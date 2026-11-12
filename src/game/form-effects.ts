import type {CharId} from './data';
import {CHARS,movePhase} from './data';
import type {Fighter} from './engine';
import {FORMS} from './resources';
import {settings} from './visual-settings';
import {mobileGraphics} from './mobile-settings';

type Motif='torii'|'energy-cross'|'psychic'|'water'|'illusion'|'galaxy'|'rage'|'smoke'|'glitch'|'chess'|'mecha'|'muay'|'brasil'|'carapace'|'paws'|'blood'|'sound'|'analysis';
export const FORM_VISUALS:Record<CharId,{motif:Motif;color:string;light:string}>={
 caetano:{motif:'torii',color:'#ff821e',light:'#ffdf9c'},rickzera:{motif:'energy-cross',color:'#85ff24',light:'#e2ffac'},
 orango:{motif:'psychic',color:'#b86aff',light:'#edc9ff'},tubarao:{motif:'water',color:'#29c9ff',light:'#bcf5ff'},
 bieu:{motif:'illusion',color:'#23d9ff',light:'#ed76ff'},nomad:{motif:'galaxy',color:'#bd55ff',light:'#ceff76'},
 renngotti:{motif:'rage',color:'#ff3c39',light:'#ffd2c4'},aneninha:{motif:'smoke',color:'#ef5599',light:'#ffc5df'},
 santox:{motif:'glitch',color:'#ce37ff',light:'#f49cff'},jao:{motif:'chess',color:'#a96aff',light:'#e4c9ff'},
 jane:{motif:'mecha',color:'#ffd729',light:'#fff3ac'},cristyan:{motif:'muay',color:'#ffcd24',light:'#fff0a6'},
 eneas:{motif:'brasil',color:'#54d44a',light:'#ffe459'},patrick:{motif:'carapace',color:'#d85143',light:'#ffb4a2'},
 gabrielzin:{motif:'paws',color:'#ff68ba',light:'#ffcee7'},ulisses:{motif:'blood',color:'#dc234b',light:'#ff9cae'},
 felipence:{motif:'sound',color:'#ff972e',light:'#ffe2a6'},hdsh:{motif:'analysis',color:'#ac66ff',light:'#ecd1ff'},
};
const TAU=Math.PI*2,clamp=(v:number)=>Math.max(0,Math.min(1,v)),fract=(v:number)=>v-Math.floor(v);
type FormVisualState=Pick<Fighter,'ch'|'def'|'formT'|'state'|'aftermathT'|'animT'|'stateT'|'formElapsed'|'formVariant'|'formShield'>;
export function drawFormPreview(c:CanvasRenderingContext2D,ch:CharId,time:number){
 drawFormEffects(c,{ch,def:CHARS[ch],formT:FORMS[ch].duration,state:'ground',aftermathT:0,animT:time,stateT:0,formElapsed:time,formVariant:0,formShield:3},time);
}
function line(c:CanvasRenderingContext2D,points:readonly (readonly number[])[],close=false){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));if(close)c.closePath();c.stroke()}
function ring(c:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,rotation=0,start=0,end=TAU){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rotation,start,end);c.stroke()}
function star(c:CanvasRenderingContext2D,x:number,y:number,r:number,points=4,angle=0){c.beginPath();for(let i=0;i<points*2;i++){const a=angle+i*Math.PI/points,rr=i%2?r*.28:r;const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;i?c.lineTo(px,py):c.moveTo(px,py)}c.closePath();c.fill()}
function heart(c:CanvasRenderingContext2D,x:number,y:number,r:number){c.save();c.translate(x,y);c.scale(r/12,r/12);c.beginPath();c.moveTo(0,10);c.bezierCurveTo(-24,-3,-11,-17,0,-7);c.bezierCurveTo(11,-17,24,-3,0,10);c.stroke();c.restore()}
function gear(c:CanvasRenderingContext2D,x:number,y:number,r:number,t:number){c.save();c.translate(x,y);c.rotate(t);c.beginPath();for(let i=0;i<48;i++){const a=i/48*TAU,rr=r*(i%4<2?1:.82);i?c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):c.moveTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.closePath();c.stroke();ring(c,0,0,r*.48,r*.48);c.restore()}
function pawn(c:CanvasRenderingContext2D,x:number,y:number,r:number){ring(c,x,y-r*.8,r*.3,r*.3);line(c,[[x-r*.18,y-r*.5],[x-r*.15,y+r*.25],[x-r*.5,y+r*.6],[x+r*.5,y+r*.6],[x+r*.15,y+r*.25],[x+r*.18,y-r*.5]])}

