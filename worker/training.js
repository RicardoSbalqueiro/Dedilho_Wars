// Account training rewards are based exclusively on a server-issued run and
// deterministic replay of legal human inputs through the shared combat engine.
import {CHAR_IDS} from '../src/game/data.ts';
import {activity,lockedReason,rivalStyle,rotatingMissions,TRAINING_RULES,TRAINING_VERSION} from '../src/game/training/catalog.ts';
import {freshProgress,readProgress,applyResult} from '../src/game/training/progress.ts';
import {parseTranscript,replayTraining} from '../src/game/training/verify.ts';

async function progressRow(db,user){
 await db.prepare('INSERT OR IGNORE INTO training_progress (user_id,data) VALUES (?,?)').bind(user.id,JSON.stringify(freshProgress())).run();
 const row=await db.prepare('SELECT * FROM training_progress WHERE user_id=?').bind(user.id).first();
 let progress;try{progress=readProgress(JSON.parse(row.data))}catch{progress=freshProgress()}
 const account=await db.prepare('SELECT xp,training_xp,username FROM users WHERE id=?').bind(user.id).first();
 progress.xp=account.training_xp;progress.revision=row.revision;
 return {row,progress,account};
}
export async function trainingProfile(db,user,time,json){
 const {progress,account}=await progressRow(db,user),day=new Date(time*1000).toISOString().slice(0,10);
 const repeats=await db.prepare("SELECT activity_id,SUM(xp) AS xp,COUNT(*) AS count FROM training_awards WHERE user_id=? AND utc_day=? AND reason='repeat' GROUP BY activity_id").bind(user.id,day).all();
 progress.repeatDay=day;progress.repeatXp=repeats.results.reduce((n,r)=>n+r.xp,0);progress.repeatCount=Object.fromEntries(repeats.results.map(r=>[r.activity_id,r.count]));
 return json({progress,accountXp:account.xp,trainingXp:account.training_xp,username:account.username,missions:rotatingMissions(time,progress)});
}
export async function startTraining(db,user,b,time,json,fail){
 const a=activity(b.activityId);if(!a||!CHAR_IDS.includes(b.p1))fail(400,'Escolha uma atividade e um lutador válidos.');
 if(b.lab||b.activityId==='lab')fail(422,'O laboratório livre não concede XP de conta.');
 const {progress}=await progressRow(db,user),locked=lockedReason(a,progress,b.p1);if(locked)fail(403,locked);
 const id=crypto.randomUUID(),seed=crypto.getRandomValues(new Uint32Array(1))[0],spec={activityId:a.id,p1:b.p1,seed,version:TRAINING_VERSION,npc:a.npc,style:rivalStyle(a,progress),verifiedSession:id};
 await db.batch([
  db.prepare("UPDATE training_runs SET state='abandoned' WHERE user_id=? AND state='active'").bind(user.id),
  db.prepare('INSERT INTO training_runs (id,user_id,activity_id,character,seed,version,config,created,expires) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,user.id,a.id,b.p1,seed,TRAINING_VERSION,JSON.stringify(spec),time,time+TRAINING_RULES.sessionSeconds),
  db.prepare("DELETE FROM training_runs WHERE user_id=? AND state!='active' AND created<? AND id NOT IN (SELECT id FROM training_runs WHERE user_id=? ORDER BY created DESC LIMIT 100)").bind(user.id,time-2592000,user.id),
  db.prepare("DELETE FROM training_awards WHERE user_id=? AND reason='repeat' AND applied=1 AND utc_day<?").bind(user.id,new Date((time-7776000)*1000).toISOString().slice(0,10)),
 ]);
 return json({id,spec,expires:time+TRAINING_RULES.sessionSeconds,missions:rotatingMissions(time,progress)});
}
export async function abandonTraining(db,user,id,json){await db.prepare("UPDATE training_runs SET state='abandoned' WHERE id=? AND user_id=? AND state='active'").bind(id,user.id).run();return json({ok:true});}
export async function submitTraining(db,user,id,b,time,json,fail){
 const run=await db.prepare('SELECT * FROM training_runs WHERE id=? AND user_id=?').bind(id,user.id).first();
 if(!run)fail(404,'Tentativa não encontrada para esta conta.');
 if(run.state==='complete')return json({result:JSON.parse(run.result),duplicate:true});
 if(run.state!=='active'||run.expires<time)fail(409,'Esta tentativa foi encerrada ou expirou. O treino local continua disponível.');
 if(run.version!==TRAINING_VERSION)fail(409,'A versão do treinamento mudou. Atualize o jogo e inicie outra tentativa.');
 let ticks;try{ticks=parseTranscript(b.inputs).ticks;}catch(e){fail(422,e.message)}
 if(ticks/60>time-run.created+3)fail(422,'O tempo desta sequência ainda não corresponde à sessão autorizada. Tente salvar novamente em alguns segundos.');
 let verified;try{verified=replayTraining(JSON.parse(run.config),b.inputs);}catch(e){fail(422,'Resultado não verificado: '+e.message)}
 const a=activity(run.activity_id),{row,progress}=await progressRow(db,user),missions=rotatingMissions(time,progress);
 verified={...verified,id,at:time*1000,verified:true,xp:0};
 const next=applyResult(progress,verified,missions,false),result=next.history[0],claim=crypto.randomUUID(),day=new Date(time*1000).toISOString().slice(0,10);
 const statements=[
  db.prepare("UPDATE training_progress SET data=?,revision=revision+1,last_run_id=? WHERE user_id=? AND revision=? AND EXISTS(SELECT 1 FROM training_runs WHERE id=? AND user_id=? AND state='active')").bind(JSON.stringify(next),id,user.id,row.revision,id,user.id),
  db.prepare("UPDATE training_runs SET state='verified',claim_id=?,result=? WHERE id=? AND user_id=? AND state='active' AND EXISTS(SELECT 1 FROM training_progress WHERE user_id=? AND revision=? AND last_run_id=?)").bind(claim,JSON.stringify(result),id,user.id,user.id,row.revision+1,id),
 ];
 const gate="EXISTS(SELECT 1 FROM training_runs WHERE id=? AND user_id=? AND state='verified' AND claim_id=?)";
 const grant=(key,xp,reason)=>statements.push(db.prepare(`INSERT OR IGNORE INTO training_awards (user_id,reward_key,run_id,activity_id,xp,reason,utc_day) SELECT ?,?,?,?,?,?,? WHERE ${gate}`).bind(user.id,key,id,a.id,xp,reason,day,id,user.id,claim));
 if(result.success){
  grant('first:'+a.id,a.xp,a.boss?'boss':a.kind==='exam'?'exam':'first');
  if(!a.unique){
   statements.push(db.prepare(`INSERT OR IGNORE INTO training_awards (user_id,reward_key,run_id,activity_id,xp,reason,utc_day)
    SELECT ?,?,?,?,MIN(?,MAX(0,?-COALESCE((SELECT SUM(xp) FROM training_awards WHERE user_id=? AND utc_day=? AND reason='repeat'),0))),'repeat',?
    WHERE ${gate} AND EXISTS(SELECT 1 FROM training_awards WHERE user_id=? AND reward_key=? AND run_id!=?)
    AND (SELECT COUNT(*) FROM training_awards WHERE user_id=? AND activity_id=? AND utc_day=? AND reason='repeat')<?
    AND COALESCE((SELECT SUM(xp) FROM training_awards WHERE user_id=? AND utc_day=? AND reason='repeat'),0)<?`).bind(user.id,'repeat:'+id,id,a.id,Math.floor(a.xp*TRAINING_RULES.repeatRate),TRAINING_RULES.repeatDailyXp,user.id,day,day,id,user.id,claim,user.id,'first:'+a.id,id,user.id,a.id,day,TRAINING_RULES.repeatPerActivity,user.id,day,TRAINING_RULES.repeatDailyXp));
  }
  if(result.grade==='S'&&['challenge','mastery','combo'].includes(a.kind))grant('gradeS:'+a.id,TRAINING_RULES.gradeS,'gradeS');
  for(const m of missions)if(!progress.missions[m.id]?.claimed&&next.missions[m.id]?.claimed)grant('mission:'+m.id,m.xp,'mission');
 }
 statements.push(
  db.prepare(`UPDATE users SET xp=xp+COALESCE((SELECT SUM(xp) FROM training_awards WHERE user_id=? AND run_id=? AND applied=0),0),training_xp=training_xp+COALESCE((SELECT SUM(xp) FROM training_awards WHERE user_id=? AND run_id=? AND applied=0),0) WHERE id=? AND ${gate}`).bind(user.id,id,user.id,id,user.id,id,user.id,claim),
  db.prepare(`UPDATE training_awards SET applied=1 WHERE user_id=? AND run_id=? AND applied=0 AND ${gate}`).bind(user.id,id,id,user.id,claim),
  db.prepare(`UPDATE training_runs SET state='complete',result=json_set(result,'$.xp',COALESCE((SELECT SUM(xp) FROM training_awards WHERE user_id=? AND run_id=?),0),'$.rewardNote',CASE WHEN json_extract(result,'$.success')=0 THEN 'Sem XP: objetivo não concluído.' WHEN COALESCE((SELECT SUM(xp) FROM training_awards WHERE user_id=? AND run_id=?),0)=0 THEN 'Recompensa única já recebida ou limite de repetição atingido.' ELSE 'Recompensa verificada pelo servidor.' END) WHERE id=? AND user_id=? AND claim_id=? AND state='verified'`).bind(user.id,id,user.id,id,id,user.id,claim),
  db.prepare("UPDATE training_progress SET data=json_set(data,'$.xp',(SELECT training_xp FROM users WHERE id=?),'$.history[0]',json((SELECT result FROM training_runs WHERE id=? AND user_id=? AND claim_id=?))) WHERE user_id=? AND last_run_id=? AND revision=? AND EXISTS(SELECT 1 FROM training_runs WHERE id=? AND user_id=? AND state='complete' AND claim_id=?)").bind(user.id,id,user.id,claim,user.id,id,row.revision+1,id,user.id,claim),
 );
 const batch=await db.batch(statements);
 const completed=await db.prepare('SELECT state,result FROM training_runs WHERE id=? AND user_id=?').bind(id,user.id).first();
 if(completed?.state==='complete')return json({result:JSON.parse(completed.result),duplicate:batch[0].meta.changes===0});
 fail(409,'O progresso mudou durante o salvamento. Tente salvar esta tentativa novamente.');
}
