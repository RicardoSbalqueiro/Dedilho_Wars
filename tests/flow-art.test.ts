import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CHAR_IDS} from '../src/game/data';
import type {DrawOpts} from '../src/game/rig';
import {flowAtlasManifest,actionClip,sampleActionFrame} from '../src/game/action-atlas';
import {FLOW_BRIDGE_MOVES,sampleFlowFrame} from '../src/game/flow-timeline';
import {spritePlacement,spriteBodyMetrics} from '../src/game/sprite-size';
let cases=0;
function check(name:string,fn:()=>void){try{fn();cases++}catch(cause){throw Error(name,{cause})}}
const manifest=flowAtlasManifest();
check('all 18 fighters have 864 additional distinct, verified cutout drawings',()=>{
 assert.equal(Object.keys(manifest.atlases).length,36);assert.equal(manifest.totalDrawings,864);
 for(const [key,a]of Object.entries(manifest.atlases)){
  assert.equal(a.frames.length,24,key);assert.equal(a.sourceDrawings,24,key);
  const path='src/assets/flow/'+a.src;assert(existsSync(path));assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),a.encodedSha256,key);
  const info=a as any;assert.equal(new Set(info.frameHashes).size,24,key);assert.equal(info.packing.sourceVisiblePixels,info.packing.packedVisiblePixels,key);
  for(const f of a.frames){const [x,y,w,h]=f.rect;assert(x>=0&&y>=0&&x+w<=a.width&&y+h<=a.height,key);assert(f.visiblePixels>700);assert(f.baseline>0&&f.baseline<=h);assert(f.anchorX>=0&&f.anchorX<=w);}
 }
});
for(const ch of CHAR_IDS)for(const form of [false,true]){
 check(`${ch}/${form}: six normal attacks gain extension/retraction without changing contact art`,()=>{
  const seen=new Set<number>();
  for(const move of FLOW_BRIDGE_MOVES){
   const base:DrawOpts={time:0,transformation:form,spriteState:'attack',spriteMove:move};
   const prepare=sampleFlowFrame(ch,{...base,spritePhase:'startup',spriteProgress:.82}),retreat=sampleFlowFrame(ch,{...base,spritePhase:'recovery',spriteProgress:.15});
   assert(prepare&&retreat);assert.notEqual(prepare.frame,retreat.frame);seen.add(prepare.frame);seen.add(retreat.frame);
   const active={...base,spritePhase:'active' as const,spriteProgress:.5};assert.equal(sampleFlowFrame(ch,active),undefined);
   assert.equal(sampleActionFrame(ch,active)!.frame,actionClip(ch,move,form)!.frames[2]);
   assert.equal(sampleFlowFrame(ch,{...base,actionClip:move,actionProgress:.5}),undefined,'explicit authored previews stay exact');
  }
  assert.equal(seen.size,12);
 });
 check(`${ch}/${form}: all twelve support drawings are reachable from real movement/guard states`,()=>{
  const states:Partial<DrawOpts>[]=[
   ...[0,5,10,15].map(t=>({spriteState:'walk' as const,spriteAction:'dash',spriteStateTime:t,spriteDashDuration:16})),
   ...[-10,0,10].map(vy=>({spriteState:'jump' as const,spriteVelocityY:vy})),
   {spriteState:'crouch',spriteAction:'ground',spriteLanding:3},
   {spriteState:'guard',spriteGuardAge:1},{spriteState:'guard',spriteAction:'block'},
   {spriteState:'guard',spriteLow:true},{spriteState:'hit',spriteGuardBreak:40},
  ];
  assert.deepEqual(states.map(s=>sampleFlowFrame(ch,{time:0,transformation:form,...s})?.frame),Array.from({length:12},(_,i)=>i+(form?12:0)));
  assert.equal(sampleFlowFrame(ch,{time:0,spriteState:'hit',actionClip:'ult',spriteGuardBreak:40}),undefined);
  assert.equal(sampleFlowFrame(ch,{time:0,spriteState:'attack',spriteAir:true,spriteMove:'jK',spritePhase:'startup',spriteProgress:.9}),undefined);
 });
 check(`${ch}/${form}: every added pose shares one calibrated body unit and grounded anchor`,()=>{
  for(const page of ['bridges','support']){
   const key=ch+'-'+page,a=manifest.atlases[key],metrics=spriteBodyMetrics().atlases['flow/'+key];assert(metrics,key);const scales=new Set<number>();
   for(let i=form?12:0;i<(form?24:12);i++){
    const f=a.frames[i],p=spritePlacement('flow',key,i,170,{time:0,transformation:form},{reference:f.referenceHeight,baseline:f.baseline,anchorX:f.anchorX});
    scales.add(p.scale);assert.equal(p.baseline,metrics.frames[i].baseline);assert.equal(-p.baseline*p.scale+metrics.frames[i].baseline*p.scale,0);assert(p.scale>0&&Number.isFinite(p.scale));
   }
   assert.equal(scales.size,1,'neither crouching nor an accessory may resize the drawing unit');
  }
 });
}
console.log(`${cases} illustrated flow checks passed: 864 added drawings, all 18 bases/forms, exact contacts and calibrated feet.`);
