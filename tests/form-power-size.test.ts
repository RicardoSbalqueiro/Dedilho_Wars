import assert from 'node:assert/strict';
import {CHAR_IDS,CHARS} from '../src/game/data';
import type {CharId,Move} from '../src/game/data';
import {Game} from '../src/game/engine';
import {DEFAULT_BINDINGS,ACTIONS} from '../src/game/input';
import {FORMS,formStats} from '../src/game/resources';
import {captureState,applyState,ONLINE_PROTOCOL} from '../src/game/net-state';
import {spritePlacement,spriteBodyMetrics} from '../src/game/sprite-size';
import {actionAtlasManifest,actionClip} from '../src/game/action-atlas';
import {drawImpactSpectacle,drawStrikeSpectacle,drawFightEnvironment,drawFightImpacts,drawFightScreen} from '../src/game/fight-spectacle';
import {settings} from '../src/game/visual-settings';

(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0},dispatchEvent(){}};
let cases=0;
function check(name:string,fn:()=>void){try{fn();cases++}catch(cause){throw Error(name,{cause})}}
function make(a:CharId,b:CharId='caetano'){const g=new Game({mode:'versus',p1:a,p2:b,difficulty:'normal',online:true,bindings:DEFAULT_BINDINGS},()=>{});g.phase='fight';g.f[0].x=600;g.f[1].x=650;return g}
const hit=(g:Game,m:Move)=>{const [a,d]=g.f;(g as any).applyHit(a,d,m,{x:d.x,y:380,dir:a.facing,serial:a.serial})};
const protectedState=(f:Game['f'][0])=>({hp:f.hp,meter:f.meter,energy:f.energy,stamina:f.stamina,battery:f.battery,blood:f.blood,state:f.state,move:f.move,stun:f.hitstun,blockstun:f.blockstun,formT:f.formT,combo:f.comboHits});

for(const target of CHAR_IDS)for(const attacker of CHAR_IDS)check(`${target}: immune to every ${attacker} attack and capture`,()=>{
 const g=make(attacker,target),[a,d]=g.f;
 try{
  d.formT=600;d.state='attack';d.move=d.def.moves.pH;d.hbActive=true;d.armor=true;d.guard=true;
  const before=protectedState(d),meter=a.meter;
  for(const m of [...Object.values(a.def.moves),{...a.def.moves.pH,id:'throw',grab:'throw' as const},{...a.def.moves.pL,id:'super',kind:'super' as const,grab:'super' as const}]){hit(g,m);assert.deepEqual(protectedState(d),before);assert.equal(g.seq,null);assert.equal(a.meter,meter);}
  (g as any).dealDamage(a,d,100000);(g as any).seqHit(a,d,100000,3,a.def.glow);(g as any).startSeq('superWoc',a,d);
  assert.deepEqual(protectedState(d),before);assert.equal(g.seq,null);assert.equal(formStats(d).defense,0);assert.equal(FORMS[target].duration,600);
  a.formT=600;hit(g,a.def.moves.pH);assert.deepEqual(protectedState(d),before,'immunity wins when both are transformed');
 }finally{g.destroy()}
});
for(const ch of CHAR_IDS)for(const defense of ['guard','crouch','perfect','precision','armor','dodge'] as const)check(`${ch}: active form bypasses ${defense}`,()=>{
 const g=make(ch),[a,d]=g.f;
 try{
  a.formT=600;a.stamina=120;d.state='ground';d.guard=defense!=='armor'&&defense!=='dodge';d.crouch=defense==='crouch';d.armor=defense==='armor';d.invuln=defense==='dodge'?30:0;
  if(defense==='perfect'||defense==='precision')d.pad.edgeAt.block=g.tick;
  assert(g.startMove(a,a.def.moves.pL));const m=a.move!;a.hbActive=true;
  assert((g as any).canHit(a,d));(g as any).resolveHits();
  assert(d.hp<d.maxHp);assert.equal(d.state,'hit');assert.equal(d.guard,false);assert.equal(d.armor,false);assert.equal(d.invuln,0);assert.equal(d.guardResultT,0);
  assert(Math.abs(d.maxHp-d.hp-m.dmg*(m.resourcePower??1))<.001,'no chip, parry or armor reduction');
 }finally{g.destroy()}
});
check('transformed throw beats throw tech and throw shield',()=>{
 const g=make('ulisses'),[a,d]=g.f;try{a.formT=600;d.throwShield=100;d.pad.edgeAt.grab=g.tick;const m={...a.def.moves.pH,id:'throw',kind:'special' as const,grab:'throw' as const};a.move=m;assert((g as any).canHit(a,d));hit(g,m);assert.equal(g.seq?.kind,'throw');assert.equal(d.state,'seq');}finally{g.destroy()}
});
check('actual projectiles bypass dodge/guard and cannot damage an active form',()=>{
 for(const sourceForm of [false,true])for(const targetForm of [false,true]){
  const g=make('rickzera'),[a,d]=g.f;try{
   a.formT=sourceForm?600:0;d.formT=targetForm?600:0;d.guard=true;d.invuln=20;d.pad.held.block=true;
   g.projectiles.push({kind:'energy',x:d.x-8,y:-70,vx:8,life:20,owner:0,move:{...a.def.moves.pL,dmg:40},serial:1,radius:45,age:0} as any);
   (g as any).updateProjectiles();assert.equal(d.hp<d.maxHp,sourceForm&&!targetForm);if(targetForm){assert.equal(d.state,'ground');assert.equal(d.comboHits,0);}
  }finally{g.destroy()}
 }
});
check('form immunity ends with the active timer and never leaks into normal play',()=>{
 const g=make('caetano','renngotti'),[a,d]=g.f;try{d.formT=1;g.step();assert.equal(d.formT,0);hit(g,a.def.moves.pL);assert(d.hp<d.maxHp);assert.equal(formStats(d).invulnerable,false);}finally{g.destroy()}
});
check('keyboard-equivalent form attack breaks held defense in the running simulation',()=>{
 const g=make('caetano'),[a,d]=g.f;try{a.formT=600;g.onlineInputs[1]=1<<ACTIONS.indexOf('block');g.startMove(a,a.def.moves.pL);for(let i=0;i<25;i++)g.step();assert(d.hp<d.maxHp);assert.equal(d.guardResult,'none');}finally{g.destroy()}
});
check('online revision 12 preserves immunity and refuses old combat rules atomically',()=>{
 const host=make('ulisses','jane'),guest=make('ulisses','jane');try{host.f[0].formT=600;host.f[1].formT=310;const s=structuredClone(captureState(host));assert.equal(ONLINE_PROTOCOL,'dw-online-12');assert(applyState(guest,s));assert(guest.f.every(f=>formStats(f).invulnerable));const before=JSON.stringify(captureState(guest));assert(!applyState(guest,{...s,v:'dw-online-11'}));assert.equal(JSON.stringify(captureState(guest)),before);}finally{host.destroy();guest.destroy()}
});

