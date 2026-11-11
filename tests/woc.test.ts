import assert from 'node:assert/strict';
import {Game} from '../src/game/engine';
import type {Fighter} from '../src/game/engine';
import {CHAR_IDS,CHAR_CATEGORIES,CHARS,BASE_HP} from '../src/game/data';
import {ACTIONS,DEFAULT_BINDINGS,MAX_INPUT_MASK,loadBindings,bindingConflict} from '../src/game/input';
import {captureState,applyState,ONLINE_PROTOCOL} from '../src/game/net-state';
import {FORMS,RESOURCE_RULES,canTransform,formStats,gainEnergy} from '../src/game/resources';
import {WOC_ULTIMATES} from '../src/game/woc-choreography';
import type {CharId} from '../src/game/data';
import type {Action} from '../src/game/input';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
let cases=0;
const check=(name:string,fn:()=>void)=>{try{fn();cases++}catch(cause){throw new Error(name,{cause})}};
function make(ch:CharId='rickzera',other:CharId='caetano'){const g=new Game({mode:'versus',p1:ch,p2:other,online:true,difficulty:'normal',bindings:DEFAULT_BINDINGS},()=>{});g.phase='fight';g.f[0].x=600;g.f[1].x=760;return g;}
function step(g:Game,n=1){for(let i=0;i<n;i++)g.step();}
function tap(g:Game,a:Action,side:0|1=0){g.onlinePressed[side]|=1<<ACTIONS.indexOf(a);g.step();}
function ready(f:Fighter){f.meter=200;f.stamina=120;f.energy=100;f.blood=3;f.battery=100;f.exhaustT=f.aftermathT=0;}
function finishActivation(g:Game){step(g,75);assert.equal(g.f[0].state,'ground');assert(g.f[0].formT>0);}
check('18 model-sheet fighters, categories, replacement and exact HP doubling',()=>{
 assert.equal(CHAR_IDS.length,18);assert.equal(CHAR_CATEGORIES.Viewers.length,9);assert(CHAR_CATEGORIES.Especiais.includes('eneas'));assert.equal(CHARS.eneas.name,'DR. ACREANO');
 for(const ch of CHAR_IDS){assert.equal(CHARS[ch].hp,BASE_HP[ch]*2);assert.equal(FORMS[ch].duration,600);assert(CHARS[ch].specials.every(s=>s.desc.length>10));}
 assert(CHARS.jane.hp<CHARS.cristyan.hp);assert(CHARS.jane.hurtH<CHARS.cristyan.hurtH);
});
check('new commands append bits and preserve custom legacy F/C bindings',()=>{
 assert.equal(ACTIONS.indexOf('headbutt'),13);assert.equal(ACTIONS.indexOf('transform'),14);assert.equal(ACTIONS.indexOf('charge'),15);assert.equal(MAX_INPUT_MASK,65535);
 const old:any=structuredClone(DEFAULT_BINDINGS);for(const b of old){delete b.transform;delete b.charge;}old[0].grab=['KeyF',''];old[0].block=['KeyC',''];
 (globalThis as any).localStorage={getItem:()=>JSON.stringify(old)};
 try{const b=loadBindings();assert.deepEqual(b[0].grab,old[0].grab);assert.deepEqual(b[0].block,old[0].block);for(const side of [0,1] as const)for(const action of ['transform','charge'] as const){assert(b[side][action][0]);assert.equal(bindingConflict(b,side,action,b[side][action][0]),null);}}
 finally{delete (globalThis as any).localStorage;}
});
for(const ch of CHAR_IDS){
 check(`${ch}: ten active seconds survive resource depletion and pause freezes the timer`,()=>{
  const g=make(ch);try{const f=g.f[0];ready(f);tap(g,'transform');
   while(f.formT===0)step(g);
   assert.equal(f.formT,600);f.stamina=f.battery=f.blood=0;
   g.paused=true;step(g,120);assert.equal(f.formT,600);g.paused=false;
   step(g,599);assert.equal(f.formT,1);assert.equal(f.formElapsed,599);
   step(g);assert.equal(f.formT,0);assert.equal(f.formElapsed,600);assert.equal(f.aftermathT,FORMS[ch].aftermath);
  }finally{g.destroy();}
 });
 check(`${ch}: transformation commits 200, activates for ten seconds, and syncs all resources`,()=>{
  const g=make(ch),guest=make(ch);try{const f=g.f[0];ready(f);assert(canTransform(f));tap(g,'transform');assert.equal(f.state,'transform');assert.equal(f.meter,0);assert.equal(f.formT,0);assert(!f.invuln&&!f.armor);finishActivation(g);
   assert(f.formT<=FORMS[ch].duration&&f.formT>FORMS[ch].duration-80);const state=JSON.parse(JSON.stringify(captureState(g)));assert.equal(state.v,'dw-online-11');assert(applyState(guest,state));
   for(const k of ['stamina','exhaustT','energy','blood','battery','formT','formStartup','formElapsed','formVariant','aftermathT'] as const)assert.equal(guest.f[0][k],f[k]);assert(JSON.stringify(state).length<64000);
   g.paused=true;const before=JSON.stringify(captureState(g));step(g,180);assert.equal(JSON.stringify(captureState(g)),before);
  }finally{g.destroy();guest.destroy();}
 });
 check(`${ch}: preparation is interruptible, with no refund or invulnerability`,()=>{
  const g=make(ch);try{const [f,o]=g.f;ready(f);o.x=f.x+70;tap(g,'transform');g.startMove(o,o.def.moves[ch==='jane'?'cP':'pL']);step(g,12);assert(f.hp<f.maxHp);assert.equal(f.formStartup,0);assert.equal(f.formT,0);assert(f.meter<10);assert(!f.invuln&&!f.armor);}finally{g.destroy();}
 });
 check(`${ch}: no transformation can escape attack/hit/block/captured states`,()=>{
  for(const state of ['attack','hit','block','seq','cine','down','getup','dizzy','transform'] as const){const g=make(ch);try{const f=g.f[0];ready(f);f.state=state;f.hitstun=f.blockstun=50;assert(!canTransform(f));}finally{g.destroy();}}
 });
 check(`${ch}: form ends, limits stay bounded and neutral recovery returns`,()=>{
  const g=make(ch);try{const f=g.f[0];ready(f);tap(g,'transform');finishActivation(g);f.formT=1;step(g);assert.equal(f.formT,0);assert.equal(f.aftermathT,FORMS[ch].aftermath);assert(f.exhaustT>0);assert(f.stamina>=0&&f.stamina<=120);assert(f.meter<=200);assert.equal(f.maxHp,CHARS[ch].hp);assert.equal(f.state,'ground');}finally{g.destroy();}
 });
}
check('a common Ultimate spends only one of two stored stocks',()=>{const g=make();try{const a=g.f[0];a.meter=200;tap(g,'super');assert.equal(a.meter,100);assert(g.cine);assert(!canTransform(a));}finally{g.destroy();}});
check('meter gain saturates at 200 without increasing its capacity under a form',()=>{const g=make();try{const f=g.f[0];(g as any).gainMeter(f,10000);assert.equal(f.meter,200);f.formT=100;(g as any).gainMeter(f,10000);assert.equal(f.meter,200);}finally{g.destroy();}});
check('stamina cannot lock out light attacks or held defense permanently',()=>{const g=make();try{const [f,o]=g.f;f.stamina=0;f.exhaustT=120;assert(!g.startMove(f,f.def.moves.s1));assert(!g.startMove(f,f.def.moves.pH));assert(g.startMove(f,f.def.moves.pL));step(g,40);g.onlineInputs[0]=1<<ACTIONS.indexOf('block');step(g);assert(f.guard);assert.equal(f.state,'ground');step(g,300);assert.equal(f.exhaustT,0);assert(f.stamina>60);assert.equal(o.hp,o.maxHp);}finally{g.destroy();}});
check('transformation command buffers until actual hitstun recovery, without canceling it',()=>{const g=make('caetano');try{const f=g.f[0];ready(f);f.state='hit';f.hitstun=5;tap(g,'transform');assert.equal(f.state,'hit');assert.equal(f.meter,200);step(g,5);assert.equal(f.state,'transform');assert.equal(f.meter,0);}finally{g.destroy();}});
check('Rick keeps energy, stamina and ULT as three independent resources',()=>{const g=make();try{const f=g.f[0];f.energy=50;f.meter=150;assert(g.startMove(f,f.def.moves.s1));assert.equal(f.energy,34);assert.equal(f.meter,150);assert.equal(f.stamina,110);gainEnergy(f,500);assert.equal(f.energy,100);}finally{g.destroy();}});
check('Rick charge is stationary, vulnerable and disabled throughout Cruz de Energia',()=>{const g=make();try{const [f,o]=g.f;f.energy=0;g.onlineInputs[0]=1<<ACTIONS.indexOf('charge');step(g,60);assert(f.energy>=24&&f.energy<26);assert.equal(f.x,600);assert(f.charging);g.onlineInputs[0]=0;ready(f);tap(g,'transform');assert.equal(f.energy,0);finishActivation(g);g.onlineInputs[0]=1<<ACTIONS.indexOf('charge');gainEnergy(f,100);(g as any).dealDamage(o,f,50);step(g,120);assert.equal(f.energy,0);assert.equal(formStats(f).damage,2);assert.equal(formStats(f).speed,2);g.onlineInputs[0]=0;f.formT=1;step(g);assert.equal(f.energy,0);g.onlineInputs[0]=1<<ACTIONS.indexOf('charge');step(g,200);assert(f.energy>0,'neutral charge becomes legal after ending the form');}finally{g.destroy();}});
check('Rick cannot spend unavailable energy and finish leaves no free specials',()=>{const g=make();try{const f=g.f[0];f.energy=0;const before=f.stamina;for(const id of ['s1','s2','s3'])assert(!g.startMove(f,f.def.moves[id]));assert.equal(f.stamina,before);assert.equal(f.rangedUses,0);assert.equal(f.serial,0);}finally{g.destroy();}});
check('Nomad pays 10% maximum HP and cannot activate a suicidal Jogatina',()=>{const g=make('nomad');try{const f=g.f[0];ready(f);f.hp=f.maxHp*.1;assert(!canTransform(f));f.hp=f.maxHp;tap(g,'transform');assert.equal(f.hp,f.maxHp*.9);assert([0,1,2].includes(f.formVariant));}finally{g.destroy();}});
check('Renngotti has real 15-second aftermath with half strength and speed',()=>{const g=make('renngotti');try{const f=g.f[0];ready(f);tap(g,'transform');finishActivation(g);assert.equal(formStats(f).damage,2);f.formT=1;step(g);assert.equal(f.aftermathT,900);assert.equal(formStats(f).damage,.5);assert.equal(formStats(f).speed,.5);assert(!canTransform(f));}finally{g.destroy();}});
check('Ulisses spends finite captured blood and stops healing without shortening the form',()=>{const g=make('ulisses');try{const f=g.f[0];ready(f);f.blood=1;f.hp=f.maxHp-150;tap(g,'transform');finishActivation(g);f.stamina=120;f.formElapsed=299;step(g);assert.equal(f.blood,0);assert.equal(f.hp,f.maxHp-50);assert(f.formT>0);f.formElapsed=599;step(g);assert.equal(f.hp,f.maxHp-50);assert(f.formT>0);}finally{g.destroy();}});
check('Jane EVA exposes a matching larger hurtbox and spends finite battery on lasers',()=>{const g=make('jane');try{const f=g.f[0],small=g.hurtBox(f);ready(f);tap(g,'transform');finishActivation(g);const big=g.hurtBox(f);assert(big.y1-big.y0>(small.y1-small.y0)*2);assert(g.startMove(f,f.def.moves.s1));assert(f.battery<88);step(g,30);assert(g.projectiles.some(p=>p.kind==='laser')||g.f[1].hp<g.f[1].maxHp);f.battery=0;step(g);assert(f.formT>0);assert(!g.startMove(f,f.def.moves.s1));}finally{g.destroy();}});
for(const side of [0,1] as const)check(`Megalodon has a mirrored aquatic hurtbox, P${side+1}`,()=>{const g=make('tubarao','tubarao');try{const f=g.f[side];f.formT=100;f.facing=side===0?1:-1;const box=g.hurtBox(f);assert(Math.abs((side===0?box.x1-f.x:f.x-box.x0)-105*1.22)<1e-6);assert.equal(box.y0,-155*1.22);f.formT=1;step(g);assert.equal(f.aftermathT,7200);assert(formStats(f).scale<1);}finally{g.destroy();}});
for(const ch of ['jao','hdsh'] as const)check(`${ch}: prediction cannot block grabs, lows or escape hitstun`,()=>{const g=make(ch);try{const [f,o]=g.f;f.formT=200;f.state='hit';f.hitstun=12;g.startMove(o,o.def.moves.pL);step(g);assert.equal(f.state,'hit');assert(!f.guard);f.state='ground';f.hitstun=0;f.predictionCooldown=0;g.startMove(o,o.def.moves.cK);step(g);assert(!f.guard);}finally{g.destroy();}});
for(const [ch,track]of Object.entries(WOC_ULTIMATES))check(`${ch}: cinematic timeline damage is real, finite and synchronized`,()=>{const g=make(ch as CharId);try{const [a,d]=g.f;a.x=600;d.x=710;a.meter=100;tap(g,'super');let saw=false;for(let i=0;i<650;i++){g.step();saw||=!!g.seq;if(saw&&!g.seq)break;}assert(saw);assert.equal(d.maxHp-d.hp,track.beats.reduce((n,b)=>n+b.damage,0));assert.equal(g.seq,null);assert.equal(a.state,'ground');assert(d.hp>0);}finally{g.destroy();}});
check('invalid resource snapshots are rejected atomically without poisoning either fighter',()=>{
 const host=make(),guest=make();try{const state=JSON.parse(JSON.stringify(captureState(host))),before=JSON.stringify(captureState(guest));state.f[1].energy=101;assert(!applyState(guest,state));assert.equal(JSON.stringify(captureState(guest)),before);state.f[1].energy=40;delete state.f[0].stamina;assert(!applyState(guest,state));assert.equal(JSON.stringify(captureState(guest)),before);}finally{host.destroy();guest.destroy();}
});
check('Gatito strength also applies to its committed short-range grab, without free range',()=>{
 const g=make('gabrielzin');try{const [a,d]=g.f;a.x=600;d.x=670;a.formT=300;assert(g.startMove(a,a.def.moves.s2));let seen=false;for(let i=0;i<160;i++){g.step();seen||=!!g.seq;if(seen&&!g.seq)break;}assert(seen);assert(Math.abs(d.maxHp-d.hp-64*1.3)<.001);assert.equal(g.seq,null);assert.equal(a.def.moves.s2.hb[1],92);}finally{g.destroy();}
});
check('EVA second-hand laser shares the three-activation ranged cooldown and cannot spend rejected battery',()=>{
 const g=make('jane');try{const f=g.f[0];f.formT=300;for(let i=0;i<3;i++)assert(g.startMove(f,f.def.moves.s2));assert.equal(f.rangedUses,3);assert.equal(f.rangedCooldown,300);const battery=f.battery;assert(!g.startMove(f,f.def.moves.s2));assert.equal(f.battery,battery);}finally{g.destroy();}
});
for(const facing of [-1,1] as const)check(`EVA hand laser aims once at launch and reaches a standing target, facing ${facing}`,()=>{
 const g=make('jane');try{const [a,d]=g.f;a.x=800;d.x=800+facing*260;a.facing=facing;a.manualFacing=true;a.formT=300;assert(g.startMove(a,a.def.moves.s1));let fired=false;for(let i=0;i<80;i++){g.step();fired||=g.projectiles.some(p=>p.kind==='laser');}assert(fired);assert(Math.abs(d.maxHp-d.hp-60*1.35)<.001);assert.equal(a.rangedUses,1);}finally{g.destroy();}
});
assert.equal(ONLINE_PROTOCOL,'dw-online-11');
console.log(`War of Champions: ${cases} regressions passed (18 fighters, double HP, finite resources/forms, interruption and recovery, true-stun commitment, 2 ULT stocks, snapshots and model-sheet cinematic damage).`);
