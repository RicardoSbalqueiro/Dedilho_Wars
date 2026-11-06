import assert from 'node:assert/strict';
import {Game,CANCEL_CONFIRM_FRAMES} from '../src/game/engine';
import {CHAR_IDS,CHARS} from '../src/game/data';
import type {CharId} from '../src/game/data';
import {ACTIONS,DEFAULT_BINDINGS,MAX_INPUT_MASK,keyboard,loadBindings,bindingConflict,saveBindings} from '../src/game/input';
import type {Action} from '../src/game/input';
import {touchInput} from '../src/game/touch';
import {captureState,applyState} from '../src/game/net-state';
import {frameData} from '../src/game/frame-data';
import {FightConnection} from '../src/online/connection';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
let cases=0;const bit=(a:Action)=>1<<ACTIONS.indexOf(a);
const step=(g:Game,n=1)=>{for(let i=0;i<n;i++)g.step()};
function check(name:string,fn:()=>void){try{fn();cases++}catch(e){throw new Error(name,{cause:e})}}
function make(ch:CharId,side:0|1=0,mirror=false,online=false){
 keyboard.down.clear();keyboard.pressed.clear();touchInput.clear();const g=new Game({mode:'versus',p1:side?'cristyan':ch,p2:side?ch:'cristyan',difficulty:'normal',bindings:DEFAULT_BINDINGS,online},()=>{});g.phase='fight';const a=g.f[side],d=g.f[1-side];a.x=800;d.x=800+(mirror?-65:65);a.facing=mirror?-1:1;d.facing=mirror?1:-1;return g;
}
function test(name:string,fn:(g:Game)=>void,ch:CharId='caetano',side:0|1=0,mirror=false,online=false){check(name,()=>{const g=make(ch,side,mirror,online);try{fn(g)}finally{g.destroy();keyboard.down.clear();keyboard.pressed.clear();touchInput.clear()}})}
function press(g:Game,side:0|1,source:'keyboard'|'touch'|'online'){
 if(source==='online')g.onlinePressed[side]=bit('headbutt');else if(source==='touch'){touchInput.set(45,['headbutt']);touchInput.set(45,[])}else keyboard.pressed.add(g.cfg.bindings[side].headbutt[0]);
 g.step();
}
check('new defaults, stable bit positions and conflicts',()=>{
 assert.deepEqual(DEFAULT_BINDINGS[0].block,['KeyE','']);assert.deepEqual(DEFAULT_BINDINGS[0].headbutt,['KeyL','']);assert.equal(DEFAULT_BINDINGS[1].headbutt[0],'Numpad9');assert.equal(DEFAULT_BINDINGS[1].block[0],'Numpad3');
 assert.equal(ACTIONS.indexOf('block'),6);assert.equal(ACTIONS.indexOf('turn'),12);assert.equal(ACTIONS.indexOf('headbutt'),13);assert.equal(MAX_INPUT_MASK,16383);assert.equal(bindingConflict(DEFAULT_BINDINGS,0,'block','KeyL'),'P1 · Cabeçada');
});
check('old untouched saved preset migrates L guard to E and gives L to headbutt',()=>{
 let raw=structuredClone(DEFAULT_BINDINGS) as any;delete raw[0].headbutt;delete raw[1].headbutt;raw[0].block=['KeyL',''];
 (globalThis as any).localStorage={getItem:()=>JSON.stringify(raw),setItem:(_k:string,v:string)=>{raw=JSON.parse(v)}};
 try{const next=loadBindings();assert.deepEqual(next,DEFAULT_BINDINGS);saveBindings(next);assert.deepEqual(loadBindings(),next)}finally{delete (globalThis as any).localStorage}
});
check('custom legacy defense and global E assignment survive; new headbutt gets a free key',()=>{
 const old=structuredClone(DEFAULT_BINDINGS) as any;delete old[0].headbutt;delete old[1].headbutt;old[0].block=['KeyL',''];old[0].p=['KeyF',''];old[1].k=['KeyE','Period'];
 (globalThis as any).localStorage={getItem:()=>JSON.stringify(old)};
 try{const b=loadBindings();assert.deepEqual(b[0].block,old[0].block);assert.deepEqual(b[0].p,old[0].p);assert.deepEqual(b[1].k,old[1].k);assert.notEqual(b[0].headbutt[0],'KeyL');assert.equal(bindingConflict(b,0,'headbutt',b[0].headbutt[0]),null)}finally{delete (globalThis as any).localStorage}
});
check('explicit custom headbutt and empty assignments are preserved',()=>{
 const old=structuredClone(DEFAULT_BINDINGS);old[0].headbutt=['KeyV',''];old[1].headbutt=['',''];
 (globalThis as any).localStorage={getItem:()=>JSON.stringify(old)};
 try{assert.deepEqual(loadBindings(),old)}finally{delete (globalThis as any).localStorage}
});
for(const ch of CHAR_IDS)for(const side of [0,1] as const)for(const mirror of [false,true])for(const source of ['keyboard','touch','online'] as const){
 if(source==='touch'&&side===1)continue;
 test(`${ch}: ${source} P${side+1}, mirror=${mirror}, dedicated headbutt`,g=>{
  const a=g.f[side],d=g.f[1-side],m=a.def.moves.headbutt;assert(m&&m.kind==='normal');press(g,side,source);assert.equal(a.move?.id,'headbutt');assert(!a.guard);assert.equal(a.invuln,0);assert(!a.armor);
  for(let i=0;i<60&&a.contact==='pending';i++)g.step();assert.equal(a.contact,'hit');assert.equal(d.maxHp-d.hp,m.dmg);assert.equal(d.comboHits,1);assert.equal(a.rangedUses,0);assert.equal(g.projectiles.length,0);assert.equal(a.poseName,'headbutt_a');assert(Object.values(a.rig.p).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  const copy=make(ch,side,mirror,true);try{assert(applyState(copy,JSON.parse(JSON.stringify(captureState(g)))));assert.equal(copy.f[side].move?.id,'headbutt');assert.equal(copy.f[side].facing,a.facing);assert.deepEqual(copy.f[side].pose,a.pose)}finally{copy.destroy()}
 },ch,side,mirror,source==='online');
}
for(const ch of CHAR_IDS)for(const low of [false,true])test(`${ch}: headbutt is blocked high or low with zero chip`,g=>{
 const [a,d]=g.f;g.onlineInputs[1]=bit('block')|(low?bit('down'):0);g.onlinePressed[0]=bit('headbutt');g.step();for(let i=0;i<60&&a.contact==='pending';i++)g.step();assert.equal(a.contact,'block');assert.equal(d.hp,d.maxHp);assert.equal(d.invuln,0);assert.equal(d.state,'block');
},ch,0,false,true);
for(const ch of CHAR_IDS)test(`${ch}: missed headbutt cannot cancel recovery; headbutt pressure is finite`,g=>{
 const [a,d]=g.f,m=a.def.moves.headbutt;d.x=1300;g.startMove(a,m);let ticks=0;while(a.move?.id==='headbutt'&&ticks<90){a.pad.tap('p',g.tick);g.step();ticks++}assert(ticks>=m.startup+m.active+m.recovery+m.whiff);assert.equal(a.serial,2,'buffered normal starts only at end of full whiff recovery');assert.equal(a.move?.id,'pL');assert.equal(d.hp,d.maxHp);
 g.resetRound();g.phase='fight';a.x=650;d.x=715;g.startMove(a,m);for(let i=0;i<70&&a.contact==='pending';i++)g.step();assert.equal(a.contact,'hit');a.pad.tap('headbutt',g.tick);a.pad.tap('s1',g.tick);a.pad.tap('super',g.tick);a.meter=100;assert(!(g as any).tryCancel(a),'cannot chain headbutt, special or ULT out of the commitment');
},ch);
for(const source of ['keyboard','touch','online'] as const)test(`${source}: headbutt buffer waits for recovery and a hold never auto-repeats`,g=>{
 const a=g.f[0],m=a.def.moves.pH;g.f[1].x=1300;g.startMove(a,m);a.moveT=m.startup+m.active+m.recovery+m.whiff-2;
 if(source==='keyboard')keyboard.down.add('KeyL');else if(source==='touch')touchInput.set(90,['headbutt']);else g.onlineInputs[0]=bit('headbutt');
 press(g,0,source);assert.equal(a.move?.id,'pH');g.step();assert.equal(a.move?.id,'headbutt');
 const serial=a.serial;step(g,130);assert.equal(a.serial,serial,'one move per press');
},'caetano',0,false,source==='online');
test('E is held guard on the first free frame; L is not guard and airborne headbutt is rejected',g=>{
 const [d,a]=g.f;keyboard.down.add('KeyE');d.state='hit';d.hitstun=1;g.startMove(a,a.def.moves.pL);a.moveT=a.move!.startup;g.step();assert.equal(d.state,'block');assert.equal(d.hp,d.maxHp);
 g.resetRound();g.phase='fight';keyboard.down.clear();keyboard.pressed.add('KeyL');g.step();assert.equal(d.move?.id,'headbutt');assert(!d.guard);
 g.resetRound();g.phase='fight';d.y=-40;d.state='jump';assert(!g.startMove(d,d.def.moves.headbutt));
});
test('headbutt only enters a confirmed ascending normal chain inside the existing window',g=>{
 const a=g.f[0];g.startMove(a,a.def.moves.kM);a.connected=true;a.contact='hit';a.moveT=8;a.contactFrame=8;a.pad.tap('headbutt',g.tick);assert((g as any).tryCancel(a));assert.equal(a.move?.id,'headbutt');
 for(const result of ['block','whiff','hit'] as const){g.startMove(a,a.def.moves.kM);a.connected=result!=='whiff';a.contact=result;a.moveT=8;a.contactFrame=result==='hit'?8-CANCEL_CONFIRM_FRAMES-1:8;a.pad.tap('headbutt',g.tick);assert(!(g as any).tryCancel(a));}
});
test('headbutt frame data is visible for all thirteen fighters',()=>{
 for(const ch of CHAR_IDS){const m=frameData(ch,'headbutt');assert.equal(m.name,'CABEÇADA');assert.equal(m.startup,14);assert.equal(m.active,3);assert.equal(m.recovery,24);assert.equal(m.whiff,12);assert.equal(m.chip,0);assert.equal(m.blockAdvantage,-14);assert(m.notes.includes('sem cancelamento'))}
});
check('direct online transport accepts headbutt held and press bits and still rejects higher bits',()=>{
 const received:any[]=[];const c=new FightConnection({host:{id:'h'},code:'TESTROOM'} as any,{id:'h'} as any,{state(){},input:n=>received.push(n),status(){},lost(){}});
 (c as any).accept({type:'input',n:1,input:{mask:8192,events:[{id:1,mask:8192}]}});assert.equal(received.length,1);assert.equal(received[0].mask,8192);
 (c as any).accept({type:'input',n:2,input:{mask:16384,events:[]}});assert.equal(received.length,1);
});
console.log(`Defense/headbutt: ${cases} regressions passed (E guard, L headbutt, all thirteen fighters/both sides/keyboard/touch/online, migration/conflicts, guard/chip, animation/hitbox/snapshots, bounded cancels and punishable recovery).`);