/** Character-specific forms use simulation-owned time and bounded vector detail.
 * The function only paints: it never heals, spends resources or creates hits. */
export function drawFormEffects(c:CanvasRenderingContext2D,f:FormVisualState,_time:number){
 if(f.formT<=0&&f.state!=='transform'){
  if(f.aftermathT>0&&(f.ch==='renngotti'||f.ch==='tubarao')){
   c.save();c.globalAlpha*=.18; c.strokeStyle=f.ch==='tubarao'?'#9cdaed':'#c6b9bd';c.lineWidth=1;
   for(let i=0;i<3;i++){const u=fract(f.animT/70+i/3);ring(c,Math.sin(i*2.1)*20,-10-u*55,5+u*6,2+u*2)}c.restore();
  }return;
 }
 const spec=FORM_VISUALS[f.ch],t=f.animT,h=f.ch==='tubarao'&&f.formT>0?155:f.def.hurtH;
 const reduced=settings.reducedFlash,detail=mobileGraphics()==='auto'?6:10;
 const strength=f.formT>0?Math.min(1,.25+f.formElapsed/14,.25+f.formT/25):clamp(f.stateT/36);
 c.save();c.globalAlpha*=(reduced?.28:.58)*strength;c.lineWidth=1.4;c.strokeStyle=spec.color;c.fillStyle=spec.light;
 const glow=c.createRadialGradient(0,-h*.45,8,0,-h*.45,h*.78);glow.addColorStop(0,spec.color+'28');glow.addColorStop(1,spec.color+'00');c.fillStyle=glow;c.fillRect(-h*.8,-h*1.2,h*1.6,h*1.3);c.fillStyle=spec.light;
 ring(c,0,-1,40+Math.sin(t*.045)*3,9);ring(c,0,-1,50,12,0,t*.015,t*.015+Math.PI*1.45);
 switch(spec.motif){
  case 'torii':{
   const y=-h*.87;line(c,[[-61,y+4],[-36,y+10],[35,y+10],[63,y+4]]);line(c,[[-52,y+21],[53,y+21]]);line(c,[[-38,y+10],[-34,-9]]);line(c,[[38,y+10],[34,-9]]);
   ring(c,0,-h*.58,67,67,0,-Math.PI*.96+t*.005,Math.PI*.2+t*.005);break;
  }
  case 'energy-cross':{
   c.save();c.scale(1,.22);c.lineWidth=3;line(c,[[-65,0],[65,0]]);line(c,[[0,-70],[0,70]]);ring(c,0,0,83,83);c.restore();
   for(let i=0;i<detail;i++){const u=fract(t/45+i/detail),x=Math.sin(i*9.4)*48;line(c,[[x,-u*h],[x+9,-u*h-12],[x+4,-u*h-24]])}break;
  }
  case 'psychic':{
   for(let i=0;i<detail;i++){const a=t*.014+i/detail*TAU,x=Math.cos(a)*64,y=-h*.48+Math.sin(a)*36,r=3+i%3;line(c,[[x-r,y],[x,y-r*1.3],[x+r,y-r*.2],[x+r*.5,y+r],[x-r,y]],true)}
   ring(c,0,-h*.9,18,5,t*.018);ring(c,0,-h*.38,69,24,-.4);break;
  }
  case 'water':{
   for(let i=0;i<4;i++){const u=fract(t/50+i/4);c.globalAlpha*=.97;ring(c,0,-u*7,22+u*60,4+u*12)}
   for(let i=0;i<detail;i++){const u=fract(t/60+i/detail),x=Math.sin(i*13.2)*58;ring(c,x,-u*h,2+(i%3),3+(i%3))}break;
  }
  case 'illusion':{
   for(let j=0;j<3;j++){const x=(j-1)*47,y=-h*(.2+j*.25);c.beginPath();for(let i=0;i<38;i++){const u=i/37,a=u*TAU*2.2+t*.018,rr=2+u*17;i?c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):c.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}c.stroke()}
   c.strokeStyle=spec.light;for(let i=0;i<5;i++){const y=-h*fract(t/70+i/5),x=Math.sin(i*6+t*.02)*58;c.strokeRect(x,y,12+i*2,4)}break;
  }
  case 'galaxy':{
   for(let i=0;i<detail;i++){const a=i*2.4+t*.008,x=Math.cos(a)*(40+i%3*9),y=-h*.5+Math.sin(a)*h*.46;star(c,x,y,2+i%3,4,a)}
   c.save();c.translate(50,-h*.75);c.rotate(-.18);c.strokeRect(-13,-13,26,26);c.font='bold 21px sans-serif';c.textAlign='center';c.fillText(f.formVariant===0?'↑':f.formVariant===1?'»':'↗',0,8);c.restore();break;
  }
  case 'rage':{
   for(let i=0;i<detail;i++){const u=fract(t/25+i/detail),x=(i%2?1:-1)*(25+i%3*12);line(c,[[x,-u*h],[x+12,-u*h-12],[x-2,-u*h-28]])}
   c.lineWidth=2.8;for(let i=0;i<3;i++)line(c,[[-48+i*11,-h*.35],[-30+i*11,-h*.53],[-29+i*11,-h*.74]]);break;
  }
  case 'smoke':{
   for(let i=0;i<detail;i++){const u=fract(t/85+i/detail),x=Math.sin(t*.018+i*2)*54,y=-u*h*.82,r=10+u*13;c.globalAlpha*=.99;ring(c,x,y,r,r*.6);ring(c,x+8,y-7,r*.7,r*.5)}break;
  }
  case 'glitch':{
   for(let i=0;i<detail;i++){const k=Math.floor(t/5),x=Math.sin(i*43+k*.61)*65,y=-h*(i+.5)/detail;c.strokeStyle=i%2?spec.light:'#74faff';c.strokeRect(x,y,8+(i*7)%24,3+i%3);if(i%2===0)line(c,[[x+5,y+3],[x+2,y+13],[x+17,y+13]])}
   c.strokeStyle=spec.color;ring(c,0,-2,72,13);break;
  }
  case 'chess':{
   c.save();c.translate(0,-2);c.scale(1,.24);for(let i=-3;i<=3;i++){line(c,[[-58,i*18],[58,i*18]]);line(c,[[i*18,-58],[i*18,58]])}c.restore();
   const symbols=['Σ','π','∫','x²'];c.font='italic 18px serif';for(let i=0;i<4;i++)c.fillText(symbols[i],Math.sin(t*.013+i*2)*58,-h*(.25+i*.19));pawn(c,50,-h*.5,14);break;
  }
  case 'mecha':{
   gear(c,-34,-h*.7,23,t*.01);gear(c,36,-h*.48,34,-t*.008);c.strokeStyle=spec.light;
   for(const side of [-1,1]){line(c,[[side*35,-h*.18],[side*48,-h*.2],[side*53,-h*.3]]);ring(c,side*35,-h*.18,9,9)}break;
  }
  case 'muay':{
   ring(c,0,-h*.52,64,64,0,t*.018,t*.018+Math.PI*1.6);for(const side of [-1,1]){ring(c,side*27,-h*.7,13,5,.3*side);ring(c,side*21,-h*.18,13,5,-.4*side)}
   for(let i=0;i<6;i++){const a=t*.01+i/6*TAU;star(c,Math.cos(a)*61,-h*.52+Math.sin(a)*62,3)}break;
  }
  case 'brasil':{
   c.strokeStyle='#ffe43f';line(c,[[-65,-h*.48],[0,-h*.86],[65,-h*.48],[0,-h*.12]],true);c.strokeStyle='#64d9ff';ring(c,0,-h*.48,32,32);
   for(let i=0;i<detail;i++){const a=i/detail*TAU+t*.009;star(c,Math.cos(a)*61,-h*.48+Math.sin(a)*h*.39,3,5,a)}break;
  }
  case 'carapace':{
   for(let i=0;i<8;i++){const a=i/8*TAU+t*.004,x=Math.cos(a)*54,y=-h*.48+Math.sin(a)*h*.42;line(c,[[x-6,y-8],[x+7,y-4],[x+9,y+4],[x,y+10],[x-8,y+3]],true)}
   const alpha=c.globalAlpha;for(let i=0;i<3;i++){c.globalAlpha=alpha*(f.formShield>i?.8:.16);c.strokeRect(-17+i*13,-h-9,8,6)}break;
  }
  case 'paws':{
   for(let i=0;i<4;i++){const a=i/4*TAU+t*.012,x=Math.cos(a)*57,y=-h*.49+Math.sin(a)*h*.38;heart(c,x,y,6)}
   for(const x of [-49,49]){ring(c,x,-h*.4,7,5);for(let i=0;i<3;i++)ring(c,x-7+i*6,-h*.4-10,2.5,3.5)}break;
  }
  case 'blood':{
   for(let i=0;i<detail;i++){const u=fract(t/67+i/detail),x=Math.sin(i*9+t*.008)*48,y=-h*u;c.beginPath();c.moveTo(x,y-6);c.quadraticCurveTo(x-6,y+3,x,y+5);c.quadraticCurveTo(x+6,y+3,x,y-6);c.stroke()}
   const beat=f.formElapsed%300;if(f.formElapsed>=300&&beat<25){c.globalAlpha*=1-beat/25;ring(c,0,-h*.58,20+beat*2,16+beat*1.5);heart(c,0,-h*.58,9)}break;
  }
  case 'sound':{
   const force=f.state==='attack'?1.5:1;for(let j=0;j<3;j++){const y=-h*(.24+j*.23);c.beginPath();for(let i=0;i<=32;i++){const x=-72+i*4.5,py=y+Math.sin(i*.7-t*.17+j)*7*force;i?c.lineTo(x,py):c.moveTo(x,py)}c.stroke()}
   for(let i=0;i<3;i++){const x=Math.sin(t*.016+i*2.1)*61,y=-h*(.2+i*.3);line(c,[[x,y+5],[x,y-10],[x+8,y-13]]);ring(c,x-3,y+6,4,2,-.2)}break;
  }
  case 'analysis':{
   for(let j=0;j<2;j++){const x=j?29:-64,y=-h*(j?.7:.38);c.strokeRect(x,y,39,29);for(let i=0;i<4;i++){const v=5+(Math.sin(t*.024+i+j)+1)*8;c.fillRect(x+6+i*7,y+23-v,3,v)}line(c,[[x+3,y+24],[x+35,y+24]])}
   ring(c,0,-h*.83,23,8,-.25);line(c,[[-60,-h*.9],[-60,-h*.98],[-48,-h*.98]]);break;
  }
 }
 if(f.state==='transform'){
  const u=clamp(f.stateT/36);c.strokeStyle=spec.light;ring(c,0,-h*.45,18+u*75,18+u*h*.54,0,-t*.03,TAU*.8-t*.03);
  const age=f.stateT-36;if(age>=0&&age<22){c.globalAlpha*=(1-age/22)*(reduced?.3:1);ring(c,0,-h*.45,35+age*5,30+age*4);}
 }
 c.restore();
}

