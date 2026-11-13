import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {Miniflare} from 'miniflare';
import {build} from 'esbuild';
import {buildWorker,headlessPlugins} from '../scripts/worker-bundle.mjs';
await buildWorker('.sites-runtime/training-api-worker.js');
await build({entryPoints:['src/game/training/verify.ts'],outfile:'.sites-runtime/training-api-sim.mjs',bundle:true,platform:'node',format:'esm',plugins:headlessPlugins});
const {createTrainingGame}=await import('../.sites-runtime/training-api-sim.mjs');
const mf=new Miniflare({modules:true,modulesRules:[{type:'ESModule',include:['**/*.js']}],scriptPath:'.sites-runtime/training-api-worker.js',compatibilityDate:'2025-10-01',d1Databases:['DB']});
try{
 const db=await mf.getD1Database('DB'),migrations=readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort();
 const migrate=async file=>{for(const statement of readFileSync('drizzle/'+file,'utf8').split('--> statement-breakpoint').map(x=>x.trim()).filter(Boolean))await db.prepare(statement).run();};
 for(const f of migrations.filter(n=>!n.startsWith('0003_')))await migrate(f);
 const call=async(path,data,cookie,origin='https://game.test')=>{const response=await mf.dispatchFetch('https://game.test/api'+path,{method:data===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(data===undefined?{}:{'Content-Type':'application/json',Origin:origin})},body:data===undefined?undefined:JSON.stringify(data)});return {status:response.status,body:await response.json(),cookie:response.headers.get('Set-Cookie')};};
 const register=async username=>{const r=await call('/auth/register',{username,password:'StrongTest!123'});assert.equal(r.status,200);return r;};
 const old=await register('LegacyFighter');await db.prepare('UPDATE users SET xp=120,games=1,wins=1,points=3 WHERE id=?').bind(old.body.user.id).run();
 for(const f of migrations.filter(n=>n.startsWith('0003_')))await migrate(f);
 const oldProfile=await call('/profile',undefined,old.cookie);assert.equal(oldProfile.body.user.xp,120);assert.equal(oldProfile.body.user.multiplayer_xp,120);assert.equal(oldProfile.body.user.training_xp,0);assert.equal(oldProfile.body.user.points,3);
 const user=await register('RebornFighter'),other=await register('OtherFighter'),cookie=user.cookie;
 assert.equal((await call('/training')).status,401);
 assert.equal((await call('/training/start',{activityId:'lesson-move',p1:'caetano'},cookie,'https://evil.test')).status,403);
 assert.equal((await call('/training/start',{activityId:'lab',p1:'caetano'},cookie)).status,400);
 assert.equal((await call('/training/start',{activityId:'tower-50',p1:'caetano'},cookie)).status,403);
 assert.equal((await call('/training/start',{activityId:'rival-caetano-6',p1:'caetano'},cookie)).status,403);
 const start=async(id='lesson-move')=>{const r=await call('/training/start',{activityId:id,p1:'caetano'},cookie);assert.equal(r.status,200,JSON.stringify(r));return r.body;};
 // Real engine inputs, with elapsed wall time advanced only in the SQL fixture.
 const trace=async(s)=>{let g;g=createTrainingGame(s.spec,()=>{},true,()=>({held:s.spec.activityId==='lesson-turn'?(g.tick%3===0?4096:0):2,pressed:0}));while(!g.reborn.result)g.step();assert(g.reborn.result.success);const inputs=g.reborn.transcript;g.destroy();await db.prepare('UPDATE training_runs SET created=created-? WHERE id=?').bind(Math.ceil(inputs.reduce((n,row)=>n+row[0],0)/60),s.id).run();return inputs;};
 const run=await start();assert.equal((await call('/training/'+run.id+'/submit',{inputs:[[60,0,0]],xp:999999,grade:'S',success:true},cookie)).status,422);
 assert.equal((await call('/training/'+run.id+'/submit',{inputs:[[10800,0,0]]},cookie)).status,422,'future input transcript cannot be fast-forwarded');
 assert.equal((await call('/training/'+run.id+'/submit',{inputs:[[1,65536,0]]},cookie)).status,422);
 const inputs=await trace(run);assert.equal((await call('/training/'+run.id+'/submit',{inputs},other.cookie)).status,404);
 const repeats=await Promise.all(Array.from({length:6},()=>call('/training/'+run.id+'/submit',{inputs,xp:999999,grade:'S',damage:999999},cookie)));
 assert(repeats.every(r=>r.status===200),JSON.stringify(repeats));assert(repeats.every(r=>r.body.result.xp===50));
 let p=await call('/training',undefined,cookie);assert.equal(p.body.trainingXp,50);assert.equal(p.body.accountXp,50);assert.equal(p.body.progress.history.length,1);assert.equal(p.body.progress.completions['lesson-move'].wins,1);
 for(let i=0;i<3;i++){const r=await start();const q=await call('/training/'+r.id+'/submit',{inputs:await trace(r)},cookie);assert.equal(q.status,200,JSON.stringify(q));assert.equal(q.body.result.xp,i<2?12:0);}
 p=await call('/training',undefined,cookie);assert.equal(p.body.trainingXp,74);assert.equal(p.body.progress.history.length,4);assert.equal(p.body.progress.repeatXp,24);assert.equal(p.body.progress.repeatCount['lesson-move'],2);
 const abandoned=await start();await call('/training/'+abandoned.id+'/abandon',{},cookie);assert.equal((await call('/training/'+abandoned.id+'/submit',{inputs:await trace(abandoned)},cookie)).status,409);assert.equal((await call('/training',undefined,cookie)).body.trainingXp,74);
 const turn=await start('lesson-turn');const turnResult=await call('/training/'+turn.id+'/submit',{inputs:await trace(turn)},cookie);assert.equal(turnResult.status,200,JSON.stringify(turnResult));assert.equal(turnResult.body.result.xp,50);
 const day=new Date().toISOString().slice(0,10);await db.prepare("INSERT INTO training_awards (user_id,reward_key,run_id,activity_id,xp,reason,utc_day,applied) VALUES (?,?,?,?,?,'repeat',?,1)").bind(user.body.user.id,'repeat:old-fixture','old-fixture','historical-fixture',374,day).run();await db.prepare('UPDATE users SET xp=xp+374,training_xp=training_xp+374 WHERE id=?').bind(user.body.user.id).run();
 const limited=await start('lesson-turn');const cap=await call('/training/'+limited.id+'/submit',{inputs:await trace(limited)},cookie);assert.equal(cap.status,200,JSON.stringify(cap));assert.equal(cap.body.result.xp,2,'repeat XP is limited atomically to remaining daily budget');
 const grade=await start('fundamentos-move');const s=await call('/training/'+grade.id+'/submit',{inputs:await trace(grade),xp:1000000},cookie);assert.equal(s.status,200,JSON.stringify(s));assert.equal(s.body.result.grade,'S');assert.equal(s.body.result.xp,175,'initial challenge plus unique S bonus');
 const again=await start('fundamentos-move');const sAgain=await call('/training/'+again.id+'/submit',{inputs:await trace(again)},cookie);assert.equal(sAgain.status,200,JSON.stringify(sAgain));assert.equal(sAgain.body.result.xp,0,'daily cap and S uniqueness both persist');
 const final=await call('/profile',undefined,cookie);assert.equal(final.body.user.games,0);assert.equal(final.body.user.points,0);assert.equal(final.body.user.wins,0);assert.equal(final.body.user.multiplayer_xp,0);assert.equal(final.body.user.xp,final.body.user.training_xp);
 const reload=await call('/training',undefined,cookie);assert.equal(reload.body.progress.completions['fundamentos-move'].wins,2);assert(reload.body.progress.history.every(r=>r.verified));assert.equal(reload.body.progress.xp,final.body.user.xp);
 const localClaim=await call('/training/start',{activityId:'exam-5',p1:'caetano',progress:{rank:5,tower:50,xp:999999}},cookie);assert.equal(localClaim.status,403,'client-side progress cannot unlock account content');
 console.log('Training API: additive legacy migration, authentication/CSRF, locked tiers, authorized seeded sessions, true replay, rejected fabricated results, concurrent exactly-once XP, repeat limits and atomic daily cap, unique S bonus, abandon/no-lab XP, persistence and untouched PvP points passed.');
}finally{await mf.dispose();}
