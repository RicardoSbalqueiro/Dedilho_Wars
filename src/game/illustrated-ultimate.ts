import {CHARS} from './data';
import type {CharId} from './data';
import {drawActionSprite} from './action-atlas';
import {drawIllustratedEffect} from './action-effects';
import {ultimateBodyOptions,ultimateContacts} from './ultimate-direction';
import {drawFormPreview,FORM_VISUALS} from './form-effects';
import {settings} from './visual-settings';
import {computeRig,drawRig} from './rig';

const TAU=Math.PI*2,clamp=(v:number)=>Math.max(0,Math.min(1,v)),smooth=(v:number)=>{const u=clamp(v);return u*u*(3-2*u)};
function text(c:CanvasRenderingContext2D,value:string,x:number,y:number,size:number,color:string){c.font=`900 italic ${size}px 'Russo One',Impact,sans-serif`;c.textAlign='center';c.lineJoin='round';c.strokeStyle='#060913';c.lineWidth=4;c.strokeText(value,x,y,890);c.fillStyle=color;c.fillText(value,x,y,890);}
function ring(c:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.stroke();}
function actor(c:CanvasRenderingContext2D,ch:CharId,x:number,y:number,height:number,time:number,duration:number,form:boolean,alpha=1){
 c.save();c.globalAlpha*=alpha;c.translate(x,y);
 if(form){c.save();c.scale(height/(CHARS[ch].hurtH*1.055),height/(CHARS[ch].hurtH*1.055));drawFormPreview(c,ch,time+30);c.restore();}
 const drawn=drawActionSprite(c,ch,ultimateBodyOptions(ch,time,duration,form),height);
 if(!drawn){const pose=CHARS[ch].poses.idle;c.save();c.scale(height/(CHARS[ch].hurtH*1.055),height/(CHARS[ch].hurtH*1.055));drawRig(c,ch,computeRig(ch,pose),pose,{time,transformation:form,spriteState:'attack',spriteKind:'super',spritePhase:'startup'});c.restore();}
 c.restore();return drawn;
}
function victim(c:CanvasRenderingContext2D,ch:CharId,x:number,y:number,height:number,index:number,time:number,form:boolean,rotation=0){
 c.save();c.translate(x,y);c.scale(-1,1);c.rotate(rotation);const drawn=drawActionSprite(c,ch,{time,transformation:form,actionClip:'react',actionProgress:(index+.01)/12},height);
 if(!drawn){const pose=CHARS[ch].poses.hit??CHARS[ch].poses.idle;c.save();c.scale(height/(CHARS[ch].hurtH*1.055),height/(CHARS[ch].hurtH*1.055));drawRig(c,ch,computeRig(ch,pose),pose,{time,transformation:form,spriteState:'hit',poseName:'hit'});c.restore();}c.restore();return drawn;
}

/** Character-specific direction over the existing authoritative ULT timeline.
 * Both actors use actual illustrated actions; props/energy animate separately. */
