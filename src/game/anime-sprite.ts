/// <reference types="vite/client" />
/** Illustrated anime frame renderer. Art is authored in the atlas, never rebuilt
 * from the old mannequin or stretched limb-by-limb. Contacts remain engine data. */
import {CHARS,CHAR_IDS} from './data';
import type {CharId,Pose} from './data';
import type {DrawOpts} from './rig';
import rawManifest from '../assets/sprites/manifest.json';
import {loadedMotionAtlas,preloadMotionSprites} from './motion-atlas';
import {sampleDrawnFrame} from './sprite-timeline';
import {drawActionSprite,preloadActionSprites} from './action-atlas';

export type AnimeSpriteRect=readonly [number,number,number,number];
export interface AnimeSpriteAtlas {
 ch:CharId;src:string;width:number;height:number;columns:number;rows:number;
 frameRects:readonly AnimeSpriteRect[];bounds:readonly AnimeSpriteRect[];
 baselines:readonly number[];idleHeight:number;portraitRect:AnimeSpriteRect;
}
interface SpriteManifest {version:number;poses:readonly string[];atlases:Record<string,AnimeSpriteAtlas>}
const manifest=rawManifest as unknown as SpriteManifest;
// Vite replaces this call with eager, offline-capable URL imports. Ordinary Node
// regression bundles have no import.meta.glob; no DOM or image is created there.
const urls:Record<string,string>=(()=>{try{return import.meta.glob<string>('../assets/sprites/*.webp',{eager:true,query:'?url',import:'default'})}catch{return {}}})();

type ImageEntry={image:HTMLImageElement;status:'loading'|'ready'|'error';promise:Promise<void>;pixels:number;used:number};
const images=new Map<string,ImageEntry>();
type PortraitEntry={source:HTMLCanvasElement|OffscreenCanvas;width:number;height:number};
// Tiny crop surfaces survive full-atlas eviction, so a static roster of 18 heads
// cannot continually reload large sheets when the body cache reaches its budget.
const portraits=new Map<string,PortraitEntry>();
function cachePortrait(key:string,atlas:AnimeSpriteAtlas,image:HTMLImageElement):PortraitEntry|undefined{
 const old=portraits.get(key);if(old)return old;
 const [sx,sy,sw,sh]=atlas.portraitRect;if(sw<=0||sh<=0)return;
 let canvas:HTMLCanvasElement|OffscreenCanvas;
 if(typeof OffscreenCanvas!=='undefined')canvas=new OffscreenCanvas(sw,sh);
 else if(typeof document!=='undefined'){canvas=document.createElement('canvas');canvas.width=sw;canvas.height=sh}else return;
 const ctx=canvas.getContext('2d') as CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D|null;if(!ctx)return;
 ctx.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);const result={source:canvas,width:sw,height:sh};portraits.set(key,result);return result;
}
const MAX_IMAGES=20,MAX_PIXELS=32*1024*1024;
let useSerial=0,notificationPending=false;
function notifyImageReady(){
 if(notificationPending||typeof window==='undefined'||typeof window.dispatchEvent!=='function')return;
 notificationPending=true;
 const notify=()=>{notificationPending=false;window.dispatchEvent(new Event('dedilho-display-change'))};
 if(typeof requestAnimationFrame==='function')requestAnimationFrame(notify);else queueMicrotask(notify);
}
function trimImages(protectedKey:string){
 let pixels=0;for(const entry of images.values())pixels+=entry.pixels;
 const candidates=[...images].filter(([key,e])=>key!==protectedKey&&e.status!=='loading').sort((a,b)=>a[1].used-b[1].used);
 for(const [key,e]of candidates){if(images.size<=MAX_IMAGES&&pixels<=MAX_PIXELS)break;images.delete(key);pixels-=e.pixels}
}
function sourceURL(atlas:AnimeSpriteAtlas):string{
 const src=atlas.src;if(src.startsWith('data:'))return src;
 const filename=src.split('/').pop()||src;
 const bundled=urls['../assets/sprites/'+filename];if(bundled)return bundled;
 // Enables direct file-based offline QA without fetching JSON or requiring a
 // running server. Production Vite builds always use the import above.
 try{return new URL('../assets/sprites/'+filename,import.meta.url).href}catch{return ''}
}
function atlasFor(ch:CharId,form=false):{key:string;atlas:AnimeSpriteAtlas}|undefined{
 const key=form&&manifest.atlases[ch+'-form']?ch+'-form':ch;
 const atlas=manifest.atlases[key];return atlas?{key,atlas}:undefined;
}
function imageFor(key:string,atlas:AnimeSpriteAtlas):ImageEntry|undefined{
 const existing=images.get(key);if(existing){existing.used=++useSerial;return existing}
 if(typeof Image==='undefined')return;
 const url=sourceURL(atlas);if(!url)return;
 const image=new Image();image.decoding='async';
 let finish:()=>void=()=>{};
 const entry:ImageEntry={image,status:'loading',pixels:0,used:++useSerial,promise:new Promise<void>(resolve=>{finish=resolve})};
 images.set(key,entry);
 const complete=(ready:boolean)=>{
  if(entry.status!=='loading')return;entry.status=ready?'ready':'error';
  if(ready){entry.pixels=(image.naturalWidth||atlas.width)*(image.naturalHeight||atlas.height);cachePortrait(key,atlas,image);trimImages(key);notifyImageReady()}
  finish();
 };
 image.onload=()=>complete(true);image.onerror=()=>complete(false);image.src=url;
 if(image.complete&&image.naturalWidth>0)complete(true);
 return entry;
}
function loadedAtlas(ch:CharId,form:boolean){
 const selected=atlasFor(ch,form);if(!selected)return;
 const entry=imageFor(selected.key,selected.atlas);
 if(entry?.status==='ready')return {...selected,image:entry.image};
 // A form image can finish loading while its already loaded base artwork and
 // the existing game aura remain visible. No procedural character fallback.
 if(selected.key!==ch){const base=atlasFor(ch);if(base){const fallback=imageFor(base.key,base.atlas);if(fallback?.status==='ready')return {...base,image:fallback.image}}}
 return;
}