const resourceOf=(f:Game['f'][0])=>f.ch==='jane'?f.battery:f.ch==='ulisses'?f.blood:f.energy;
const setResource=(f:Game['f'][0],n:number)=>{if(f.ch==='jane')f.battery=n;else if(f.ch==='ulisses')f.blood=n;else f.energy=n};
for(const ch of ['jane','ulisses','rickzera'] as const)for(const side of [0,1] as const)for(const form of [false,true])check(`${ch}/P${side+1}/${form}: every damaging contact restores the bounded resource`,()=>{
 const g=make(ch,ch),a=g.f[side],d=g.f[1-side],gain=ch==='jane'?4:ch==='ulisses'?1:5,max=ch==='ulisses'?3:100;
 try{a.formT=form?600:0;setResource(a,0);assert(g.startMove(a,a.def.moves.pL));a.hbActive=true;(g as any).resolveHits();assert(d.hp<d.maxHp);assert.equal(resourceOf(a),gain);
  (g as any).seqHit(a,d,10,1,a.def.glow);assert.equal(resourceOf(a),Math.min(max,gain*2),'cinematic contacts also restore resources');
  setResource(a,max-1);(g as any).dealDamage(a,d,10);assert.equal(resourceOf(a),max);(g as any).dealDamage(a,d,10);assert.equal(resourceOf(a),max,'never overfill');
  const peer=make(ch,ch);try{assert(applyState(peer,structuredClone(captureState(g))));assert.equal(resourceOf(peer.f[side]),resourceOf(a));}finally{peer.destroy()}
 }finally{g.destroy()}
});
for(const ch of ['jane','ulisses','rickzera'] as const)check(`${ch}: whiffs, guards, zero damage and immune targets do not restore resources`,()=>{
 const g=make(ch),[a,d]=g.f;try{setResource(a,0);assert(g.startMove(a,a.def.moves.pL));a.hbActive=true;d.x=1400;(g as any).resolveHits();assert.equal(resourceOf(a),0);
  d.x=650;d.guard=true;d.pad.edgeAt.block=-999;hit(g,a.def.moves.pL);assert.equal(resourceOf(a),0);assert.equal(d.state,'block');
  (g as any).dealDamage(a,d,0);assert.equal(resourceOf(a),0);
  d.formT=600;hit(g,a.def.moves.pH);(g as any).seqHit(a,d,100,2,a.def.glow);assert.equal(resourceOf(a),0);
 }finally{g.destroy()}
});
check('a real three-orb Rick volley restores energy on all three damaging contacts',()=>{
 const g=make('rickzera'),[a,d]=g.f;try{a.x=500;d.x=720;a.energy=40;assert(g.startMove(a,a.def.moves.s1));assert.equal(a.energy,24);for(let i=0;i<85;i++)g.step();assert.equal(a.energy,39);assert(Math.abs(d.maxHp-d.hp-64.8)<.001);}finally{g.destroy()}
});

