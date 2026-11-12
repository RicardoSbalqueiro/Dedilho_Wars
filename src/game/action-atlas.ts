/// <reference types="vite/client" />
import type {CharId} from './data';
import type {DrawOpts} from './rig';
import {mobileGraphics} from './mobile-settings';
import raw from '../assets/actions/manifest.json';

export interface ActionCell {rect:[number,number,number,number];anchorX:number;baseline:number;referenceHeight:number;visiblePixels:number}
export interface ActionAtlas {ch?:CharId;src:string;width:number;height:number;frames:ActionCell[];sourceDrawings:number;kind:string;encodedSha256:string}
export interface ActionClip {atlas:string;frames:number[];kind:'move'|'ultimate'|'prop'|'effect'}
interface Manifest {version:number;atlases:Record<string,ActionAtlas>;clips:Record<string,ActionClip>}
const manifest=raw as unknown as Manifest;
const urls:Record<string,string>=(()=>{try{return import.meta.glob<string>('../assets/actions/*.webp',{eager:true,query:'?url',import:'default'})}catch{return {}}})();
interface Entry {source?:CanvasImageSource;image?:HTMLImageElement;atlas:ActionAtlas;status:'queued'|'loading'|'ready'|'error';promise:Promise<void>;resolve:()=>void;rx:number;ry:number;used:number;pixels:number}
const cache=new Map<string,Entry>(),queue:string[]=[];let loading=0,serial=0,notified=false;
const clamp=(n:number)=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
function notify(){if(notified||typeof window==='undefined')return;notified=true;requestAnimationFrame(()=>{notified=false;window.dispatchEvent(new Event('dedilho-display-change'))})}
function trim(protectedKey:string){
 let pixels=[...cache.values()].reduce((sum,e)=>sum+e.pixels,0);const limit=(mobileGraphics()==='auto'?16:40)*1024*1024;
 for(const [key,e] of [...cache].filter(([key,e])=>key!==protectedKey&&e.status==='ready').sort((a,b)=>a[1].used-b[1].used)){
  if(pixels<=limit&&cache.size<=22)break;pixels-=e.pixels;cache.delete(key);
 }
}
function pump(){
 while(loading<2&&queue.length){
  const key=queue.shift()!,e=cache.get(key);if(!e||e.status!=='queued')continue;
  loading++;e.status='loading';const image=new Image();e.image=image;image.decoding='async';
  const finish=(ok:boolean)=>{
   image.onload=image.onerror=null;e.status=ok?'ready':'error';loading--;
   if(ok){
    // Bound the decoded surface per sheet so both selected fighters, reactions,
    // ULTs and their effect sheets fit together on a phone without cache churn.
    const scale=Math.min(1,Math.sqrt((mobileGraphics()==='auto'?720000:1800000)/(image.naturalWidth*image.naturalHeight)));
    if(scale<1&&typeof document!=='undefined'){
     const surface=document.createElement('canvas');surface.width=Math.max(1,Math.round(image.naturalWidth*scale));surface.height=Math.max(1,Math.round(image.naturalHeight*scale));
     const c=surface.getContext('2d');if(c){c.drawImage(image,0,0,surface.width,surface.height);e.source=surface;e.rx=surface.width/e.atlas.width;e.ry=surface.height/e.atlas.height;e.image=undefined;image.src='';}
    }
    e.source??=image;e.pixels=e.atlas.width*e.rx*e.atlas.height*e.ry;trim(key);notify();
   }
   e.resolve();pump();
  };
  image.onload=()=>finish(true);image.onerror=()=>finish(false);image.src=urls['../assets/actions/'+e.atlas.src]||new URL('../assets/actions/'+e.atlas.src,import.meta.url).href;
 }
}
function entry(key:string,urgent=false){
 const old=cache.get(key);if(old){old.used=++serial;if(urgent&&old.status==='queued'){const i=queue.indexOf(key);if(i>0){queue.splice(i,1);queue.unshift(key);}}return old;}
 const atlas=manifest.atlases[key];if(!atlas||typeof Image==='undefined')return;
 let resolve=()=>{};const e:Entry={atlas,status:'queued',promise:new Promise<void>(done=>{resolve=done}),resolve:()=>resolve(),rx:1,ry:1,used:++serial,pixels:0};cache.set(key,e);if(urgent)queue.unshift(key);else queue.push(key);pump();return e;
}
export function preloadActionSheets(keys:readonly string[]){return Promise.all(keys.map(key=>entry(key)?.promise??Promise.resolve())).then(()=>{})}
const EFFECT_PAGE:Record<CharId,string>={caetano:'f',rickzera:'a',renngotti:'b',jao:'c',bieu:'a',nomad:'b',aneninha:'a',santox:'scene',jane:'c',cristyan:'f',eneas:'d',patrick:'f',gabrielzin:'e',ulisses:'f',felipence:'e',hdsh:'d',orango:'b',tubarao:'b'};
export function preloadActionSprites(ids:readonly CharId[]){
 const priority=['punches','kicks','specials','reactions','low','misc','ult','ult-form'];
 const keys=priority.flatMap(page=>ids.map(ch=>ch+'-'+page)).filter(key=>manifest.atlases[key]);
 if(ids.includes('jane')&&manifest.atlases['jane-bike'])keys.push('jane-bike');
 keys.push(...new Set(ids.map(ch=>'fx-'+EFFECT_PAGE[ch])),'fx-scene');return preloadActionSheets(keys);
}
export function preloadActionEffects(){return Promise.all(Object.entries(manifest.atlases).filter(([,a])=>a.kind==='effects').map(([key])=>entry(key)?.promise??Promise.resolve())).then(()=>{})}
export const actionAtlasManifest=()=>manifest;
export const actionAtlasReady=(key:string)=>cache.get(key)?.status==='ready';
export function actionCacheStats(){return {images:cache.size,pixels:[...cache.values()].reduce((n,e)=>n+e.pixels,0),loading,queued:queue.length}}
export function actionClip(ch:CharId,move:string,form=false){return manifest.clips[ch+'/'+(form?'form':'base')+'/'+move];}
export function sampleActionFrame(ch:CharId,o:DrawOpts):{clip:ActionClip;frame:number;action:string}|undefined{
 let action=o.actionClip??(o.spriteState==='attack'?o.spriteMove:undefined);
 if(!action)return;
 const riding=ch==='jane'&&!o.transformation&&o.actionClip===undefined&&(action==='s2'||action==='bikeRush');
 if(riding)action='bike';
 if(action==='bikeRush')action='s2';
 const aliases:Record<string,string>={megaStomp:'s1',megaDevour:'s2',megaKiss:'s3',evaLaser:'s1',evaDash:'s3'};action=aliases[action]??action;
 const clip=actionClip(ch,action,!!o.transformation);if(!clip)return;
 let index:number;
 if(o.actionProgress!==undefined)index=Math.min(clip.frames.length-1,Math.floor(clamp(o.actionProgress)*clip.frames.length));
 else if(riding){
  const p=clamp(o.spriteProgress??0),cycle=Math.floor((o.time||0)/4);
  index=o.spriteMove==='bikeRush'?[6,7,8,7][cycle%4]:o.spritePhase==='startup'?Math.min(2,Math.floor(p*3)):o.spritePhase==='recovery'?9+Math.min(2,Math.floor(p*3)):[3,4,3,2,3,4][cycle%6];
 }
 else{
  const p=clamp(o.spriteProgress??0),phase=o.spritePhase??'active';
  index=phase==='startup'?p<.52?0:1:phase==='active'?2:3;
 }
 return {clip,frame:clip.frames[Math.min(clip.frames.length-1,index)],action};
}
/** Paint a complete illustrated figure. Root movement comes from the match or
 * the cinematic choreography, never from deforming individual illustrated limbs. */
