/// <reference types="vite/client" />
import {CHARS,CHAR_IDS} from './data';
import manifest from '../assets/sprites/manifest.json';
import {selectAnimeSpriteFrame} from './anime-sprite';
import {menuBrawlFrame} from './menu-brawl';
import {settings} from './visual-settings';
import {drawAccessoryNormal} from './accessories';

type Atlas=(typeof manifest.atlases)[keyof typeof manifest.atlases];
type Sheet={canvas:HTMLCanvasElement;atlas:Atlas;rx:number;ry:number};
const urls:Record<string,string>=(()=>{try{return import.meta.glob<string>('../assets/sprites/*.webp',{eager:true,query:'?url',import:'default'})}catch{return {}}})();
/** Small menu-only textures avoid decoding/reloading18fullsize fighters every
 * frame. A bounded, disposable cache never replaces high-detail match assets. */
export class MenuBrawlArt {
 private sheets=new Map<string,Sheet>();
 private pending=new Set<HTMLImageElement>();
 private disposed=false;
 private scale:number;
 private rallyUntil=-1;
 private pulseX=480;
 readonly ready:Promise<void>;
 get loaded(){return this.sheets.size;}
 get pixels(){return [...this.sheets.values()].reduce((n,s)=>n+s.canvas.width*s.canvas.height,0);}
 constructor(coarse=false){
  const all=Object.values(manifest.atlases),budget=(coarse?12:28)*1024*1024;
  this.scale=Math.min(.7,Math.sqrt(budget/all.reduce((n,a)=>n+a.width*a.height,0)));
  const queue=[...CHAR_IDS,...CHAR_IDS.map(ch=>ch+'-form')];
  const worker=async()=>{while(queue.length&&!this.disposed){const key=queue.shift()!;await this.load(key)}};
  this.ready=Promise.all([worker(),worker()]).then(()=>{});
 }
 private load(key:string):Promise<void>{
  const atlas=(manifest.atlases as Record<string,Atlas>)[key];
  if(!atlas||typeof Image==='undefined')return Promise.resolve();
  return new Promise(resolve=>{
   const image=new Image();image.decoding='async';this.pending.add(image);let finished=false;
   const finish=()=>{if(finished)return;finished=true;this.pending.delete(image);image.onload=image.onerror=null;image.src='';resolve()};
   image.onload=()=>{if(!this.disposed){
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.floor(atlas.width*this.scale));canvas.height=Math.max(1,Math.floor(atlas.height*this.scale));
    const ctx=canvas.getContext('2d');if(ctx){ctx.drawImage(image,0,0,canvas.width,canvas.height);this.sheets.set(key,{canvas,atlas,rx:canvas.width/atlas.width,ry:canvas.height/atlas.height})}
   }finish()};image.onerror=finish;image.src=urls['../assets/sprites/'+atlas.src]||'';
  });
 }
 rally(time:number,x=480){this.rallyUntil=time+180;this.pulseX=Math.min(930,Math.max(30,x));}
 dispose(){this.disposed=true;this.sheets.clear();for(const im of this.pending)im.src='';}
 draw(c:CanvasRenderingContext2D,time:number){
  const rally=time<this.rallyUntil,actors=menuBrawlFrame(time,rally);
  // A single baseline also anchors aquatic/low forms and all walking frames.
  c.save();c.lineWidth=1;c.strokeStyle='#efc99c38';c.beginPath();c.moveTo(16,471);c.lineTo(944,471);c.stroke();
  if(rally){const age=180-(this.rallyUntil-time);c.strokeStyle=settings.reducedFlash?'#e7d6b633':'#ffe4b6aa';c.lineWidth=2;c.beginPath();c.ellipse(this.pulseX,472,Math.min(900,age*9),Math.min(90,age*.9),0,0,Math.PI*2);c.stroke();}
  const order=[...actors].sort((a,b)=>((CHAR_IDS.indexOf(a.ch)*7)%18)-((CHAR_IDS.indexOf(b.ch)*7)%18));
  for(const a of order){
   const sheet=this.sheets.get(a.ch+(a.form?'-form':''))||this.sheets.get(a.ch);if(!sheet)continue;
   const index=selectAnimeSpriteFrame(CHARS[a.ch].poses.idle,a.options),{atlas}=sheet;
   const [sx,sy,sw,sh]=atlas.frameRects[index],[,by,,bh]=atlas.bounds[index];
   const height=(a.form&&a.ch==='tubarao'?155:CHARS[a.ch].hurtH)*1.055;
   const scale=height/atlas.idleHeight,bodyScale=(a.ch==='jane'&&a.form?1.7:1)*.81;
   c.save();c.translate(a.x,a.y);c.scale(a.facing*bodyScale,bodyScale);
   c.fillStyle='#07040ab0';c.beginPath();c.ellipse(0,1,25,5,0,0,Math.PI*2);c.fill();
   if(a.form){const col=CHARS[a.ch].color;
    c.strokeStyle=col+(settings.reducedFlash?'45':'90');c.lineWidth=1.5;
    c.beginPath();c.ellipse(0,-3,30+Math.sin(time*.07+CHAR_IDS.indexOf(a.ch))*3,8,0,0,Math.PI*2);c.stroke();
    c.globalAlpha=.14;c.fillStyle=col;c.beginPath();c.ellipse(0,-height*.47,33,height*.48,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
   }
   c.drawImage(sheet.canvas,sx*sheet.rx,sy*sheet.ry,sw*sheet.rx,sh*sheet.ry,-sw*.5*scale,-(by+bh)*scale,sw*scale,sh*scale);
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