export function drawIllustratedUltimate(c:CanvasRenderingContext2D,ch:CharId,target:CharId,t:number,duration:number,form=false,targetForm=false):void{
 const p=clamp(t/duration),def=CHARS[ch],col=form?FORM_VISUALS[ch].color:def.color,light=form?FORM_VISUALS[ch].light:def.glow;
 const times=ultimateContacts(ch),last=times.at(-1)??132;let impact=0,age=999;
 for(const hit of times){const d=t-hit;if(d>=0&&d<age)age=d;impact=Math.max(impact,clamp(1-Math.abs(d)/8));}
 const melee=['caetano','rickzera','orango','bieu','aneninha','patrick','ulisses','santox','cristyan','tubarao'].includes(ch);
 c.save();c.fillStyle='#070a14';c.fillRect(0,0,960,540);
 const bg=c.createLinearGradient(0,0,960,540);bg.addColorStop(0,col+'55');bg.addColorStop(.5,'#111425');bg.addColorStop(1,col+'22');c.fillStyle=bg;c.fillRect(0,0,960,540);
 // A moving floor grid and parallax strokes give the attack depth. Reduced
 // flash keeps all drawings and movement while attenuating high-contrast VFX.
 c.strokeStyle=col+'33';c.lineWidth=1;
 for(let i=0;i<12;i++){const x=(i*127-t*(1+i%3))%1150-80;c.beginPath();c.moveTo(x,130+i%4*48);c.lineTo(x+110,100+i%4*48);c.stroke();}
 for(let i=0;i<8;i++){const y=430+i*i*1.7;c.beginPath();c.moveTo(0,y);c.lineTo(960,y);c.stroke();}
 for(let i=-6;i<7;i++){c.beginPath();c.moveTo(480+i*16,405);c.lineTo(480+i*150,510);c.stroke();}
 if(impact>0&&!settings.reducedFlash){c.fillStyle=light;c.globalAlpha=impact*.065;c.fillRect(0,0,960,540);c.globalAlpha=1;}
 c.save();const zoom=1+smooth((p-.08)/.8)*.045;c.translate(480,435);c.scale(zoom,zoom);c.translate(-480,-435);
 const close=times.reduce((best,hit)=>Math.abs(t-hit)<Math.abs(t-best)?hit:best,times[0]??last),near=Math.max(0,1-Math.abs(t-close)/17);
 let ax=melee?245+smooth((t-12)/35)*165+near*75:260,ay=450;
 if(t>last+16)ax+=(310-ax)*smooth((t-last-16)/Math.max(1,duration-last-16));
 let dx=690+smooth((t-last)/26)*100,dy=450,index=age<4?1:age<11?2:age<22?10:0,turn=0;
 if(p<.1)index=0;
 if(t>last+8){index=t>last+32?7:6;dy-=Math.sin(clamp((t-last-8)/27)*Math.PI)*94;dx+=smooth((t-last-8)/28)*20;}
 if(ch==='cristyan'){
  drawIllustratedEffect(c,'hammock',t,540,245,340,210,smooth((t-last+12)/30));
  if(t<last-20){index=7;dx=700;dy=360;turn=-.12;}
  const jump=smooth((t-last+58)/48);if(t<last+2){ax=350+jump*280;ay=450-Math.sin(jump*Math.PI)*180;}
 }
 if(ch==='tubarao'&&t<last-10){dx=670;index=2;}
 if(ch==='jane')ax=330;
 if(ch==='bieu'||ch==='aneninha')for(let i=0;i<3;i++)actor(c,ch,100+i*95+Math.sin(t*.04+i)*12,445,160,t+i*3,duration,form,.16+i*.07);
 victim(c,target,dx,dy,target==='jane'&&targetForm?300:CHARS[target].hurtH*1.4,index,t,targetForm,turn);
 let height=ch==='orango'?245:ch==='tubarao'?260:CHARS[ch].hurtH*1.42;
 if(ch==='jane')height=form?330:150+smooth((p-.1)/.2)*180;
 actor(c,ch,ax,ay,height,t,duration,form);
 // Authored object/effect frames supplement body animation, rather than
 // replacing it with a stationary character behind a fullscreen flash.
 c.save();if(settings.reducedFlash)c.globalAlpha*=.35;
 const cast=clamp((t-(times[0]??last)+12)/24),power=times.some(hit=>Math.abs(t-hit)<16);
 if(ch==='jane'){
  if(t>times[0]-16&&t<last+22)drawIllustratedEffect(c,'zord-beam',t,ax+48,175,Math.max(110,dx-ax+90),210,cast);
 }else if(ch==='eneas'){
  if(t<last-22)drawIllustratedEffect(c,'atomic-missile',t,dx-70,-100+smooth((t-35)/70)*390,145,225,clamp((t-35)/70));
  if(t>times[0]-5)drawIllustratedEffect(c,'atomic-cloud',t,dx-240,80,490,400,clamp((t-times[0])/50));
 }else if(ch==='nomad'){
  if(t>=35&&t<105)drawIllustratedEffect(c,'arena-beam',t,ax+68,208,Math.max(100,dx-ax+20),155,clamp((t-35)/25));
 }else if(ch==='jao'){
  drawIllustratedEffect(c,'jao-chess',t,480,260,360,210);drawIllustratedEffect(c,'jao-formula',t,440,100,330,180);
  if(power)drawIllustratedEffect(c,'jao-ball',t,dx-80,235,135,135);
 }else if(ch==='hdsh'){
  drawIllustratedEffect(c,'hdsh-go',t,510,350,300,130);drawIllustratedEffect(c,'glitch-domain',t,535,130,260,335,smooth((t-22)/35));
  if(power)drawIllustratedEffect(c,'hdsh-trend',t,470,185,270,210);
 }else if(ch==='santox'){
  drawIllustratedEffect(c,'glitch-domain',t,425,100,420,365);if(power)drawIllustratedEffect(c,'combat-burst',t,dx-110,210,210,210);
 }else if(ch==='felipence'){
  for(let i=0;i<3;i++){const x=ax+50+((t*4+i*105)%390);drawIllustratedEffect(c,i%2?'felipence-note':'felipence-pulse',t+i*3,x,160+i*56,145,150);}
 }else if(ch==='gabrielzin'){
  drawIllustratedEffect(c,'gabriel-cupid',t,ax+35,135,390,315);if(power)drawIllustratedEffect(c,'gabriel-kiss',t,dx-105,210,180,180);
 }else if(power){
  const effect=ch==='ulisses'?(form?'ulisses-claw':'ulisses-blood'):ch==='bieu'?'bieu-paint':ch==='aneninha'?'aneninha-paint':ch==='patrick'?'patrick-impact':ch==='cristyan'?'cristyan-knee':ch==='orango'?'orango-finger':ch==='rickzera'?'rick-fist':ch==='tubarao'?'tubarao-water':'caetano-finger';
  drawIllustratedEffect(c,effect,t,dx-125,210,220,185,clamp(age/14));
 }
 c.restore();if(age>=0&&age<17){
  c.save();c.translate(dx-25,295);c.globalAlpha=(1-age/17)*(settings.reducedFlash?.2:.75);c.strokeStyle=light;c.lineWidth=2;
  for(let i=0;i<8;i++){const a=i/8*TAU,r=20+age*5;c.beginPath();c.moveTo(Math.cos(a)*r*.45,Math.sin(a)*r*.45);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);c.stroke();}c.restore();
 }
 c.strokeStyle=col+'88';c.lineWidth=2;ring(c,ax,454,60+Math.sin(t*.04)*5,9);c.restore();
 c.fillStyle='#070a13f2';c.fillRect(0,0,960,58);c.fillRect(0,486,960,54);
 text(c,def.superName,480,39,30,light);text(c,def.name,480,518,19,'#f5f0e8');
 c.fillStyle=col;c.fillRect(40,532,880*p,3);c.restore();
}