export function drawActionSprite(c:CanvasRenderingContext2D,ch:CharId,o:DrawOpts,height:number,rotation=0):boolean{
 const pick=sampleActionFrame(ch,o);if(!pick)return false;const e=entry(pick.clip.atlas,true);if(!e||e.status!=='ready'||!e.source)return false;
 const cell=e.atlas.frames[pick.frame];if(!cell)return false;const [x,y,w,h]=cell.rect,scale=height/Math.max(1,cell.referenceHeight),dx=-cell.anchorX*scale,dy=-cell.baseline*scale;
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 if(pick.action==='react')rotation=0;
 if(Math.abs(rotation)>.08){const cx=dx+w*scale*.5,cy=dy+h*scale*.5,extent=Math.abs(Math.cos(rotation))*h*scale+Math.abs(Math.sin(rotation))*w*scale;c.translate(0,-extent*.5);c.rotate(rotation);c.translate(-cx,-cy);}
 c.drawImage(e.source,x*e.rx,y*e.ry,w*e.rx,h*e.ry,dx,dy,w*scale,h*scale);c.restore();return true;
}
export function drawActionProp(c:CanvasRenderingContext2D,key:string,frame:number,x:number,y:number,width:number,height:number):boolean{
 const e=entry(key,true);if(!e||e.status!=='ready'||!e.source)return false;const cell=e.atlas.frames[Math.max(0,Math.min(e.atlas.frames.length-1,Math.floor(frame)))];if(!cell)return false;
 const [sx,sy,sw,sh]=cell.rect;c.drawImage(e.source,sx*e.rx,sy*e.ry,sw*e.rx,sh*e.ry,x,y,width,height);return true;
}