/** Load only the needed cast/category. Defaults to all 18 base atlases; forms are
 * loaded on demand so mobile browsers do not decode 36 large sheets at once. */
export function preloadAnimeSprites(ids:readonly CharId[]=CHAR_IDS,includeForms=false):Promise<void>{
 const pending:Promise<void>[]=[];
 if(includeForms&&ids.length<=4)pending.push(preloadMotionSprites(ids),preloadActionSprites(ids));
 for(const ch of ids){
  const base=atlasFor(ch);if(base){const entry=imageFor(base.key,base.atlas);if(entry)pending.push(entry.promise)}
  if(includeForms&&manifest.atlases[ch+'-form']){const form=atlasFor(ch,true)!;const entry=imageFor(form.key,form.atlas);if(entry)pending.push(entry.promise)}
 }
 return Promise.all(pending).then(()=>{});
}
export function preloadAnimeSprite(ch:CharId,form=false):Promise<void>{
 const data=atlasFor(ch,form);if(!data)return Promise.resolve();return Promise.all([imageFor(data.key,data.atlas)?.promise??Promise.resolve(),preloadMotionSprites([ch])]).then(()=>{});
}
export function animeSpriteReady(ch:CharId,form=false):boolean{
 const selected=atlasFor(ch,form);return !!selected&&images.get(selected.key)?.status==='ready';
}
export const isAnimeSpriteReady=animeSpriteReady;
export function animeSpritesReady(ids:readonly CharId[]=CHAR_IDS,includeForms=false):boolean{
 return ids.every(ch=>animeSpriteReady(ch)&&(!includeForms||!manifest.atlases[ch+'-form']||animeSpriteReady(ch,true)));
}
export function animeSpriteStatus(ch:CharId,form=false):'missing'|'unloaded'|'loading'|'ready'|'error'{
 const selected=atlasFor(ch,form);return selected?images.get(selected.key)?.status??'unloaded':'missing';
}
export function getAnimeSpriteManifest():Readonly<SpriteManifest>{return manifest}

