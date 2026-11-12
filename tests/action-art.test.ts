import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CHAR_IDS,CHARS} from '../src/game/data';
import {actionAtlasManifest,actionClip,sampleActionFrame} from '../src/game/action-atlas';
import {ultimateBodyOptions,ultimateContacts,ultimateDuration} from '../src/game/ultimate-direction';
import {animeMotion} from '../src/game/anime-motion';
import {Game} from '../src/game/engine';
import {DEFAULT_BINDINGS} from '../src/game/input';
import {FORMS} from '../src/game/resources';

(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
const manifest=actionAtlasManifest();let cases=0;
function check(name:string,fn:()=>void){try{fn();cases++}catch(cause){throw Error(name,{cause})}}
function make(ch:typeof CHAR_IDS[number]){const g=new Game({mode:'versus',p1:ch,p2:'caetano',difficulty:'normal',online:true,bindings:DEFAULT_BINDINGS},()=>{});g.phase='fight';return g}

check('152 real transparent action atlases contain 3636 authored drawings',()=>{
 assert.equal(Object.keys(manifest.atlases).length,152);
 assert.equal(Object.values(manifest.atlases).reduce((n,a)=>n+a.sourceDrawings,0),3636);
 for(const [key,a]of Object.entries(manifest.atlases)){
  assert.equal(a.frames.length,a.sourceDrawings,key);assert(existsSync('src/assets/actions/'+a.src));
  assert.equal(createHash('sha256').update(readFileSync('src/assets/actions/'+a.src)).digest('hex'),a.encodedSha256,key);
  const p=(a as any).packing;assert.equal(p.sourceVisiblePixels,p.packedVisiblePixels,key);
  for(const f of a.frames){const [x,y,w,h]=f.rect;assert(x>=0&&y>=0&&w>0&&h>0&&x+w<=a.width&&y+h<=a.height,key);assert(f.visiblePixels>20,key);assert(Number.isFinite(f.referenceHeight)&&f.referenceHeight>0,key);assert(f.baseline>0&&f.baseline<=h,key);assert(f.anchorX>=0&&f.anchorX<=w,key);}
 }
});
for(const ch of CHAR_IDS)for(const form of [false,true]){
 check(`${ch}/${form?'form':'base'}: every normal, special and grab has its own drawings`,()=>{
  const seen=new Set<string>();
  for(const id of [...Object.keys(CHARS[ch].moves),'throw']){
   const clip=actionClip(ch,id,form);assert(clip,`${ch}/${id}`);assert.equal(clip.frames.length,4);
   for(const frame of clip.frames){const key=clip.atlas+':'+frame;assert(!seen.has(key),`${ch}/${id} reuses ${key}`);seen.add(key);}
   if(ch==='jane'&&!form&&id==='s2')continue;
   const picks=[sampleActionFrame(ch,{transformation:form,spriteState:'attack',spriteMove:id,actionClip:id==='throw'?id:undefined,spritePhase:'startup',spriteProgress:0}),sampleActionFrame(ch,{transformation:form,actionClip:id,spritePhase:'startup',spriteProgress:.9}),sampleActionFrame(ch,{transformation:form,actionClip:id,spritePhase:'active',spriteProgress:0}),sampleActionFrame(ch,{transformation:form,actionClip:id,spritePhase:'recovery',spriteProgress:.7})];
   assert.deepEqual(picks.map(p=>p?.frame),clip.frames,`${ch}/${id}`);
  }
  assert.equal(actionClip(ch,'react',form)?.frames.length,12);assert.equal(FORMS[ch].duration,600);
 });
 check(`${ch}/${form?'form':'base'}: all 24 ULT drawings actually appear in its timeline`,()=>{
  const clip=actionClip(ch,'ult',form);assert(clip);assert.equal(clip.frames.length,24);const seen=new Set<number>(),dur=ultimateDuration(ch);
  for(let t=0;t<=dur;t+=.25){const pick=sampleActionFrame(ch,ultimateBodyOptions(ch,t,dur,form));assert.equal(pick?.clip.atlas,clip.atlas);seen.add(pick!.frame);}
  assert.equal(seen.size,24,`${ch}: ${[...seen]}`);assert(ultimateContacts(ch).every(t=>t>=0&&t<dur));
 });
}
check('Jane sports bike has 12 real drawings and changes while holding a wheelie and racing',()=>{
 const clip=actionClip('jane','bike');assert(clip);assert.equal(clip.frames.length,12);
 for(const move of ['s2','bikeRush']){const seen=new Set<number>();for(let t=0;t<30;t++)seen.add(sampleActionFrame('jane',{time:t,spriteState:'attack',spriteMove:move,spritePhase:'active',spriteProgress:.5})!.frame);assert(seen.size>=3);}
 assert.notEqual(sampleActionFrame('jane',{transformation:true,spriteState:'attack',spriteMove:'s2'})!.clip.atlas,clip.atlas);
});
for(const ch of CHAR_IDS)check(`${ch}: visual ULT contacts match actual combat contacts`,()=>{
 const g=make(ch),a=g.f[0],d=g.f[1],hits:number[]=[];
 try{
  const kind=({orango:'superO',tubarao:'superT',nomad:'superN',renngotti:'superG',santox:'superS',jao:'superJ',jane:'superJane',cristyan:'superCristyan',eneas:'superEneas'} as Record<string,string>)[ch]||'superWoc';
  (g as any).seqHit=()=>hits.push(g.seq!.t);(g as any).startSeq(kind,a,d);
  assert.equal(g.seq!.dur,ultimateDuration(ch));
  for(let i=0;i<ultimateDuration(ch);i++){if(!g.seq)break;(g as any).updateSeq();}
  assert.deepEqual(hits,ultimateContacts(ch));
 }finally{g.destroy()}
});
check('Ulisses transforms to empty-handed strikes while base katana and Felipence guitar stay intact',()=>{
 for(const ch of ['ulisses','felipence'] as const){const g=make(ch),f=g.f[0],before=JSON.stringify(CHARS[ch]);try{
  for(const id of Object.keys(CHARS[ch].moves)){f.state='attack';f.move=CHARS[ch].moves[id];f.moveT=1;f.formT=0;const base=animeMotion(f).normalAccessory;f.formT=600;const form=animeMotion(f).normalAccessory;if(ch==='ulisses')assert.equal(form,undefined);else assert.equal(form,base);}
  assert.equal(JSON.stringify(CHARS[ch]),before);
 }finally{g.destroy()}}
 const engine=readFileSync('src/game/engine.ts','utf8');assert(engine.includes("f.ch==='ulisses'&&f.formT>0?{...m,accessory:undefined}:m"));
});
console.log(`${cases} action illustration checks passed; 3636 real drawings, all commands and both forms.`);