check('all 4332 body drawings have calibrated ground anchors',()=>{
 const m=spriteBodyMetrics();assert.equal(Object.keys(m.atlases).length,199);let frames=0;
 for(const a of Object.values(m.atlases))for(const f of a.frames){assert(f.rise>0&&f.baseline>0&&f.top>=0&&f.width>0);assert(f.baseline>=f.rise);frames++;}
 assert.equal(frames,4332);
});
for(const ch of CHAR_IDS)for(const form of [false,true])check(`${ch}/${form}: standing attacks retain their stature through every frame`,()=>{
 for(const id of ['pL','pM','pH','kL','kM','kH','headbutt']){
  const clip=actionClip(ch,id,form)!;const atlas=actionAtlasManifest().atlases[clip.atlas];
  let unit=0;
  for(const index of clip.frames){const f=atlas.frames[index],body=spriteBodyMetrics().atlases['actions/'+clip.atlas].frames[index],p=spritePlacement('actions',clip.atlas,index,160,{time:0,actionClip:id,transformation:form},{reference:f.referenceHeight,baseline:f.baseline,anchorX:f.anchorX});
   if(unit)assert.equal(p.scale,unit,'changing the pose or crop never rescales the character');unit=p.scale;
   assert.equal(p.baseline,body.baseline);assert.equal(-p.baseline*p.scale+body.baseline*p.scale,0,'feet stay at the world ground');
  }
 }
});
check('low attacks and down poses stay low instead of being inflated to standing height',()=>{
 const ch='caetano',m=actionAtlasManifest();for(const id of ['cP','cK']){const clip=actionClip(ch,id)!;const i=clip.frames[2],a=m.atlases[clip.atlas],f=a.frames[i];const p=spritePlacement('actions',clip.atlas,i,160,{time:0,actionClip:id},{reference:f.referenceHeight,baseline:f.baseline,anchorX:f.anchorX});assert(p.bodyHeight<135);}
 const clip=actionClip(ch,'react')!,i=clip.frames[7],a=m.atlases[clip.atlas],f=a.frames[i],p=spritePlacement('actions',clip.atlas,i,160,{time:0,actionClip:'react'},{reference:f.referenceHeight,baseline:f.baseline,anchorX:f.anchorX});assert(f.rect[3]*p.scale<160);
});

function context(){let ops=0;const gradient={addColorStop(){}};const ctx=new Proxy({},{get:(_t,key)=>key==='ops'?ops:key==='createRadialGradient'||key==='createLinearGradient'?()=>gradient:(..._a:unknown[])=>{ops++},set:()=>true});return ctx as CanvasRenderingContext2D&{ops:number}}
check('spectacle is deterministic, stays visual, and respects reduced flashes',()=>{
 const g=make('felipence'),f=g.f[0];try{g.startMove(f,f.def.moves.pH);f.moveT=f.move!.startup+1;f.formT=600;f.animT=50;f.impact={serial:3,kind:'hit',strength:2,tick:10,x:650,y:380};g.tick=14;const before=JSON.stringify(captureState(g));
  const c=context();drawStrikeSpectacle(c,f,g.tick);drawFightEnvironment(c,g);drawFightImpacts(c,g);drawFightScreen(c,g);assert(c.ops>100);assert.equal(JSON.stringify(captureState(g)),before);
  settings.reducedFlash=false;const full=context();drawImpactSpectacle(full,'felipence',650,380,4,2,3);settings.reducedFlash=true;const reduced=context();drawImpactSpectacle(reduced,'felipence',650,380,4,2,3);assert(reduced.ops<full.ops);settings.reducedFlash=false;
 }finally{g.destroy()}
});
console.log(`${cases} form power, fixed stature, online and combat spectacle checks passed.`);
