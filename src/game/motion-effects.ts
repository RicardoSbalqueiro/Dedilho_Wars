import {movePhase} from './data';
import type {Fighter,Game} from './engine';
import {FLOOR_Y} from './stage';
import {settings} from './visual-settings';
import {effectDetail} from './visual-budget';

const TAU=Math.PI*2;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const noise=(n:number)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
const boundedAge=(age:number,duration:number)=>age>=0&&age<duration;

/** These small budgets are drawn geometry, never engine particles. They follow
 * the same local quality preference without changing a match or its snapshot. */
export function motionEffectBudget(){
 const detail=effectDetail(),reduced=settings.reducedFlash;
 return {dust:Math.max(3,Math.min(9,Math.floor(detail.shards*.7))),
  ribbons:detail.ghosts>1?3:2,guardShards:Math.min(10,detail.shards),
  airLines:detail.ghosts>1?3:2,alpha:reduced?.46:1};
}

export interface MotionDustSample {x:number;y:number;rx:number;ry:number;alpha:number;direction:number}
/** An inspectable, bounded wake. Signed velocity chooses its world direction;
 * facing alone cannot make a backdash emit dust ahead of the moving feet. */
export function sampleMotionDust(f:Pick<Fighter,'x'|'y'|'vx'|'walking'|'state'|'stateT'|'animT'|'idx'|'hidden'>):MotionDustSample[]{
 if(f.hidden||Math.abs(f.y)>.5||f.state!=='dash'&&!(f.state==='ground'&&f.walking)||Math.abs(f.vx)<.7)return [];
 const budget=motionEffectBudget(),dash=f.state==='dash',direction=Math.sign(f.vx),time=dash?f.stateT:f.animT;
 const count=dash?budget.dust:Math.max(2,Math.floor(budget.dust*.45));
 return Array.from({length:count},(_,i)=>{
  const n=noise(i*3.1+f.idx*17),age=((time+i*3.7)%21+21)%21,u=age/21;
  return {x:f.x-direction*(10+age*(.9+Math.abs(f.vx)*.62)+n*10),
   y:FLOOR_Y+3-Math.sin(u*Math.PI)*(dash?6+n*10:3+n*4),
   rx:3+u*(dash?10:6)+n*3,ry:1.3+u*2+n,
   alpha:Math.sin(u*Math.PI)*(dash?.22:.1)*budget.alpha,direction};
 });
}

interface Landing {tick:number;x:number;strength:number}
interface MotionTrack {tick:number;y:number;vy:number;landLag:number;landing?:Landing}
// Presentation history only. No data is attached to a Fighter, Game or Canvas.
const tracks=new WeakMap<Game,Map<number,MotionTrack>>();
export function sampleLandingEffect(g:Game,f:Fighter):{x:number;age:number;strength:number}|undefined{
 let cast=tracks.get(g);if(!cast){cast=new Map();tracks.set(g,cast)}
 let old=cast.get(f.idx);
 if(old&&(g.tick<old.tick||g.tick-old.tick>12))old=undefined;
 let landing=old?.landing;
 const grounded=f.state==='ground'&&!f.hidden&&Math.abs(f.y)<.5;
 if(grounded&&(old&&old.y<-.5||f.landLag>0&&f.stateT<=1&&(!old||old.landLag===0))){
  landing={tick:g.tick,x:f.x,strength:.6+clamp(Math.abs(old?.vy??4)/13)*.7};
 }
 if(landing&&!boundedAge(g.tick-landing.tick,19))landing=undefined;
 cast.set(f.idx,{tick:g.tick,y:f.y,vy:f.vy,landLag:f.landLag,landing});
 return landing?{x:landing.x,age:g.tick-landing.tick,strength:landing.strength}:undefined;
}

function groundEllipse(c:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number){
 c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.stroke();
}

/** Called in the world floor pass, before either fighter is painted. All dust
 * and landing accents stay within a few pixels of the floor or below the feet. */
