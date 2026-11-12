import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CHAR_IDS,CHARS,movePhase} from '../src/game/data';
import type {CharId} from '../src/game/data';
import type {DrawOpts} from '../src/game/rig';
import {Game} from '../src/game/engine';
import {DEFAULT_BINDINGS} from '../src/game/input';
import {captureState} from '../src/game/net-state';
import {animeMotion} from '../src/game/anime-motion';
import {sampleDrawnFrame,DRAWN_WALK_FRAMES} from '../src/game/sprite-timeline';
import {selectAnimeSpriteFrame} from '../src/game/anime-sprite';
import {captureMotion,localPresentation,remotePresentation} from '../src/game/render-motion';
import {drawFormEffects,drawCombatFlowFx,FORM_VISUALS} from '../src/game/form-effects';
import {settings} from '../src/game/visual-settings';
import {FORMS} from '../src/game/resources';
import manifest from '../src/assets/motion/manifest.json';

(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
let count=0;
function test(name:string,fn:()=>void){try{fn();count++}catch(cause){throw Error(name,{cause})}}
function make(ch:CharId){const g=new Game({mode:'versus',p1:ch,p2:'caetano',difficulty:'normal',online:true,bindings:DEFAULT_BINDINGS},()=>{});g.phase='fight';return g}
const key=(o:DrawOpts,ch:CharId)=>{const f=sampleDrawnFrame(selectAnimeSpriteFrame(CHARS[ch].poses.idle,o),o);return f.bank+':'+f.index};

test('432 new full illustrations: all 18 sheets, hashes, both forms, valid cell geometry',()=>{
 assert.equal(Object.keys(manifest.atlases).length,18);assert.equal(manifest.poses.length,12);assert.equal(manifest.formOffset,12);
 for(const ch of CHAR_IDS){
  const a=manifest.atlases[ch];assert.equal(a.sourceDrawings,24);assert.equal(a.frames.length,24);assert.equal(a.geometryVersion,3);
  assert.equal(a.packing.sourceVisiblePixels,a.packing.packedVisiblePixels);assert.equal(a.packing.sourceSeedAreas.length,24);assert(a.packing.sourceSeedAreas.every(n=>n>=1000));
  assert.equal(createHash('sha256').update(readFileSync('src/assets/motion/'+a.src)).digest('hex'),a.encodedSha256);
  assert.equal(a.rowReferenceHeights.length,6);assert(a.rowReferenceHeights.every(n=>n>100&&Number.isFinite(n)));
  for(const f of a.frames){const [x,y,w,h]=f.rect;assert(x>=0&&y>=0&&x+w<=a.width&&y+h<=a.height);assert(w>20&&h>20&&f.visiblePixels>900);assert(f.anchorX>=0&&f.anchorX<w);assert(f.baseline>0&&f.baseline<=h);}
  assert.equal(FORMS[ch].duration,600);
 }
});
test('walking actually selects six drawings and loops at fractional render times',()=>{
 assert.equal(new Set(DRAWN_WALK_FRAMES.map(f=>f.bank+f.index)).size,6);
 for(const ch of CHAR_IDS){const seen=new Set<string>();for(let t=0;t<27;t+=.25)seen.add(key({time:t,spriteState:'walk'},ch));assert.equal(seen.size,6);assert.equal(key({time:27,spriteState:'walk'},ch),key({time:0,spriteState:'walk'},ch));}
});
for(const ch of CHAR_IDS)test(`${ch}: actual move clock visits wind-up, release, contact, follow-through and recovery art`,()=>{
 const g=make(ch),f=g.f[0],before=JSON.stringify(CHARS[ch]);
 try{
  for(const id of ['pM','pH','kH']){const m=CHARS[ch].moves[id];f.state='attack';f.move=m;f.connected=false;const seen=new Set<string>();
   for(let t=0;t<m.startup+m.active+m.recovery+m.whiff;t+=.25){f.moveT=t+1;const o={time:t,...animeMotion(f)};seen.add(key(o,ch));assert(Number.isFinite(o.spriteProgress));}
   assert(seen.size>=6,`${ch}/${id}: ${[...seen]}`);assert([...seen].some(s=>s.startsWith('motion:')));
   f.moveT=m.startup+1;const o={time:0,...animeMotion(f)};assert.equal(o.spritePhase,'active');
   if(id[0]==='p')assert.equal(key(o,ch),'base:5','first contact keeps the key strike');
   const end=m.startup+m.active+m.recovery+m.whiff;
   f.moveT=end+1;assert.equal(key({time:end,...animeMotion(f)},ch),'base:0');
  }
  assert.equal(JSON.stringify(CHARS[ch]),before,'presentation never edits combat data');
 }finally{g.destroy()}
});
test('phase progress varies through startup and active without moving their boundaries or original recovery formula',()=>{
 for(const ch of CHAR_IDS)for(const m of Object.values(CHARS[ch].moves)){
  if(m.startup>1){assert.equal(movePhase(m,0,false).progress,0);assert(movePhase(m,m.startup-.1,false).progress>.8)}
  assert.equal(movePhase(m,m.startup,false).phase,'active');assert.equal(movePhase(m,m.startup,false).progress,0);
  if(m.active>1)assert(movePhase(m,m.startup+m.active-.1,false).progress>.8);
  const t=m.startup+m.active;assert.equal(movePhase(m,t,false).phase,'recovery');assert.equal(movePhase(m,t,false).progress,Math.min(1,1/Math.max(1,m.recovery+m.whiff)));
 }
});
test('weapon overheads use weapon plates; low hand strikes keep their tools; low kicks show legs',()=>{
 for(const ch of ['ulisses','felipence'] as const){const m=CHARS[ch].moves.kH;
  for(const p of [0,.2,.5,.8,1])assert.equal(sampleDrawnFrame(6,{time:0,spriteState:'attack',spritePhase:'active',spriteProgress:p,spriteKind:'kick',normalAccessory:m.accessory}).index,10);
 }
 for(const ch of ['ulisses','felipence','bieu','aneninha'] as const){const m=CHARS[ch].moves.cP;assert.equal(key({time:0,spriteState:'attack',spriteMove:m.id,spritePhase:'active',spriteKind:'punch',normalAccessory:m.accessory},ch),'motion:11');}
 assert.equal(key({time:0,spriteState:'attack',spriteMove:'cK',spritePhase:'active',spriteKind:'kick'},'caetano'),'motion:9');
});
test('new fractional animation clocks are read-only and snap during contacts/hitstop/new commands',()=>{
 const g=make('ulisses');try{
  const f=g.f[0];f.state='attack';f.move=CHARS.ulisses.moves.pH;f.animT=10;f.moveT=2;f.stateT=2;const p=captureMotion(f);
  f.animT++;f.moveT++;f.stateT++;const before=JSON.stringify(captureState(g));const mid=localPresentation(f,p,.5,false);
  assert.equal(mid.moveT,2.5);assert.equal(mid.animT,10.5);assert.equal(mid.stateT,2.5);assert.equal(JSON.stringify(captureState(g)),before);
  assert.equal(localPresentation(f,p,.5,true),f);f.hbActive=true;assert.equal(localPresentation(f,p,.5,false),f);f.hbActive=false;f.serial++;assert.equal(localPresentation(f,p,.5,false),f);
  remotePresentation(f,0,false);f.animT+=3;f.moveT+=3;f.stateT+=3;remotePresentation(f,50,false);const r=remotePresentation(f,75,false);assert(r.moveT>mid.moveT&&r.moveT<f.moveT);assert.equal(remotePresentation(f,80,true).moveT,f.moveT);
 }finally{g.destroy()}
});

function canvas(){
 const stack:number[]=[],state={globalAlpha:1},gradient={addColorStop(){}};let draws=0;
 const c=new Proxy(state as any,{get(t,k){if(k in t)return t[k];if(k==='save')return()=>stack.push(t.globalAlpha);if(k==='restore')return()=>{assert(stack.length);t.globalAlpha=stack.pop()!};if(k==='createRadialGradient')return(...a:number[])=>{assert(a.every(Number.isFinite));return gradient};return(...a:unknown[])=>{for(const n of a)if(typeof n==='number')assert(Number.isFinite(n),String(k));draws++}},set(t,k,v){if(k==='globalAlpha')assert(Number.isFinite(v)&&v>=0&&v<=1);t[k]=v;return true}});
 return {ctx:c as CanvasRenderingContext2D,check(){assert.equal(stack.length,0);assert.equal(state.globalAlpha,1);return draws}};
}
for(const ch of CHAR_IDS)test(`${ch}: form and impact effects paint finite, bounded geometry, restore canvas and never alter game state`,()=>{
 const g=make(ch),f=g.f[0],original=settings.reducedFlash;try{
  assert(FORM_VISUALS[ch]);for(const reduced of [false,true]){settings.reducedFlash=reduced;
   for(const t of [0,12,35,36,52,90,299,300,320,599]){
    f.animT=t;f.stateT=t;f.formElapsed=t;f.formT=600-t;f.formShield=3;f.state=t<72?'transform':'ground';
    const before=JSON.stringify(captureState(g)),c=canvas();drawFormEffects(c.ctx,f,t);drawCombatFlowFx(c.ctx,f,g.tick);assert(c.check()>10);assert.equal(JSON.stringify(captureState(g)),before);
   }
   f.formT=0;f.aftermathT=20;f.state='ground';const c=canvas();drawFormEffects(c.ctx,f,600);c.check();
  }
 }finally{settings.reducedFlash=original;g.destroy()}
});
console.log(`Illustrated fluidity: ${count} cases passed (432 new drawings, 18 forms, live attack phase coverage, weapon actions, six-pose walk, read-only local/online subframes and bounded form VFX).`);
