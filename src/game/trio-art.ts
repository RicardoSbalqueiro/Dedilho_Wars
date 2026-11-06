// Jane, Cristyan e Doutor Enéas: somente desenho. Dano e duração pertencem ao motor.
import type { CharId } from './data';
import { drawFullBody, drawPortrait } from './rig';
import { settings } from './visual-settings';
import { cinematicAnimation } from './animation';

export type TrioId = 'jane' | 'cristyan' | 'eneas';
type P = { x: number; y: number };
const W=960,H=540,FLOOR=452;
const FONT="'Russo One',Impact,sans-serif";
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>1-(1-clamp(v))**3;
const phase=(t:number,dur:number)=>clamp(t/Math.max(1,dur));
const seed=(n:number)=>{const v=Math.sin(n*91.73+63.9)*43758.5453;return v-Math.floor(v)};
const C={jane:'#ffe36b',cristyan:'#fdba74',eneas:'#bef264'};

function poly(ctx:CanvasRenderingContext2D,pts:P[],fill:string,stroke='#211a28',width=2){
 ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(width){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineJoin='round';ctx.stroke()}
}
function line(ctx:CanvasRenderingContext2D,pts:P[],color:string,width=3){
 ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();
}
function ellipse(ctx:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,fill:string,stroke?:string,width=2,rotation=0){
 ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rotation,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}
}
function ring(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string,width=3,oval=1){ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,r),Math.max(.1,r*oval),0,0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function text(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,size:number,color='#fff',maxWidth=860){
 ctx.save();ctx.font=`italic 900 ${size}px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.strokeStyle='#130d1c';ctx.lineWidth=Math.max(3,size*.11);ctx.strokeText(value,x,y,maxWidth);ctx.fillStyle=color;ctx.fillText(value,x,y,maxWidth);ctx.restore();
}
function glow(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string,alpha=1){
 ctx.save();ctx.globalAlpha*=clamp(alpha)*(settings.reducedFlash?.35:1);const g=ctx.createRadialGradient(x,y,1,x,y,Math.max(2,r));g.addColorStop(0,settings.reducedFlash?color:'#fff');g.addColorStop(.17,color);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();
}
function burst(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string,rot=0){
 const pts:P[]=[];for(let i=0;i<24;i++){const a=i*Math.PI/12+rot,d=r*(i%2?.38:1);pts.push({x:x+Math.cos(a)*d,y:y+Math.sin(a)*d})}poly(ctx,pts,color,'#fff9d2',2);
}
function actor(ctx:CanvasRenderingContext2D,ch:CharId,x:number,y:number,t:number,pose='idle',scale=1.5,flip=false,alpha=1){ctx.save();ctx.globalAlpha*=clamp(alpha);drawFullBody(ctx,ch,x,y,scale,t,pose,flip,cinematicAnimation(ctx,ch,pose,t,flip));ctx.restore()}
function background(ctx:CanvasRenderingContext2D,ch:TrioId,t:number){
 const color=ch==='jane'?'#5d4c1c':ch==='cristyan'?'#6a351f':'#234a2e';
 const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#0c1022');g.addColorStop(.55,color);g.addColorStop(1,'#0c0d18');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 for(let i=0;i<16;i++){const y=100+seed(i)*365,x=(seed(i+29)*1100+t*(.4+i%3*.4))%1100-80;ctx.strokeStyle=C[ch]+'18';ctx.lineWidth=1+i%2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+90,y-45);ctx.stroke()}
 ctx.fillStyle='#0005';ctx.fillRect(0,428,W,60);ring(ctx,490,449,400,C[ch]+'30',2,.12);
}
function frame(ctx:CanvasRenderingContext2D,title:string,subtitle:string,color:string){
 ctx.fillStyle='#090b16ef';ctx.fillRect(0,0,W,81);ctx.fillRect(0,477,W,63);line(ctx,[{x:8,y:83},{x:952,y:83}],color,2);line(ctx,[{x:8,y:475},{x:952,y:475}],color,2);
 text(ctx,title,480,42,title.length>28?26:31,color,872);text(ctx,subtitle,480,507,19,'#fff1d6',885);
}
function confetti(ctx:CanvasRenderingContext2D,t:number,colors:string[],amount=34){
 for(let i=0;i<amount;i++){const x=seed(i+19)*W+Math.sin(t*.03+i)*16,y=((seed(i+70)*430+t*(1+seed(i)*2))%450)+55;ctx.save();ctx.translate(x,y);ctx.rotate(t*.07+i);ctx.fillStyle=colors[i%colors.length];ctx.fillRect(-2,-5,4,10);ctx.restore()}
}

/** Projéteis em origem local; o tamanho e a velocidade reais são definidos pelo motor. */
export function drawTrioProjectile(ctx:CanvasRenderingContext2D,kind:'java'|'ecg'|'five'|'six',time:number):void{
 ctx.save();
 if(kind==='java'){
  const labels=['new Java();','System.out','class Ataque'];ctx.rotate(Math.sin(time*.1)*.045);glow(ctx,0,0,62,'#facc15',.25);
  poly(ctx,[{x:-48,y:-18},{x:43,y:-18},{x:50,y:18},{x:-43,y:18}],'#2d291ee8','#facc15',2);
  ctx.fillStyle='#ffdf6a';ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(labels[Math.floor(time/12)%3],0,0,88);
  line(ctx,[{x:-53,y:25},{x:-21,y:25}], '#fff0a6',2);line(ctx,[{x:-66,y:-4},{x:-53,y:-4}], '#fde047',2);
 }else if(kind==='ecg'){
  glow(ctx,0,0,65,'#a3e635',.4);const pts:P[]=[{x:-46,y:0},{x:-26,y:0},{x:-18,y:-9},{x:-11,y:9},{x:-4,y:-24},{x:4,y:24},{x:12,y:-5},{x:20,y:0},{x:45,y:0}];
  line(ctx,pts,'#4d7c0f88',10);line(ctx,pts,'#b8ff66',4);line(ctx,pts,'#fff',1.4);
 }else{
  const six=kind==='six';glow(ctx,0,0,53,six?'#fde047':'#bef264',.45);ctx.rotate(Math.sin(time*.09)*.08);
  text(ctx,six?'6':'5',3,1,62,six?'#ffe16a':'#c6f77c',60);ctx.globalAlpha=.7;ring(ctx,0,0,33+(time%12)*.25,'#fef9c340',1.5);
 }
 ctx.restore();
}

/** Moto em origem local nos pés de Jane; charge é normalizado entre 0 e 1. */
export function drawJaneBike(ctx:CanvasRenderingContext2D,t:number,charge:number):void{
 const q=clamp(charge),tilt=-.11-q*.43;ctx.save();
 if(q>.15){ctx.save();ctx.globalAlpha=.22+q*.2;ctx.translate(-46,-22);ctx.rotate(tilt);ring(ctx,120,0,28+q*9,'#ffe36b',2);ring(ctx,120,0,37+q*16,'#ffe36b',1);ctx.restore()}
 ctx.translate(-48,-22);ctx.rotate(tilt);
 const spin=t*(.1+q*.48);
 for(const x of [0,120]){
  ellipse(ctx,x,0,22,22,'#12131e','#0b0b13',3);ellipse(ctx,x,0,14,14,'#59616b','#b3bfca',2);
  for(let i=0;i<7;i++){const a=spin+i*Math.PI*2/7;line(ctx,[{x,y:0},{x:x+Math.cos(a)*13,y:Math.sin(a)*13}],'#d1dae2',1.8)}
  ellipse(ctx,x,0,4,4,'#facc15','#19131c',1);
 }
 line(ctx,[{x:0,y:0},{x:31,y:-38},{x:70,y:-35},{x:39,y:0},{x:0,y:0}],'#363342',8);
 line(ctx,[{x:0,y:0},{x:31,y:-38},{x:70,y:-35},{x:39,y:0},{x:0,y:0}],'#f6c73c',4);
 line(ctx,[{x:70,y:-35},{x:120,y:0}],'#b4c3d2',8);line(ctx,[{x:70,y:-35},{x:120,y:0}],'#f0f4fa',3);
 poly(ctx,[{x:24,y:-43},{x:64,y:-48},{x:89,y:-36},{x:67,y:-22},{x:26,y:-27}],'#f4cf3e','#302337',2);
 poly(ctx,[{x:-11,y:-28},{x:14,y:-46},{x:31,y:-41},{x:18,y:-27}],'#f4f1ed','#302337',2);
 line(ctx,[{x:17,y:-46},{x:54,y:-48}],'#211f2b',9);
 poly(ctx,[{x:31,y:-24},{x:63,y:-26},{x:64,y:-7},{x:38,y:-7}],'#3e4250','#14131d',2);
 for(let i=0;i<4;i++)line(ctx,[{x:35,y:-21+i*4},{x:60,y:-21+i*4}],'#9caab7',1.3);
 line(ctx,[{x:67,y:-37},{x:62,y:-68},{x:75,y:-74}],'#bec9d3',5);line(ctx,[{x:69,y:-75},{x:86,y:-74}],'#211c2a',5);
 poly(ctx,[{x:71,y:-61},{x:89,y:-60},{x:94,y:-45},{x:76,y:-43}],'#fef3c7','#302337',2);
 ellipse(ctx,87,-53,5,6,'#fff9bf');
 ctx.restore();
 if(q>.35){ctx.save();ctx.globalAlpha=.2+q*.2;for(let i=0;i<3;i++)ring(ctx,10,-25,75+i*11,'#ffe87c',1.5,.45);ctx.restore()}
}

function hourglass(ctx:CanvasRenderingContext2D,x:number,y:number,size:number){
 ctx.save();ctx.translate(x,y);ctx.scale(size,size);line(ctx,[{x:-15,y:-22},{x:15,y:-22}], '#fff1a5',5);line(ctx,[{x:-15,y:22},{x:15,y:22}],'#fff1a5',5);
 poly(ctx,[{x:-11,y:-18},{x:11,y:-18},{x:3,y:0},{x:11,y:18},{x:-11,y:18},{x:-3,y:0}],'#fffbd1','#bca03a',2);poly(ctx,[{x:-8,y:-13},{x:8,y:-13},{x:0,y:-2}],'#f3ca35','',0);poly(ctx,[{x:-8,y:15},{x:8,y:15},{x:0,y:5}],'#f3ca35','',0);ctx.restore();
}
function robot(ctx:CanvasRenderingContext2D,x:number,y:number,scale:number,t:number,fire:number){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 // Pernas em placas, ombreiras e cabeça: silhueta reconhecível em tela pequena.
 poly(ctx,[{x:-56,y:-128},{x:-16,y:-119},{x:-25,y:-25},{x:-75,y:-17}],'#f1f3f8','#242b3b',4);
 poly(ctx,[{x:12,y:-119},{x:53,y:-129},{x:80,y:-20},{x:27,y:-20}],'#d9e0e8','#242b3b',4);
 poly(ctx,[{x:-75,y:-30},{x:-23,y:-32},{x:-18,y:0},{x:-94,y:0}],'#edbc2d','#242b3b',4);poly(ctx,[{x:26,y:-32},{x:80,y:-30},{x:99,y:0},{x:22,y:0}],'#f4d15b','#242b3b',4);
 poly(ctx,[{x:-77,y:-220},{x:65,y:-220},{x:51,y:-116},{x:0,y:-95},{x:-59,y:-124}],'#e8edf3','#242b3b',4);
 poly(ctx,[{x:-53,y:-211},{x:45,y:-211},{x:32,y:-151},{x:0,y:-133},{x:-38,y:-153}],'#eebf2b','#655025',3);
 poly(ctx,[{x:-50,y:-219},{x:-19,y:-241},{x:17,y:-241},{x:49,y:-220},{x:0,y:-198}],'#faf9ef','#242b3b',3);
 poly(ctx,[{x:-92,y:-230},{x:-56,y:-228},{x:-61,y:-186},{x:-105,y:-180},{x:-127,y:-209}],'#ffdf6b','#242b3b',4);
 poly(ctx,[{x:60,y:-228},{x:94,y:-232},{x:123,y:-205},{x:101,y:-180},{x:58,y:-189}],'#f4f5f2','#242b3b',4);
 poly(ctx,[{x:-109,y:-182},{x:-75,y:-175},{x:-86,y:-116},{x:-117,y:-124}],'#e3e8f1','#242b3b',4);
 poly(ctx,[{x:-119,y:-127},{x:-86,y:-119},{x:-84,y:-87},{x:-122,y:-88}],'#e8be3f','#242b3b',4);
 // Braço de disparo aponta para o adversário.
 poly(ctx,[{x:80,y:-188},{x:106,y:-173},{x:139,y:-179},{x:140,y:-145},{x:97,y:-134},{x:62,y:-158}],'#dfebef','#242b3b',4);
 poly(ctx,[{x:126,y:-181},{x:160,y:-179},{x:169,y:-150},{x:133,y:-143}],'#f2c83a','#242b3b',4);ellipse(ctx,164,-163,13,20,'#253549','#a7bbc9',3);ellipse(ctx,168,-163,7,12,'#85efff');
 // Casco com crista original de ampulheta.
 poly(ctx,[{x:-32,y:-282},{x:28,y:-282},{x:35,y:-244},{x:0,y:-227},{x:-35,y:-244}],'#f3f6fc','#242b3b',3);
 poly(ctx,[{x:-33,y:-282},{x:-46,y:-304},{x:-13,y:-285},{x:0,y:-302},{x:12,y:-284},{x:45,y:-303},{x:30,y:-278}],'#f5c435','#242b3b',3);
 poly(ctx,[{x:-27,y:-267},{x:27,y:-267},{x:18,y:-252},{x:-16,y:-252}],'#28354a','#242b3b',2);line(ctx,[{x:-22,y:-262},{x:-6,y:-260}], '#8bf4ff',4);line(ctx,[{x:5,y:-260},{x:22,y:-262}],'#8bf4ff',4);
 hourglass(ctx,-2,-177,1.03);line(ctx,[{x:-48,y:-144},{x:-38,y:-150}], '#fffdf1',3);line(ctx,[{x:31,y:-148},{x:46,y:-142}], '#fffdf1',3);
 if(fire>0){glow(ctx,173,-163,38+fire*38,'#fff07c',fire);ring(ctx,177,-163,20+Math.sin(t*.3)*5,'#fff4b2',3,1.5)}ctx.restore();
}
function laser(ctx:CanvasRenderingContext2D,x:number,y:number,to:number,strength:number,t:number){
 if(strength<=0)return;ctx.save();ctx.globalAlpha*=clamp(strength);const wide=12+strength*26;
 poly(ctx,[{x,y:y-wide},{x:to,y:y-wide*.65},{x:to+18,y},{x:to,y:y+wide*.65},{x,y:y+wide}],'#facc154f','#fff2a250',9);
 poly(ctx,[{x,y:y-wide*.55},{x:to,y:y-wide*.35},{x:to+10,y},{x:to,y:y+wide*.35},{x,y:y+wide*.55}],'#fff5a8','',0);
 line(ctx,[{x,y},{x:to,y}],'#fff',9);for(let i=0;i<4;i++){const p=((t*.045+i*.25)%1),xx=x+(to-x)*p;ring(ctx,xx,y,wide*(.9+p*.3),'#fff9b0',2,1.8)}ctx.restore();
}
function janeScene(ctx:CanvasRenderingContext2D,loser:CharId,t:number,u:number,finisher:boolean){
 background(ctx,'jane',t);
 for(let i=0;i<8;i++){const x=100+i*110,y=115+Math.sin(t*.03+i)*17;ctx.save();ctx.globalAlpha=.17;text(ctx,['<>','{}','JAVA'][i%3],x,y,25,'#fff39b',100);ctx.restore()}
 const appear=ease((u-.12)/.2),fire=u>.47&&u<.83?Math.sin(clamp((u-.47)/.36)*Math.PI):0,hit=ease((u-.63)/.2);
 if(u<.21){actor(ctx,'jane',272,FLOOR,t,finisher?'laptop_a':'zord_s',1.65);actor(ctx,loser,745,FLOOR,t,'idle',1.42,true);hourglass(ctx,390,250,.6+u*3);if(finisher){ctx.save();ctx.translate(330+u*280,305-u*100);drawTrioProjectile(ctx,'java',t);ctx.restore()}text(ctx,finisher?'RODANDO O ÚLTIMO DEPLOY…':'CHAMANDO O AREIAZORD…',480,143,24,'#fff4b2',800)}
 else{
  const ry=FLOOR+(1-appear)*300;robot(ctx,270,ry,1.13,t,fire);actor(ctx,'jane',139,FLOOR,t,u>.83?'win':'zord_a',1.5);
  actor(ctx,loser,747+hit*60,FLOOR-Math.sin(hit*Math.PI)*90,t,hit>.97?'down':u>.5?'hit':'block',1.42,true);
  if(appear<1){ring(ctx,273,FLOOR-2,70+appear*90,'#ffe36b',3,.18);glow(ctx,270,300,120,'#ffe36b',(1-appear)*.5)}
  if(fire>0){laser(ctx,462,268,746,fire,t);burst(ctx,748,268,40+fire*72,'#ffe98590',t*.04)}
  if(u>.86){hourglass(ctx,505,330,1.5);text(ctx,finisher?'BUILD PASSOU. ROUND TAMBÉM.':'JAVA COMPILOU. O LASER TAMBÉM.',615,151,24,'#fff5a5',610);confetti(ctx,t,['#ffe36b','#fff5dd','#b8e7f0'],28)}
 }
 frame(ctx,finisher?'DEPLOY DO AREIAZORD':'AREIAZORD',u<.25?'Pequena no tamanho. Gigante no projeto.':u<.78?'Robô online. Energia de areia no máximo!':finisher?'Deploy concluído. Última linha: vitória.':'O prazo foi entregue em forma de laser.',C.jane);
}

function hammock(ctx:CanvasRenderingContext2D,cx:number,y:number,t:number,broken=0){
 const left=cx-147,right=cx+147,sway=Math.sin(t*.06)*5*(1-broken);
 for(const x of [left,right]){line(ctx,[{x,y:y-144},{x,y:y+25}], '#573526',9);line(ctx,[{x:x-3,y:y-142},{x:x-3,y:y+23}],'#b38450',3);ellipse(ctx,x,y-147,7,7,'#dbc58e','#4e322a',2)}
 if(broken>.1){
  for(const side of [-1,1]){const x=cx+side*125;ctx.save();ctx.translate(x,y-35+broken*45);ctx.rotate(side*broken*1.2);poly(ctx,[{x:-52,y:-14},{x:45,y:-28},{x:22,y:27},{x:-20,y:33}],'#c79a5d','#5e342b',2);ctx.restore()}
  for(let i=0;i<8;i++){const xx=cx+(i-3.5)*25;line(ctx,[{x:xx,y:y-48},{x:xx+(i%2?1:-1)*broken*22,y:y+broken*45}], '#f1cf8b',2)}return;
 }
 ctx.save();ctx.translate(sway,0);ctx.beginPath();ctx.moveTo(left,y-135);ctx.quadraticCurveTo(cx,y+9,right,y-135);ctx.quadraticCurveTo(cx,y+95,left,y-135);ctx.fillStyle='#c78a45';ctx.fill();ctx.strokeStyle='#f5d896';ctx.lineWidth=3;ctx.stroke();
 for(let i=1;i<12;i++){const v=i/12,x=left+(right-left)*v,top=y-135+Math.sin(v*Math.PI)*70,bottom=y-135+Math.sin(v*Math.PI)*135;line(ctx,[{x,y:top},{x:x+30*(v-.5),y:bottom}],'#e9bd71',1.5)}
 for(let i=0;i<6;i++){const d=i*13;ctx.beginPath();ctx.moveTo(left+7,y-128+d*.18);ctx.quadraticCurveTo(cx,y-35+d,right-7,y-128+d*.18);ctx.strokeStyle='#70412d';ctx.lineWidth=1.3;ctx.stroke()}ctx.restore();
}
function restingActor(ctx:CanvasRenderingContext2D,ch:CharId,cx:number,y:number,t:number){
 ctx.save();ctx.translate(cx-6,y-15);ctx.rotate(-1.28);actor(ctx,ch,0,85,t,'grabbed',1.12,true);ctx.restore();
}
function cristyanScene(ctx:CanvasRenderingContext2D,loser:CharId,t:number,u:number,finisher:boolean){
 background(ctx,'cristyan',t);
 // Casario e mar baiano ao fundo, sem competir com a ação.
 ctx.fillStyle='#bc78411a';for(let i=0;i<10;i++){const x=i*110,y=260-(i%3)*21;ctx.fillRect(x,y,80,170);poly(ctx,[{x:x-8,y},{x:x+40,y:y-30},{x:x+88,y}],'#e7b36d20','',0)}
 const catchP=ease((u-.12)/.16),jump=ease((u-.51)/.19),slam=ease((u-.7)/.13),broken=u>.76?ease((u-.76)/.13):0;
 hammock(ctx,720,432,t,broken);
 if(u<.22){actor(ctx,'cristyan',275+catchP*80,FLOOR,t,u<.12?'hammock_s':'hammock_a',1.51);actor(ctx,loser,725,FLOOR,t,'grabbed',1.4,true);text(ctx,finisher?'ÚLTIMO DESCANSO DO ROUND':'DEITA SÓ UM MINUTINHO…',620,135,26,'#ffe8ae',610)}
 else if(u<.53){actor(ctx,'cristyan',305,FLOOR,t,'hammock_a',1.5);restingActor(ctx,loser,713,363,t);const drift=(t%40)/40;for(let i=0;i<3;i++)text(ctx,'Z',747+i*24,263-i*30-drift*18,20+i*5,'#d9eaff',70);if(finisher)text(ctx,'MODO SONECA',710,161,24,'#ffe9b6',360)}
 else{
  const ax=305+jump*407,ay=FLOOR-Math.sin(jump*Math.PI*.65)*150+slam*85;
  if(u<.78)restingActor(ctx,loser,713,363,t);else actor(ctx,loser,770+broken*26,FLOOR,t,'down',1.38,true);
  if(u<.84)actor(ctx,'cristyan',ax,Math.min(FLOOR,ay),t,u<.68?'jump':'slam_a',1.12);else actor(ctx,'cristyan',460,FLOOR,t,'win',1.5);
  if(u>.7&&u<.89){const impact=Math.sin(clamp((u-.7)/.19)*Math.PI);burst(ctx,719,396,45+impact*100,'#ffd28b99',t*.02);glow(ctx,719,400,150,'#ffc366',impact*.7);for(let i=0;i<4;i++)ring(ctx,720,446,40+(u-.7)*500+i*21,'#ffc67580',2,.17)}
  if(u>.86){text(ctx,finisher?'ACABOU A HORA DA SONECA!':'A REDE NÃO AGUENTOU!',665,158,29,'#fff0c4',530);confetti(ctx,t,['#ffc46a','#fff0c7','#ce5f2d'],24)}
 }
 frame(ctx,finisher?'SENTENÇA DA REDE':'REDE BAIANA',u<.22?'Um convite tranquilo para descansar.':u<.53?'Silêncio na arena. O rival pegou no sono.':u<.85?'Cristyan acordou o round com um salto!':finisher?'Rede desmontada. Vitória confirmada.':'O descanso terminou em impacto.',C.cristyan);
}

function button(ctx:CanvasRenderingContext2D,x:number,y:number,pressed:boolean){
 poly(ctx,[{x:x-36,y:y+9},{x:x+30,y:y+9},{x:x+42,y:y+23},{x:x-43,y:y+23}],'#404857','#151b2a',3);ellipse(ctx,x,y+7,25,10,'#8f1624','#29111b',2);ellipse(ctx,x,y+(pressed?4:-2),22,9,pressed?'#f97461':'#ef3443','#68202b',2);glow(ctx,x,y-4,35,'#ff6b51',pressed?.45:.15);
}
function missile(ctx:CanvasRenderingContext2D,x:number,y:number,scale:number){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 poly(ctx,[{x:-19,y:-52},{x:19,y:-52},{x:22,y:49},{x:-22,y:49}],'#f7f2dc','#1e382f',3);poly(ctx,[{x:-19,y:-52},{x:0,y:-89},{x:19,y:-52}],'#e3b43d','#1e382f',3);
 poly(ctx,[{x:-21,y:19},{x:-40,y:57},{x:-20,y:48}],'#6fa84a','#1e382f',3);poly(ctx,[{x:21,y:19},{x:40,y:57},{x:20,y:48}],'#99c95d','#1e382f',3);
 text(ctx,'56',0,-10,36,'#2d7538',40);line(ctx,[{x:-15,y:25},{x:15,y:25}],'#efc645',4);poly(ctx,[{x:-14,y:50},{x:0,y:82},{x:14,y:50}],'#fdce55','',0);ctx.restore();
}
function mushroom(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,t:number){
 ctx.save();ctx.translate(x,y);ctx.scale(size,size);
 const puff=(px:number,py:number,r:number,c:string)=>ellipse(ctx,px,py,r,r*.74,c,'#244e2c',2);
 poly(ctx,[{x:-35,y:0},{x:-25,y:-115},{x:22,y:-128},{x:41,y:0}],'#edcf4a','#315e33',3);
 for(let i=0;i<5;i++)puff(-26+i*12,-50-i*17,25,i%2?'#b4d855':'#edda69');
 for(let i=0;i<7;i++){const a=Math.PI+i*Math.PI/6;const xx=Math.cos(a)*91,yy=-152+Math.sin(a)*42;puff(xx,yy,47+(i%2)*5,i%2?'#e9d95d':'#b4d358')}
 for(let i=0;i<8;i++)puff((i-3.5)*37,-4+Math.sin(t*.15+i)*4,30+(i%3)*4,i%2?'#d0db67':'#f0d25d');
 ctx.restore();
}
function eneasScene(ctx:CanvasRenderingContext2D,loser:CharId,t:number,u:number,finisher:boolean){
 background(ctx,'eneas',t);
 for(let i=0;i<10;i++){ctx.save();ctx.globalAlpha=.09;text(ctx,i%2?'56':'CIÊNCIA',70+i*94,133+Math.sin(t*.03+i)*20,i%2?35:16,'#e6f7b2',100);ctx.restore()}
 const press=u>.25,drop=ease((u-.37)/.2),boom=ease((u-.55)/.16),clear=ease((u-.78)/.13);
 actor(ctx,'eneas',268,FLOOR,t,u<.15?'atom_s':u<.37?'atom_a':u>.84?'shout_a':'ecg_a',1.47);
 poly(ctx,[{x:363,y:319},{x:401,y:319},{x:410,y:430},{x:353,y:430}],'#303943','#151d28',3);line(ctx,[{x:370,y:333},{x:373,y:416}],'#788381',2);button(ctx,383,304,press);
 if(u<.56)actor(ctx,loser,737,FLOOR,t,u<.3?'idle':'block',1.42,true);
 if(u<.36){
  const speech=['CIÊNCIA!','BRASIL!','NÚMEROS!','MEU NOME É…'][Math.floor(t/7)%4];text(ctx,speech,624,160,32,'#e6f7a3',525);
  if(u<.17){ctx.save();ctx.globalAlpha=.18;drawPortrait(ctx,'eneas',512,258,87,{time:t,poseName:'atom_s'});ctx.restore()}
 }
 if(u>.35&&u<.61){missile(ctx,727,-72+drop*461,.96);for(let i=0;i<4;i++)line(ctx,[{x:702+i*16,y:-15+drop*370},{x:702+i*16,y:-90+drop*370}],'#e6f7b780',2)}
 if(u>.55){
  const alpha=1-clear*.88;ctx.save();ctx.globalAlpha=alpha;mushroom(ctx,723,450,.2+boom*1.28,t);glow(ctx,722,317,130+boom*90,'#d8ee79',(1-boom)*.8);if(boom<.9)burst(ctx,722,378,65+boom*140,'#fff3b4aa',t*.02);ctx.restore();
  if(u>.79)actor(ctx,loser,804,FLOOR,t,'down',1.32,true);
  if(u>.83){
   confetti(ctx,t,['#f4d75a','#a0cf66','#f0f6d7'],40);const close=ease((u-.83)/.1);ctx.save();ctx.globalAlpha=close;ctx.fillStyle='#102819dd';ctx.fillRect(354,185,182,224);ctx.strokeStyle='#d5ed8b';ctx.lineWidth=2;ctx.strokeRect(354,185,182,224);drawPortrait(ctx,'eneas',443,250,45+close*15,{time:t,expr:'shout',poseName:'shout_a'});text(ctx,'AO VIVO',444,395,11,'#e2f5a5',150);ctx.restore();text(ctx,'MEU NOME É ENÉAS!',603,154,35,'#e8f69c',644);
  }
 }
 if(finisher&&u>.9){text(ctx,'56',649,313,88,'#ffe371',150);text(ctx,'NO PLACAR!',660,390,27,'#e3f8bc',340)}
 frame(ctx,finisher?'56 NO PLACAR':'BOMBA ATÔMICA BRASILEIRA',u<.36?'Óculos ajustados. Discurso em velocidade máxima.':u<.61?'Uma entrega cartunesca marcada com o número 56.':u<.85?'Ciência absurda. Explosão verde e amarela.':finisher?'A última palavra foi dele. E tinha 56 letras.':'A fumaça baixou. O bordão ficou.',C.eneas);
}

/** Sequências completas, opacas, em coordenadas 960×540. */
export function drawTrioSuper(ctx:CanvasRenderingContext2D,ch:TrioId,loser:CharId,t:number,dur:number):void{
 ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();const u=phase(t,dur);
 if(ch==='jane')janeScene(ctx,loser,t,u,false);else if(ch==='cristyan')cristyanScene(ctx,loser,t,u,false);else eneasScene(ctx,loser,t,u,false);ctx.restore();
}

/** Finishers cosméticos com encerramentos próprios; nenhuma entidade é alterada. */
export function drawTrioFinisher(ctx:CanvasRenderingContext2D,ch:TrioId,loser:CharId,t:number,dur:number):void{
 ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();const u=phase(t,dur);
 if(ch==='jane')janeScene(ctx,loser,t,u,true);else if(ch==='cristyan')cristyanScene(ctx,loser,t,u,true);else eneasScene(ctx,loser,t,u,true);
 for(const x of [14,934])for(let i=0;i<10;i++){ctx.fillStyle=C[ch]+'65';ctx.fillRect(x,99+((i*36+t*.4)%354),12,9)}text(ctx,'FINALIZAÇÃO',480,13,10,'#fff4ce',180);ctx.restore();
}

/** Efeitos locais de contato, sem criar uma hitbox implícita. */
export function drawTrioMoveFx(ctx:CanvasRenderingContext2D,ch:TrioId,move:string,t:number):void{
 ctx.save();
 if(ch==='eneas'&&move==='s1')for(let i=0;i<3;i++){const p=((t*.045+i*.26)%1);ctx.save();ctx.globalAlpha=(1-p)*.55;ring(ctx,35+p*165,-108,20+p*37,'#e5f59c',3,.85);ctx.restore()}
 if(ch==='eneas'&&move==='s2'&&t>8)text(ctx,'CASO GRAVE!',68,-166,15,'#e5f59c',210);
 if(ch==='cristyan'&&move==='s3'){ctx.save();ctx.globalAlpha=.42;ctx.strokeStyle='#ffd19a';ctx.lineWidth=7;ctx.beginPath();ctx.arc(12,-91,91,-Math.PI*.9+t*.07,Math.PI*.2+t*.07);ctx.stroke();ctx.restore()}
 if(ch==='jane'&&move==='s3'){ctx.save();ctx.globalAlpha=.35;line(ctx,[{x:-60,y:-14},{x:20,y:-14}],'#fff0a4',6);line(ctx,[{x:-45,y:-29},{x:7,y:-29}],'#facc15',3);ctx.restore()}
 ctx.restore();
}

/** Moto tombada após exceder o limite do grau; origem local nos pés de Jane. */
export function drawJaneBikeFall(ctx:CanvasRenderingContext2D,elapsed:number,duration=60):void{
 const u=phase(elapsed,duration),fall=ease(elapsed/15);ctx.save();ctx.globalAlpha*=Math.min(1,(1-u)*5);
 ctx.save();ctx.translate(8,-4-Math.sin(fall*Math.PI)*12);ctx.rotate(fall*.12);ctx.scale(1,1-fall*.64);drawJaneBike(ctx,elapsed,.12);ctx.restore();
 if(elapsed<24)for(let i=0;i<6;i++){const age=clamp(elapsed/24),x=-55+i*28;ctx.save();ctx.globalAlpha*=(1-age)*.45;ellipse(ctx,x+Math.sin(i)*age*18,-6-age*(5+i%3*4),9+age*13,4+age*5,'#e5c68f');ctx.restore()}
 if(elapsed<15){ctx.save();ctx.globalAlpha*=1-fall;burst(ctx,40,-25,18+fall*14,'#ffe68c90');ctx.restore()}ctx.restore();
}

/** Estrelas e espiral sobre a cabeça; o motor controla a vulnerabilidade real. */
export function drawJaneDizzy(ctx:CanvasRenderingContext2D,time:number):void{
 ctx.save();ctx.strokeStyle='#fff0a6';ctx.lineWidth=1.8;
 const spiral:P[]=[];for(let i=0;i<34;i++){const a=i*.31+time*.065,r=1+i*.23;spiral.push({x:Math.cos(a)*r,y:-108+Math.sin(a)*r*.6})}line(ctx,spiral,'#fff0a6',1.8);
 for(let i=0;i<3;i++){
  const a=time*.09+i*Math.PI*2/3,x=Math.cos(a)*24,y=-113+Math.sin(a)*8,pts:P[]=[];
  for(let n=0;n<10;n++){const ang=n*Math.PI/5-Math.PI/2,r=n%2?2.2:5.5;pts.push({x:x+Math.cos(ang)*r,y:y+Math.sin(ang)*r})}poly(ctx,pts,i%2?'#fff7ce':'#ffe166','#876d27',.8);
 }
 ctx.restore();
}
