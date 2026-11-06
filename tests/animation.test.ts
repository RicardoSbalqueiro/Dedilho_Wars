import assert from 'node:assert/strict';
import {CHAR_IDS,CHARS} from '../src/game/data';
import type {CharId,Pose} from '../src/game/data';
import {attackAnimation,motionAnimation,cinematicAnimation,animationFrames,animationFrame,ANIMATION_CLIPS,ANIMATION_CLIP_IDS,ANIMATION_FRAMES_PER_FIGHTER} from '../src/game/animation';
import {computeRig} from '../src/game/rig';
import {Game} from '../src/game/engine';
import {settings} from '../src/game/visual-settings';
import {remotePresentation} from '../src/game/render-motion';
import {captureState,applyState} from '../src/game/net-state';
import {ACTIONS,DEFAULT_BINDINGS,keyboard} from '../src/game/input';
import {combatHint} from '../src/game/combat-feel';
import {loadPrefs,savePrefs,applyPrefs} from '../src/game/prefs';
import {audio} from '../src/game/audio';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
let count=0;
function test(name:string,fn:()=>void){try{fn();count++}catch(e){throw Error(name,{cause:e})}}
function finite(p:Pose,ch:CharId){assert(Object.values(p).every(Number.isFinite));assert(Object.values(computeRig(ch,p).p).every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)))}
const make=(ch:CharId='caetano')=>{const g=new Game({mode:'versus',p1:ch,p2:'cristyan',difficulty:'normal',bindings:DEFAULT_BINDINGS,online:true},()=>{});g.phase='fight';g.f[0].x=600;g.f[1].x=680;return g};
for(const ch of CHAR_IDS){
 const def=CHARS[ch];
 for(const id of ANIMATION_CLIP_IDS)test(`${ch}/${id}: real immutable catalogue frames, unique shapes and exact playback`,()=>{
  const frames=animationFrames(ch,id);assert.equal(frames.length,ANIMATION_CLIPS[id].frames);assert(Object.isFrozen(frames));
  const unique=new Set<string>();for(let i=0;i<frames.length;i++){
   assert(Object.isFrozen(frames[i]));finite(frames[i],ch);unique.add(JSON.stringify(Object.values(frames[i]).map(v=>+v.toFixed(6))));
   assert.deepEqual(animationFrame(ch,id,i),frames[i]);
  }assert.equal(unique.size,frames.length,'not repeated static poses');
  assert.deepEqual(animationFrame(ch,id,frames.length),ANIMATION_CLIPS[id].loop?frames[0]:frames[frames.length-1]);
 });
 test(`${ch}: more than 1000 unique animation frames used by the live fighter`,()=>{
  const all=ANIMATION_CLIP_IDS.flatMap(id=>animationFrames(ch,id)),unique=new Set(all.map(p=>JSON.stringify(Object.values(p).map(v=>+v.toFixed(6)))));
  assert.equal(all.length,1098);assert.equal(ANIMATION_FRAMES_PER_FIGHTER,1098);assert.equal(unique.size,1098);
  const g=make(ch);try{for(let i=0;i<130;i++){g.step();const f=g.f[0],target=motionAnimation(ch,f.def.poses.idle,f);finite(target,ch);assert.notDeepEqual(target,CHARS[ch].poses.idle);}}finally{g.destroy()}
 });

 for(const m of Object.values(def.moves))test(`${ch}/${m.id}: complete multibeat animation and unchanged frame data`,()=>{
  const before=JSON.stringify(def),end=m.startup+m.active+m.recovery+m.whiff,unique=new Set<string>();
  for(let t=0;t<=end;t+=.5){const pose=attackAnimation(ch,m,t,false);finite(pose,ch);unique.add(JSON.stringify(pose));}
  assert(unique.size>=4,'multiple actual poses, not a static active illustration');
  assert.deepEqual(attackAnimation(ch,m,m.startup,false),def.poses[m.poses[1]],'exact first-active pose');
  assert.equal(JSON.stringify(def),before,'no mutations to move timings, stats, hitboxes or poses');
 });
 for(const state of ['ground','jump','dash','hit','block','dizzy','getup','win'])test(`${ch}/${state}: continuous finite articulated frames`,()=>{
  const unique=new Set<string>(),base=def.poses[state==='ground'?'idle':state]||def.poses.idle;
  for(let t=0;t<60;t++){const pose=motionAnimation(ch,base,{state,stateT:t,animT:t,vx:state==='ground'?def.walk:2,vy:(t-30)/4,walking:1,facing:1,crouch:false,guard:false,landLag:0});finite(pose,ch);unique.add(JSON.stringify(pose));}
  assert(unique.size>10);
 });
 test(`${ch}: presentation cannot change collision/damage/commands in online simulation`,()=>{
  const a=make(ch),b=make(ch);(b as any).animate=(f:Game['f'][0])=>{f.animT++;f.pose={...f.def.poses.idle};f.rig=computeRig(f.ch,f.pose)};
  const physical=(g:Game)=>captureState(g).f.map(f=>Object.fromEntries(Object.entries(f).filter(([k])=>!['pose','poseName','animT','expr','exprT','exprOverride','glow','aura'].includes(k))));
  try{for(let t=0;t<260;t++){
   const action=t%90===0?'p':t%90===8?'k':t%90===18?'s1':t%90===65?'s2':t%90===78?'s3':null;
   for(const g of [a,b]){g.onlinePressed[0]=action?1<<ACTIONS.indexOf(action):0;g.step();}
   assert.deepEqual(physical(a),physical(b));
  }}finally{a.destroy();b.destroy();keyboard.down.clear();keyboard.pressed.clear()}
 });
 test(`${ch}: snapshot retains the animated pose and hitstop freezes it`,()=>{
  const g=make(ch),guest=make(ch);try{
   g.onlinePressed[0]=1<<ACTIONS.indexOf('k');g.step();g.step();const p={...g.f[0].pose},t=g.f[0].animT;
   g.hitstop=3;g.step();assert.deepEqual(g.f[0].pose,p);assert.equal(g.f[0].animT,t);
   assert(applyState(guest,JSON.parse(JSON.stringify(captureState(g)))));assert.deepEqual(guest.f[0].pose,p);assert.equal(guest.f[0].animT,t);
  }finally{g.destroy();guest.destroy()}
 });
}
test('all loops have continuous seams; acceleration changes stride amplitude without skipping phase',()=>{
 for(const ch of CHAR_IDS){
  for(const id of ANIMATION_CLIP_IDS)if(ANIMATION_CLIPS[id].loop){
   const f=animationFrames(ch,id),a=f[0],b=f[f.length-1];
   for(const k of ['lean','head','fa1','fa2','ba1','ba2','fl1','fl2','bl1','bl2'] as const)assert(Math.abs(a[k]-b[k])<12,`${ch}/${id}/${k}: loop seam`);
  }
  const base=CHARS[ch].poses.idle,walk=CHARS[ch].walk;
  const state={state:'ground',stateT:0,animT:10001,vx:walk*.5,vy:0,walking:1,facing:1,crouch:false,guard:false,landLag:0};
  const a=motionAnimation(ch,base,state),b=motionAnimation(ch,base,{...state,vx:walk*.6});
  assert(Math.abs(a.fl1-b.fl1)<3);assert(Math.abs(a.bl1-b.bl1)<3);
 }
});
test('20 Hz guest poses and positions interpolate; authoritative state stays untouched',()=>{
 const g=make();try{const f=g.f[0];remotePresentation(f,0,false);f.animT+=3;f.x+=30;f.pose={...f.pose,lean:30};const state=JSON.stringify(captureState(g));
 const a=remotePresentation(f,50,false),mid=remotePresentation(f,75,false),end=remotePresentation(f,100,false);
 assert(a.x<mid.x&&mid.x<end.x);assert.equal(end.x,f.x);assert.equal(JSON.stringify(captureState(g)),state);
 assert.deepEqual(remotePresentation(f,101,true).pose,f.pose);f.facing=-1;assert.equal(remotePresentation(f,102,false).x,f.x);
 }finally{g.destroy()}
});
test('cinematic transitions generate inbetweens, isolate actors and reset on timeline seek',()=>{
 const canvas={},other={};cinematicAnimation(canvas,'caetano','idle',10,false);
 const begin=cinematicAnimation(canvas,'caetano','pH_a',11,false),mid=cinematicAnimation(canvas,'caetano','pH_a',14,false),end=cinematicAnimation(canvas,'caetano','pH_a',17,false);
 assert.notDeepEqual(begin,mid);assert.notDeepEqual(mid,end);
 assert.deepEqual(cinematicAnimation(other,'caetano','pH_a',17,false),end);
 finite(cinematicAnimation(canvas,'orango','win',5,true),'orango');finite(cinematicAnimation(canvas,'caetano','idle',0,false),'caetano');
});
test('legacy settings migrate; reduced motion defaults and local visual settings do not enter snapshots',()=>{
 const mem=new Map<string,string>();(globalThis as any).localStorage={getItem:(k:string)=>mem.get(k)||null,setItem:(k:string,v:string)=>mem.set(k,v)};
 (globalThis as any).matchMedia=()=>({matches:true});let p=loadPrefs();assert(p.reducedFlash);assert(!p.shake);
 mem.set('dedilho-wars-prefs-v1',JSON.stringify({music:.3,sfx:.4,voice:false,shake:true}));p=loadPrefs();assert.equal(p.music,.3);assert(p.shake);assert(p.combatHints);assert(p.reducedFlash);
 savePrefs({...p,reducedFlash:false,combatHints:false});p=loadPrefs();applyPrefs(p);assert(!settings.reducedFlash&&!settings.combatHints);assert.equal(audio.settings.sfx,.4);
 const g=make();try{assert(!JSON.stringify(captureState(g)).includes('reducedFlash'));assert(combatHint(g.f[0],DEFAULT_BINDINGS[0],false).includes('J'));assert(combatHint(g.f[0],DEFAULT_BINDINGS[0],true).includes('SOCO'));g.f[0].state='hit';assert(combatHint(g.f[0],DEFAULT_BINDINGS[0],true).includes('DEFESA'));}finally{g.destroy()}
 delete (globalThis as any).localStorage;delete (globalThis as any).matchMedia;
});
test('light/heavy/special audio layers are distinct, finite and retain the chosen volume',()=>{
 const calls:unknown[][]=[],tone=audio.tone,noise=audio.noise;audio.tone=(...a)=>{calls.push(['tone',...a])};audio.noise=(...a)=>{calls.push(['noise',...a])};
 try{audio.hit(.5);const light=JSON.stringify(calls);calls.length=0;audio.hit(2.5);const heavy=JSON.stringify(calls);assert.notEqual(light,heavy);assert(calls.length>3);
  for(const ch of CHAR_IDS){calls.length=0;audio.swing(ch,CHARS[ch].moves.s1);assert(calls.length>0);for(const call of calls)for(const x of call)if(typeof x==='number')assert(Number.isFinite(x)&&x>=0)}
  assert.equal(audio.settings.sfx,.4);
 }finally{audio.tone=tone;audio.noise=noise}
});
console.log(`Animation/presentation: ${count} cases passed (1,098 catalogue frames per fighter, 14,274 total, all 13 multibeat rigs/moves, exact contact poses, simulation invariance, frozen hitstop, snapshots, guest interpolation, cinematic transitions, audio layers, migrated preferences and touch/keyboard hints).`);
