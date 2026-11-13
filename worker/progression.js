// Server-confirmed match records. Awards are inserted once per participant;
// the same atomic batch updates aggregate statistics and marks awards applied.
export async function rememberMatch(db,code,epoch,time) {
 await db.prepare(`INSERT OR IGNORE INTO matches (id,room_code,host_id,guest_id,host_char,guest_char,stage,created)
 SELECT epoch,code,host_id,guest_id,host_char,guest_char,stage,? FROM rooms WHERE code=? AND epoch=? AND guest_id IS NOT NULL AND status='playing'`).bind(time,code,epoch).run();
}
const statsCols='u.id,u.username,u.games,u.wins,u.losses,u.xp,u.training_xp,(u.xp-u.training_xp) AS multiplayer_xp,u.points,u.finishers,u.streak,u.best_streak';
export async function leaderboard(db,url,json) {
 const page=Math.floor(Math.max(0,Math.min(49,Number(url.searchParams.get('page'))||0)));
 const rows=await db.prepare(`SELECT ${statsCols} FROM users u WHERE games>0 ORDER BY points DESC,wins DESC,losses ASC,username_key ASC LIMIT 21 OFFSET ?`).bind(page*20).all();
 return json({players:rows.results.slice(0,20).map((u,i)=>({...u,rank:page*20+i+1})),page,more:rows.results.length>20,rules:'Vitória: 3 pontos e 100 XP. Derrota: 0 pontos e 40 XP. Finisher: +20 XP para o vencedor. Resultados exigem confirmação dos dois jogadores.'});
}
export async function profile(db,user,json) {
 const me=await db.prepare(`SELECT ${statsCols} FROM users u WHERE id=?`).bind(user.id).first();
 const rank=me.games?await db.prepare('SELECT COUNT(*)+1 AS rank FROM users WHERE games>0 AND (points>? OR points=? AND wins>? OR points=? AND wins=? AND losses<? OR points=? AND wins=? AND losses=? AND username_key<(SELECT username_key FROM users WHERE id=?))').bind(me.points,me.points,me.wins,me.points,me.wins,me.losses,me.points,me.wins,me.losses,user.id).first():null;
 const history=await db.prepare(`SELECT m.id,m.host_char,m.guest_char,m.stage,m.host_score,m.guest_score,m.winner_idx,m.finisher_idx,m.created,m.finished,m.status,h.username AS host_name,g.username AS guest_name,m.host_id,m.guest_id FROM matches m JOIN users h ON h.id=m.host_id JOIN users g ON g.id=m.guest_id WHERE m.host_id=? OR m.guest_id=? ORDER BY m.created DESC LIMIT 30`).bind(user.id,user.id).all();
 return json({user:{...me,rank:rank?.rank||null},history:history.results});
}
export async function submitResult(db,user,id,b,json,fail,time) {
 const m=await db.prepare('SELECT * FROM matches WHERE id=?').bind(id).first();
 if(!m)fail(404,'Partida não encontrada.');
 const host=m.host_id===user.id;
 if(!host&&m.guest_id!==user.id)fail(403,'Você não participou desta partida.');
 const {winner,hostScore,guestScore}=b,finisher=b.finisher??-1;
 if(![0,1].includes(winner)||!Number.isInteger(hostScore)||!Number.isInteger(guestScore)||hostScore<0||guestScore<0||hostScore>2||guestScore>2||(winner===0?(hostScore!==2||guestScore>=2):(guestScore!==2||hostScore>=2))||![-1,winner].includes(finisher))fail(400,'Placar inválido.');
 if(time-m.created<10)fail(422,'A partida terminou cedo demais para entrar no ranking.');
 if(time-m.created>7200)fail(409,'O prazo de confirmação desta partida terminou.');
 const report=[winner,hostScore,guestScore,finisher].join(':'),own=host?'host_report':'guest_report';
 if(m[own]&&m[own]!==report)fail(409,'Seu resultado já foi informado e não pode ser alterado.');
 await db.prepare(`UPDATE matches SET ${own}=?,host_score=?,guest_score=?,winner_idx=?,finisher_idx=?,finished=COALESCE(finished,?) WHERE id=? AND (${own} IS NULL OR ${own}=?)`).bind(report,hostScore,guestScore,winner,finisher,time,id,report).run();
 await db.batch([
  db.prepare(`INSERT OR IGNORE INTO match_awards (match_id,user_id,won,xp,points,finisher) SELECT id,host_id,CASE WHEN winner_idx=0 THEN 1 ELSE 0 END,CASE WHEN winner_idx=0 THEN 100+CASE WHEN finisher_idx=0 THEN 20 ELSE 0 END ELSE 40 END,CASE WHEN winner_idx=0 THEN 3 ELSE 0 END,CASE WHEN finisher_idx=0 THEN 1 ELSE 0 END FROM matches WHERE id=? AND host_report=guest_report AND host_report IS NOT NULL`).bind(id),
  db.prepare(`INSERT OR IGNORE INTO match_awards (match_id,user_id,won,xp,points,finisher) SELECT id,guest_id,CASE WHEN winner_idx=1 THEN 1 ELSE 0 END,CASE WHEN winner_idx=1 THEN 100+CASE WHEN finisher_idx=1 THEN 20 ELSE 0 END ELSE 40 END,CASE WHEN winner_idx=1 THEN 3 ELSE 0 END,CASE WHEN finisher_idx=1 THEN 1 ELSE 0 END FROM matches WHERE id=? AND host_report=guest_report AND host_report IS NOT NULL`).bind(id),
  db.prepare(`WITH fresh AS (SELECT * FROM match_awards WHERE match_id=? AND applied=0)
   UPDATE users SET games=games+1,wins=wins+(SELECT won FROM fresh WHERE user_id=users.id),losses=losses+1-(SELECT won FROM fresh WHERE user_id=users.id),xp=xp+(SELECT xp FROM fresh WHERE user_id=users.id),points=points+(SELECT points FROM fresh WHERE user_id=users.id),finishers=finishers+(SELECT finisher FROM fresh WHERE user_id=users.id),best_streak=MAX(best_streak,CASE WHEN (SELECT won FROM fresh WHERE user_id=users.id)=1 THEN streak+1 ELSE 0 END),streak=CASE WHEN (SELECT won FROM fresh WHERE user_id=users.id)=1 THEN streak+1 ELSE 0 END WHERE id IN (SELECT user_id FROM fresh)`).bind(id),
  db.prepare('UPDATE match_awards SET applied=1 WHERE match_id=? AND applied=0').bind(id),
  db.prepare("UPDATE matches SET status=CASE WHEN host_report=guest_report THEN 'confirmed' ELSE 'disputed' END WHERE id=? AND host_report IS NOT NULL AND guest_report IS NOT NULL").bind(id),
 ]);
 const fresh=await db.prepare('SELECT status FROM matches WHERE id=?').bind(id).first();
 const award=await db.prepare('SELECT xp,points,won,finisher FROM match_awards WHERE match_id=? AND user_id=?').bind(id,user.id).first();
 return json({status:fresh.status,award:award||null});
}
