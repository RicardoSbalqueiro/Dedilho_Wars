import { rememberMatch, leaderboard, profile, submitResult } from './progression.js';
// Public game API. Application accounts use usernames, never email addresses.
const VERSION = 'dw-online-8';
const MAX_INPUT_MASK = 8191; // 13 actions; turn is bit 12, existing bit positions stay intact.
const CHARS = ['caetano','orango','tubarao','rickzera','bieu','nomad','renngotti','aneninha','santox','jao','jane','cristyan','eneas'];
const STAGES = ['neto','dojo','liberdade','curitiba','piaui','planalto','casebre','praca','osasco','bolivia','morro','campo','casabranca','letsgay','ngb','zoologico','termodinamica'];
const COOKIE = 'dw_session';
const encoder = new TextEncoder();
class HttpError extends Error { constructor(status,message) { super(message); this.status=status; } }
const fail=(status,message)=>{throw new HttpError(status,message)};
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const now=()=>Math.floor(Date.now()/1000);
const random=(n=32)=>Array.from(crypto.getRandomValues(new Uint8Array(n)),b=>b.toString(16).padStart(2,'0')).join('');
const digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
async function passwordHash(password,salt) {
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256);
  return Array.from(new Uint8Array(bits),b=>b.toString(16).padStart(2,'0')).join('');
}
const equal=(a,b)=>{let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0};
const cookie=(token,secure,age=604800)=>`${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${secure?'; Secure':''}`;
async function body(req,max=65536) {
  if(!req.headers.get('Content-Type')?.startsWith('application/json'))fail(415,'Envie os dados em JSON.');
  const reader=req.body?.getReader();let size=0,text='';const decoder=new TextDecoder();
  if(reader)for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();fail(413,'Dados acima do limite.')}text+=decoder.decode(value,{stream:true})}
  try{const v=JSON.parse(text);if(!v||typeof v!=='object'||Array.isArray(v))throw Error();return v}catch{fail(400,'Dados inválidos.')}
}
async function limit(db,key,max,seconds) {
  const bucket=Math.floor(now()/seconds);
  const row=await db.prepare('INSERT INTO rate_limits (key,hits,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits').bind(`${key}:${bucket}`,now()+seconds*2).first();
  if(row.hits>max)fail(429,'Muitas tentativas. Aguarde alguns minutos e tente novamente.');
}
async function session(req,db,required=true) {
  const token=req.headers.get('Cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  const user=token&&/^[a-f0-9]{64}$/.test(token)?await db.prepare('SELECT u.id,u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?').bind(await digest(token),now()).first():null;
  if(!user&&required)fail(401,'Entre na sua conta para jogar online.');return user||null;
}
async function member(db,code,user) {
  const r=await db.prepare('SELECT * FROM rooms WHERE code=? AND expires>?').bind(code,now()).first();
  if(!r)fail(404,'Sala não encontrada ou encerrada.');
  if(r.host_id!==user.id&&r.guest_id!==user.id)fail(403,'Você não participa desta sala.');return r;
}
async function roomView(db,r) {
  const users=await db.prepare('SELECT id,username FROM users WHERE id IN (?,?)').bind(r.host_id,r.guest_id||'').all();
  const name=id=>users.results.find(u=>u.id===id)?.username||'';
  return {code:r.code,status:r.status,epoch:r.epoch,stage:r.stage,host:{id:r.host_id,username:name(r.host_id),char:r.host_char,ready:!!r.host_ready,seen:r.host_seen},guest:r.guest_id?{id:r.guest_id,username:name(r.guest_id),char:r.guest_char,ready:!!r.guest_ready,seen:r.guest_seen}:null,protocol:VERSION};
}
export default {
  async fetch(req,env) {
    const url=new URL(req.url),path=url.pathname;
    if(!path.startsWith('/api/'))return env.ASSETS.fetch(req);
    try {
      if(!env.DB)return json({error:'O serviço online está indisponível. Os modos locais continuam disponíveis.'},503);
      if(req.method!=='GET') {
        if(req.headers.get('Origin')!==url.origin)fail(403,'Origem da solicitação inválida.');
        if(req.method!=='POST')fail(405,'Método não permitido.');
      }
      const db=env.DB;
      if(path==='/api/health'&&req.method==='GET'){await db.prepare('SELECT id FROM users LIMIT 1').first();return json({online:true,protocol:VERSION})}
      if(path==='/api/session'&&req.method==='GET')return json({user:await session(req,db,false),protocol:VERSION});
      if(['/api/auth/register','/api/auth/login'].includes(path)&&req.method==='POST') {
        const b=await body(req,4096),username=typeof b.username==='string'?b.username.trim():'',password=b.password;
        if(!/^[A-Za-z0-9_]{3,24}$/.test(username)||typeof password!=='string'||password.length<8||password.length>128)fail(400,'Use um usuário com 3 a 24 letras, números ou _ e uma senha com 8 a 128 caracteres.');
        const key=username.toLowerCase();
        await limit(db,'auth-user:'+await digest(key),20,900);
        await limit(db,'auth-ip:'+await digest(req.headers.get('CF-Connecting-IP')||'local'),100,900);
        let user=await db.prepare('SELECT * FROM users WHERE username_key=?').bind(key).first();
        if(path.endsWith('/register')) {
          if(user)fail(409,'Este nome de usuário já está em uso.');
          const id=crypto.randomUUID(),salt=random(16),hash=await passwordHash(password,salt);
          try{await db.prepare('INSERT INTO users (id,username,username_key,password_hash,salt,created) VALUES (?,?,?,?,?,?)').bind(id,username,key,hash,salt,now()).run()}
          catch(e){if(String(e).includes('UNIQUE'))fail(409,'Este nome de usuário já está em uso.');throw e}
          user={id,username};
        } else {
          const hash=await passwordHash(password,user?.salt||'00000000000000000000000000000000');
          if(!user||!equal(hash,user.password_hash))fail(401,'Usuário ou senha incorretos.');
        }
        const token=random();
        await db.batch([
          db.prepare('DELETE FROM sessions WHERE expires<? OR user_id=? AND token_hash IN (SELECT token_hash FROM sessions WHERE user_id=? ORDER BY expires DESC LIMIT -1 OFFSET 9)').bind(now(),user.id,user.id),
          db.prepare('INSERT INTO sessions (token_hash,user_id,expires) VALUES (?,?,?)').bind(await digest(token),user.id,now()+604800),
          db.prepare('DELETE FROM rate_limits WHERE expires<?').bind(now()),
        ]);
        return json({user:{id:user.id,username:user.username},protocol:VERSION},200,{'Set-Cookie':cookie(token,url.protocol==='https:')});
      }
      if(path==='/api/auth/logout'&&req.method==='POST') {
        const token=req.headers.get('Cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
        if(token)await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(token)).run();
        return json({ok:true},200,{'Set-Cookie':cookie('',url.protocol==='https:',0)});
      }
      if(path==='/api/leaderboard'&&req.method==='GET')return await leaderboard(db,url,json);
      const user=await session(req,db);
      if(path==='/api/profile'&&req.method==='GET')return await profile(db,user,json);
      const resultPath=path.match(/^\/api\/results\/([a-f0-9-]{36})$/);
      if(resultPath&&req.method==='POST')return await submitResult(db,user,resultPath[1],await body(req,2048),json,fail,now());
      if(path==='/api/rooms'&&req.method==='POST') {
        await limit(db,'create:'+user.id,10,300);
        const code=Array.from(crypto.getRandomValues(new Uint8Array(8)),x=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x%32]).join('');
        await db.batch([
          db.prepare('DELETE FROM rooms WHERE code IN (SELECT code FROM rooms WHERE expires<? LIMIT 50)').bind(now()),
          db.prepare('INSERT INTO rooms (code,host_id,host_seen,expires) VALUES (?,?,?,?)').bind(code,user.id,now(),now()+7200),
        ]);
        return json({room:await roomView(db,await member(db,code,user))});
      }
      const match=path.match(/^\/api\/rooms\/([A-Z2-9]{8})(?:\/(join|configure|start|signal|sync|finish|leave))?$/);
      if(!match)fail(404,'Endereço não encontrado.');
      const [,code,op]=match;
      if(op==='join'&&req.method==='POST') {
        await limit(db,'join:'+user.id,30,60);
        await db.prepare("UPDATE rooms SET guest_id=?,guest_seen=?,guest_ready=0 WHERE code=? AND guest_id IS NULL AND host_id!=? AND status!='playing' AND expires>?").bind(user.id,now(),code,user.id,now()).run();
        const r=await db.prepare('SELECT * FROM rooms WHERE code=? AND expires>?').bind(code,now()).first();
        if(!r)fail(404,'Sala não encontrada ou encerrada.');
        if(r.host_id===user.id)fail(409,'Esta sala foi criada por você.');
        if(r.guest_id!==user.id)fail(409,'Esta sala já tem dois jogadores.');
        return json({room:await roomView(db,r)});
      }
      const r=await member(db,code,user),host=r.host_id===user.id,side=host?'host':'guest';
      if(!op&&req.method==='GET') {
        await db.prepare(`UPDATE rooms SET ${side}_seen=? WHERE code=?`).bind(now(),code).run();
        const after=Math.max(0,Math.min(Number(url.searchParams.get('after'))||0,1e12));
        const signals=await db.prepare('SELECT id,payload FROM signals WHERE room=? AND epoch=? AND sender!=? AND id>? ORDER BY id LIMIT 100').bind(code,r.epoch,user.id,after).all();
        return json({room:await roomView(db,r),signals:signals.results.map(s=>({id:s.id,payload:JSON.parse(s.payload)}))});
      }
      if(req.method!=='POST')fail(405,'Método não permitido.');
      if(op==='leave') {
        if(host)await db.prepare('DELETE FROM rooms WHERE code=?').bind(code).run();
        else await db.batch([db.prepare("UPDATE rooms SET guest_id=NULL,guest_ready=0,host_ready=0,status='waiting',epoch='',host_state=NULL,guest_input=NULL,host_n=0,guest_n=0 WHERE code=? AND guest_id=?").bind(code,user.id),db.prepare('DELETE FROM signals WHERE room=?').bind(code)]);
        return json({ok:true});
      }
      const b=await body(req);
      if(op==='configure') {
        if(r.status==='playing')fail(409,'A partida já começou.');
        const ch=b.char??r[side+'_char'];if(!CHARS.includes(ch))fail(400,'Lutador inválido.');
        const stage=host?(b.stage??r.stage):r.stage;if(!STAGES.includes(stage))fail(400,'Mapa inválido.');
        await db.prepare(`UPDATE rooms SET ${side}_char=?,${side}_ready=?,${host&&stage!==r.stage?'guest_ready=0,':''}stage=?,status='waiting',${side}_seen=? WHERE code=? AND status!='playing'`).bind(ch,b.ready===true?1:0,stage,now(),code).run();
      } else if(op==='start') {
        if(!host)fail(403,'Somente o criador pode iniciar.');
        const epoch=crypto.randomUUID();
        const updated=await db.prepare("UPDATE rooms SET status='playing',epoch=?,host_state=NULL,guest_input=NULL,host_n=0,guest_n=0 WHERE code=? AND status!='playing' AND host_ready=1 AND guest_ready=1 AND guest_id IS NOT NULL AND host_seen>? AND guest_seen>? RETURNING code").bind(epoch,code,now()-15,now()-15).first();
        if(!updated)fail(409,'Os dois jogadores precisam estar conectados e prontos.');
        await db.prepare('DELETE FROM signals WHERE room=?').bind(code).run();
        await rememberMatch(db,code,epoch,now());
      } else if(op==='finish') {
        if(!host)fail(403,'Somente o criador pode finalizar.');
        await db.prepare("UPDATE rooms SET status='finished',host_ready=0,guest_ready=0 WHERE code=? AND epoch=?").bind(code,b.epoch).run();
      } else if(op==='signal') {
        if(b.epoch!==r.epoch||r.status!=='playing')fail(409,'Esta partida foi encerrada.');
        if(!['offer','answer','ice'].includes(b.payload?.type)||JSON.stringify(b.payload).length>16000)fail(400,'Conexão inválida.');
        await limit(db,'signal:'+code+':'+user.id,150,60);
        await db.prepare('INSERT INTO signals (room,epoch,sender,payload) VALUES (?,?,?,?)').bind(code,r.epoch,user.id,JSON.stringify(b.payload)).run();
        return json({ok:true});
      } else if(op==='sync') {
        if(b.epoch!==r.epoch||!['playing','finished'].includes(r.status))fail(409,'Esta partida foi encerrada.');
        if(!Number.isSafeInteger(b.n)||b.n<1||b.n>1e9)fail(400,'Sequência inválida.');
        const value=host?b.state:b.input;
        const invalidEvent=e=>!e||!Number.isSafeInteger(e.id)||e.id<1||!Number.isInteger(e.mask)||e.mask<0||e.mask>MAX_INPUT_MASK||(e.clash!==undefined&&(!Number.isSafeInteger(e.clash)||e.clash<0))||(e.clashFrame!==undefined&&(!Number.isSafeInteger(e.clashFrame)||e.clashFrame< -60||e.clashFrame>240));
        const invalid=host?(!value||value.v!==VERSION||!Array.isArray(value.f)||value.f.length!==2):(!value||!Number.isInteger(value.mask)||value.mask<0||value.mask>MAX_INPUT_MASK||!Array.isArray(value.events)||value.events.length>32||value.events.some(invalidEvent));
        if(invalid)fail(400,'Estado inválido.');
        await db.prepare(`UPDATE rooms SET ${host?'host_state':'guest_input'}=?,${side}_n=?,${side}_seen=? WHERE code=? AND epoch=? AND ${side}_n<?`).bind(JSON.stringify(value),b.n,now(),code,r.epoch,b.n).run();
        const fresh=await member(db,code,user),peer=host?'guest':'host';
        return json({n:fresh[peer+'_n'],value:JSON.parse(fresh[host?'guest_input':'host_state']||'null'),seen:fresh[peer+'_seen'],status:fresh.status});
      } else fail(404,'Endereço não encontrado.');
      return json({room:await roomView(db,await member(db,code,user))});
    } catch(e) {
      if(e instanceof HttpError)return json({error:e.message},e.status);
      console.error('Game API failure',e instanceof Error?e.message:'unknown');
      return json({error:'O serviço online está indisponível. Tente novamente em instantes.'},503);
    }
  }
};
