/// <reference types="vite/client" />
import {CHARS,CHAR_IDS} from './data';
import raw from '../assets/menu/manifest.json';
import {selectAnimeSpriteFrame} from './anime-sprite';
import {menuBrawlFrame} from './menu-brawl';
import {settings} from './visual-settings';
import {drawAccessoryNormal} from './accessories';

interface Frame {page:number;rect:number[];x:number;y:number;w:number;h:number}
const manifest=raw as {actors:Record<string,{frames:Frame[]}>;pages:{src:string;width:number;height:number}[];pixels:number};
const actors=Object.values(manifest.actors);
interface Sheet {source:CanvasImageSource;rx:number;ry:number;pixels:number}
interface Bank {coarse:boolean;sheets:Map<number,Sheet>;ready:Promise<void>;error:boolean}
const urls:Record<string,string>=(()=>{try{return import.meta.glob<string>('../assets/menu/*.webp',{eager:true,query:'?url',import:'default'})}catch{return {}}})();
let shared:Bank|undefined;
function bank(coarse:boolean){
 if(shared?.coarse===coarse&&!shared.error)return shared;
 const next:Bank={coarse,sheets:new Map(),ready:Promise.resolve(),error:false};shared=next;
 const scale=Math.min(1,Math.sqrt((coarse?6:16)*1024*1024/manifest.pixels));
 next.ready=Promise.all(manifest.pages.map((page,index)=>new Promise<void>(resolve=>{
  if(typeof Image==='undefined'){resolve();return;}
  const image=new Image();image.decoding='async';
  const finish=()=>{image.onload=image.onerror=null;resolve();};
  image.onload=()=>{let source:CanvasImageSource=image,rx=1,ry=1;
   if(scale<1){const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.floor(page.width*scale));canvas.height=Math.max(1,Math.floor(page.height*scale));const c=canvas.getContext('2d');if(c){c.drawImage(image,0,0,canvas.width,canvas.height);source=canvas;rx=canvas.width/page.width;ry=canvas.height/page.height;}}
   next.sheets.set(index,{source,rx,ry,pixels:page.width*rx*page.height*ry});finish();if(source!==image)image.src='';
  };
  image.onerror=()=>{next.error=true;finish();};image.src=urls['../assets/menu/'+page.src]||'';
 }))).then(()=>{});return next;
}
/** A shared, bounded ambient atlas contains the same 432 calibrated poses.
 * Menu re-entry reuses decoded pages; it never queues 36 combat body sheets. */
export class MenuBrawlArt {
 private readonly bank:Bank;
 private rallyUntil=-1;
 private pulseX=480;
 readonly ready:Promise<void>;
 get loaded(){return this.bank.sheets.size===manifest.pages.length?actors.length:actors.filter(a=>a.frames.every(f=>this.bank.sheets.has(f.page))).length;}
 get pixels(){return [...this.bank.sheets.values()].reduce((n,s)=>n+s.pixels,0);}
 constructor(coarse=false){this.bank=bank(coarse);this.ready=this.bank.ready;}
 rally(time:number,x=480){this.rallyUntil=time+180;this.pulseX=Math.min(930,Math.max(30,x));}
 dispose(){/* The one shared bank is bounded and reused on the next menu visit. */}
 draw(c:CanvasRenderingContext2D,time:number){
  const rally=time<this.rallyUntil,actors=menuBrawlFrame(time,rally);
  // A single baseline also anchors aquatic/low forms and all walking frames.
  c.save();c.lineWidth=1;c.strokeStyle='#efc99c38';c.beginPath();c.moveTo(16,471);c.lineTo(944,471);c.stroke();
  if(rally){const age=180-(this.rallyUntil-time);c.strokeStyle=settings.reducedFlash?'#e7d6b633':'#ffe4b6aa';c.lineWidth=2;c.beginPath();c.ellipse(this.pulseX,472,Math.min(900,age*9),Math.min(90,age*.9),0,0,Math.PI*2);c.stroke();}
  const order=[...actors].sort((a,b)=>((CHAR_IDS.indexOf(a.ch)*7)%18)-((CHAR_IDS.indexOf(b.ch)*7)%18));
  for(const a of order){
   const actor=manifest.actors[a.ch+(a.form?'-form':'')]||manifest.actors[a.ch];if(!actor)continue;
   const index=selectAnimeSpriteFrame(CHARS[a.ch].poses.idle,a.options),frame=actor.frames[index];if(!frame)continue;
   const sheet=this.bank.sheets.get(frame.page);if(!sheet)continue;
   const [sx,sy,sw,sh]=frame.rect,height=(a.form&&a.ch==='tubarao'?155:CHARS[a.ch].hurtH)*1.055;
   const bodyScale=(a.ch==='jane'&&a.form?1.7:1)*.81;
   c.save();c.translate(a.x,a.y);c.scale(a.facing*bodyScale,bodyScale);
   c.fillStyle='#07040ab0';c.beginPath();c.ellipse(0,1,25,5,0,0,Math.PI*2);c.fill();
   if(a.form){const col=CHARS[a.ch].color;
    c.strokeStyle=col+(settings.reducedFlash?'45':'90');c.lineWidth=1.5;
    c.beginPath();c.ellipse(0,-3,30+Math.sin(time*.07+CHAR_IDS.indexOf(a.ch))*3,8,0,0,Math.PI*2);c.stroke();
    c.globalAlpha=.14;c.fillStyle=col;c.beginPath();c.ellipse(0,-height*.47,33,height*.48,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
   }
   c.drawImage(sheet.source,sx*sheet.rx,sy*sheet.ry,sw*sheet.rx,sh*sheet.ry,frame.x*height,frame.y*height,frame.w*height,frame.h*height);
   if(a.contact)drawAccessoryNormal(c,a.move,a.moveFrame);
   c.restore();
  }
  for(const a of actors)if(a.contact){
   const target=actors.find(b=>b.ch===a.target)!;if(Math.abs(a.x-target.x)>145)continue;
   const x=(a.x+target.x)*.5,y=470-(a.move.level==='low'?35:93),age=(a.moveFrame-a.move.startup)/Math.max(1,a.move.active);
   c.save();c.translate(x,y);c.globalAlpha=(settings.reducedFlash?.3:.7)*(1-age*.6);c.strokeStyle=CHARS[a.ch].glow;c.lineWidth=2;
   c.beginPath();c.moveTo(-a.facing*18,-17);c.quadraticCurveTo(a.facing*10,-27,a.facing*24,9);c.stroke();
   for(let k=0;k<(settings.reducedFlash?3:6);k++){const angle=k*Math.PI/3+time*.05,r=8+age*12;c.beginPath();c.moveTo(Math.cos(angle)*r*.3,Math.sin(angle)*r*.3);c.lineTo(Math.cos(angle)*r,Math.sin(angle)*r);c.stroke()}
   c.restore();
  }
  c.restore();
 }
}
