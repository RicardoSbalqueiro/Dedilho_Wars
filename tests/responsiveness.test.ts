import assert from 'node:assert/strict';
import { Game, CANCEL_CONFIRM_FRAMES, DASH_COMMIT_FRAMES } from '../src/game/engine';
import { CHARS, CHAR_IDS, movePhase, impactStrength } from '../src/game/data';
import type { CharId } from '../src/game/data';
import { ACTIONS, DEFAULT_BINDINGS, INPUT_BUFFER_FRAMES, Keyboard, Pad, keyboard } from '../src/game/input';
import type { Action } from '../src/game/input';
import { touchInput } from '../src/game/touch';
import { lerpPose, computeRig } from '../src/game/rig';
import { captureState, applyState, ONLINE_PROTOCOL } from '../src/game/net-state';

(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
let cases=0;
const step=(g:Game,n=1)=>{for(let i=0;i<n;i++)g.step()};
const make=(ch:CharId='caetano',mode:'training'|'versus'='training')=>{
  keyboard.down.clear();keyboard.pressed.clear();touchInput.clear();
  const g=new Game({mode,p1:ch,p2:'nomad',difficulty:'normal',bindings:DEFAULT_BINDINGS},()=>{});
  g.phase='fight';g.train.dummy=3;g.f[0].x=300;g.f[1].x=1200;
  return g;
};
function check(name:string,fn:()=>void){try{fn();cases++}catch(e){throw new Error(name,{cause:e})}}
function game(name:string,fn:(g:Game)=>void,ch:CharId='caetano',mode:'training'|'versus'='training'){
  check(name,()=>{const g=make(ch,mode);try{fn(g)}finally{g.destroy();keyboard.down.clear();keyboard.pressed.clear();touchInput.clear()}});
}
function recovery(g:Game,left:number){
  const f=g.f[0],m=f.def.moves.pH;assert(g.startMove(f,m));
  f.moveT=m.startup+m.active+m.recovery+m.whiff-left;
}
function near(g:Game){g.f[0].x=650;g.f[1].x=725}
function contact(g:Game,blocked=false){
  near(g);if(blocked)keyboard.down.add('Numpad3');
  for(let n=0;n<80&&g.f[0].contact==='pending';n++)g.step();
  assert.equal(g.f[0].contact,blocked?'block':'hit');
}

check('nine-frame boundaries, frozen buffers and physical timestamps',()=>{
  const p=new Pad();assert.equal(INPUT_BUFFER_FRAMES,9);p.tap('p',100);
  for(let age=0;age<9;age++)assert(p.buffered('p',100+age));
  assert(!p.buffered('p',99));assert(!p.buffered('p',109));
  p.tap('block',100);p.tap('right',95);p.tap('right',100);
  for(let t=101;t<130;t++)p.freezeBuffers(t);
  assert(p.buffered('p',130));assert.equal(p.edgeAt.block,100);assert.equal(p.prevAt.right,95);
  p.consume('p');p.freezeBuffers(131);assert(!p.buffered('p',131));
  const expired=new Pad();expired.tap('p',0);expired.freezeBuffers(10);assert(!expired.buffered('p',10));
});

check('keyboard pulse survives release, ignores repeats and clears on blur',()=>{
  const k=new Keyboard(),e={code:'KeyJ',repeat:false} as KeyboardEvent;
  (k as any).kd(e);(k as any).ku(e);assert(!k.down.has('KeyJ'));assert(k.consumePressed().has('KeyJ'));
  (k as any).kd({...e,repeat:true});assert.equal(k.consumePressed().size,0);
  (k as any).ku(e);(k as any).kd(e);(k as any).blur();assert.equal(k.down.size+k.pressed.size,0);
});
game('simultaneous sub-frame keyboard taps reach both local players',g=>{
  for(const code of ['KeyJ','Numpad1']){(keyboard as any).kd({code,repeat:false,preventDefault(){}});(keyboard as any).ku({code})}
  g.step();assert(g.f.every(f=>f.move?.id==='pL'&&f.serial===1));
  step(g,80);assert(g.f.every(f=>f.serial===1),'one attack per press');
});
game('held keys do not repeat attacks',g=>{
  keyboard.down.add('KeyJ');step(g,120);assert.equal(g.f[0].serial,1);
});
game('pause preserves pending age and clears unpolled physical pulses',g=>{
  recovery(g,3);g.f[0].pad.tap('p',g.tick);g.togglePause(true);
  const tick=g.tick;step(g,50);assert.equal(g.tick,tick);
  keyboard.pressed.add('KeyK');g.togglePause(false);assert.equal(keyboard.pressed.size,0);
  step(g,3);assert.equal(g.f[0].move?.id,'pL');
});

// Each age in the buffer is exercised through the actual state machine for every fighter.
for(const ch of CHAR_IDS)for(let remaining=1;remaining<=9;remaining++)game(`${ch}: recovery queue age ${remaining}`,g=>{
  recovery(g,remaining);const f=g.f[0],serial=f.serial;f.pad.tap('p',g.tick);
  step(g,remaining-1);assert.equal(f.serial,serial,'no premature whiff cancel');g.step();
  if(remaining<9){assert.equal(f.serial,serial+1);assert.equal(f.move?.id,'pL');assert.equal(f.moveT,0)}
  else {assert.equal(f.serial,serial);assert.equal(f.state,'ground','expired input stays expired')}
},ch);

for(const action of ['k','s1','super','grab','up'] as Action[])game(`recovery accepts ${action} on first legal frame`,g=>{
  recovery(g,4);g.f[0].pad.tap(action,g.tick);step(g,4);
  if(action==='up')assert.equal(g.f[0].state,'jump');
  else if(action==='super')assert(g.cine||g.f[0].move?.kind==='super');
  else assert.equal(g.f[0].move?.id,action==='k'?'kL':action==='grab'?'throw':action);
});

for(const source of ['keyboard','touch','online'])game(`${source}: recovery and long hitstop retain quick input`,g=>{
  recovery(g,2);g.hitstop=16;
  if(source==='keyboard'){(keyboard as any).kd({code:'KeyJ',repeat:false,preventDefault(){}});(keyboard as any).ku({code:'KeyJ'})}
  if(source==='touch'){touchInput.set(20,['p']);touchInput.set(20,[])}
  if(source==='online'){g.cfg.online=true;g.onlinePressed[0]=1<<ACTIONS.indexOf('p')}
  step(g,17);assert.equal(g.f[0].serial,1);g.step();assert.equal(g.f[0].move?.id,'pL');assert.equal(g.f[0].serial,2);
});
game('slow motion does not age commands during skipped simulation frames',g=>{
  recovery(g,2);g.slowmo=24;g.f[0].pad.tap('p',g.tick);step(g,6);assert.equal(g.f[0].move?.id,'pL');
});
for(const [ch,field,action] of [['nomad','rangedCooldown','s1'],['jane','bikeCooldown','s2'],['santox','fourthCooldown','s3']] as const)game(`${ch}: cooldown rejection retains command until legal`,g=>{
  const f=g.f[0];f[field]=2;f.pad.tap(action,g.tick);g.step();assert.equal(f.serial,0);assert(f.pad.buffered(action,g.tick));
  g.step();assert.equal(f.move?.id,action);assert.equal(f.serial,1);assert(!f.pad.buffered(action,g.tick));
},ch);
game('an unavailable special does not swallow a legal normal',g=>{
  const f=g.f[0];f.rangedCooldown=30;f.pad.tap('s1',0);f.pad.tap('p',0);g.step();
  assert.equal(f.move?.id,'pL');assert(f.pad.buffered('s1',g.tick));
},'nomad');

for(const state of ['attack','hit','block','getup','dizzy','landing'] as const)for(const action of ['p','block'] as const)game(`${state}: ${action} on final locked frame`,g=>{
  const f=g.f[0];
  if(state==='attack')recovery(g,1);
  else if(state==='landing')f.landLag=1;
  else {f.state=state;f.stateT=state==='getup'?17:0;f.hitstun=f.blockstun=1;f.bikeDizzy=0}
  f.pad.tap(action,g.tick);g.step();
  if(action==='block'){assert.equal(f.state,'ground');assert(f.guard)}else assert.equal(f.move?.id,'pL');
});
for(const recovering of [0,1])game(`held defense blocks a strike on recovery, player ${recovering+1}`,g=>{
  near(g);const d=g.f[recovering],a=g.f[1-recovering];
  const m=d.def.moves.pH;g.startMove(d,m);d.moveT=m.startup+m.active+m.recovery+m.whiff-1;
  keyboard.down.add(recovering===0?'KeyE':'Numpad3');
  g.startMove(a,a.def.moves.pL);a.moveT=a.move!.startup;g.step();
  assert.equal(d.state,'block');assert(d.maxHp-d.hp<2);assert.equal(a.contact,'block');
});

game('dash second tap buffers through recovery, starts moving immediately',g=>{
  recovery(g,2);const f=g.f[0];f.pad.tap('right',0);step(g,1);f.pad.tap('right',g.tick);const x=f.x;
  g.step();assert.equal(f.state,'dash');assert.equal(f.x-x,f.def.dashVx);
  assert.equal(f.pad.edgeAt.right,-999,'dash consumes both taps');
});
for(const action of ['p','block'] as const)game(`dash has ${DASH_COMMIT_FRAMES} frame commitment then accepts ${action}`,g=>{
  const f=g.f[0];f.pad.tap('right',0);g.step();f.pad.tap('right',1);g.step();assert.equal(f.state,'dash');
  f.pad.tap(action,g.tick);step(g,DASH_COMMIT_FRAMES-1);assert.equal(f.state,'dash');g.step();
  if(action==='p')assert.equal(f.move?.id,'pL');else {assert.equal(f.state,'ground');assert(f.guard);assert.equal(f.vx,0)}
});
game('dash needs two fresh taps and settles into walking without overshoot',g=>{
  const f=g.f[0];f.pad.tap('right',0);g.step();f.pad.tap('right',1);g.step();step(g,f.def.dashDur);
  assert.equal(f.state,'ground');keyboard.down.add('KeyD');g.step();assert.notEqual(f.state,'dash');
  step(g,12);assert(f.vx>f.def.walk*.95&&f.vx<=f.def.walk+.01);
  keyboard.down.clear();step(g,6);assert.equal(f.vx,0);
});
game('walking reversal responds in one frame, air steering stays bounded',g=>{
  const f=g.f[0];keyboard.down.add('KeyD');step(g,6);assert(f.vx>0);
  keyboard.down.clear();keyboard.down.add('KeyA');g.step();assert(f.vx<0);
  f.state='jump';f.y=-300;f.vx=f.def.jumpVx;f.vy=-2;keyboard.down.clear();keyboard.down.add('KeyD');
  const y=f.y;step(g,4);assert(f.vx<=f.def.jumpVx);assert.notEqual(f.y,y);
  g.startMove(f,f.def.moves.jP);const vy=f.vy;keyboard.down.clear();keyboard.down.add('KeyA');step(g,2);
  assert(f.vx<f.def.jumpVx);assert(f.vy>vy,'gravity continues during aerial attack');
});
game('Rickzera keeps his second jump with the unified buffer',g=>{
  g.f[0].pad.tap('up',0);g.step();step(g,5);g.f[0].pad.tap('up',g.tick);g.step();assert.equal(g.f[0].airJumps,2);assert(g.f[0].vy<0);
},'rickzera');

game('confirmed chain increases rank and terminates at one special',g=>{
  const f=g.f[0];g.startMove(f,f.def.moves.pL);contact(g);
  for(const [button,expected] of [['k','kM'],['p','pH'],['s2','s2']] as const){
    f.pad.tap(button,g.tick);while(g.hitstop)g.step();g.step();assert.equal(f.move?.id,expected);
    if(expected!=='s2'){g.f[1].x=f.x+75;contact(g)}
  }
  contact(g);const serial=f.serial;for(const a of ['p','k','s2','s3'] as Action[])f.pad.tap(a,g.tick);
  step(g,12);assert.equal(f.serial,serial,'no special-to-normal loop');
});
for(const action of ['s1','super'] as const)game(`blocked normal cannot bail out into ${action}`,g=>{
  const f=g.f[0];g.startMove(f,f.def.moves.pL);contact(g,true);const serial=f.serial;f.pad.tap(action,g.tick);
  while(g.hitstop)g.step();g.step();assert.equal(f.serial,serial);assert.equal(f.contact,'block');
});
game('blocked normals still allow a strictly ascending, finite string',g=>{
  const f=g.f[0];g.startMove(f,f.def.moves.pL);contact(g,true);f.pad.tap('p',g.tick);
  while(g.hitstop)g.step();g.step();assert.equal(f.move?.id,'pM');
});
game('late hit confirmation cannot bypass remaining recovery',g=>{
  const f=g.f[0];g.startMove(f,f.def.moves.pH);f.connected=true;f.contact='hit';f.contactFrame=f.move!.startup+1;
  f.moveT=f.contactFrame+CANCEL_CONFIRM_FRAMES+1;f.pad.tap('s1',0);g.step();assert.equal(f.move?.id,'pH');
});
game('whiffed heavy retains its punishable recovery and cannot cancel',g=>{
  const f=g.f[0],m=f.def.moves.pH;g.startMove(f,m);step(g,m.startup+m.active+1);assert.equal(f.contact,'whiff');
  f.pad.tap('s1',g.tick);step(g,9);assert.equal(f.move?.id,'pH');assert.equal(f.serial,1);
  near(g);g.startMove(g.f[1],g.f[1].def.moves.pL);g.f[1].moveT=g.f[1].move!.startup;g.step();
  assert.equal(f.state,'hit');assert(f.hp<f.maxHp,'a real counterattack punishes the whiff');
});
game('Caetano Dedilho exception ends at Conspiracy Kick',g=>{
  const f=g.f[0];g.startMove(f,f.def.moves.s2);contact(g);f.pad.tap('s1',g.tick);
  while(g.hitstop)g.step();g.step();assert.equal(f.move?.id,'s1');
  contact(g);const serial=f.serial;f.pad.tap('s2',g.tick);step(g,10);assert.equal(f.serial,serial);
});
game('super cancel still requires full meter and consumes it',g=>{
  const f=g.f[0];g.startMove(f,f.def.moves.pL);contact(g);while(g.hitstop)g.step();
  // Versus keeps the real meter cost instead of training's refill.
  f.meter=99;f.pad.tap('super',g.tick);g.step();assert.equal(g.cine,null);
  f.meter=100;g.step();assert(g.cine);assert.equal(f.meter,0);
},'caetano','versus');
for(const ch of CHAR_IDS)game(`${ch}: repeating light attacks allows defense; juggle cap remains four`,g=>{
  const f=g.f[0];g.startMove(f,f.def.moves.pL);contact(g);keyboard.down.add('Numpad3');let blocked=false;
  for(let n=0;n<100;n++){
    g.f[1].x=f.x+Math.max(55,f.def.pushW+g.f[1].def.pushW);
    if(f.state==='ground'||(f.move&&f.moveT-f.contactFrame>CANCEL_CONFIRM_FRAMES))f.pad.tap('p',g.tick);
    g.step();if(f.contact==='block'){blocked=true;break}
  }
  assert(blocked,'guard escapes repeated light attacks');
  g.f[1].state='launched';g.f[1].y=-20;g.f[1].juggle=4;g.startMove(f,f.def.moves.pH);
  assert.equal((g as any).canHit(f,g.f[1]),false);
},ch);

game('late projectile hit and expired volley report the right outcome',g=>{
  const f=g.f[0];g.startMove(f,f.def.moves.s1);step(g,65);assert.equal(f.move,null);assert.equal(f.contact,'pending');
  for(let i=0;i<100&&f.contact==='pending';i++)g.step();assert.equal(f.contact,'hit');
  g.resetPositions();f.x=150;g.f[1].x=1500;g.f[1].invuln=500;g.startMove(f,f.def.moves.s1);step(g,140);assert.equal(f.contact,'whiff');
},'rickzera');
game('cloned six projectile confirms the original Eneas volley',g=>{
  const f=g.f[0];near(g);g.startMove(f,f.def.moves.s3);f.moveT=f.move!.startup+10;
  (g as any).spawnProjectile(f,f.move);const p=g.projectiles[0];assert.equal(p.kind,'six');
  (g as any).applyHit(f,g.f[1],p.move,{x:g.f[1].x,y:-100,dir:1,serial:p.serial});
  assert(f.connected);assert.equal(f.contact,'hit');assert.equal(f.contactFrame,f.moveT);
},'eneas');
for(const weight of ['pL','pH'])game(`${weight}: hit/block feedback and online snapshot preserve weight`,g=>{
  const f=g.f[0];g.startMove(f,f.def.moves[weight]);contact(g);const impact=g.f[1].impact;
  assert.equal(impact?.kind,'hit');assert.equal(impact?.strength,impactStrength(f.def.moves[weight]));
  if(weight==='pL')assert(impact!.strength<1);else assert(impact!.strength>=1.5);
  const copy=make();try{const state=JSON.parse(JSON.stringify(captureState(g)));assert.equal(state.v,ONLINE_PROTOCOL);assert(applyState(copy,state));
    assert.deepEqual(copy.f[1].impact,impact);assert.equal(copy.f[0].contact,'hit');assert.equal(copy.f[0].poseName,f.poseName);
  }finally{copy.destroy()}
});
game('blocked contact produces shield feedback rather than damage feedback',g=>{
  g.startMove(g.f[0],g.f[0].def.moves.pH);contact(g,true);assert.equal(g.f[1].impact?.kind,'block');
});

check('shortest angle interpolation preserves endpoints and non-angle coordinates',()=>{
  const a={...CHARS.jane.poses.idle,fa2:160,finger:0,rot:0},b={...a,fa2:-100,finger:1,rot:Math.PI*3};
  const mid=lerpPose(a,b,.5);assert.equal(mid.fa2,210);assert.equal(mid.finger,.5);assert.equal(mid.rot,Math.PI*1.5);
  assert.deepEqual(lerpPose(a,b,0),a);assert.deepEqual(lerpPose(a,b,1),b);
});
for(const ch of CHAR_IDS)game(`${ch}: pose timing matches active hitboxes and recovery remains visible`,g=>{
  const f=g.f[0],m=f.def.moves.pH;g.startMove(f,m);step(g,m.startup);
  assert.equal(f.poseName,m.poses[0]);assert.equal(f.hbActive,false);
  g.step();assert.equal(f.poseName,m.poses[1]);assert.equal(f.hbActive,true);
  step(g,m.active-1);assert.equal(f.poseName,m.poses[1]);assert.equal(f.hbActive,true);
  g.step();assert.equal(f.hbActive,false);assert.equal(f.poseName,'idle');assert.equal(f.state,'attack');
  assert.equal(movePhase(m,f.moveT-1,false).phase,'recovery');
  const idle=f.def.poses.idle;assert(Object.keys(idle).some(k=>Math.abs(f.pose[k as keyof typeof idle]-idle[k as keyof typeof idle])>2),'visible recovery, not instantly neutral');
  for(const pose of Object.values(f.def.poses))assert(Object.values(computeRig(ch,lerpPose(f.pose,pose,.5)).p).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  assert(f.def.moves.pL.startup>=3&&f.def.moves.pL.startup<=5);assert(m.startup>=8&&m.recovery>=18,'heavy risk retained');
},ch);
game('Eneas six accessory stops with the active phase, not after recovery',g=>{
  const f=g.f[0],m=f.def.moves.s3;g.startMove(f,m);f.moveT=m.startup+m.active-1;g.step();assert.equal(f.poseName,'six_a');
  g.step();assert.equal(f.poseOverride,null);assert.equal(f.poseName,'idle');assert.equal(f.state,'attack');
},'eneas');

console.log(`Responsiveness: ${cases} regression cases passed (9-frame input, recovery/guard, keyboard/touch/online, hitstop, cooldowns, dash/air control, bounded cancels, whiffs, feedback and all 13 rigs).`);
