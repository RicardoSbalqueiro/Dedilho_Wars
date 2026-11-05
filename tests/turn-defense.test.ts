import assert from 'node:assert/strict';
import { Game, PERFECT_GUARD_FRAMES, PRECISION_GUARD_FRAMES } from '../src/game/engine';
import type { Fighter } from '../src/game/engine';
import { CHARS, CHAR_IDS, SPECIAL_CHIP } from '../src/game/data';
import type { CharId, Move } from '../src/game/data';
import { ACTIONS, DEFAULT_BINDINGS, MAX_INPUT_MASK, keyboard, loadBindings, bindingConflict, bindingNotices } from '../src/game/input';
import { captureState, applyState } from '../src/game/net-state';
import { FightConnection } from '../src/online/connection';
import { touchInput } from '../src/game/touch';
import { aiAct } from '../src/game/ai';

(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
let cases=0;
const step=(g:Game,n=1)=>{for(let i=0;i<n;i++)g.step()};
function make(ch:CharId='caetano',other:CharId='nomad'){
 keyboard.down.clear();keyboard.pressed.clear();touchInput.clear();
 const g=new Game({mode:'training',p1:ch,p2:other,difficulty:'normal',bindings:DEFAULT_BINDINGS},()=>{});
 g.train.dummy=3;g.f[0].x=400;g.f[1].x=1200;return g;
}
function check(name:string,fn:()=>void){try{fn();cases++}catch(e){throw new Error(name,{cause:e})}}
function game(name:string,fn:(g:Game)=>void,ch:CharId='caetano',other:CharId='nomad'){
 check(name,()=>{const g=make(ch,other);try{fn(g)}finally{g.destroy();keyboard.down.clear();keyboard.pressed.clear();touchInput.clear()}});
}
const apply=(g:Game,a:Fighter,d:Fighter,m:Move)=>{(g as any).applyHit(a,d,m,{x:d.x,y:-100,dir:a.facing,serial:a.serial})};
const near=(g:Game)=>{g.f[0].x=650;g.f[1].x=710};
function lockedAttack(g:Game,f:Fighter,remaining:number){const m=f.def.moves.pH;g.startMove(f,m);f.moveT=m.startup+m.active+m.recovery+m.whiff-remaining}

check('legacy bindings keep Q grab and all custom controls; turn gets a globally free key',()=>{
 const old:any=structuredClone(DEFAULT_BINDINGS);delete old[0].turn;delete old[1].turn;
 old[0].grab=['KeyQ',''];old[0].p=['KeyF',''];old[1].s3=['KeyN','Enter'];
 (globalThis as any).localStorage={getItem:()=>JSON.stringify(old)};
 try{const next=loadBindings();for(const p of [0,1])for(const a of ACTIONS.filter(a=>a!=='turn'))assert.deepEqual(next[p][a],old[p][a]);
  assert.equal(next[0].turn[0],'KeyV');assert.equal(next[1].turn[0],'Numpad8');
  assert.equal(bindingConflict(next,0,'turn','KeyQ'),'P1 · Agarrão');assert(bindingNotices(next).some(s=>s.includes('Q já está')));
  assert.equal(bindingConflict(next,0,'turn',next[0].turn[0]),null);
  assert.deepEqual(loadBindings(),next,'migration is deterministic without writing storage');
 }finally{delete (globalThis as any).localStorage}
});
check('explicit custom/unassigned turn and old duplicate controls are preserved and reported',()=>{
 const b=structuredClone(DEFAULT_BINDINGS);b[0].grab=['KeyQ',''];b[1].turn=['',''];
 (globalThis as any).localStorage={getItem:()=>JSON.stringify(b)};
 try{assert.deepEqual(loadBindings(),b);assert(bindingNotices(b).some(s=>s.includes('conflito')));assert(bindingNotices(b).some(s=>s.includes('sem tecla')))}finally{delete (globalThis as any).localStorage}
 assert.equal(DEFAULT_BINDINGS[0].turn[0],'KeyQ');assert.equal(DEFAULT_BINDINGS[1].turn[0],'KeyN');
 assert.equal(ACTIONS.indexOf('grab'),11);assert.equal(ACTIONS.indexOf('turn'),12);assert.equal(MAX_INPUT_MASK,8191);
 assert.match(bindingConflict(DEFAULT_BINDINGS,0,'turn','KeyP')!,/Pausa/);
});

for(const idx of [0,1] as const)for(const side of [-1,1])game(`P${idx+1}, opponent side ${side}: immediate turn persists through crossings`,g=>{
 const f=g.f[idx],o=g.f[1-idx];f.x=800;o.x=800+side*400;g.step();assert.equal(f.facing,side);
 const x=f.x,invuln=f.invuln,serial=f.serial,meter=f.meter;keyboard.down.add(idx===0?'KeyQ':'KeyN');g.step();
 assert.equal(f.facing,-side);assert(f.manualFacing);assert.equal(f.x,x);assert.equal(f.invuln,invuln);assert.equal(f.serial,serial);assert.equal(f.meter,meter);
 step(g,12);assert.equal(f.facing,-side,'holding turn never repeats');keyboard.down.clear();g.step();
 o.x=800-side*400;step(g,4);assert.equal(f.facing,-side);o.x=800+side*400;step(g,4);assert.equal(f.facing,-side);
 keyboard.down.add(idx===0?'KeyQ':'KeyN');g.step();assert.equal(f.facing,side);assert(f.manualFacing);
});
game('a same-frame crossing does not swallow the requested facing inversion',g=>{
 g.step();const f=g.f[0];assert.equal(f.facing,1);g.f[1].x=100;f.pad.tap('turn',g.tick);g.step();assert.equal(f.facing,-1);
});
for(const source of ['keyboard','touch','online'])game(`${source}: fast turn press survives release between frames`,g=>{
 let guardPress=-999;
 if(source==='keyboard'){(keyboard as any).kd({code:'KeyQ',repeat:false,preventDefault(){}});(keyboard as any).ku({code:'KeyQ'})}
 if(source==='touch'){touchInput.set(19,['block']);step(g,4);guardPress=g.f[0].pad.edgeAt.block;touchInput.set(20,['turn']);touchInput.set(20,[])}
 if(source==='online'){g.cfg.online=true;g.onlinePressed[0]=1<<ACTIONS.indexOf('turn')}
 g.step();assert.equal(g.f[0].facing,-1);if(source==='touch'){assert(g.f[0].guard);assert.equal(g.f[0].pad.edgeAt.block,guardPress,'turn cannot refresh a held perfect guard');}step(g,12);assert.equal(g.f[0].facing,-1);
});
for(const state of ['attack','hit','block','getup','landing','dash'] as const)for(const remaining of [1,8,9])game(`${state}, queue ${remaining}: no turn animation cancel`,g=>{
 const f=g.f[0],old=f.facing;
 if(state==='attack')lockedAttack(g,f,remaining);
 else if(state==='landing')f.landLag=remaining;
 else if(state==='dash'){f.state='dash';f.stateT=f.def.dashDur-remaining;f.vx=3;}
 else {f.state=state;f.hitstun=f.blockstun=remaining;if(state==='getup')f.stateT=18-remaining;}
 f.pad.tap('turn',g.tick);step(g,remaining-1);assert.equal(f.facing,old);g.step();
 assert.equal(f.facing,remaining<9?-old:old);assert.equal(f.manualFacing,remaining<9);
});
game('turn during long hitstun expires instead of triggering much later',g=>{
 const f=g.f[0];f.state='hit';f.hitstun=20;f.pad.tap('turn',0);step(g,20);assert.equal(f.facing,1);assert(!f.manualFacing);
});
game('hitstop preserves a turn buffered near the end of an attack',g=>{
 const f=g.f[0];lockedAttack(g,f,2);g.hitstop=15;f.pad.tap('turn',0);step(g,17);assert.equal(f.facing,-1);assert.equal(f.state,'ground');
});

for(const ch of CHAR_IDS)for(const facing of [-1,1] as const)game(`${ch}, facing ${facing}: subsequent light hitbox and pose respect manual direction`,g=>{
 const f=g.f[0],o=g.f[1];f.facing=facing;f.manualFacing=true;f.x=800;o.x=800+facing*55;
 f.pad.tap('p',0);g.step();assert.equal(f.move?.id,'pL');const box=g.boxOf(f);
 assert(facing===1?box.x0>f.x:box.x1<f.x);step(g,f.move!.startup+2);
 assert.equal(f.contact,'hit');assert(o.hp<o.maxHp);assert.equal(f.facing,facing);
 assert.equal(f.poseName,f.def.moves.pL.poses[1]);assert(Object.values(f.rig.p).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
},ch);
game('clean hits cancel manual orientation; ordinary blocks keep the chosen direction',g=>{
 near(g);const [f,o]=g.f;f.manualFacing=true;f.facing=-1;f.guard=true;f.pad.edgeAt.block=-999;
 apply(g,o,f,o.def.moves.pL);assert.equal(f.state,'block');assert(f.manualFacing);
 f.state='ground';f.guard=false;apply(g,o,f,o.def.moves.pL);assert.equal(f.state,'hit');assert(!f.manualFacing);
 step(g,f.hitstun+10);assert.equal(f.facing,1);
});
game('grabs and cinematic sequences release manual orientation and ignore turn inputs',g=>{
 const [f,o]=g.f;f.manualFacing=o.manualFacing=true;(g as any).startSeq('throw',f,o);assert(g.f.every(f=>!f.manualFacing));
 const facing=f.facing;f.pad.tap('turn',g.tick);step(g,20);assert.equal(f.facing,facing);assert.equal(f.state,'seq');
 g.resetPositions();f.manualFacing=true;(g as any).startSuper(f);assert(!f.manualFacing);f.pad.tap('turn',g.tick);step(g,20);assert.equal(f.state,'cine');assert.equal(f.facing,1);
});
for(const ch of CHAR_IDS)for(const m of Object.values(CHARS[ch].moves).filter(m=>m.turn))game(`${ch}/${m.id}: authored spin is not changed by turn`,g=>{
 const f=g.f[0];f.facing=-1;f.manualFacing=true;g.startMove(f,m);const t=m.turn![0]+3;f.moveT=t;f.pad.tap('turn',0);g.step();
 assert.equal(f.facing,-1);const cos=Math.cos((t-m.turn![0])/(m.turn![1]-m.turn![0])*Math.PI*2);
 assert(Math.abs(f.turn-(Math.abs(cos)<.18?(cos<0?-.18:.18):cos))<.0001);
 assert.equal(f.move?.id,m.id);
},ch);
game('Jane slide keeps its original automatic kick turn on frame 18',g=>{
 const f=g.f[0];f.facing=-1;f.manualFacing=true;g.startMove(f,f.def.moves.s3);assert(!f.manualFacing);
 f.moveT=17;f.pad.tap('turn',0);g.step();assert.equal(f.facing,-1);g.step();assert.equal(f.facing,1);assert.equal(f.move?.id,'s3');
},'jane');
game('released projectiles keep velocity while new projectiles use the new facing',g=>{
 const f=g.f[0];g.startMove(f,f.def.moves.s1);step(g,45);const old=g.projectiles[0];assert(old&&old.vx>0);const x=old.x;
 f.pad.tap('turn',g.tick);g.step();assert.equal(f.facing,-1);assert(old.x>x&&old.vx>0);assert.equal(old.launchFacing,1);
 f.pad.tap('s1',g.tick);g.step();step(g,f.def.moves.s1.startup+1);const fresh=g.projectiles.find(p=>p.serial===f.serial);
 assert(fresh&&fresh.vx<0);assert.equal(fresh.launchFacing,-1);
},'rickzera');
game('a stationary projectile keeps its launch direction at an exact-center impact',g=>{
 const [f,d]=g.f;g.startMove(f,f.def.moves.s2);(g as any).spawnProjectile(f,f.move);const p=g.projectiles[0];
 p.x=d.x=800;(g as any).endAttack(f);f.pad.tap('turn',g.tick);g.step();
 assert.equal(f.facing,-1);assert.equal(p.launchFacing,1);assert.equal(p.vx,0);assert(d.vx>0,'owner turn cannot reverse an existing zone impact');
},'aneninha');

// Collision rules: no normals chip, correct posture and no guard in committed states.
for(const crouch of [false,true])for(const level of ['high','mid','low'] as const)game(`basic guard, crouch=${crouch}, level=${level}`,g=>{
 const [d,a]=g.f;d.guard=true;d.crouch=crouch;const m={...a.def.moves.pL,level};
 apply(g,a,d,m);const expected=level==='mid'||(crouch?level==='low':level==='high');
 assert.equal(d.state,expected?'block':'hit');assert.equal(d.hp===d.maxHp,expected);
 assert.equal(d.invuln,0);
});
for(const ch of CHAR_IDS)for(const key of ['pL','pM','pH','kL','kM','kH','cP','cK','jP','jK'])game(`${ch}/${key}: normals never cause chip`,g=>{
 const [a,d]=g.f,m=a.def.moves[key];d.guard=true;d.crouch=m.level==='low';apply(g,a,d,m);
 assert.equal(d.state,'block');assert.equal(d.hp,d.maxHp);assert.equal(d.blockstun,m.blockstun);
},ch);
for(const ch of CHAR_IDS)for(const [i,key] of ['s1','s2','s3'].entries())game(`${ch}/${key}: individual special chip remains below old damage`,g=>{
 const [a,d]=g.f,m=a.def.moves[key];assert.equal(m.chip,SPECIAL_CHIP[ch][i]);assert(m.chip!>=0&&m.chip!<=.08);
 if(m.grab||m.unblockable||m.dmg===0)return;
 d.guard=true;d.crouch=m.level==='low';apply(g,a,d,m);assert.equal(d.state,'block');
 assert(Math.abs(d.maxHp-d.hp-m.dmg*m.chip!)<.0001);assert(d.maxHp-d.hp<m.dmg*.1);
},ch);
for(const state of ['attack','hit','launched','dizzy'] as const)game(`${state}: defense and turn cannot bypass commitment`,g=>{
 const [d,a]=g.f;d.state=state;d.guard=true;d.hitstun=8;d.blockstun=8;if(state==='attack'){d.move=d.def.moves.pH;d.moveT=10}
 if(state==='launched')d.y=-10;const facing=d.facing;d.pad.tap('turn',g.tick);apply(g,a,d,a.def.moves.pL);
 assert.equal(d.state,state==='launched'?'launched':'hit');assert(d.hp<d.maxHp);assert.equal(d.facing,facing);
});
game('landing lag remains punishable until its final frame',g=>{
 near(g);const [d,a]=g.f;d.landLag=4;keyboard.down.add('KeyL');g.step();assert(!d.guard);
 g.startMove(a,a.def.moves.pL);a.moveT=a.move!.startup;g.step();assert.equal(d.state,'hit');assert(d.hp<d.maxHp);
 assert.equal(d.landLag,0,'hitstun replaces the old landing commitment');g.hitstop=0;step(g,d.hitstun-1);
 a.x=d.x+60;g.startMove(a,a.def.moves.pL);a.moveT=a.move!.startup;g.step();assert.equal(d.state,'block','held defense works on the first recovered frame after a landing punish');
});
game('held defense blocks on the first recovered frame, not during true hitstun',g=>{
 near(g);const [d,a]=g.f;d.state='hit';d.hitstun=3;keyboard.down.add('KeyL');g.step();assert.equal(d.state,'hit');
 g.startMove(a,a.def.moves.pL);a.moveT=a.move!.startup;g.step();assert.equal(d.state,'hit');assert(d.hp<d.maxHp);
 g.hitstop=0;step(g,6);d.hitstun=1;g.startMove(a,a.def.moves.pL);a.moveT=a.move!.startup;g.step();assert.equal(d.state,'block');assert.equal(d.guardResult,'block');
});
game('grabs still beat held guard',g=>{
 const [a,d]=g.f;d.guard=true;g.startMove(a,{...a.def.moves.pH,id:'throw',kind:'special',grab:'throw',unblockable:true});
 apply(g,a,d,a.move!);assert.equal(g.seq?.kind,'throw');assert.equal(d.state,'seq');
});

assert.equal(PERFECT_GUARD_FRAMES,3);assert.equal(PRECISION_GUARD_FRAMES,5);
for(const age of [0,1,2,3,4])game(`universal perfect guard boundary age ${age}`,g=>{
 const [a,d]=g.f;g.tick=100;d.guard=true;d.pad.tap('block',100-age);const m=a.def.moves.pH;apply(g,a,d,m);
 assert.equal(d.guardResult,age<3?'perfect':'block');assert.equal(d.impact?.kind,d.guardResult);
 assert.equal(d.blockstun,age<3?Math.max(4,Math.ceil(m.blockstun*.6)):m.blockstun);assert.equal(d.invuln,0);assert.equal(d.precision,0);
});
for(const age of [0,2,3,4,5])game(`Caetano extra Precision boundary age ${age}`,g=>{
 const [a,d]=g.f;g.tick=100;d.guard=true;d.pad.tap('block',100-age);apply(g,a,d,a.def.moves.s1);
 assert.equal(d.guardResult,age<5?'precision':'block');assert.equal(d.precision,age<5?120:0);
 if(age<5){assert.equal(d.blockstun,4);assert.equal(d.hp,d.maxHp);assert.equal(d.parryCooldown,24)}
},'nomad','caetano');
game('one press cannot refresh perfect guard through held block or hitstop',g=>{
 const [a,d]=g.f;g.tick=100;d.guard=true;d.pad.tap('block',100);apply(g,a,d,a.def.moves.pL);assert.equal(d.guardResult,'perfect');
 apply(g,a,d,a.def.moves.pL);assert.equal(d.guardResult,'block','same edge is spent');
 d.pad.freezeBuffers(101);g.tick=101;apply(g,a,d,a.def.moves.pL);assert.equal(d.guardResult,'block');
});
game('perfect guard still permits real answers and does not grant invulnerability',g=>{
 near(g);const [a,d]=g.f;g.tick=100;d.guard=true;d.pad.tap('block',100);apply(g,a,d,a.def.moves.pH);
 g.hitstop=0;step(g,d.blockstun-3);d.pad.tap('p',g.tick);step(g,3);assert.equal(d.move?.id,'pL');assert.equal(d.invuln,0);
});
game('block recovery exposes a short actionable indicator; attacks clear it',g=>{
 const f=g.f[0];f.state='block';f.blockstun=1;g.step();assert.equal(f.state,'ground');assert.equal(f.guardReadyT,36);step(g,20);assert.equal(f.guardReadyT,16);
 f.pad.tap('p',g.tick);g.step();assert.equal(f.guardReadyT,0);assert.equal(f.guard,false);
});
game('AI can prepare held guard during hitstun without canceling it',g=>{
 const f=g.f[1];near(g);g.tick=100;f.state='hit';f.hitstun=4;f.ai.blockT=90;f.ai.blockUntil=130;f.ai.thinkT=200;
 aiAct(g,f,'normal');assert(f.pad.held.block);assert.equal(f.state,'hit');assert.equal(f.hitstun,4);
});

game('online state preserves manual orientation, perfect feedback, spent press and response window',g=>{
 const [a,d]=g.f;a.manualFacing=true;a.facing=-1;g.tick=100;d.guard=true;d.pad.tap('block',100);apply(g,a,d,a.def.moves.pH);
 d.guardReadyT=18;const copy=make();try{assert(applyState(copy,JSON.parse(JSON.stringify(captureState(g)))));
  assert.equal(copy.f[0].facing,-1);assert(copy.f[0].manualFacing);assert.equal(copy.f[1].guardResult,'perfect');
  assert.equal(copy.f[1].guardSpentAt,100);assert.equal(copy.f[1].guardReadyT,18);assert.deepEqual(copy.f[1].impact,d.impact);
 }finally{copy.destroy()}
});
check('direct online transport accepts turn bit and rejects invalid mask/event ranges',()=>{
 const received:any[]=[];const connection=new FightConnection({host:{id:'host'},code:'TESTROOM'} as any,{id:'host'} as any,{state(){},input:n=>received.push(n),status(){},lost(){}});
 const packet=(n:number,mask:number,events:any[]=[])=>({type:'input',n,input:{mask,events}});
 (connection as any).accept(packet(1,4096,[{id:1,mask:4096}]));assert.equal(received.length,1);
 (connection as any).accept(packet(2,8192));(connection as any).accept(packet(2,0,[{id:2,mask:8192}]));assert.equal(received.length,1);
 (connection as any).accept(packet(2,MAX_INPUT_MASK,[{id:2,mask:4096}]));assert.equal(received.length,2);
});
console.log(`Turn/defense: ${cases} cases passed (both players/sides/crossings, buffered turns, all 13 rigs/hitboxes, authored spins, projectiles, legacy bindings, guard posture/commitment, zero normal chip, individual special chip, 3-frame perfect/Precision, AI and online).`);
