import {settings} from './visual-settings';
import {drawFormEffects} from './form-effects';
// Timelines are sampled using simulation ticks, never a separate animation clock.
import {CHARS} from './data';
import type {CharId,Pose} from './data';
import {computeRig,drawRig,drawPortrait} from './rig';
import {mixAnimation} from './animation';
import {WOC_ULTIMATES} from './woc-choreography';
import {FORMS,RESOURCE_RULES,canTransform} from './resources';
import type {Fighter,Game,Projectile} from './engine';
const TAU=Math.PI*2,FONT="'Russo One',Impact,sans-serif";
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
function text(c:CanvasRenderingContext2D,s:string,x:number,y:number,size:number,color='#fff',align:CanvasTextAlign='center'){
 c.font=`900 italic ${size}px ${FONT}`;c.textAlign=align;c.lineJoin='round';c.strokeStyle='#080814';c.lineWidth=Math.max(2,size*.13);c.strokeText(s,x,y);c.fillStyle=color;c.fillText(s,x,y);
}
function path(c:CanvasRenderingContext2D,points:number[][],color:string,width=3,fill=false){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(fill)c.closePath();c.strokeStyle=color;c.lineWidth=width;if(fill){c.fillStyle=color;c.fill();}else c.stroke();}
function oval(c:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,color:string,fill=false){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);c.strokeStyle=color;c.lineWidth=3;if(fill){c.fillStyle=color;c.fill();}else c.stroke();}
function heart(c:CanvasRenderingContext2D,x:number,y:number,size:number,color:string){c.save();c.translate(x,y);c.scale(size/20,size/20);c.beginPath();c.moveTo(0,13);c.bezierCurveTo(-30,-7,-13,-27,0,-10);c.bezierCurveTo(13,-27,30,-7,0,13);c.fillStyle=color;c.fill();c.strokeStyle='#fff4fb';c.lineWidth=1.5;c.stroke();c.restore();}
function actor(c:CanvasRenderingContext2D,ch:CharId,x:number,y:number,scale:number,pose:Pose,time:number,flip=false,transformed=false){c.save();c.translate(x,y);c.scale(flip?-scale:scale,scale);drawRig(c,ch,computeRig(ch,pose),pose,{time,transformation:transformed,formTime:time,expr:pose.mouth>.5?'shout':'n'});c.restore();}
function ultimatePose(ch:CharId,t:number){
 const def=CHARS[ch],track=WOC_ULTIMATES[ch];let p={...def.poses.idle};
 if(!track)return p;
 for(const b of track.beats){const d=t-b.frame;if(d>=-10&&d<=15){const wind=def.poses[b.pose.replace(/_a$/,'_s')]??def.poses.idle;const strike=def.poses[b.pose]??def.poses.pH_a;p=d<0?mixAnimation(wind,strike,clamp((d+10)/10)**2):mixAnimation(strike,def.poses.idle,clamp(d/15));break;}}
 p.head+=Math.sin(t*.12)*1.3;return p;
}
function motif(c:CanvasRenderingContext2D,ch:CharId,t:number,color:string){
 if(ch==='hdsh'){
  for(let i=0;i<7;i++){path(c,[[300+i*60,130],[300+i*60,400]],color+'88',1);path(c,[[300,130+i*45],[660,130+i*45]],color+'88',1);}
  for(let i=0;i<8;i++)oval(c,330+(i*83)%310,150+(i*59)%230,14,14,i%2?'#f5eeff':'#10101c',true);
 }else if(ch==='ulisses')for(let i=0;i<7;i++)path(c,[[100,80+i*62],[860,80+i*62+Math.sin(t*.14+i)*80]],'#ff5577',3+i%2);
 else if(ch==='felipence')for(let y=140;y<410;y+=60){const pts=Array.from({length:65},(_,i)=>[90+i*12,y+Math.sin(i*.55-t*.2)*18*(1+Math.sin(t*.03))]);path(c,pts,color,3);}
 else if(ch==='gabrielzin')for(let i=0;i<15;i++)heart(c,80+(i*127)%800,95+(i*73+t*1.5)%310,8+i%5*3,color);
 else if(ch==='patrick')for(let i=0;i<8;i++){const x=110+i*110;path(c,[[x,160],[x+32,140],[x+60,166],[x+52,230],[x+8,230]],color+'66',2);}
 else for(let i=0;i<12;i++)path(c,[[480,270],[480+Math.cos(i/12*TAU+t*.002)*550,270+Math.sin(i/12*TAU+t*.002)*330]],color+'66',2);
}
export function drawWocUltimate(c:CanvasRenderingContext2D,ch:CharId,target:CharId,t:number,duration:number,transformed=false,finisher=false){
 const d=CHARS[ch],track=WOC_ULTIMATES[ch];c.save();c.fillStyle='#080915';c.fillRect(0,0,960,540);
 const bg=c.createLinearGradient(0,0,960,540);bg.addColorStop(0,d.color+'77');bg.addColorStop(.5,'#10111e');bg.addColorStop(1,d.color+'44');c.fillStyle=bg;c.fillRect(0,0,960,540);motif(c,ch,t,d.glow);
 const impact=track?.beats.reduce((v,b)=>Math.max(v,1-Math.abs(t-b.frame)/8),0)??0;
 if(impact>0){c.fillStyle=d.glow;c.globalAlpha=impact*(settings.reducedFlash?.025:.14);c.fillRect(0,0,960,540);c.globalAlpha=1;}
 if(t<27){
  const u=clamp(t/27);c.save();c.translate(240,220);c.scale(3.2+u*.4,3.2+u*.4);drawPortrait(c,ch,0,12,57,{time:t,transformation:transformed,expr:t>15?'shout':'n'});c.restore();
  actor(c,ch,680,465,1.85,CHARS[ch].poses.taunt,t,false,transformed);
 }else{
  const final=t>145,offset=final?clamp((t-145)/22)*120:0;
  if(ch==='bieu'||ch==='aneninha')for(let i=0;i<4;i++){c.globalAlpha=.45+i*.1;actor(c,ch,90+i*190+Math.sin(t*.08+i)*14,450,1.3,ultimatePose(ch,t+i*3),t+i*7,i%2===0);c.globalAlpha=1;}
  actor(c,target,650+offset,465,1.65,CHARS[target].poses[final?'down':'hit'],t,true);
  actor(c,ch,310+Math.sin(t*.08)*6,465,1.9,final?CHARS[ch].poses.win:ultimatePose(ch,t),t,false,transformed);
  if(impact>0){for(let i=0;i<8;i++){const a=i/8*TAU;path(c,[[620+Math.cos(a)*25,315+Math.sin(a)*25],[620+Math.cos(a)*(60+70*impact),315+Math.sin(a)*(60+70*impact)]],i%2?'#fff':d.glow,4);}}
  if(ch==='hdsh'){const k=clamp((t-30)/30);c.strokeStyle=d.glow;c.lineWidth=5;c.strokeRect(540,160,180*k,270);}
  if(ch==='patrick'&&t<145){c.save();c.translate(375,350);c.rotate(-.35);oval(c,0,0,85,60,'#db6c68');c.restore();}
  if(ch==='gabrielzin'&&t>80)heart(c,650,300,35+Math.sin(t*.1)*12,d.glow);
 }
 c.fillStyle='#070711';c.fillRect(0,0,960,45);c.fillRect(0,486,960,54);
 text(c,finisher?'FINISHER · WAR OF CHAMPIONS':'ULTIMATE · WAR OF CHAMPIONS',480,29,19,d.glow);
 text(c,finisher?'FINALIZAÇÃO':d.superName,480,521,30,d.glow);
 text(c,`${Math.min(duration,Math.floor(t))} / ${duration}`,935,477,9,'#c5becb','right');c.restore();
}
export function drawFormAura(c:CanvasRenderingContext2D,f:Fighter,time:number){
 drawFormEffects(c,f,time);
}
export function drawTransformCutin(c:CanvasRenderingContext2D,g:Game){
 for(const f of g.f){if(f.state!=='transform')continue;const t=f.stateT,u=clamp(t/72),left=f.idx===0;const x=left?0:685;c.save();
 c.fillStyle='#0c0d19ed';c.fillRect(x,135,275,265);c.strokeStyle=f.def.color;c.lineWidth=3;c.strokeRect(x+2,137,271,261);
 c.save();c.beginPath();c.rect(x+4,139,267,164);c.clip();drawPortrait(c,f.ch,x+125+Math.sin(u*4)*5,270,76,{time:g.tick,expr:t>36?'shout':'n',transformation:t>=36,glow:t/72});c.restore();
 text(c,FORMS[f.ch].name,x+138,324,18,f.def.glow);text(c,t<36?'PREPARAÇÃO VULNERÁVEL':'FORMA ATIVA',x+138,348,12,t<36?'#fda4af':'#86efac');
 c.fillStyle=f.def.color;c.fillRect(x+14,373,247*u,5);c.restore();}
}
export function drawResourcesHud(c:CanvasRenderingContext2D,g:Game){
 for(const f of g.f){const right=f.idx===1,x=right?554:76,w=330,align:CanvasTextAlign=right?'right':'left',tx=right?884:76;c.save();
 c.fillStyle='#111222';c.fillRect(x,73,w,5);c.fillStyle=f.exhaustT>0?'#f87171':'#67e8d5';c.fillRect(x,73,w*clamp(f.stamina/RESOURCE_RULES.staminaMax),5);
 text(c,`${Math.ceil(f.hp)} / ${f.maxHp} HP`,tx,39,10,'#fff',align);
 text(c,`${f.exhaustT>0?'EXAUSTO':'FÔLEGO'} ${Math.ceil(f.stamina)}`,right?884:76,78,8,f.exhaustT>0?'#fca5a5':'#a7f3d0',align);
 const x2=right?912:48;
 if(f.ch==='rickzera')text(c,`ENERGIA ${Math.floor(f.energy)}/100${f.charging?' · CARREGANDO':''}`,x2,126,11,'#86efac',align);
 if(f.ch==='ulisses')text(c,`SANGUE ${f.blood}/3`,x2,126,11,'#fb7185',align);
 if(f.ch==='jane')text(c,`BATERIA ${Math.ceil(f.battery)}%`,x2,126,11,'#fde047',align);
 if(f.formT>0){text(c,`${FORMS[f.ch].name} · ${(f.formT/60).toFixed(1)}s${f.ch==='nomad'?[' · FORÇA 2×',' · VELOCIDADE',' · TAMANHO'][f.formVariant]:''}`,x2,480,11,f.def.glow,align);text(c,'IMUNE · ROMPE DEFESA',x2,465,10,'#fff1b5',align);}
 else if(f.aftermathT>0&&['renngotti','tubarao'].includes(f.ch))text(c,`${f.ch==='renngotti'?'RECUPERAÇÃO BERSERKER':'CRESCENDO'} ${(f.aftermathT/60).toFixed(0)}s`,x2,480,10,'#fda4af',align);
 else if(canTransform(f))text(c,`FORMA PRONTA [${g.cfg.bindings[f.idx].transform[0].replace('Key','').replace('Numpad','NUM ')}]`,x2,480,11,'#a3ff8c',align);
 if(f.confusionT>0)text(c,'CONFUSÃO · DIREÇÕES INVERTIDAS',x2,f.formT>0?450:465,10,'#f0abfc',align);c.restore();}
}
export function drawWocProjectile(c:CanvasRenderingContext2D,p:Projectile,color:string){
 const t=p.age??0,k=p.kind;
 if(!['energy','energyFist','heart','wink','blood','sound','territory','trend','drop','roach','laser'].includes(k))return false;
 if(k==='drop'){
  c.save();c.strokeStyle=color;c.lineWidth=2;c.setLineDash([6,5]);c.strokeRect(p.x-38,424,76,42);c.setLineDash([]);text(c,t<30?`DROP ${Math.ceil((30-t)/6)}`:'!',p.x,414,12,color);c.restore();
 }
 c.save();c.translate(p.x,470+p.y);c.scale(p.launchFacing??1,1);
 if(k==='territory'){
  c.save();c.scale(1,.25);c.strokeStyle=color;c.lineWidth=2;c.strokeRect(-100,-100,200,200);for(let i=-2;i<=2;i++){path(c,[[i*40,-100],[i*40,100]],color,1);path(c,[[-100,i*40],[100,i*40]],color,1);}for(let i=0;i<5;i++)oval(c,-70+i*35,-35+(i%2)*60,10,10,i%2?'#fff':'#080813',true);c.restore();
 }else if(k==='heart'||k==='wink')heart(c,0,0,k==='wink'?14:20,color);
 else if(k==='energyFist'){
  c.fillStyle='#b9ff88';c.strokeStyle='#247f32';c.lineWidth=3;c.beginPath();c.roundRect(-22,-17,45,34,7);c.fill();c.stroke();for(let i=0;i<4;i++)path(c,[[i*8-12,-16],[i*8-12,0]],'#319845',1.6);path(c,[[-22,7],[-8,10],[-2,17]],'#319845',2);
 }else if(k==='energy'){oval(c,0,0,18+Math.sin(t*.4),16,'#a7ff78',true);oval(c,0,0,11,10,'#f4ffdc',true);}
 else if(k==='sound'){oval(c,0,0,15,35,color);text(c,'♫',-6,7,24,color);}
 else if(k==='blood')path(c,[[-30,15],[10,-18],[35,-12],[-8,8]],'#f25871',3,true);
 else if(k==='trend')path(c,[[-27,10],[-10,-10],[2,0],[20,-17],[13,-18],[29,-27],[29,-10],[24,-15],[3,9],[-9,-1],[-22,17]],color,2,true);
 else if(k==='drop'){c.fillStyle='#a88437';c.strokeStyle='#fef08a';c.lineWidth=3;c.fillRect(-27,-23,54,46);c.strokeRect(-27,-23,54,46);path(c,[[0,-23],[0,23]],'#fef08a',4);}
 else if(k==='roach'){oval(c,0,0,15,8,'#573125',true);for(let i=0;i<3;i++)for(const sign of [-1,1])path(c,[[i*8-10,0],[i*8-14,sign*(11+Math.sin(t+i)*3)]],'#bc855a',2);}
 else if(k==='laser'){path(c,[[-55,0],[24,0]],'#fef08a',16);path(c,[[-55,0],[24,0]],'#fffce4',5);}
 c.restore();return true;
}