export function drawMotionEnvironment(c:CanvasRenderingContext2D,g:Game){
 if(g.phase!=='fight'||g.seq||g.cine||g.clash)return;
 const budget=motionEffectBudget();
 for(const f of g.f){
  const landing=sampleLandingEffect(g,f);if(f.hidden)continue;
  const dust=sampleMotionDust(f);
  if(dust.length){
   c.save();c.lineCap='round';c.fillStyle='#c5b39c';c.strokeStyle=f.def.glow;
   for(let i=0;i<dust.length;i++){
    const d=dust[i];c.globalAlpha=d.alpha;c.beginPath();
    c.ellipse(d.x,d.y,d.rx,d.ry,-d.direction*.12,Math.PI*.12,Math.PI*1.85);c.fill();
    if(i%2===0){c.globalAlpha=d.alpha*.8;c.lineWidth=.9;c.beginPath();c.moveTo(d.x-d.direction*d.rx*1.5,FLOOR_Y+4+i%3);c.lineTo(d.x+d.direction*d.rx*.4,FLOOR_Y+3+i%3);c.stroke();}
   }
   c.restore();
  }
  if(landing){
   const u=landing.age/19,fade=(1-u)**1.6,strength=landing.strength;
   c.save();c.strokeStyle=f.def.glow;c.lineWidth=1.25;c.globalAlpha=fade*.33*budget.alpha;
   groundEllipse(c,landing.x,FLOOR_Y+3,13+u*64*strength,2.4+u*10);
   if(budget.ribbons===3){c.globalAlpha=fade*.16*budget.alpha;groundEllipse(c,landing.x,FLOOR_Y+4,8+u*46*strength,1.5+u*7);}
   c.fillStyle='#c5b39c';
   for(let i=0;i<Math.min(6,budget.dust);i++){
    const side=i%2?-1:1,n=noise(i+f.idx*7),x=landing.x+side*(9+u*(28+n*37)*strength),y=FLOOR_Y+3-Math.sin(u*Math.PI)*(2+n*8);
    c.globalAlpha=fade*.18*budget.alpha;c.beginPath();c.ellipse(x,y,3+u*8,1+u*2,side*.1,0,TAU);c.fill();
   }
   c.restore();
  }
  if(f.y<-8&&(f.state==='jump'||f.state==='attack'&&f.move?.air)&&Math.abs(f.vy)>2.5){
   // Fine air curls sit behind/below the legs, away from the head and torso.
   c.save();c.strokeStyle=f.def.glow;c.lineWidth=.9;c.globalAlpha=.13*budget.alpha;
   for(let i=0;i<budget.airLines;i++){
    const side=i%2?-1:1,phase=((f.animT*.09+i*.3)%1+1)%1,x=f.x+side*(15+i*7),y=FLOOR_Y+f.y+10+phase*18;
    c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+side*(6+phase*5),y+8,x+side*2,y+17);c.stroke();
   }
   c.restore();
  }
 }
}

/** Fighter-local defensive contour. Only the front edge is drawn, with a gap
 * around the face; an impact flexes it and a break sheds its outer segments. */
