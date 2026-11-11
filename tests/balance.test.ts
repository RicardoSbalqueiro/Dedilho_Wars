import assert from 'node:assert/strict';
import { Game } from '../src/game/engine';
import type { Fighter } from '../src/game/engine';
import { CHAR_IDS, CHARS } from '../src/game/data';
import type { CharId, Move } from '../src/game/data';
import { comboDamageScale } from '../src/game/balance';
import { frameData } from '../src/game/frame-data';
import { readFileSync } from 'node:fs';
import { ACTIONS, DEFAULT_BINDINGS, keyboard } from '../src/game/input';
import { touchInput } from '../src/game/touch';
import { captureState, applyState } from '../src/game/net-state';
import { incomingProjectile } from '../src/game/ai';

(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
let cases=0;
const bit=(action:string)=>1<<ACTIONS.indexOf(action as any);
const step=(g:Game,n=1)=>{for(let i=0;i<n;i++)g.step()};
function make(ch:CharId='caetano',other:CharId='cristyan'){
 keyboard.down.clear();keyboard.pressed.clear();touchInput.clear();
 const g=new Game({mode:'versus',p1:ch,p2:other,difficulty:'normal',bindings:DEFAULT_BINDINGS,online:true},()=>{});
 g.phase='fight';g.f[0].x=600;g.f[1].x=600+CHARS[ch].pushW+CHARS[other].pushW+2;
 return g;
}
function check(name:string,fn:()=>void){try{fn();cases++}catch(e){throw new Error(name,{cause:e})}}
function game(name:string,fn:(g:Game)=>void,ch:CharId='caetano',other:CharId='cristyan'){
 check(name,()=>{const g=make(ch,other);try{fn(g)}finally{g.destroy()}});
}
const apply=(g:Game,a:Fighter,d:Fighter,m:Move)=>(g as any).applyHit(a,d,m,{x:d.x,y:-100,dir:a.facing,serial:a.serial});
function finish(g:Game){for(let i=0;i<900&&(g.cine||g.seq||g.f.some(f=>f.move?.kind==='super'));i++)g.step();assert(!g.cine&&!g.seq,'cinematic must terminate');}
const soloDamage:Partial<Record<CharId,number>>={};

check('progressive scaling has a finite positive floor and never grows in a true chain',()=>{
 assert.equal(comboDamageScale(0),1);assert.equal(comboDamageScale(1),.9);assert.equal(comboDamageScale(8),.2);
 for(let i=1;i<=1000;i++){assert(comboDamageScale(i)<=comboDamageScale(i-1));assert(comboDamageScale(i)>=.2)}
});

for(const ch of CHAR_IDS)game(`${ch}: a full-bar solo Ultimate preserves authored damage and remains below 40% of Jane HP`,g=>{
 const [a,d]=g.f;a.meter=100;a.pad.tap('super',g.tick);
 for(let i=0;i<250&&!g.seq;i++)g.step();assert(g.seq,'neutral opponent should be captured');finish(g);
 const damage=d.maxHp-d.hp;soloDamage[ch]=damage;
 assert.equal(damage,frameData(ch,'super').damage,'training Ultimate damage must match the real cinematic');
 assert(damage>0&&damage<=CHARS.jane.hp*.4,`damage ${damage}`);assert(a.meter<100,'cost is not refunded');
 assert(Number.isFinite(d.comboDmg));
},ch);

for(const ch of CHAR_IDS)game(`${ch}: confirmed medium → Ultimate preserves total and scales the entire cinematic once`,g=>{
 const [a,d]=g.f;a.meter=100;g.startMove(a,a.def.moves.pM);
 for(let i=0;i<80&&!a.connected;i++)g.step();assert.equal(a.contact,'hit');
 const opening=d.maxHp-d.hp,contacts=d.comboHits;assert.equal(contacts,1);
 a.pad.tap('super',g.tick);g.onlineInputs[1]=bit('block');
 for(let i=0;i<250&&!g.seq;i++)g.step();assert(g.seq,'sufficient hitstun confirms the commitment');
 assert.equal(g.seq!.damageScale,.9);assert.equal(d.comboDmg,opening,'opening must not be discarded');
 const snapshot=JSON.parse(JSON.stringify(captureState(g))),copy=make();
 try{assert(applyState(copy,snapshot));assert.equal(copy.seq?.damageScale,.9);assert.equal(copy.f[1].comboDmg,opening)}finally{copy.destroy()}
 finish(g);const expected=opening+soloDamage[ch]!*.9;
 assert(Math.abs(d.maxHp-d.hp-expected)<.001,`${d.maxHp-d.hp} vs ${expected}`);
 assert(Math.abs(d.comboDmg-expected)<.001,'training/history counter includes the opening');
},ch);

for(const ch of CHAR_IDS)for(const side of [0,1] as const)for(const direction of [0,1,-1])game(`${ch}: P${side+1} ULT can be jumped after announcement, direction ${direction}`,g=>{
 const a=g.f[side],d=g.f[1-side];a.meter=100;a.pad.tap('super',g.tick);g.step();
 while(g.cine)g.step();assert.equal(a.move?.kind,'super');
 const toward=d.x<a.x?'right':'left',away=toward==='left'?'right':'left';
 g.onlineInputs[d.idx]=bit('up')|(direction===1?bit(toward):direction===-1?bit(away):0);
 let captured=false;for(let i=0;i<130;i++){g.step();captured ||=!!g.seq;}
 assert(!captured);assert.equal(d.hp,d.maxHp);assert.equal(a.state,'ground');
},side===0?ch:'eneas',side===1?ch:'eneas');

for(const ch of CHAR_IDS)game(`${ch}: neutral ULT startup is interruptible and costs meter even on interruption`,g=>{
 const [a,d]=g.f;a.meter=100;a.pad.tap('super',g.tick);g.step();while(g.cine)g.step();
 assert(!a.armor);if(ch==='jane')g.startMove(d,d.def.moves.cP);else d.pad.tap('p',g.tick);step(g,10);
 assert(a.hp<a.maxHp);assert.equal(a.state,'hit');assert.equal(a.move,null);assert(!g.seq);assert(a.meter<100);
},ch);
for(const ch of CHAR_IDS)game(`${ch}: a missed ULT has vulnerable recovery`,g=>{
 const [a,d]=g.f;a.x=200;d.x=1080;a.meter=100;a.pad.tap('super',g.tick);g.step();while(g.cine)g.step();
 while(a.move&&a.moveT<a.move.startup+a.move.active)g.step();g.step();
 assert(a.move?.kind==='super');assert(!a.armor);assert(!a.hbActive);
 d.x=a.x+CHARS[ch].pushW+d.def.pushW+2;d.facing=-1;if(ch==='jane')g.startMove(d,d.def.moves.cP);else d.pad.tap('p',g.tick);step(g,10);
 assert(a.hp<a.maxHp);assert.equal(a.state,'hit');assert(!g.seq);
},ch);

for(const ch of CHAR_IDS)game(`${ch}: repeated lights leave a genuine held-defense escape, never an infinite`,g=>{
 const [a,d]=g.f;g.startMove(a,a.def.moves.pL);for(let i=0;i<80&&!a.connected;i++)g.step();assert.equal(a.contact,'hit');
 const opening=d.maxHp-d.hp;g.onlineInputs[1]=bit('block');let gotFree=false,blocked=false;
 for(let i=0;i<600;i++){
  if(a.state==='ground')a.pad.tap('p',g.tick);
  g.step();gotFree ||=d.state==='ground';blocked ||=a.contact==='block';
 }
 assert(gotFree);assert(blocked);assert.equal(d.maxHp-d.hp,opening,'subsequent lights cannot bypass held guard');
 assert.equal(d.comboHits,0);
},ch);

for(const ch of CHAR_IDS)game(`${ch}: four air contacts stop all later hitbox attempts until landing`,g=>{
 const [a,d]=g.f;d.state='launched';d.juggle=0;d.y=-60;const hp=d.hp;
 for(let n=0;n<20;n++){
  a.state='jump';a.y=-60;a.facing=1;a.x=600;d.x=675;d.y=-60;
  g.startMove(a,a.def.moves.jK);a.hbActive=true;(g as any).resolveHits();
  assert.equal(d.juggle,Math.min(n+1,4));
 }
 const damage=hp-d.hp,base=a.def.moves.jK.dmg;
 const bonus=ch==='orango'?[1,1.03,1.06,1.09]:[1,1,1,1];
 const expected=bonus.reduce((sum,b,i)=>sum+base*comboDamageScale(i)*b,0);
 assert(Math.abs(damage-expected)<.001);assert(damage<d.maxHp*.35);
},ch);

for(const ch of CHAR_IDS)for(const target of ['jane','cristyan'] as const)for(const facing of [-1,1] as const)for(const edge of [-.01,.01])game(`${ch}: pL real hurtbox range vs ${target}, facing ${facing}, edge ${edge}`,g=>{
 const [a,d]=g.f,m=a.def.moves[target==='jane'?'cP':'pL'];a.x=800;a.facing=facing;d.x=800+facing*(m.hb[1]+d.def.pushW+4+edge);
 g.startMove(a,m);a.hbActive=true;(g as any).resolveHits();
 assert.equal(d.hp<d.maxHp,edge<0);
},ch,target);

for(const ch of CHAR_IDS)game(`${ch}: first-contact grounded jab advantage matches the engine clock`,g=>{
 const [a,d]=g.f;g.startMove(a,a.def.moves.pL);let hit=false,aFree=-1,dFree=-1;
 for(let i=0;i<100;i++){g.step();hit ||=a.contact==='hit';if(hit){if(a.state==='ground'&&aFree<0)aFree=g.tick;if(d.state==='ground'&&dFree<0)dFree=g.tick;}if(aFree>=0&&dFree>=0)break;}
 assert(aFree>=0&&dFree>=0);assert.equal(dFree-aFree,frameData(ch,'pL').hitAdvantage,'training first-contact advantage matches actual recovery');
},ch);

for(const [ch,id] of [['tubarao','s2'],['orango','s2'],['orango','s3'],['renngotti','s1']] as const)for(const locked of ['hit','block','jump','down','getup'])game(`${ch}/${id}: command grab cannot extend ${locked}`,g=>{
 const [a,d]=g.f;d.state=locked as any;d.hitstun=d.blockstun=20;if(locked==='jump')d.y=-30;
 g.startMove(a,a.def.moves[id]);a.hbActive=true;(g as any).resolveHits();assert(!g.seq);assert.equal(d.hp,d.maxHp);
},ch);
for(const side of [-1,1] as const)for(const distance of [120,140])game(`Engole: strict shorter range, side ${side}, distance ${distance}`,g=>{
 const [a,d]=g.f;a.x=800;a.facing=side;d.x=800+side*distance;g.startMove(a,a.def.moves.s2);a.hbActive=true;(g as any).resolveHits();
 assert.equal(!!g.seq,distance===120);if(g.seq){finish(g);assert.equal(d.maxHp-d.hp,125)}
},'tubarao','cristyan');

game('Jao area has one owner slot, slows ground, leaves air movement free and breaks on a clean hit',g=>{
 const [a,d]=g.f;a.x=400;d.x=630;g.startMove(a,a.def.moves.s1);(g as any).spawnProjectile(a,a.move);(g as any).spawnProjectile(a,a.move);
 assert.equal(g.projectiles.filter(p=>p.kind==='chess').length,1);
 const start=d.x;g.onlineInputs[1]=bit('right');g.step();const slowDelta=d.x-start;
 const free=make('jao');free.f[0].x=400;free.f[1].x=start;free.onlineInputs[1]=bit('right');free.step();const normalDelta=free.f[1].x-start;free.destroy();
 assert(Math.abs(slowDelta-normalDelta*.65)<.001);
 d.state='jump';d.y=-100;d.vy=-1;d.vx=4;g.onlineInputs[1]=0;const airX=d.x;g.step();assert.equal(d.x-airX,4);
 apply(g,d,a,d.def.moves.pL);assert(g.projectiles.every(p=>p.kind!=='chess'||p.life===0));
},'jao');
game('Renngotti field budget removes the oldest microphone; anchored/resonant hits remain single contact',g=>{
 const [a,d]=g.f;a.x=200;d.x=1080;
 for(let i=0;i<3;i++){g.startMove(a,a.def.moves.s2);(g as any).spawnProjectile(a,a.move)}
 const owned=g.projectiles.filter(p=>p.kind==='microphone');assert.equal(owned.length,2);assert(owned.every(p=>p.serial>=2));
 const p=owned[0];g.projectiles=[p];p.age=50;p.x=d.x;p.y=-14;p.vx=0;p.anchored=true;p.radius=48;p.move={...p.move,dmg:28,level:'low'};
 g.onlineInputs[1]=bit('down')|bit('block');g.step();assert.equal(d.state,'block');assert.equal(g.projectiles.length,0);
 const hp=d.hp;step(g,50);assert.equal(d.hp,hp,'consumed trap cannot hit again');
},'renngotti');

game('Santox fourth wall cannot escape a true stun, is vulnerable after active frames and stays on cooldown',g=>{
 const [a,d]=g.f;a.state='hit';a.hitstun=15;a.pad.tap('s3',g.tick);step(g,10);assert.equal(a.state,'hit');assert.equal(a.fourthCooldown,0);
 step(g,6);a.pad.tap('s3',g.tick);g.step();assert.equal(a.move?.id,'s3');assert(a.fourthCooldown>0);
 step(g,a.def.moves.s3.startup+2);assert(a.invuln>0);const hp=a.hp;
 g.startMove(d,d.def.moves.pL);d.hbActive=true;(g as any).resolveHits();assert.equal(a.hp,hp);
 while(a.move&&a.moveT<a.move.startup+a.move.active+1)g.step();assert.equal(a.invuln,0);
 d.x=a.x+65;d.facing=-1;g.startMove(d,d.def.moves.pL);d.hbActive=true;(g as any).resolveHits();assert(a.hp<hp);
 assert(!g.startMove(a,a.def.moves.s3),'cooldown survives interruption');
},'santox');

for(const kind of ['microphone','osasco','spray'] as const)game(`AI detects nearby stationary ${kind} without requiring projectile velocity`,g=>{
 const [a,d]=g.f;
 const p={owner:0 as const,kind,x:d.x-35,y:-14,vx:0,life:80,serial:1,move:{...a.def.moves.s2,dmg:28,level:'low' as const},radius:48,anchored:kind==='microphone'};
 g.projectiles=[p];assert.equal(incomingProjectile(g,d),p);
 p.life=0;assert.equal(incomingProjectile(g,d),undefined);
 p.life=80;p.x=d.x-500;assert.equal(incomingProjectile(g,d),undefined);
});
game('AI picks the closest real threat and ignores own, expired, retreating and zero-damage chess objects',g=>{
 const [a,d]=g.f;
 const base={owner:0 as const,kind:'franco' as const,x:d.x-150,y:-100,vx:10,life:80,serial:1,move:a.def.moves.s1,radius:20};
 const far={...base},close={...base,x:d.x-60},board={...base,kind:'chess' as const,x:d.x,vx:0,move:{...base.move,dmg:0}};
 g.projectiles=[board,{...base,owner:1},{...base,life:0},{...base,x:d.x+30},far,close];
 assert.equal(incomingProjectile(g,d),close);g.projectiles=[board];assert.equal(incomingProjectile(g,d),undefined);
});

game('exact recovery-frame Ultimate inherits scaling without adding hitstun or a grace period',g=>{
 const [a,d]=g.f;a.x=600;d.x=734;a.meter=100;g.startMove(a,a.def.moves.cP);
 let request=0,last=-1;const route=['p','super'] as const;
 for(let t=0;t<500&&!g.seq;t++){
  if(a.contact==='hit'&&a.connected&&a.serial!==last&&request<route.length){last=a.serial;a.pad.tap(route[request++],g.tick);}
  if(d.hp<d.maxHp)g.onlineInputs[1]=bit('block');g.step();
 }
 assert(g.seq);assert.equal(d.hitstun,0,'the defender really did reach the recovery frame');
 assert.equal(g.seq.damageScale,.8,'two earlier contacts still count on this exact step');
 const opening=34+55*.9*1.03;assert(Math.abs(d.comboDmg-opening)<.001);
 finish(g);assert(Math.abs(d.maxHp-d.hp-(opening+341*.8))<.001);assert(Math.abs(d.comboDmg-(opening+341*.8))<.001);
},'orango','jane');
game('one fully actionable frame ends scaling carry; a later Ultimate is a new opening',g=>{
 const [a,d]=g.f;d.state='hit';d.hitstun=1;d.comboHits=2;d.comboDmg=70;d.hp-=70;
 g.step();assert.equal(d.state,'ground');assert.equal(d.comboHits,0);g.step();
 (g as any).startSeq('superC',a,d);assert.equal(g.seq?.damageScale,1);assert.equal(d.comboDmg,0);
});

for(const ch of CHAR_IDS)game(`${ch}: common three-normal → ULT route cannot delete half of minimum roster HP`,g=>{
 const [a,d]=g.f;d.x=a.x+a.def.pushW+d.def.pushW+5;a.meter=100;g.startMove(a,a.def.moves.cP);
 const route=['k','k','super'] as const;let request=0,last=-1,sawSequence=false;
 for(let t=0;t<850;t++){
  if(a.contact==='hit'&&a.connected&&a.serial!==last&&request<route.length){last=a.serial;a.pad.tap(route[request++],g.tick)}
  if(d.hp<d.maxHp)g.onlineInputs[1]=bit('block');g.step();sawSequence ||=!!g.seq;
  if(sawSequence&&!g.seq)break;
 }
 assert(request>=2&&a.serial>=3,'normals actually started through confirmed cancels');
 // A route may now drop before ULT capture because startup/spacing are real costs.
 // The separate medium → ULT cases above require a successful capture for all 13.
 assert(d.maxHp-d.hp<=CHARS.jane.hp*.5,'bounded route damage is at most half the least HP');
},ch,'jane');

check('doubled legacy HP, explicit Jane stature and otherwise preserved asymmetric mobility/normals',()=>{
 const before=JSON.parse(readFileSync('docs/balance-before.json','utf8')).characters;
 for(const ch of CHAR_IDS.filter(ch=>before[ch])){
  for(const key of ['hp','walk','walkBack','jumpVy','jumpVx','dashVx','dashDur','pushW','hurtH','crouchH'] as const)assert.equal(CHARS[ch][key],key==='hp'?before[ch][key]*2:ch==='jane'&&key==='hurtH'?96:ch==='jane'&&key==='crouchH'?60:before[ch][key]);
  for(const m of Object.values<{kind:string;id:string}>(before[ch].moves).filter(m=>m.kind==='normal'))assert.deepEqual(CHARS[ch].moves[m.id],m);
 }
 assert(frameData('santox','s2').variable&&frameData('jao','s2').variable&&frameData('renngotti','s1').variable,'conditional advantage is never presented as guaranteed');
});
check('frame stepping and move preview are restricted to paused offline training',()=>{
 const versus=make();versus.paused=true;assert(!versus.stepTrainingFrame());assert(!versus.previewTrainingMove('pL'));versus.destroy();
 const g=new Game({mode:'training',p1:'jao',p2:'jane',difficulty:'normal',bindings:DEFAULT_BINDINGS},()=>{});
 try{
  g.train.dummy=3;assert(!g.stepTrainingFrame());assert(!g.previewTrainingMove('pL'));g.togglePause(true);
  const t=g.tick;assert(g.stepTrainingFrame());assert.equal(g.tick,t+1);assert(g.paused);assert(g.previewTrainingMove('s1'));assert(!g.previewTrainingMove('pL'),'cannot cancel a committed attack');
  for(let i=0;i<25;i++)assert(g.stepTrainingFrame());assert(g.projectiles.some(p=>p.kind==='chess'));assert(g.paused);
  g.resetPositions();assert(!g.previewTrainingMove('jP'),'air attacks require an actual jump');assert(!g.previewTrainingMove('missing'));
  g.f[0].rangedCooldown=20;assert(!g.previewTrainingMove('s2'),'inspection respects real cooldowns');g.cfg.online=true;assert(!g.stepTrainingFrame());assert(!g.previewTrainingMove('pL'));
 }finally{g.destroy()}
});

console.log(`Balance: ${cases} cases passed (13 fighter damage/confirmed ULT chains, exact recovery-frame scaling, mirrored ULT escape/interruption/recovery, repeated-pressure escape, juggle cap, actual Jane/Cristyan reach, command grabs, zones, Santox, real frame-data values and restricted training tools). Automated regressions are not human balance approval.`);
