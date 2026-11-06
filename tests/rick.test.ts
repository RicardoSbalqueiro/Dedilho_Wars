import assert from 'node:assert/strict';
import {Game} from '../src/game/engine';
import {CHARS} from '../src/game/data';
import {ACTIONS,DEFAULT_BINDINGS,keyboard} from '../src/game/input';
import type {Action} from '../src/game/input';
import {touchInput} from '../src/game/touch';
import {captureState,applyState} from '../src/game/net-state';
import {aiAct} from '../src/game/ai';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
let cases=0;
const bit=(a:Action)=>1<<ACTIONS.indexOf(a);
const step=(g:Game,n=1)=>{for(let i=0;i<n;i++)g.step()};
function make(side:0|1=0,mirror=false,online=false){
 keyboard.down.clear();keyboard.pressed.clear();touchInput.clear();
 const g=new Game({mode:'versus',p1:side?'cristyan':'rickzera',p2:side?'rickzera':'cristyan',difficulty:'normal',bindings:DEFAULT_BINDINGS,online},()=>{});
 g.phase='fight';const a=g.f[side],d=g.f[1-side];a.x=mirror?1100:500;d.x=mirror?300:1300;a.facing=mirror?-1:1;d.facing=mirror?1:-1;return g;
}
function test(name:string,fn:(g:Game)=>void,side:0|1=0,mirror=false,online=false){
 const g=make(side,mirror,online);try{fn(g);cases++}catch(e){throw new Error(name,{cause:e})}finally{g.destroy();keyboard.down.clear();keyboard.pressed.clear();touchInput.clear()}
}
function command(g:Game,side:0|1,a:Action,source:'keyboard'|'touch'|'online'){
 if(source==='online')g.onlinePressed[side]=bit(a);
 else if(source==='touch'){touchInput.set(77,[a]);touchInput.set(77,[])}
 else keyboard.pressed.add(g.cfg.bindings[side][a][0]);
 g.step();assert.equal(g.f[side].move?.id,a);
}
const craters=(g:Game)=>g.parts.filter(p=>p.type==='crater');
for(const source of ['keyboard','touch','online'] as const)for(const side of [0,1] as const)for(const mirror of [false,true]){
 if(source==='touch'&&side===1)continue;
 test(`three notes through ${source}, P${side+1}, mirror=${mirror}`,g=>{
  const a=g.f[side];g.f[1-side].invuln=300;command(g,side,'s1',source);
  const times:number[]=[],seen=new Set<object>();
  for(let n=0;n<65;n++){
   for(const p of g.projectiles)if(!seen.has(p)){seen.add(p);times.push(a.moveT-1);assert.equal(p.kind,'franco');assert.equal(p.vx,mirror?-12:12);assert.equal(p.launchFacing,a.facing);assert.equal(p.move.dmg,24)}
   g.step();
  }
  assert.deepEqual(times,[12,18,24]);assert.equal(a.rangedUses,1);assert.equal(a.serial,1,'held or released controls do not repeat the volley');
 },side,mirror,source==='online');
 test(`melee slam through ${source}, P${side+1}, mirror=${mirror}`,g=>{
  const a=g.f[side],d=g.f[1-side];d.x=a.x+a.facing*90;a.rangedCooldown=250;
  command(g,side,'s2',source);assert.equal(a.invuln,0);assert(!a.armor);
  for(let n=0;n<75&&a.contact==='pending';n++)g.step();
  assert.equal(a.contact,'hit');assert.equal(d.maxHp-d.hp,84);assert.equal(d.state,'launched');assert(d.vy>0&&d.groundSmash);assert.equal(craters(g).length,0,'wait for real floor contact');assert.equal(g.projectiles.length,0);
  const guest=make(side,mirror,true);try{
   assert(applyState(guest,JSON.parse(JSON.stringify(captureState(g)))));assert.equal(guest.f[1-side].groundSmash,true);assert.equal(guest.f[side].facing,a.facing);
   for(let n=0;n<25&&!craters(g).length;n++)g.step();assert.equal(craters(g).length,1);assert(!d.groundSmash);assert.equal(d.state,'down');assert.equal(craters(g)[0].color,'#a3ff36');
   assert(applyState(guest,JSON.parse(JSON.stringify(captureState(g)))));assert.equal(craters(guest).length,1);assert.equal(guest.f[1-side].groundSmash,false);
   step(g,90);assert.equal(craters(g).length,1,'one cosmetic crater per strike');assert.equal(d.state,'ground');assert.equal(d.invuln,0);
  }finally{guest.destroy()}
 },side,mirror,source==='online');
}
for(const side of [0,1] as const)for(const mirror of [false,true])for(const low of [false,true])test(`standing/crouching guard, P${side+1}, mirrored ${mirror}, low ${low}`,g=>{
 const a=g.f[side],d=g.f[1-side];d.x=a.x+a.facing*90;g.onlineInputs[d.idx]=bit('block')|(low?bit('down'):0);command(g,side,'s2','online');
 for(let n=0;n<90&&a.contact==='pending';n++)g.step();assert.equal(a.contact,low?'hit':'block');
 if(low){assert.equal(d.maxHp-d.hp,84);assert(d.groundSmash)}else{assert(Math.abs(d.maxHp-d.hp-84*.015)<.001);step(g,90);assert(!d.groundSmash);assert.equal(craters(g).length,0);assert(d.guard)}
},side,mirror,true);
for(const mirror of [false,true])test(`far miss is fully punishable, mirror ${mirror}`,g=>{
 const a=g.f[0],m=a.def.moves.s2;g.startMove(a,m);let ticks=0;while(a.move&&ticks<100){g.step();ticks++}
 assert.equal(ticks,m.startup+m.active+m.recovery+m.whiff);assert.equal(a.contact,'whiff');assert.equal(craters(g).length,0);assert.equal(g.projectiles.length,0);assert.equal(g.f[1].hp,g.f[1].maxHp);assert.equal(a.invuln,0);assert(!a.armor);
},0,mirror);
test('three clean notes scale damage and held guard recovers afterwards',g=>{
 const a=g.f[0],d=g.f[1];d.x=a.x+220;g.startMove(a,a.def.moves.s1);step(g,160);
 assert.equal(d.comboResult?.hits,3);assert(Math.abs(d.maxHp-d.hp-64.8)<.001);assert.equal(a.rangedUses,1);assert.equal(d.state,'ground');assert.equal(craters(g).length,0);
});
test('all three notes can be blocked without a hidden melee hit',g=>{
 const a=g.f[0],d=g.f[1];d.x=a.x+220;g.onlineInputs[1]=bit('block');g.startMove(a,a.def.moves.s1);step(g,150);
 assert.equal(a.contact,'block');assert(Math.abs(d.maxHp-d.hp-24*.025*3)<.001);assert.equal(d.state,'ground');assert(d.guard);assert.equal(d.comboHits,0);assert.equal(craters(g).length,0);
},0,false,true);
test('three volleys trigger ranged cooldown; Soco Inglês remains available',g=>{
 const a=g.f[0];g.f[1].invuln=800;
 for(let cast=0;cast<3;cast++){assert(g.startMove(a,a.def.moves.s1));while(a.move)g.step()}
 assert(a.rangedCooldown>0);assert(!g.startMove(a,a.def.moves.s1));assert(g.startMove(a,a.def.moves.s2));assert.equal(a.rangedUses,3,'melee does not add or reset ranged charges');assert.equal(a.invuln,0);
});
for(const move of ['s1','s2'])test(`${move} startup is interruptible, no further notes or crater after interruption`,g=>{
 const a=g.f[0],d=g.f[1];d.x=a.x+65;g.startMove(a,a.def.moves[move]);g.startMove(d,d.def.moves.pL);step(g,12);
 assert(a.hp<a.maxHp);assert.equal(a.move,null);step(g,70);assert.equal(g.projectiles.length,0);assert.equal(craters(g).length,0);assert(!d.groundSmash);
});
test('released notes keep direction after manual turn; new volley reverses',g=>{
 const a=g.f[0];g.f[1].invuln=800;g.startMove(a,a.def.moves.s1);while(a.move)g.step();const old=[...g.projectiles];assert.equal(old.length,3);const x=old.map(p=>p.x);
 a.pad.tap('turn',g.tick);g.step();assert.equal(a.facing,-1);old.forEach((p,i)=>{assert(p.x>x[i]);assert.equal(p.vx,12);assert.equal(p.launchFacing,1)});
 g.startMove(a,a.def.moves.s1);step(g,27);const fresh=g.projectiles.filter(p=>p.serial===a.serial);assert.equal(fresh.length,3);assert(fresh.every(p=>p.vx===-12&&p.launchFacing===-1));
});
test('airborne slam waits for landing and marker is cleared by round reset and cinematic',g=>{
 const a=g.f[0],d=g.f[1];d.x=a.x+85;d.state='jump';d.y=-90;d.vy=0;g.startMove(a,a.def.moves.s2);a.moveT=a.move!.startup;g.step();assert(d.groundSmash);assert.equal(craters(g).length,0);
 g.hitstop=0;g.step();assert.equal(craters(g).length,0);for(let i=0;i<30&&!craters(g).length;i++)g.step();assert.equal(craters(g).length,1);
 d.groundSmash=true;(g as any).startSeq('superR',a,d);assert(!d.groundSmash);d.groundSmash=true;g.resetRound();assert(!d.groundSmash);assert.equal(craters(g).length,0);
});
test('floor impact survives particle-heavy online snapshots within the existing 60-particle bound',g=>{
 (g as any).knuckleCrater(800);
 for(let i=0;i<90;i++)g.parts.push({type:'spark',x:i,y:0,vx:0,vy:0,life:20,max:20,size:2,color:'#fff',g:0,rot:0,grow:0});
 const snapshot=captureState(g);assert.equal(snapshot.parts.length,60);assert.equal(snapshot.parts.filter(p=>p.type==='crater').length,1);
 assert.equal(snapshot.parts.at(-1)?.x,89);assert.equal(g.parts.filter(p=>p.type==='spark').length,106,'capturing is read-only');
});
test('new combat snapshots reject previous protocol',g=>{
 const state=captureState(g);assert.equal(state.v,'dw-online-9');assert.equal(applyState(g,{...state,v:'dw-online-8'}),false);
});
test('Rick AI approaches during ranged cooldown and never selects new melee special from long range',g=>{
 const a=g.f[0];a.rangedCooldown=200;g.f[1].x=a.x+340;
 for(let n=0;n<120;n++){g.tick++;a.ai.thinkT=0;aiAct(g,a,'hard');assert(!a.pad.buffered('s2',g.tick));assert(a.ai.stopDist<=145,'cooldown strategy must actually reach melee range')}
});
console.log(`Rickzera: ${cases} regressions passed (three-note volleys, golden left melee/green floor slam, startup/guard/whiff risks, scaling/cooldown, keyboard/touch/P2/online, mirrored directions and snapshots).`);