export function drawGuardMotion(c:CanvasRenderingContext2D,f:Fighter,tick:number){
 const hit=f.impact,age=hit?tick-hit.tick:999,broken=f.guardBreakT>0;
 const struck=!!hit&&['block','perfect','precision','guardBreak'].includes(hit.kind)&&boundedAge(age,23);
 if(!broken&&!f.guard&&f.state!=='block'&&!struck)return;
 const budget=motionEffectBudget(),h=f.ch==='tubarao'&&f.formT>0?155:f.def.hurtH;
 const low=f.crouch,cy=-h*(low?.3:.55),rx=low?27:26,ry=h*(low?.17:.23);
 const x=low?26:30,perfect=hit?.kind==='perfect'||hit?.kind==='precision';
 const col=broken||f.guardMeter<25?'#ffbf69':hit?.kind==='precision'?'#ffe895':perfect?'#8defff':'#87cfe0';
 c.save();c.strokeStyle=col;c.lineCap='round';c.lineJoin='round';
 if(broken){
  const t=hit?.kind==='guardBreak'?age:42-f.guardBreakT;
  if(boundedAge(t,28))for(let i=0;i<budget.guardShards;i++){
   const a=-1.15+i/Math.max(1,budget.guardShards-1)*2.3,n=noise(i+f.idx*13),u=t/28,rr=1+u*(.8+n*.5);
   const px=x+Math.cos(a)*rx*rr,py=cy+Math.sin(a)*ry*rr+t*t*.018;
   c.globalAlpha=(1-u)*.48*budget.alpha;c.lineWidth=1.35;c.beginPath();c.moveTo(px-3,py-4);c.lineTo(px+4+u*2,py);c.lineTo(px+1,py+5);c.stroke();
  }
 }else{
  const shock=struck?Math.exp(-age/7)*Math.sin(age*.6):0,flash=struck?(1-age/23)**1.3:0;
  c.globalAlpha=(.095+flash*(perfect?.43:.3))*budget.alpha;c.lineWidth=1.2+flash*(perfect?1.7:.8);
  c.beginPath();c.ellipse(x+shock*4,cy,rx*(1+shock*.05),ry,0,-1.14,1.14);c.stroke();
  if(struck){
   c.globalAlpha=flash*.22*budget.alpha;c.lineWidth=.9;c.beginPath();c.ellipse(x+5,cy,rx+5+age*.35,ry+age*.5,0,-.92,.92);c.stroke();
   for(let i=0;i<(perfect?4:2);i++){
    const side=i%2?-1:1,n=Math.floor(i/2),px=x+rx+3+age*(.6+n*.2),py=cy+side*(12+age*(.7+n*.4));
    c.globalAlpha=flash*.45*budget.alpha;c.beginPath();c.moveTo(px,py);c.lineTo(px+3,py+side*4);c.stroke();
   }
  }
 }
 c.restore();
}

/** Narrow ribbons express acceleration with an open silhouette. Every band
 * starts in front of the core body and tapers to the actual move's reach. */
export function drawForceRibbons(c:CanvasRenderingContext2D,f:Fighter,amount:number,reach:number,y:number,spread:number,colour=f.def.glow){
 const m=f.move;if(!m||amount<=0||m.grab||m.kind==='super')return;
 const budget=motionEffectBudget(),frame=Math.max(0,f.moveT-1),phase=movePhase(m,frame,f.connected);
 const start=Math.min(24,reach*.2),end=reach+12,width=Math.min(19,spread*.36);
 c.save();c.lineCap='round';c.strokeStyle=colour;c.fillStyle=colour;
 for(let i=0;i<budget.ribbons;i++){
  const side=i%2?-1:1,offset=(i-1)*6,bend=spread*(.45+i*.16),tipY=y+offset*.3;
  c.globalAlpha=amount*(i===1?.13:.065)*budget.alpha;
  c.beginPath();c.moveTo(start,y+offset+side*width);
  c.bezierCurveTo(start+(end-start)*.28,y+offset-side*bend,end*.78,y-side*bend,end,tipY);
  c.bezierCurveTo(end*.76,y-side*bend*.62,start+(end-start)*.24,y+offset-side*bend*.62,start,y+offset+side*width);c.fill();
  c.globalAlpha=amount*(i===1?.39:.24)*budget.alpha;c.lineWidth=i===1?1.4:.85;
  c.beginPath();c.moveTo(start+7,y+offset+side*width*.6);c.quadraticCurveTo(end*.55,y-side*bend,end,tipY);c.stroke();
 }
 const age=frame-m.startup,heavy=m.kind!=='normal'||m.rank>=3;
 if(heavy&&boundedAge(age,11)&&phase.phase!=='startup'){
  const u=age/11;c.globalAlpha=(1-u)*.26*budget.alpha;c.lineWidth=1.05;
  // The open pressure fronts remain at the hand/foot, never a full-screen disk.
  for(let i=0;i<Math.min(2,budget.ribbons);i++){
   c.beginPath();c.ellipse(end-3+u*(10+i*7),y,3+u*(5+i*3),8+u*(14+i*6),0,-1.18,1.18);c.stroke();
  }
 }
 c.restore();
}
