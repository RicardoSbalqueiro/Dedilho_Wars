/// <reference types="vite/client" />
import type {CharId} from './data';
import raw from '../assets/motion/manifest.json';
export interface MotionCell {rect:[number,number,number,number];anchorX:number;baseline:number;height:number;visiblePixels:number}
export interface MotionAtlas {ch:CharId;src:string;width:number;height:number;referenceHeights:[number,number];rowReferenceHeights?:number[];frames:MotionCell[];sourceDrawings:number}
const manifest=raw as unknown as {version:number;poses:string[];formOffset:number;atlases:Partial<Record<CharId,MotionAtlas>>};
const urls:Record<string,string>=(()=>{try{return import.meta.glob<string>('../assets/motion/*.webp',{eager:true,query:'?url',import:'default'})}catch{return {}}})();
interface Entry {image:HTMLImageElement;atlas:MotionAtlas;status:'loading'|'ready'|'error';promise:Promise<void>;used:number;pixels:number}
const cache=new Map<CharId,Entry>();const MAX_PIXELS=12*1024*1024,MAX_IMAGES=6;let serial=0,notice=false;
function notify(){if(notice||typeof window==='undefined')return;notice=true;requestAnimationFrame(()=>{notice=false;window.dispatchEvent(new Event('dedilho-display-change'))})}
function trim(protectedId:CharId){let pixels=[...cache.values()].reduce((n,e)=>n+e.pixels,0);for(const [id,e] of [...cache].filter(([id,e])=>id!==protectedId&&e.status!=='loading').sort((a,b)=>a[1].used-b[1].used)){if(pixels<=MAX_PIXELS&&cache.size<=MAX_IMAGES)break;pixels-=e.pixels;cache.delete(id)}}
function entry(ch:CharId):Entry|undefined {
 const old=cache.get(ch);if(old){old.used=++serial;return old;}
 const atlas=manifest.atlases[ch];if(!atlas||typeof Image==='undefined')return;
 const image=new Image();image.decoding='async';let done=()=>{};
 const value:Entry={image,atlas,status:'loading',pixels:0,used:++serial,promise:new Promise<void>(resolve=>{done=resolve})};cache.set(ch,value);
 image.onload=()=>{value.status='ready';value.pixels=image.naturalWidth*image.naturalHeight;trim(ch);notify();done()};image.onerror=()=>{value.status='error';done()};
 image.src=urls['../assets/motion/'+atlas.src]||new URL('../assets/motion/'+atlas.src,import.meta.url).href;
 return value;
}
export function preloadMotionSprites(ids:readonly CharId[]){return Promise.all(ids.map(ch=>entry(ch)?.promise??Promise.resolve())).then(()=>{})}
export function loadedMotionAtlas(ch:CharId){const e=entry(ch);return e?.status==='ready'?{image:e.image,atlas:e.atlas}:undefined}
export function motionSpriteReady(ch:CharId){return cache.get(ch)?.status==='ready'}
export function motionAtlasManifest(){return manifest}