/** Front accents connect authored frames to the actual strike and foot contacts. */
export function drawCombatFlowFx(c:CanvasRenderingContext2D,f:Fighter,tick:number){
 const reduced=settings.reducedFlash,t=f.animT,h=f.def.hurtH,col=f.formT>0?FORM_VISUALS[f.ch].light:f.def.glow;
 c.save();c.strokeStyle=col;c.fillStyle=col;c.lineWidth=1.2;c.lineCap='round';
 if((f.walking||f.state==='dash')&&f.y===0){
  const age=t%13.5,u=age/13.5;c.globalAlpha*=.25*(1-u);const side=Math.sign(f.vx*f.facing||1);ring(c,-side*(20+u*18),-3-u*4,4+u*9,2+u*3);
 }
 if(f.landLag>0&&f.state==='ground'){const u=clamp((12-f.landLag)/12);c.globalAlpha=(1-u)*.36;ring(c,0,-2,15+u*38,3+u*7)}
 const m=f.move;
 if(f.state==='attack'&&m&&!m.grab&&m.kind!=='super'){
  const phase=movePhase(m,Math.max(0,f.moveT-1),f.connected),u=phase.progress;
  const strength=m.kind==='normal'?m.rank/3:1,x=Math.min(245,m.hb[1]*(m.rangeScale??1)),y=-(m.hb[2]+m.hb[3])*.5;
  if(phase.phase==='active'||phase.phase==='recovery'&&u<.2){
   c.globalAlpha=(phase.phase==='active'?.58:.25)*(reduced?.4:1);c.lineWidth=1+strength*1.5;
   const r=12+strength*13;c.beginPath();c.moveTo(x*.18,y+r);c.quadraticCurveTo(x*.65,y-r*1.2,x+6,y-r*.2);c.stroke();
   if(f.formT>0){ring(c,x,y,8+u*11,6+u*8,-.4);star(c,x+4,y-2,4+strength*4)}
  }
 }
 const impact=f.impact;
 if(impact&&(impact.kind==='hit'||impact.kind==='armor')){
  const age=tick-impact.tick;if(age>=0&&age<14){const u=age/14;c.globalAlpha=(1-u)*(reduced?.2:.7);c.strokeStyle=impact.kind==='armor'?'#b9e9ff':'#ffe4b1';const y=-h*.58;
   for(let i=0;i<6;i++){const a=i/6*TAU,r=8+u*24;line(c,[[Math.cos(a)*r*.5,y+Math.sin(a)*r*.5],[Math.cos(a)*r,y+Math.sin(a)*r]])}
  }
 }
 c.restore();
}
