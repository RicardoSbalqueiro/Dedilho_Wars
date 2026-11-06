import assert from 'node:assert/strict';
import {FrameTimer,TICK_MS} from '../src/game/timing';
import {Game} from '../src/game/engine';
import {CHAR_IDS,CHARS} from '../src/game/data';
import type {CharId} from '../src/game/data';
import {DEFAULT_BINDINGS,ACTIONS,keyboard} from '../src/game/input';
import {captureState} from '../src/game/net-state';
import {captureMotion,localPresentation} from '../src/game/render-motion';
import {ANIMATION_CLIPS,ANIMATION_CLIP_IDS,ANIMATION_SUBFRAMES,ANIMATION_FPS,animationFrame,motionAnimation} from '../src/game/animation';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
let count=0;
function test(name:string,fn:()=>void){try{fn();count++}catch(e){throw Error(name,{cause:e})}}
const rates=[5,10,15,24,30,59.94,60,75,90,120,144,165,240,360];
function timeline(fps:number,duration:number,fn:(time:number)=>void,start=0){fn(start);const dt=1000/fps;for(let i=1;i*dt<duration-1e-7;i++)fn(start+i*dt);fn(start+duration)}
function make(ch:CharId='caetano'){
 const g=new Game({mode:'versus',p1:ch,p2:'cristyan',difficulty:'normal',bindings:DEFAULT_BINDINGS,online:true},()=>{});g.phase='fight';g.f[0].x=600;g.f[1].x=670;for(const f of g.f)f.animT=0;return g;
}
for(const fps of rates)test(`${fps} Hz: same ten seconds for simulation and menu, including a zero timestamp`,()=>{
 const c=new FrameTimer();let steps=0;timeline(fps,10000,t=>{steps+=c.sample(t);assert(c.fraction>=0&&c.fraction<1)});
 assert.equal(steps,600);assert(Math.abs(c.frames-600)<1e-7);
 const d=new FrameTimer();let second=0;timeline(fps,10000,t=>second+=d.sample(t),1234.75);assert.equal(second,600);
});
test('irregular render intervals preserve wall time and residual fractions',()=>{
 const c=new FrameTimer();let ticks=0,now=0;c.sample(0);const dt=[6,11,48,140,25,8,16,180,31,50];
 while(now<10000){now=Math.min(10000,now+dt[ticks%dt.length]);ticks+=c.sample(now)}
 assert.equal(ticks,600);assert(Math.abs(c.frames-600)<1e-8);
});
test('duplicates, invalid and backwards timestamps never add time or poison the clock',()=>{
 const c=new FrameTimer();c.sample(100);for(const t of [100,NaN,Infinity,-Infinity,99,0])assert.equal(c.sample(t),0);
 assert.equal(c.sample(100+TICK_MS),1);assert.equal(c.sample(100+TICK_MS),0);assert(Math.abs(c.frames-1)<1e-8);
});
test('hidden/paused time and long gaps do not produce catch-up bursts',()=>{
 const c=new FrameTimer();c.sample(0);assert.equal(c.sample(100),6);assert.equal(c.sample(10000),0);assert.equal(c.sample(10000+TICK_MS),1);
 assert.equal(c.sample(10000+TICK_MS*2,false),0);assert.equal(c.sample(10000+TICK_MS*3,false),0);c.rebase();assert.equal(c.sample(30000),0);assert.equal(c.sample(30000+TICK_MS),1);
});
const attack=(g:Game)=>{
 const step=g.step.bind(g);g.step=()=>{
  const next=g.tick+1,at=next%120;
  const key=at===1?'p':at===9?'k':at===18?'s2':at===80?'s1':null;
  g.onlinePressed[0]=key?1<<ACTIONS.indexOf(key):0;
  g.onlineInputs[1]=next>300?1<<ACTIONS.indexOf('block'):0;
  step();
 };
};
function state(g:Game){const s=captureState(g);return {f:s.f,tick:g.tick,time:g.timeLeft,acc:g.timeAcc,phase:g.phase,phaseT:g.phaseT,elapsed:g.elapsedTicks,hitstop:g.hitstop,slowmo:g.slowmo,projectiles:g.projectiles.map(p=>({x:p.x,y:p.y,vx:p.vx,vy:p.vy,life:p.life}))}}
for(const ch of CHAR_IDS)for(const fps of [5,15,30,59.94,120,144,240])test(`${ch}: Game.advance at ${fps} Hz matches 60 Hz attacks, defense and recovery`,()=>{
 const reference=make(ch),g=make(ch);attack(reference);attack(g);
 try{timeline(60,10000,t=>reference.advance(t));timeline(fps,10000,t=>g.advance(t));assert.deepEqual(state(g),state(reference));assert.equal(g.tick,600);}
 finally{g.destroy();reference.destroy();keyboard.down.clear();keyboard.pressed.clear()}
});
for(const ch of CHAR_IDS)for(const fps of [10,30,144])test(`${ch}: ULT cinematic and sequence keep their duration at ${fps} Hz`,()=>{
 const a=make(ch),b=make(ch);for(const g of [a,b]){g.f[0].meter=100;g.onlinePressed[0]=1<<ACTIONS.indexOf('super')}
 try{timeline(60,6000,t=>a.advance(t));timeline(fps,6000,t=>b.advance(t));assert.deepEqual(state(a),state(b));assert.equal(a.tick,360);}
 finally{a.destroy();b.destroy()}
});
test('pause, restart and manual single-frame inspection never accumulate elapsed wall time',()=>{
 const g=make();try{
  g.advance(0);g.advance(100);assert.equal(g.tick,6);g.togglePause(true);g.advance(20000);assert.equal(g.tick,6);g.togglePause(false);g.advance(20001);assert.equal(g.tick,6);g.advance(20001+TICK_MS);assert.equal(g.tick,7);
  g.restart();const before=g.tick;g.advance(90000);assert.equal(g.tick,before);g.advance(90000+TICK_MS);assert.equal(g.tick,before+1);
 }finally{g.destroy()}
});
test('new frame density preserves real-time clip duration and interpolates fractional samples',()=>{
 assert.equal(ANIMATION_FPS,180);assert.equal(ANIMATION_SUBFRAMES,3);
 const old={idle:120,walk:32,dash:24,jump:24,guard:36,crouch:36,hit:16,getup:18,win:60};
 for(const id of ANIMATION_CLIP_IDS){assert.equal(ANIMATION_CLIPS[id].frames/ANIMATION_FPS,old[id]/60);assert.equal(ANIMATION_CLIPS[id].ticks,old[id]);}
 for(const ch of CHAR_IDS){const a=animationFrame(ch,'walk',3),b=animationFrame(ch,'walk',4);assert.notDeepEqual(a,b)}
});
test('all thirteen live renderers sample the new intermediate catalogue frames',()=>{
 for(const ch of CHAR_IDS){const g=make(ch);try{
  const f=g.f[0];f.animT=0;f.poseName='idle';f.state='ground';f.walking=0;f.vx=f.vy=0;
  const base=f.def.poses.idle;f.pose=motionAnimation(ch,base,f);const prev=captureMotion(f);
  f.animT=1;f.pose=motionAnimation(ch,base,f);const display=localPresentation(f,prev,1/3,false);
  const expected=motionAnimation(ch,base,{...f,animT:1/3});
  for(const key of Object.keys(expected) as (keyof typeof expected)[])assert(Math.abs(display.pose[key]-expected[key])<1e-9,`${ch}/${key}`);
 }finally{g.destroy()}}
});
test('local subframe rendering is read-only; turning, guarding, attacking and impacts stay immediate',()=>{
 const g=make();try{
  const f=g.f[0],p=captureMotion(f);f.x+=12;f.pose={...f.pose,lean:f.pose.lean+4};const before=JSON.stringify(captureState(g));
  const a=localPresentation(f,p,.25,false),b=localPresentation(f,p,.75,false);assert.equal(a.x,p.x+3);assert.equal(b.x,p.x+9);assert.notDeepEqual(a.pose,b.pose);assert.equal(JSON.stringify(captureState(g)),before);
  assert.equal(localPresentation(f,p,.5,true),f);f.hbActive=true;assert.equal(localPresentation(f,p,.5,false),f);f.hbActive=false;
  f.facing=-f.facing;assert.equal(localPresentation(f,p,.5,false),f);f.facing=p.facing;f.guard=true;assert.equal(localPresentation(f,p,.5,false),f);f.guard=false;
  f.serial++;assert.equal(localPresentation(f,p,.5,false),f);f.serial--;f.move=CHARS.caetano.moves.s1;assert(f.move.turn);assert.equal(localPresentation(f,p,.5,false),f);
 }finally{g.destroy()}
});
console.log(`Timing: ${count} cases passed (5–360 Hz, 59.94 Hz, jitter, timestamp zero, invalid clocks, pause/background gaps, all 13 fighters/ULTs, fixed-duration dense animation and read-only subframe presentation).`);
