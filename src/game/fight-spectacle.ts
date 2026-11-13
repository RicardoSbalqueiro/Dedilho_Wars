import {CHARS,movePhase} from './data';
import type {CharId} from './data';
import type {Game,Fighter} from './engine';
import {FORM_VISUALS} from './form-effects';
import {computeRig,drawRig} from './rig';
import {attackAnimation} from './animation';
import {animeMotion} from './anime-motion';
import {mobileGraphics} from './mobile-settings';
import {settings} from './visual-settings';
import {FLOOR_Y,W,H} from './stage';
import {effectDetail} from './visual-budget';
import {drawImpactMotif} from './impact-motifs';
import {drawMotionEnvironment,drawGuardMotion,drawForceRibbons} from './motion-effects';

const TAU=Math.PI*2,clamp=(n:number)=>Math.max(0,Math.min(1,n));
const noise=(n:number)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
const light=(ch:CharId,form=false)=>form?FORM_VISUALS[ch].light:CHARS[ch].glow;
function ellipse(c:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,angle=0){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),angle,0,TAU);c.stroke()}
function polygon(c:CanvasRenderingContext2D,x:number,y:number,r:number,sides:number,angle=0){c.beginPath();for(let i=0;i<sides;i++){const a=angle+i/sides*TAU;i?c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):c.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}c.closePath()}

/** All VFX use simulation ticks and fixed detail budgets. Nothing here changes
 * damage, hitboxes, the camera, fighter scale, or the online particle payload. */
export function drawStrikeSpectacle(c:CanvasRenderingContext2D,f:Fighter,tick:number){
 const mobile=mobileGraphics()==='auto',reduced=settings.reducedFlash,col=light(f.ch,f.formT>0),h=f.ch==='tubarao'&&f.formT>0?155:f.def.hurtH,t=f.animT;
 drawGuardMotion(c,f,tick);
 if(f.formT>0){
  c.save();c.strokeStyle=col;c.fillStyle=col;c.globalCompositeOperation='lighter';
  c.globalAlpha=reduced?.12:.35;c.lineWidth=1.5;
  ellipse(c,0,-h*.51,Math.max(39,h*.4),h*.63);ellipse(c,0,-h*.51,Math.max(43,h*.43),h*.66);
  const count=mobile?7:12;
  for(let i=0;i<count;i++){const u=(t/48+i/count)%1,x=Math.sin(i*4.3+t*.02)*(34+h*.15);c.beginPath();c.moveTo(x,8-u*h*1.1);c.quadraticCurveTo(x+20*Math.sin(i+t*.04),-u*h-20,x+5,-u*h-42);c.stroke();}
  c.globalAlpha=reduced?.1:.28;c.lineWidth=2;const ground=-f.y+2;
  ellipse(c,0,ground,65+Math.sin(t*.05)*5,13);ellipse(c,0,ground,85,18,t*.003);
  for(let i=0;i<6;i++){const a=i/6*TAU+t*.009;c.beginPath();c.moveTo(Math.cos(a)*50,ground+Math.sin(a)*11);c.lineTo(Math.cos(a)*91,ground+Math.sin(a)*19);c.stroke();}
  c.restore();
 }
 const m=f.move;if(f.state!=='attack'||!m||m.kind==='super'||m.grab)return;
 const frame=Math.max(0,f.moveT-1),phase=movePhase(m,frame,f.connected),p=phase.progress;
 const force=m.kind==='normal'?.6+m.rank*.24:1.7;
 const amount=phase.phase==='startup'?clamp((p-.3)/.7)*.35:phase.phase==='active'?1:Math.max(0,1-p*2.5);
 if(amount<=0)return;
 if(!reduced&&phase.phase!=='startup'){
  const images=effectDetail().ghosts;
  for(let i=images;i>0;i--){const delay=i*2.6,pose=attackAnimation(f.ch,m,Math.max(0,frame-delay),f.connected);
   c.save();c.globalAlpha*=amount*(.17-i*.035);c.translate(-i*(7+force*3)-f.vx*f.facing*.2,0);
   drawRig(c,f.ch,computeRig(f.ch,pose),pose,{time:t-delay,transformation:f.formT>0,formVariant:f.formVariant,formTime:f.formElapsed,...animeMotion({...f,moveT:Math.max(1,f.moveT-delay)})});c.restore();
  }
 }
 const reach=Math.min(330,Math.max(45,m.hb[1]*(m.rangeScale??1))),low=m.level==='low',kick=/^(k|cK|jK)/.test(m.id),y=low?-h*.15:kick?-h*.48:-h*.66,spread=(18+force*19)*(kick?1.3:1);
 drawForceRibbons(c,f,amount,reach,y,spread,col);
 c.save();c.globalCompositeOperation='lighter';c.globalAlpha*=amount*(reduced?.18:.48);c.fillStyle=col;c.strokeStyle=col;
 // Small energy fragments follow the strike rather than replacing the actor.
 for(let i=0;i<(mobile?5:10);i++){const u=(t*.065+i*.17)%1;c.globalAlpha=amount*(1-u)*(reduced?.13:.65);polygon(c,reach*u,y+Math.sin(i*6+u*4)*spread,2+force*2,4,u*TAU);c.fill();}
 c.restore();
}