const finite=(n:number,fallback=0)=>Number.isFinite(n)?n:fallback;
const progress=(o:DrawOpts)=>Math.max(0,Math.min(1,finite(o.spriteProgress??0)));
const walkFrame=(time:number)=>2+(Math.floor(finite(time)/7)%2+2)%2;
const isRelaxed=(p:Pose)=>p.fa1>70&&p.fa2>55&&p.ba1>85&&p.ba2>55&&Math.abs(p.rot)<.1;
function attackFrame(pose:Pose,o:DrawOpts,name:string):number{
 const crouched=/^(cP|cK)|sweep|lowkick|kicklow|slide|crouch|dashlow/i.test(name);
 if(o.spriteKind==='super'&&o.spritePhase==='startup')return 11;
 if(o.spritePhase==='startup')return crouched?7:4;
 if(o.spritePhase==='recovery')return crouched?7:progress(o)<.23?4:0;
 if(o.spriteAir)return 8;
 // The crouched plate is preparation/guard. A committed weapon contact must
 // show its actual strike, including low sword/guitar and hand-tool normals.
 if(o.normalAccessory==='katana'||o.normalAccessory==='guitar')return (o.spriteRank??1)>=2||o.spriteKind==='kick'?6:5;
 if(o.normalAccessory==='screwdriver'||o.normalAccessory==='spray')return 5;
 if(crouched)return 7;
 if(o.spriteKind==='kick'||/^(k[LMH]|aK)|kick|chute|teep|knee|garuda|senbukan/i.test(name))return 6;
 if(o.spriteKind==='super'&&o.spritePhase!=='active')return 11;
 // Special gestures that visibly lift a leg use the kick plate; other ranged
 // powers keep their illustrated arm extension and the existing projectile art.
 if(o.spriteKind==='special'&&((pose.fl1<5&&pose.fl2<30)||(pose.bl1<0&&pose.bl2<30)))return 6;
 return 5;
}
/** Pure presentation selection: the supplied action phase wins over pose names,
 * so an actual active contact cannot accidentally display the wind-up plate. */
export function selectAnimeSpriteFrame(pose:Pose,o:DrawOpts):number{
 const name=o.poseName||'',state=o.spriteState;
 switch(state){
  case 'walk':return walkFrame(o.time);
  case 'crouch':return 7;
  case 'jump':return 8;
  case 'guard':return /blockC|crouch/i.test(name)?7:9;
  case 'hit':return 10;
  case 'charge':case 'victory':return 11;
  case 'attack':return attackFrame(pose,o,name);
  case 'idle':return isRelaxed(pose)||/standing|model|select|relaxed/i.test(name)?1:0;
 }
 if(o.spritePhase)return attackFrame(pose,o,name);
 if(/standing|model|select|relaxed/i.test(name))return 1;
 if(/^(win|taunt|charge|transform)|_charge|powerup|shout|super_s|atom_s/i.test(name))return 11;
 if(/hit|hurt|grabbed|air$|down|dizzy/i.test(name)||o.expr==='hit')return 10;
 if(/blockC|crouch|getup|^c[PK]|slide|laptop/i.test(name))return 7;
 if(/block|guard|defen/i.test(name))return 9;
 if(/jump|hop|rabbit|leap/i.test(name))return 8;
 if(/walk|rush|run|dash/i.test(name))return walkFrame(o.time);
 if(/_s$|windup|prepare/i.test(name))return 4;
 if(/_a$|_hit$|^a[PK]|headbutt|punch|kick|chute|throw|grab/i.test(name))return attackFrame(pose,o,name);
 if(isRelaxed(pose))return 1;
 return 0;
}
function frameRect(atlas:AnimeSpriteAtlas,index:number):AnimeSpriteRect{
 const declared=atlas.frameRects[index];if(declared)return declared;
 const col=index%atlas.columns,row=Math.floor(index/atlas.columns),w=atlas.width/atlas.columns,h=atlas.height/atlas.rows;
 return [col*w,row*h,w,h];
}
function bodyHeight(ch:CharId,form:boolean):number{
 // The large megalodon replaces the humanoid height during that form; the game
 // already applies its actual scale and hurtbox. EVA likewise receives its scale
 // once in drawFighter, rather than growing again inside this renderer.
 return (form&&ch==='tubarao'?155:CHARS[ch].hurtH)*1.055;
}

