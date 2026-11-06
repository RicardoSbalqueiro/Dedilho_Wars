// Tubarão Fiscal: humanoid face, aquatic body and a cinematic tail strike.
// Rendering only. The shared choreography and engine own all timing/damage.
import type {CharId} from './data';
import {drawFullBody,drawHead,computeRig} from './rig';
import {cinematicAnimation} from './animation';
import {settings} from './visual-settings';
import {sharkUltMotion,SHARK_ULT_TAIL_FRAME} from './shark-choreography';
type C=CanvasRenderingContext2D;
type Point={x:number;y:number};
const W=960,H=540,FLOOR=440,FONT="'Russo One',Impact,sans-serif";
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
function path(ctx:C,points:number[][],fill:string,stroke='#17394a'){
  ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(const [x,y] of points.slice(1))ctx.lineTo(x,y);ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();
}
function line(ctx:C,points:number[][],color:string,width:number){
  ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(const [x,y] of points.slice(1))ctx.lineTo(x,y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
}
function heart(ctx:C,x:number,y:number,size:number,alpha=1){
  ctx.save();ctx.translate(x,y);ctx.scale(size/20,size/20);ctx.globalAlpha*=alpha;ctx.beginPath();ctx.moveTo(0,8);ctx.bezierCurveTo(-26,-8,-10,-23,0,-10);ctx.bezierCurveTo(10,-23,26,-8,0,8);ctx.fillStyle='#fda4af';ctx.fill();ctx.strokeStyle='#ffe4ed';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
}
function text(ctx:C,s:string,x:number,y:number,size:number,color:string){
  ctx.font=`italic 900 ${size}px ${FONT}`;ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=Math.max(2,size*.12);ctx.strokeStyle='#061a2c';ctx.strokeText(s,x,y);ctx.fillStyle=color;ctx.fillText(s,x,y);
}

/** A complete fish silhouette: tail, dorsal and pectoral fins, gills and face. */
export function drawSharkForm(ctx:C,x:number,y:number,t:number,scale=1.2,facing=1,tongue=0,target?:Point,tailPower=0){
  ctx.save();ctx.translate(x,y);ctx.scale(scale*facing,scale);
  const swim=Math.sin(t*.15)*7,tail=swim+Math.sin(t*.52)*tailPower*23;
  path(ctx,[[-140,-5],[-199,-18+tail],[-273,-97+tail*.4],[-254,-13+tail],[-273,82+tail*.4],[-199,20+tail],[-140,13]],'#5d7f91');
  line(ctx,[[-244,-69+tail*.5],[-224,tail],[-244,56+tail*.5]],'#b0cbd3',2);
  path(ctx,[[-76,-34],[-57,-122],[-10,-58],[18,-37]],'#627f8f');
  path(ctx,[[-96,24],[-130,86],[-61,57],[-15,22]],'#567e92');
  const skin=ctx.createLinearGradient(0,-60,0,58);skin.addColorStop(0,'#aec5cc');skin.addColorStop(.48,'#7696a7');skin.addColorStop(1,'#d7e8e9');
  ctx.beginPath();ctx.moveTo(-176,0);ctx.bezierCurveTo(-130,-52,10,-70,76,-47);ctx.bezierCurveTo(112,-39,122,-14,111,17);ctx.bezierCurveTo(93,61,-73,66,-176,0);ctx.fillStyle=skin;ctx.fill();ctx.strokeStyle='#163b50';ctx.lineWidth=2.8;ctx.stroke();
  ctx.beginPath();ctx.moveTo(-140,10);ctx.bezierCurveTo(-54,49,34,48,91,21);ctx.strokeStyle='#effafa';ctx.lineWidth=4;ctx.stroke();
  path(ctx,[[-22,17],[-45,85],[25,49],[51,17]],'#789eac');line(ctx,[[-23,29],[-33,65],[6,45]],'#c2dce0',2);
  for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(27-i*10,-17+i*2);ctx.quadraticCurveTo(17-i*10,0,25-i*10,21);ctx.strokeStyle='#355c70';ctx.lineWidth=2.5;ctx.stroke();}
  for(let i=0;i<13;i++){const xx=-130+i*13;line(ctx,[[xx,-20+(i%3)*7],[xx+7,-23+(i%3)*7]],'#668393',1);}
  ctx.save();ctx.translate(77,-16);ctx.rotate(Math.sin(t*.05)*.025);drawHead(ctx,'tubarao',40,{time:t,expr:'n',kiss:tongue>0.05});ctx.restore();
  if(tongue>0&&target){
    const end={x:(target.x-x)/(scale*facing),y:(target.y-y)/scale},mouth={x:119,y:7};
    const tip={x:mouth.x+(end.x-mouth.x)*tongue,y:mouth.y+(end.y-mouth.y)*tongue};
    ctx.beginPath();ctx.moveTo(mouth.x,mouth.y);ctx.bezierCurveTo(mouth.x+40,mouth.y+25,tip.x-25,tip.y+24,tip.x,tip.y);
    ctx.strokeStyle='#973d64';ctx.lineWidth=15;ctx.lineCap='round';ctx.stroke();ctx.strokeStyle='#f282aa';ctx.lineWidth=11;ctx.stroke();ctx.strokeStyle='#ffbbd1';ctx.lineWidth=2;ctx.stroke();
    ctx.beginPath();ctx.arc(tip.x,tip.y,5,0,Math.PI*2);ctx.fillStyle='#f8a1bf';ctx.fill();
  }
  ctx.restore();
}