export function drawImpactSpectacle(c:CanvasRenderingContext2D,ch:CharId,x:number,y:number,age:number,power=1,seed=0,kind:'hit'|'guard'|'immune'|'break'='hit'){
 if(age<0||age>=28)return;
 const reduced=settings.reducedFlash,u=age/28,fade=(1-u)**1.5,col=kind==='guard'?'#83eaff':kind==='break'?'#fbbf24':kind==='immune'?FORM_VISUALS[ch].light:light(ch),strength=Math.min(3,Math.max(.6,power));
 c.save();c.translate(x,y);c.globalCompositeOperation='lighter';c.lineCap='round';c.lineJoin='round';
 c.globalAlpha=fade*(reduced?.24:.9);c.strokeStyle=col;c.fillStyle=col;
 const radius=13+age*(3+strength*1.6);
 for(let i=0;i<(reduced?2:effectDetail().ghosts>1?3:2);i++){c.globalAlpha=fade*(reduced?.12:.4)/(1+i*.3);c.lineWidth=1.5+strength*(1-u);ellipse(c,0,0,radius*(1-i*.14),radius*(.5+i*.1),i*.43);}
 const count=reduced?7:kind==='guard'?Math.floor(effectDetail().rays*.55):effectDetail().rays;
 for(let i=0;i<count;i++){
  const a=noise(i+seed*7)*TAU,n=noise(i*3.7+seed),r=(12+age*(3+n*6))*strength,len=(13+n*31)*(1-u);
  c.globalAlpha=fade*(.28+n*.6)*(reduced?.3:1);c.strokeStyle=i%4?col:'#ffffff';c.lineWidth=i%4?1+n*2:3;
  c.beginPath();c.moveTo(Math.cos(a)*r*.55,Math.sin(a)*r*.55);c.lineTo(Math.cos(a)*(r+len),Math.sin(a)*(r+len));c.stroke();
 }
 // Detached pressure crescents carry the impact outward after its sharp core
 // has faded. The empty centre preserves the defender's illustrated silhouette.
 if(kind==='hit'&&age>1&&age<18){
  const fronts=reduced?2:effectDetail().ghosts>1?5:3;
  c.strokeStyle=col;c.lineWidth=1.15;c.globalAlpha=(1-age/18)*.32*(reduced?.45:1);
  for(let i=0;i<fronts;i++){const a=noise(i+seed*2.3)*TAU,r=radius*(.8+i*.065);c.beginPath();c.ellipse(0,0,r,r*(.49+i*.05),i*.37,a,a+.24+strength*.07);c.stroke();}
 }
 if(kind==='immune'){
  c.strokeStyle=col;c.lineWidth=2;c.globalAlpha=fade*.7;
  for(let i=0;i<6;i++){const a=i/6*TAU,r=25+age*2;polygon(c,Math.cos(a)*r,Math.sin(a)*r*.8,9+u*9,6,a+u);c.stroke();}
 }else if(kind==='hit'){
  drawImpactMotif(c,ch,age,CHARS[ch].color,power);
  c.globalAlpha=Math.max(0,1-age/11)*fade*(reduced?.075:.32);c.fillStyle='#fff7dc';
  c.beginPath();for(let i=0;i<16;i++){const a=i/16*TAU,r=(i%2?7:26+strength*6)*(1-u*.65);i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill();
  c.globalAlpha=fade*(reduced?.13:.5);c.strokeStyle=col;c.lineWidth=2;
  if(ch==='ulisses')for(let i=-1;i<2;i++){c.beginPath();c.moveTo(-50+i*14,35);c.quadraticCurveTo(i*14,-20,44+i*14,-52);c.stroke();}
  if(ch==='felipence')for(let i=0;i<4;i++)ellipse(c,0,0,35+i*17+age*2,26+i*13+age*1.5);
  if(ch==='jao'||ch==='hdsh'){c.font='bold 24px serif';c.fillStyle=col;for(let i=0;i<3;i++)c.fillText(['Σ','π','×'][i],(i-1)*45,-35-age*.8);}
  if(ch==='santox'||ch==='bieu')for(let i=0;i<7;i++)c.strokeRect((noise(i+seed)-.5)*130,-50+noise(i+4)*100,12+i*3,4+i%3*3);
 }
 c.restore();
}

export function drawFightEnvironment(c:CanvasRenderingContext2D,g:Game){
 drawMotionEnvironment(c,g);
 const reduced=settings.reducedFlash,mobile=mobileGraphics()==='auto';
 for(const f of g.f){
  const hit=f.impact;if(!hit)continue;const age=g.tick-hit.tick;if(age<0||age>32)continue;
  const strength=Math.max(.6,hit.strength),x=hit.x??f.x,u=age/32,col=hit.kind==='hit'?g.f[1-f.idx].def.glow:f.def.glow;
  c.save();c.translate(x,FLOOR_Y+2);c.globalAlpha=(1-u)*(reduced?.15:.42);c.strokeStyle=col;c.lineWidth=2;
  ellipse(c,0,0,20+age*(3+strength),3+age*.5);
  if(hit.kind==='hit'){
   const count=effectDetail().shards;
   for(let i=0;i<count;i++){const n=noise(i+hit.serial*3),side=i%2?1:-1,dx=side*(8+age*(1+n*3)),dy=-Math.sin(clamp(age/(20+n*10))*Math.PI)*(7+n*25)*strength;
    c.save();c.translate(dx,dy);c.rotate(side*age*.12);c.fillStyle=i%3?'#b3a3a0':col;polygon(c,0,0,2+n*5,4,0);c.fill();c.restore();}
   for(let i=0;i<5;i++){const a=i/5*TAU,rr=18+u*55;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*rr*.5,Math.sin(a)*rr*.1);c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr*.22);c.stroke();}
  }
  c.restore();
 }
 for(const p of g.projectiles){
  if(p.life<=0||Math.abs(p.vx)<.2||Math.abs(p.x-g.cam.x)>780)continue;
  const col=g.f[p.owner].def.glow,dir=Math.sign(p.vx),x=p.x,y=FLOOR_Y+p.y;
  c.save();c.globalCompositeOperation='lighter';c.strokeStyle=col;c.lineWidth=2;c.globalAlpha=reduced?.18:.6;
  for(let i=0;i<(mobile?3:5);i++){const oy=(i-2)*5;c.beginPath();c.moveTo(x-dir*(25+i*14),y+oy);c.quadraticCurveTo(x-dir*30,y+Math.sin((p.age??0)*.3+i)*8+oy,x,y);c.stroke();}c.restore();
 }
}
export function drawFightImpacts(c:CanvasRenderingContext2D,g:Game){
 for(const f of g.f){const h=f.impact;if(!h)continue;const age=g.tick-h.tick;
  drawImpactSpectacle(c,h.kind==='hit'?g.f[1-f.idx].ch:f.ch,h.x??f.x,h.y??FLOOR_Y+f.y-f.def.hurtH*.58,age,h.strength,h.serial,h.kind==='guardBreak'?'break':h.kind==='armor'&&f.formT>0?'immune':h.kind==='hit'?'hit':'guard');
 }
}
export function drawFightScreen(c:CanvasRenderingContext2D,g:Game){
 if(settings.reducedFlash)return;
 for(const f of g.f){const hit=f.impact;if(!hit||hit.kind!=='hit')continue;const age=g.tick-hit.tick;if(age<0||age>12)continue;
  const fade=(1-age/13)*Math.min(1,hit.strength*.4),x=W/2+((hit.x??f.x)-g.cam.x)*g.cam.zoom,y=FLOOR_Y+((hit.y??FLOOR_Y-f.def.hurtH*.6)-FLOOR_Y)*g.cam.zoom;
  c.save();c.globalCompositeOperation='lighter';c.globalAlpha=fade*.34;c.strokeStyle=g.f[1-f.idx].def.glow;c.lineWidth=1.5;
  const count=mobileGraphics()==='auto'?12:22;
  for(let i=0;i<count;i++){const a=i/count*TAU,r=180+noise(i+hit.serial)*180;c.beginPath();c.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r*.7);c.lineTo(x+Math.cos(a)*(r+160),y+Math.sin(a)*(r+160)*.7);c.stroke();}
  c.fillStyle=g.f[1-f.idx].def.glow;c.globalAlpha=fade*.1;c.fillRect(0,0,W,4);c.fillRect(0,H-4,W,4);c.restore();
 }
}
export function drawCinematicAtmosphere(c:CanvasRenderingContext2D,ch:CharId,time:number,form:boolean){
 const reduced=settings.reducedFlash,count=mobileGraphics()==='auto'?16:30,col=light(ch,form);
 c.save();c.globalCompositeOperation='lighter';c.strokeStyle=col;c.fillStyle=col;c.globalAlpha=reduced?.11:.3;
 for(let i=0;i<count;i++){const n=noise(i+3),x=(i*79+time*(3+n*7))%(W+220)-110,y=70+noise(i+18)*360;c.lineWidth=i%4?1:3;c.beginPath();c.moveTo(x-35-n*60,y+8);c.lineTo(x+15,y-6);c.stroke();}
 for(let i=0;i<4;i++){const r=100+i*75+(time*1.8)%75;c.lineWidth=1;ellipse(c,W/2,440,r,r*.19,-.1);}
 c.restore();
}
