import assert from 'node:assert/strict';
import { readFileSync,readdirSync } from 'node:fs';
import { Miniflare } from 'miniflare';
const mf=new Miniflare({modules:true,scriptPath:'worker/index.js',compatibilityDate:'2025-10-01',d1Databases:['DB']});
try {
 const db=await mf.getD1Database('DB');
 for(const file of readdirSync('drizzle').filter(x=>x.endsWith('.sql'))) {
  const sql=readFileSync('drizzle/'+file,'utf8');
  for(const statement of sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(statement).run();
 }
 const call=async(path,data,cookie,origin='https://game.test')=>{
  const response=await mf.dispatchFetch('https://game.test/api'+path,{method:data===undefined?'GET':'POST',headers:{...(data===undefined?{}:{'Content-Type':'application/json',Origin:origin}),...(cookie?{Cookie:cookie}:{})},body:data===undefined?undefined:JSON.stringify(data)});
  const body=await response.json();return {status:response.status,body,cookie:response.headers.get('Set-Cookie')};
 };
 const reg=async username=>{const r=await call('/auth/register',{username,password:'TestPassword!42'});assert.equal(r.status,200,JSON.stringify(r));assert.match(r.cookie,/HttpOnly.*SameSite=Strict.*Secure/);return r};
 assert.equal((await call('/health')).body.online,true);
 assert.equal((await call('/rooms',{})).status,401);
 assert.equal((await call('/auth/register',{username:'tester',password:'password123'},null,'https://evil.test')).status,403);
 assert.equal((await call('/auth/register',{username:'bad@user',password:'password123'})).status,400);
 const a=await reg('Fighter_A'),b=await reg('Fighter_B'),c=await reg('Fighter_C');
 assert.equal((await call('/auth/register',{username:'fighter_a',password:'somepassword'})).status,409);
 assert.equal((await call('/auth/login',{username:'Fighter_A',password:'WrongPassword'})).status,401);
 const login=await call('/auth/login',{username:'fIgHtEr_A',password:'TestPassword!42'});assert.equal(login.status,200);
 assert.equal((await call('/session',undefined,login.cookie)).body.user.id,a.body.user.id);
 const stored=await db.prepare('SELECT * FROM users WHERE id=?').bind(a.body.user.id).first();assert.notEqual(stored.password_hash,'TestPassword!42');assert.equal(stored.salt.length,32);
 const tokens=await db.prepare('SELECT token_hash FROM sessions').all();assert(tokens.results.every(t=>!a.cookie.includes(t.token_hash)));
 const made=await call('/rooms',{},a.cookie);assert.equal(made.status,200);const code=made.body.room.code,path='/rooms/'+code;
 assert.equal((await call(path,undefined,b.cookie)).status,403);
 const joins=await Promise.all([call(path+'/join',{},b.cookie),call(path+'/join',{},c.cookie)]);assert.deepEqual(joins.map(x=>x.status).sort(),[200,409]);
 const guest=joins[0].status===200?b:c,outsider=guest===b?c:b;
 assert.equal((await call(path+'/join',{},outsider.cookie)).status,409);
 assert.equal((await call(path+'/start',{},guest.cookie)).status,403);
 assert.equal((await call(path+'/start',{},a.cookie)).status,409);
 assert.equal((await call(path+'/configure',{char:'not-a-fighter'},a.cookie)).status,400);
 await call(path+'/configure',{char:'aneninha',stage:'curitiba',ready:true},a.cookie);
 const gcfg=await call(path+'/configure',{char:'nomad',stage:'piaui',ready:true},guest.cookie);assert.equal(gcfg.body.room.stage,'curitiba');
 const start=await call(path+'/start',{},a.cookie);assert.equal(start.status,200);const epoch=start.body.room.epoch;assert(epoch);
 assert.equal((await call(path+'/configure',{char:'caetano'},guest.cookie)).status,409);
 assert.equal((await call(path+'/sync',{epoch:'old',n:1,input:8},guest.cookie)).status,409);
 assert.equal((await call(path+'/sync',{epoch,n:1,input:{mask:2048,events:[]}},guest.cookie)).status,400);
 assert.equal((await call(path+'/sync',{epoch,n:1,input:{mask:16,events:[{id:1,mask:16}]}},outsider.cookie)).status,403);
 const state={v:'dw-online-1',f:[{hp:1000},{hp:900}],g:{tick:10}};
 await call(path+'/sync',{epoch,n:2,state},a.cookie);
 const sync=await call(path+'/sync',{epoch,n:3,input:{mask:16,events:[{id:1,mask:16}]}},guest.cookie);assert.deepEqual(sync.body.value,state);assert.equal(sync.body.n,2);
 const hostSync=await call(path+'/sync',{epoch,n:1,state:{...state,g:{tick:1}}},a.cookie);assert.deepEqual(hostSync.body.value,{mask:16,events:[{id:1,mask:16}]});assert.equal(hostSync.body.n,3);
 assert.equal(JSON.parse((await db.prepare('SELECT host_state FROM rooms WHERE code=?').bind(code).first()).host_state).g.tick,10);
 const signal=await call(path+'/signal',{epoch,payload:{type:'offer',sdp:{type:'offer',sdp:'test'}}},a.cookie);assert.equal(signal.status,200);
 const received=await call(path,undefined,guest.cookie);assert.equal(received.body.signals.length,1);assert.equal((await call(path,undefined,a.cookie)).body.signals.length,0);
 assert.equal((await call(path+'?after='+received.body.signals[0].id,undefined,guest.cookie)).body.signals.length,0);
 assert(!/password|token|salt/i.test(JSON.stringify(received.body)));
 assert.equal((await call(path+'/sync',{epoch,n:4,state:{...state,large:'x'.repeat(70000)}},a.cookie)).status,413);
 assert.equal((await call(path+'/finish',{epoch},guest.cookie)).status,403);
 await call(path+'/finish',{epoch},a.cookie);assert.equal((await call(path,undefined,a.cookie)).body.room.status,'finished');
 await call(path+'/leave',{},guest.cookie);const left=await call(path,undefined,a.cookie);assert.equal(left.body.room.guest,null);assert.equal(left.body.room.host.ready,false);
 await call(path+'/leave',{},a.cookie);assert.equal((await call(path,undefined,a.cookie)).status,404);
 await call('/auth/logout',{},login.cookie);assert.equal((await call('/session',undefined,login.cookie)).body.user,null);
 let limited;for(let i=0;i<24;i++)limited=await call('/auth/login',{username:'RateTest',password:'BadPassword42'});assert.equal(limited.status,429);
 console.log('API: username-only registration, hashed passwords/sessions, case-insensitive login, CSRF, rate limits, private two-player rooms, ready/start, epoch/sequence validation, relay, signals, finish and logout passed.');
} finally {await mf.dispose()}