export function drawSharkSuper(ctx:C,loser:CharId,t:number,dur:number,direction=1){
  const m=sharkUltMotion(t);ctx.save();
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#072c49');bg.addColorStop(.55,'#075b76');bg.addColorStop(1,'#031928');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(120+i*145,-10);ctx.lineTo(-230+i*145,H);ctx.lineTo(-190+i*145,H);ctx.lineTo(150+i*145,-10);ctx.fillStyle='#79dff411';ctx.fill();}
  for(let i=0;i<32;i++){
    const x=(i*173+Math.sin(t*.025+i)*18)%W,y=H-((t*.8+i*39)%H);
    ctx.beginPath();ctx.arc(x,y,2+i%5,0,Math.PI*2);ctx.strokeStyle='#bdf3ff66';ctx.lineWidth=1;ctx.stroke();
  }
  ctx.fillStyle='#0b3142';ctx.fillRect(0,FLOOR+8,W,H-FLOOR);
  for(let i=0;i<11;i++)line(ctx,[[i*100,FLOOR+16],[i*100+45,FLOOR+11],[i*100+80,FLOOR+17]],'#2e7682',2);
  ctx.save();if(direction<0){ctx.translate(W,0);ctx.scale(-1,1);}
  const flight=m.flight,air=t>=SHARK_ULT_TAIL_FRAME&&t<185;
  const victimX=565+flight*810,victimY=FLOOR-Math.sin(flight*Math.PI)*240;
  const victimPose=t<SHARK_ULT_TAIL_FRAME?'grabbed':air?'air':'down',victimScale=1.16;
  const victimAnimation=cinematicAnimation(ctx,loser,victimPose,t,true);
  ctx.save();ctx.translate(victimX,victimY);if(air)ctx.rotate(flight*Math.PI*2);drawFullBody(ctx,loser,0,0,victimScale,t,victimPose,true,victimAnimation);ctx.restore();
  const head=computeRig(loser,victimAnimation).p.head;
  const target={x:victimX-head.x*victimScale+6,y:victimY+head.y*victimScale+6};
  const morph=m.transform*(1-m.restore),formX=330+Math.sin(t*.06)*4,formY=268+Math.sin(t*.09)*5;
  if(morph<1){ctx.save();ctx.globalAlpha=1-morph;drawFullBody(ctx,'tubarao',300,FLOOR,1.25,t,t<30?'roar':'win',false,cinematicAnimation(ctx,'tubarao',t<30?'roar':'win',t,false));ctx.restore();}
  if(morph>0){
    ctx.save();ctx.globalAlpha=morph;
    const turn=t<116?1:t<138?Math.cos(m.windup*Math.PI):t<165?-1:Math.cos(Math.PI*(1-clamp((t-165)/25)));
    const facing=Math.abs(turn)<.18?Math.sign(turn||1)*.18:turn;
    drawSharkForm(ctx,formX,formY,t,1.2,facing,m.tongue,target,t>=116&&t<156?1:0);ctx.restore();
  }
  if(t<30||t>=190){
    const amount=t<30?m.transform:1-m.restore;
    for(let i=0;i<18;i++){const a=i/18*Math.PI*2+t*.08;ctx.beginPath();ctx.arc(300+Math.cos(a)*(40+amount*105),330+Math.sin(a)*85,3+i%4,0,Math.PI*2);ctx.fillStyle='#b5f5ff99';ctx.fill();}
  }
  if(t>=52&&t<116)for(let i=0;i<6;i++)heart(ctx,450+i*20+Math.sin(t*.09+i)*25,250-((t*1.8+i*31)%145),9+i%3*5,.75);
  if(t>=116&&t<152){
    const strength=t<138?m.windup:1-clamp((t-138)/14);ctx.save();ctx.globalAlpha=strength*(settings.reducedFlash?.35:.8);
    ctx.beginPath();ctx.ellipse(500,288,160,123,-.3,-1.4,1.2);ctx.strokeStyle='#b5f3ff';ctx.lineWidth=13;ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();ctx.restore();
  }
  if(t>=138&&t<153){
    const impact=1-(t-138)/15;ctx.save();ctx.globalAlpha=impact;
    for(let i=0;i<18;i++){const a=i/18*Math.PI*2;line(ctx,[[565+Math.cos(a)*20,270+Math.sin(a)*20],[565+Math.cos(a)*(50+i%4*20),270+Math.sin(a)*(50+i%4*20)]],i%2?'#fff7d6':'#82f4ff',3+i%3);}
    text(ctx,'RABADA!',635,190,52,'#e8fcff');ctx.restore();
  }
  if(air){
    for(let i=0;i<12;i++)line(ctx,[[Math.max(570,victimX-180)-i*13,110+i*26],[victimX-35-i*11,110+i*26]],'#a8edff88',2);
    if(victimX>W-80){ctx.save();ctx.translate(W-72,250);drawHead(ctx,loser,24,{time:t,expr:'hit'});ctx.restore();text(ctx,'→',W-65,315,48,'#e0f2fe');}
  }
  ctx.restore();
  ctx.fillStyle='#031321dd';ctx.fillRect(0,0,W,93);text(ctx,'TUBARÃO FISCAL',W/2,30,15,'#9eeaff');text(ctx,'QUANDO TERÁ LIVE?',W/2,73,37,'#e2faff');
  const caption=t<30?'MODO TUBARÃO!':t<52?'SÓ UMA VISITINHA...':t<116?'SÓ MAIS UMA LAMBIDINHA!':t<138?'PREPARA A RABADA...':t<190?'FOI COBRAR A LIVE BEM LONGE!':'QUANDO TERÁ LIVE?!';
  ctx.fillStyle='#061626dd';ctx.fillRect(0,H-63,W,63);text(ctx,caption,W/2,H-25,22,t<116?'#ffc2da':'#a7f4ff');
  ctx.fillStyle='#a5f3fc';ctx.fillRect(38,H-9,(W-76)*clamp(t/dur),3);ctx.restore();
}