export function drawAnimeSprite(c:CanvasRenderingContext2D,ch:CharId,pose:Pose,o:DrawOpts):boolean{
 if(drawActionSprite(c,ch,o,bodyHeight(ch,!!o.transformation),finite(pose.rot)))return true;
 const data=loadedAtlas(ch,!!o.transformation);if(!data)return false;
 const {atlas}=data,legacy=selectAnimeSpriteFrame(pose,o),sample=sampleDrawnFrame(legacy,o);
 const motion=sample.bank==='motion'?loadedMotionAtlas(ch):undefined;
 const index=sample.bank==='base'?sample.index:legacy,rect=frameRect(atlas,index);
 let [sx,sy,sw,sh]=rect;if(sw<=0||sh<=0||atlas.idleHeight<=0)return false;
 let source:CanvasImageSource=data.image,scale=bodyHeight(ch,!!o.transformation)/atlas.idleHeight;
 const row=Math.floor(index/atlas.columns),baseline=atlas.baselines[row]??sh;
 let dx=-sw*.5*scale,dy=-baseline*scale,bounds:readonly number[]=atlas.bounds[index]??[0,0,sw,sh];
 if(motion){
  const variant=o.transformation?1:0,cell=motion.atlas.frames[sample.index+variant*12];
  if(cell){[sx,sy,sw,sh]=cell.rect;source=motion.image;scale=bodyHeight(ch,!!o.transformation)/(motion.atlas.rowReferenceHeights?.[variant*3+Math.floor(sample.index/4)]??motion.atlas.referenceHeights[variant]);dx=-cell.anchorX*scale;dy=-cell.baseline*scale;bounds=[0,0,sw,sh];}
 }
 const dw=sw*scale,dh=sh*scale;
 const time=finite(o.time),state=o.spriteState,idle=!motion&&(index===0||index===1);
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 if(idle){const breath=Math.sin(time*.063);c.translate(0,-.35*(breath+1));const breathe=1+breath*.0015;c.scale(breathe,breathe)}
 else if(!motion&&(state==='walk'||index===2||index===3))c.translate(0,-.65*(1-Math.cos(time*Math.PI/7)));
 const rotation=finite(pose.rot);
 if(Math.abs(rotation)>.08){
  const b=bounds,left=dx+b[0]*scale,right=left+b[2]*scale,top=dy+b[1]*scale,bottom=top+b[3]*scale;
  const cx=(left+right)*.5,cy=(top+bottom)*.5,a=Math.abs(Math.cos(rotation)),bSin=Math.abs(Math.sin(rotation)),height=(bottom-top)*a+(right-left)*bSin;
  // Whole illustrated figure rotates for launch/down/spins. Re-anchor its outer
  // bound at the game's feet origin; no face or limb is independently warped.
  c.translate(0,-height*.5);c.rotate(rotation);c.translate(-cx,-cy);
 }
 c.drawImage(source,sx,sy,sw,sh,dx,dy,dw,dh);c.restore();return true;
}

export function drawAnimeSpriteHead(c:CanvasRenderingContext2D,ch:CharId,r:number,o:DrawOpts):boolean{
 if(!Number.isFinite(r)||r<=0)return false;
 const selected=atlasFor(ch,!!o.transformation);if(!selected)return false;
 let portrait=portraits.get(selected.key);
 if(!portrait){
  const data=loadedAtlas(ch,!!o.transformation);if(!data)return false;
  portrait=cachePortrait(data.key,data.atlas,data.image);
  if(!portrait){
   const [sx,sy,sw,sh]=data.atlas.portraitRect;if(sw<=0||sh<=0)return false;
   const h=r*2.8,w=h*sw/sh;c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(data.image,sx,sy,sw,sh,-w*.5,-r*1.65,w,h);c.restore();return true;
  }
 }
 const h=r*2.8,w=h*portrait.width/portrait.height;c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 c.drawImage(portrait.source,0,0,portrait.width,portrait.height,-w*.5,-r*1.65,w,h);c.restore();return true;
}
