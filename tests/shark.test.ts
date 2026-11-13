import assert from 'node:assert/strict';
import {Game} from '../src/game/engine';
import {CHAR_IDS,CHARS,RANGED_MOVES} from '../src/game/data';
import type {CharId} from '../src/game/data';
import {ACTIONS,DEFAULT_BINDINGS,keyboard} from '../src/game/input';
import type {Action} from '../src/game/input';
import {touchInput} from '../src/game/touch';
import {captureState,applyState,ONLINE_PROTOCOL} from '../src/game/net-state';
import {SHARK_KISS_DAMAGE,SHARK_ULT_BEATS,SHARK_ULT_DURATION,SHARK_ULT_DAMAGE,SHARK_ULT_TAIL_FRAME,SHARK_ULT_THROW,sharkUltMotion} from '../src/game/shark-choreography';
import {frameData} from '../src/game/frame-data';
import {FINISHER_NAMES} from '../src/game/finishers-art';
import {aiAct} from '../src/game/ai';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
let cases=0;const bit=(a:Action)=>1<<ACTIONS.indexOf(a);
const step=(g:Game,n=1)=>{for(let i=0;i<n;i++)g.step()};
function make(side:0|1=0,mirror=false,target:CharId='cristyan',online=true){
 keyboard.down.clear();keyboard.pressed.clear();touchInput.clear();
 const g=new Game({mode:'versus',p1:side?target:'tubarao',p2:side?'tubarao':target,difficulty:'normal',bindings:DEFAULT_BINDINGS,online},()=>{});g.phase='fight';const a=g.f[side],d=g.f[1-side];a.x=800;d.x=800+(mirror?-90:90);a.facing=mirror?-1:1;d.facing=mirror?1:-1;a.meter=100;return g;
}
function test(name:string,fn:(g:Game)=>void,side:0|1=0,mirror=false,target:CharId='cristyan',online=true){const g=make(side,mirror,target,online);try{fn(g);cases++}catch(e){throw new Error(name,{cause:e})}finally{g.destroy();keyboard.down.clear();keyboard.pressed.clear();touchInput.clear()}}
function press(g:Game,side:0|1,action:Action,source:'keyboard'|'touch'|'online'){
 if(source==='online')g.onlinePressed[side]=bit(action);else if(source==='touch'){touchInput.set(700,[action]);touchInput.set(700,[])}else keyboard.pressed.add(g.cfg.bindings[side][action][0]);g.step();
}
function capture(g:Game){for(let i=0;i<180&&!g.seq;i++)g.step();assert.equal(g.seq?.kind,'superT');assert.equal(g.seq?.dur,210)}
function finish(g:Game){for(let i=0;i<400&&g.seq;i++)g.step();assert.equal(g.seq,null)}
test('new move mapping, damage budget, inspector and preserved kit',g=>{
 const a=g.f[0];assert.equal(a.def.specials[2].name,'BEIJO DO FISCALIZADOR');assert.equal(a.def.moves.s3.label,a.def.specials[2].name);assert.equal(a.def.superName,'QUANDO TERÁ LIVE?');assert.equal(a.def.moves.s3.dmg,64);assert(SHARK_KISS_DAMAGE<290/4);assert.equal(SHARK_ULT_DAMAGE,290);assert.equal(frameData('tubarao','s3').chip,1.6);assert.equal(frameData('tubarao','s3').level,'médio');assert.equal(frameData('tubarao','super').damage,290);
 assert.equal(a.def.hp,2460);assert.equal(a.def.moves.s1.dmg,100);assert.equal(a.def.moves.s2.dmg,125);assert.equal(a.def.moves.s2.grab,'engole');assert.deepEqual(RANGED_MOVES.tubarao,[]);assert.equal(FINISHER_NAMES.tubarao,'MARÉ DA MALHA FINA');assert.equal(ONLINE_PROTOCOL,'dw-online-13');
});
for(const side of [0,1] as const)for(const mirror of [false,true])for(const target of ['jane','cristyan'] as const)for(const source of ['keyboard','touch','online'] as const){
 if(source==='touch'&&side===1)continue;
 test(`kiss P${side+1} ${source}, mirror ${mirror}, target ${target}`,g=>{
  const a=g.f[side],d=g.f[1-side];press(g,side,'s3',source);assert.equal(a.move?.id,'s3');assert.equal(a.meter,100);
  for(let i=0;i<75&&a.contact==='pending';i++){assert(!a.armor&&a.invuln===0);g.step()}
  assert.equal(a.contact,'hit');assert.equal(d.maxHp-d.hp,64);assert.equal(d.state,'hit');assert.equal(d.juggle,0);assert.equal(g.seq,null);assert.equal(g.cine,null);assert.equal(g.projectiles.length,0);assert.equal(a.poseName,'kiss_a');assert.equal(a.rangedUses,0);
  const copy=make(side,mirror,target);try{assert(applyState(copy,JSON.parse(JSON.stringify(captureState(g)))));assert.equal(copy.f[side].move?.label,'BEIJO DO FISCALIZADOR');assert.deepEqual(copy.f[side].pose,a.pose)}finally{copy.destroy()}
  step(g,90);assert.equal(d.hp,d.maxHp-64);assert.equal(d.state,'ground');assert.equal(a.serial,1);
 },side,mirror,target,source==='online');
 test(`new Ultimate P${side+1} ${source}, mirror ${mirror}, target ${target}`,g=>{
  const a=g.f[side],d=g.f[1-side];press(g,side,'super',source);assert.equal(a.meter,0);capture(g);
  const before=d.hp,events:{t:number;damage:number}[]=[],copied=new Set<string>();
  const copy=make(side,mirror,target);try{
   for(let i=0;i<400&&g.seq;i++){
    const hp=d.hp;g.step();if(d.hp<hp)events.push({t:g.seq?.t??-1,damage:hp-d.hp});
    if(g.seq){const phase=sharkUltMotion(g.seq.t).phase;if(!copied.has(phase)){copied.add(phase);assert(applyState(copy,JSON.parse(JSON.stringify(captureState(g)))));assert.equal(copy.seq?.kind,'superT');assert.equal(copy.seq?.t,g.seq.t);assert.equal(copy.seq?.a.idx,side);assert.equal(copy.f[side].facing,a.facing);assert.equal(copy.seq?.dur,SHARK_ULT_DURATION);}}
   }
   assert.equal(g.seq,null);assert.deepEqual(events,SHARK_ULT_BEATS.map(([t,damage])=>({t,damage})));assert.equal(before-d.hp,290);assert.equal(d.comboHits,4);
   assert(Math.abs(d.x-a.x)>=640,'tail sends opponent far across the arena');assert.equal(a.state,'ground');assert.equal(d.state,'down');assert.equal(d.y,0);assert(!d.hidden&&!a.hidden&&!a.armor);assert.equal(a.landLag,10);assert(copied.has('lick')&&copied.has('tail')&&copied.has('restore'));
   step(g,90);assert.equal(d.state,'ground');assert.equal(d.invuln,0);assert.equal(d.juggle,0);
  }finally{copy.destroy()}
 },side,mirror,target,source==='online');
}
for(const target of CHAR_IDS)test(`transformed Ultimate remains functional against ${target}`,g=>{
 const [a,d]=g.f;g.onlinePressed[0]=bit('super');g.step();capture(g);finish(g);assert.equal(d.maxHp-d.hp,290);assert.equal(a.state,'ground');assert.equal(d.state,'down');assert(Number.isFinite(d.x));
},0,false,target);
for(const low of [false,true])for(const mirror of [false,true])test(`kiss is blockable, low=${low}, mirror=${mirror}`,g=>{
 const [a,d]=g.f;g.onlineInputs[1]=bit('block')|(low?bit('down'):0);g.startMove(a,a.def.moves.s3);step(g,100);assert.equal(a.contact,'block');assert(Math.abs(d.maxHp-d.hp-1.6)<.001);assert.equal(d.state,'ground');assert(d.guard);assert.equal(d.juggle,0);assert.equal(a.invuln,0);assert(!a.armor);
},0,mirror);
for(const mirror of [false,true])test(`kiss has punishable whiff and no distance damage, mirror=${mirror}`,g=>{
 const a=g.f[0],d=g.f[1],m=a.def.moves.s3;d.x=a.x+a.facing*360;g.startMove(a,m);let frames=0;
 while(a.move&&frames<90){a.pad.tap('p',g.tick);g.step();frames++;if(a.move?.id==='pL')break}
 assert.equal(frames,m.startup+m.active+m.recovery+m.whiff);assert.equal(a.move?.id,'pL');assert.equal(d.hp,d.maxHp);assert.equal(a.serial,2);assert.equal(g.projectiles.length,0);
},0,mirror);
for(const mirror of [false,true])test(`kiss active frames grant no armor or invulnerability, mirror=${mirror}`,g=>{
 const [a,d]=g.f;a.manualFacing=true;d.x=a.x-a.facing*70;d.facing=a.facing;g.startMove(a,a.def.moves.s3);a.moveT=a.move!.startup;g.startMove(d,d.def.moves.pL);d.moveT=d.move!.startup;g.step();assert(a.hp<a.maxHp);assert.equal(a.state,'hit');assert.equal(a.move,null);assert(!a.armor);assert.equal(a.invuln,0);
},0,mirror);
test('inherited combo scale applies once to all four cinematic contacts',g=>{
 const [a,d]=g.f;d.state='hit';d.hitstun=30;d.comboHits=2;d.comboDmg=80;d.hp-=80;(g as any).startSeq('superT',a,d);assert.equal(g.seq?.damageScale,.8);const hp=d.hp;finish(g);assert(Math.abs(hp-d.hp-232)<.001);assert(Math.abs(d.comboDmg-312)<.001);assert.equal(d.comboHits,6);
});
for(const mirror of [false,true])test(`Ultimate respects arena boundaries and releases both actors, mirror=${mirror}`,g=>{
 const [a,d]=g.f;a.x=mirror?110:1490;d.x=mirror?40:1560;(g as any).startSeq('superT',a,d);finish(g);assert(a.x>=40&&a.x<=1560&&d.x>=40&&d.x<=1560);assert.equal(d.y,0);assert.equal(d.rotAdd,0);assert.equal(d.state,'down');assert(!d.hidden);assert.equal(a.state,'ground');step(g,90);assert.equal(d.state,'ground');
},0,mirror);
test('held kiss does not auto-repeat; unavailable state never spends Ultimate meter',g=>{
 g.cfg.online=false;keyboard.down.add('KeyO');step(g,150);assert.equal(g.f[0].serial,1);assert.equal(g.f[1].maxHp-g.f[1].hp,64);assert(Math.abs(g.f[0].meter-105.12)<.001);
 const a=g.f[0];a.state='hit';a.hitstun=30;a.pad.tap('super',g.tick);step(g,20);assert(Math.abs(a.meter-105.12)<.001);assert.equal(g.cine,null);
});
test('shared visual phases remain bounded and align lick/tail contacts',()=>{
 for(let t=0;t<=SHARK_ULT_DURATION;t++){const m=sharkUltMotion(t);for(const n of [m.transform,m.restore,m.tongue,m.windup,m.flight])assert(n>=0&&n<=1&&Number.isFinite(n))}
 for(const [at] of SHARK_ULT_BEATS.slice(0,3))assert.equal(sharkUltMotion(at).tongue,1);assert.equal(sharkUltMotion(SHARK_ULT_TAIL_FRAME).flight,0);assert.equal(sharkUltMotion(185).flight,1);assert.equal(SHARK_ULT_THROW,700);
});
test('protocol 13 rejects old kiss-as-Ultimate snapshots',g=>{
 const state=captureState(g);assert(applyState(g,JSON.parse(JSON.stringify(state))));assert(!applyState(g,{...state,v:'dw-online-9'}));
});
test('AI no longer selects the contact kiss from far away',g=>{
 const a=g.f[0];g.f[1].x=1300;a.meter=0;
 for(let i=0;i<100;i++){g.tick++;a.ai.thinkT=0;aiAct(g,a,'hard');assert(!a.pad.buffered('s3',g.tick));assert(a.ai.stopDist<=150)}
});
console.log(`Tubarão Fiscal: ${cases} regressions passed (reduced blockable kiss, no fin armor, 290-damage transformation/licks/tail, mirrored long throw/bounds/recovery, all 18 targets, keyboard/touch/P2/online, scaling, snapshots and protocol 13).`);
