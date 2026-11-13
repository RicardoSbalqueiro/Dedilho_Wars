import type {P2, Rig} from '../rig';

/** Training-only actors. Their proportions are fixed; animation comes from Rig. */
export type TrainingNpc = 'moderator' | 'supreme';
export interface TrainingNpcDrawOptions {
  jet?: boolean;
  attack?: boolean;
  guard?: boolean;
  color?: string;
}

const INK = '#100e19';
const SUIT = '#24222e';
const SUIT_LIGHT = '#403b4d';
const ARMOR = '#693286';
const ARMOR_DARK = '#392344';
const ARMOR_LIGHT = '#a561c6';
const EDGE = '#d79ae7';
const LIME = '#a2ff37';
const LIME_LIGHT = '#e6ffc0';
const SILVER = '#b4a5bd';
const WHITE = '#fff6ff';
const TAU = Math.PI * 2;

function polygon(ctx:CanvasRenderingContext2D,points:readonly number[],fill:string,stroke=INK,width=2.2) {
  ctx.beginPath();ctx.moveTo(points[0],points[1]);
  for(let i=2;i<points.length;i+=2)ctx.lineTo(points[i],points[i+1]);
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  if(width){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
}

function line(ctx:CanvasRenderingContext2D,x0:number,y0:number,x1:number,y1:number,color:string,width:number) {
  ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
}

function disc(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,fill:string,edge=INK,width=2) {
  ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=fill;ctx.fill();
  if(width){ctx.strokeStyle=edge;ctx.lineWidth=width;ctx.stroke();}
}

/** Small, geometry-only communications emblem, legible even at combat scale. */
function insignia(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,color=WHITE) {
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  polygon(ctx,[-.52,-.55,.57,-.55,.57,.24,.1,.62,-.18,.62,-.18,.35,-.52,.35],color,color,0);
  polygon(ctx,[-.32,-.37,.37,-.37,.37,.12,.04,.39,-.08,.39,-.08,.15,-.32,.15],ARMOR_DARK,ARMOR_DARK,0);
  line(ctx,-.08,-.22,-.08,.05,color,.1);line(ctx,.15,-.22,.15,.05,color,.1);
  ctx.restore();
}

function ribbedJoint(ctx:CanvasRenderingContext2D,p:P2,r:number) {
  disc(ctx,p.x,p.y,r,INK,SUIT_LIGHT,1.2);
  line(ctx,p.x-r*.6,p.y-2,p.x+r*.6,p.y-2,'#6c6179',1);
  line(ctx,p.x-r*.6,p.y+2,p.x+r*.6,p.y+2,'#6c6179',1);
}

/** A tapered, bevelled limb plate. Its length follows the animated bone. */
function limb(ctx:CanvasRenderingContext2D,a:P2,b:P2,wide:number,narrow:number,front:boolean,green=false) {
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
  if(len<.01)return;
  ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(dy,dx));
  polygon(ctx,[1,-wide,len*.7,-narrow-1,len,narrow*.75,len*.75,narrow+1,1,wide],SUIT);
  polygon(ctx,[len*.16,-wide-1,len*.62,-narrow-2,len*.84,-narrow*.5,len*.68,narrow,len*.22,wide-1],front?ARMOR:ARMOR_DARK);
  polygon(ctx,[len*.16,-wide-1,len*.62,-narrow-2,len*.55,-narrow*.2,len*.24,wide-1],front?ARMOR_LIGHT:ARMOR,INK,.6);
  line(ctx,len*.2,-wide+1,len*.57,-narrow,front?EDGE:'#8d589e',1);
  if(green)line(ctx,len*.3,-wide+4,len*.65,-narrow+3,LIME,2.6);
  ctx.restore();
}

function boot(ctx:CanvasRenderingContext2D,ankle:P2,toe:P2,front:boolean) {
  const dx=toe.x-ankle.x,dy=toe.y-ankle.y,angle=Math.atan2(dy,dx);
  ctx.save();ctx.translate(ankle.x,ankle.y);ctx.rotate(angle);
  polygon(ctx,[-7,-10,8,-10,20,-5,22,3,-8,4,-11,-2],front?ARMOR:ARMOR_DARK);
  polygon(ctx,[-7,-10,8,-10,15,-6,-6,-5],front?ARMOR_LIGHT:ARMOR,INK,.9);
  polygon(ctx,[-10,1,21,0,22,5,-9,6],INK,INK,1);
  line(ctx,-6,3,16,3,front?'#937aa3':'#62526c',1);
  line(ctx,-3,-7,8,-7,SILVER,1.2);line(ctx,-3,-3,10,-3,SILVER,1.2);
  line(ctx,13,-4,18,-2,LIME,1.6);
  ctx.restore();
}

function leg(ctx:CanvasRenderingContext2D,hip:P2,knee:P2,ankle:P2,toe:P2,front:boolean,heavy:boolean) {
  limb(ctx,hip,knee,heavy?15:12,heavy?11:9,front);
  ribbedJoint(ctx,knee,heavy?10:8);
  disc(ctx,knee.x,knee.y,heavy?11:9,front?ARMOR:ARMOR_DARK);
  polygon(ctx,[knee.x-7,knee.y-5,knee.x+5,knee.y-7,knee.x+8,knee.y+4,knee.x-3,knee.y+7],front?ARMOR_LIGHT:ARMOR,INK,1.1);
  limb(ctx,knee,ankle,heavy?12:9,heavy?10:8,front,true);
  boot(ctx,ankle,toe,front);
}

function glove(ctx:CanvasRenderingContext2D,w:P2,elbow:P2,front:boolean,heavy:boolean) {
  const angle=Math.atan2(w.y-elbow.y,w.x-elbow.x);
  ctx.save();ctx.translate(w.x,w.y);ctx.rotate(angle);
  polygon(ctx,[-6,-7,5,-8,12,-4,12,4,5,8,-6,6],SUIT);
  polygon(ctx,[-5,-7,5,-8,10,-4,7,1,-5,0],front?ARMOR:ARMOR_DARK);
  for(let i=0;i<3;i++)line(ctx,2+i*3,-3,3+i*3,3,front?'#8f819e':'#5d5267',1);
  if(heavy)polygon(ctx,[-9,-8,-1,-10,2,-5,-7,-3],ARMOR_LIGHT,INK,1.1);
  ctx.restore();
}

function arm(ctx:CanvasRenderingContext2D,shoulder:P2,elbow:P2,wrist:P2,front:boolean,heavy:boolean) {
  limb(ctx,shoulder,elbow,heavy?13:10,heavy?10:8,front,true);
  ribbedJoint(ctx,elbow,heavy?8:6);
  limb(ctx,elbow,wrist,heavy?12:9,heavy?9:7,front);
  glove(ctx,wrist,elbow,front,heavy);
}

function cape(ctx:CanvasRenderingContext2D,rig:Rig,time:number) {
  const p=rig.p,angle=Math.atan2(p.neck.x-p.hip.x,-(p.neck.y-p.hip.y));
  const length=Math.min(116,Math.max(82,p.hip.y-p.sh.y+55)),wave=Math.sin(time*.055)*4;
  ctx.save();ctx.translate(p.sh.x-15,p.sh.y-3);ctx.rotate(angle*.4);
  polygon(ctx,[-12,-5,12,5,8,length-7,-2,length-12,-12,length-2,-22,length-11,-36,length-4,-33,48-wave,-26,5],ARMOR_DARK);
  polygon(ctx,[-12,-2,3,7,-6,length-17,-18,length-11,-23,37],ARMOR,INK,1);
  line(ctx,-21,11,-27,length-16,ARMOR_LIGHT,1);
  line(ctx,-9,19,-12,length-21,'#b174c8',1);
  insignia(ctx,-14,length*.57,18,'#c99add');
  ctx.restore();
}

function jetpack(ctx:CanvasRenderingContext2D,rig:Rig,time:number,active:boolean,heavy:boolean) {
  const p=rig.p,angle=Math.atan2(p.neck.x-p.hip.x,-(p.neck.y-p.hip.y));
  ctx.save();ctx.translate(p.sh.x-24,p.sh.y+16);ctx.rotate(angle*.65);
  polygon(ctx,[-14,-25,6,-27,16,-17,15,27,-10,30,-18,18],INK);
  polygon(ctx,[-12,-24,6,-26,12,-17,10,21,-9,24,-15,16],ARMOR_DARK);
  polygon(ctx,[-12,-24,1,-25,3,21,-9,24,-15,16],ARMOR);
  line(ctx,-9,-20,-2,-21,ARMOR_LIGHT,2);
  line(ctx,-8,-12,-8,11,LIME,3.6);line(ctx,7,-11,7,12,LIME,3);
  polygon(ctx,[-14,20,-1,20,-2,31,-14,31],SUIT_LIGHT,INK,1.5);
  polygon(ctx,[4,20,15,18,14,29,3,30],SUIT_LIGHT,INK,1.5);
  line(ctx,-13,29,-3,29,LIME_LIGHT,2);line(ctx,4,28,12,27,LIME_LIGHT,2);
  if(heavy)insignia(ctx,-1,-7,13);
  if(active){
    const flame=22+Math.sin(time*.9)*5;
    for(let i=0;i<2;i++){
      const x=i?8:-8,y=i?30:32;
      polygon(ctx,[x-6,y,x+5,y,x+3,y+flame*.75,x,y+flame+5,x-3,y+flame*.54,x-6,y+flame*.8],LIME,LIME,0);
      polygon(ctx,[x-3,y,x+3,y,x+1,y+flame*.7,x-2,y+flame*.42],LIME_LIGHT,LIME_LIGHT,0);
      line(ctx,x-5,y+flame+7,x-7,y+flame+13,'#a6ff6c',1);
    }
  }
  ctx.restore();
}

function torso(ctx:CanvasRenderingContext2D,rig:Rig,heavy:boolean,color?:string) {
  const p=rig.p,dx=p.sh.x-p.hip.x,dy=p.sh.y-p.hip.y,len=Math.hypot(dx,dy),angle=Math.atan2(dx,-dy);
  const w=heavy?29:24;
  ctx.save();ctx.translate(p.hip.x,p.hip.y);ctx.rotate(angle);
  polygon(ctx,[-17,7,-21,-len*.34,-w,-len+8,-15,-len-4,16,-len-4,w,-len+8,20,-len*.35,17,7],SUIT);
  polygon(ctx,[-w,-len+6,-15,-len-6,14,-len-7,w+4,-len+5,20,-len*.48,7,-len*.28,-17,-len*.39],color??ARMOR);
  polygon(ctx,[-w,-len+6,-15,-len-6,1,-len+2,-3,-len*.44,-17,-len*.39],ARMOR_LIGHT,INK,1.3);
  polygon(ctx,[1,-len+2,14,-len-7,w+4,-len+5,20,-len*.48,7,-len*.28,-3,-len*.44],ARMOR_DARK,INK,1.3);
  polygon(ctx,[-15,-len*.44,-3,-len*.48,7,-len*.29,16,-len*.35,14,-13,-14,-12],SUIT_LIGHT,INK,1.5);
  line(ctx,-14,-len*.4,-11,-18,SILVER,1);
  line(ctx,12,-len*.35,9,-16,'#665974',1);
  polygon(ctx,[-21,-len+10,-18,-len+8,-15,-len*.43,-19,-len*.4],LIME,LIME,0);
  polygon(ctx,[20,-len+7,24,-len+10,18,-len*.45,15,-len*.49],LIME,LIME,0);
  insignia(ctx,3,-len*.72,heavy?21:18);
  // Neck seal and layered collar sit underneath the helmet.
  polygon(ctx,[-12,-len-3,-9,-len-13,9,-len-13,14,-len-4,8,-len+2,-5,-len+3],INK,INK,1.5);
  polygon(ctx,[-14,-len-3,-11,-len-9,0,-len-6,12,-len-11,16,-len-4,6,-len+3,-4,-len+3],ARMOR_DARK);
  line(ctx,-9,-len-7,-3,-len-2,LIME,1.7);
  // Tactical belt and individual pouches.
  polygon(ctx,[-20,-13,19,-14,21,-1,-20,0],INK);
  for(let i=0;i<4;i++){
    const x=-18+i*9;
    polygon(ctx,[x,-12,x+7,-12,x+8,2,x,3],i%2?SUIT_LIGHT:ARMOR_DARK,INK,1.2);
    line(ctx,x+1,-10,x+6,-10,SILVER,.8);
  }
  polygon(ctx,[-3,-14,6,-14,7,-3,-3,-3],SILVER,INK,1.4);
  polygon(ctx,[-1,-11,4,-11,4,-6,-1,-6],ARMOR_DARK,INK,.6);
  ctx.restore();
}

function shoulder(ctx:CanvasRenderingContext2D,p:P2,heavy:boolean,front:boolean) {
  const w=heavy?23:17;
  ctx.save();ctx.translate(p.x+(front?3:-6),p.y+2);
  polygon(ctx,[-w,-7,-w*.5,-17,w*.48,-15,w+3,-3,w*.75,15,1,17,-w*.86,9],front?ARMOR:ARMOR_DARK);
  polygon(ctx,[-w,-7,-w*.5,-17,w*.48,-15,w+3,-3,2,-6,-w*.86,9],front?ARMOR_LIGHT:ARMOR,INK,1.2);
  line(ctx,-w*.48,-13,w*.35,-12,EDGE,1.4);
  if(front){line(ctx,5,0,14,2,WHITE,3.2);line(ctx,5,6,14,8,WHITE,3.2);}
  else insignia(ctx,1,0,12,'#d5b0e6');
  if(heavy)polygon(ctx,[-w,-5,-w-6,0,-w-3,17,-w*.8,11],ARMOR_DARK,INK,1.4);
  ctx.restore();
}

function helmet(ctx:CanvasRenderingContext2D,head:P2,neck:P2,heavy:boolean,time:number,guard:boolean) {
  const lean=Math.atan2(head.x-neck.x,-(head.y-neck.y));
  ctx.save();ctx.translate(head.x,head.y);ctx.rotate(lean*.5);
  // Angular brow, ear radio and jaw plates keep the silhouette unlike a human head.
  polygon(ctx,[-23,5,-23,-9,-14,-22,6,-26,24,-15,28,-2,23,11,12,23,-4,21,-17,16],INK);
  polygon(ctx,[-24,-8,-14,-23,6,-27,23,-16,26,-6,6,-7,-10,-1],ARMOR);
  polygon(ctx,[-14,-23,6,-27,16,-22,-1,-17,-8,-6,-24,-8],ARMOR_LIGHT,INK,1.2);
  polygon(ctx,[6,-27,23,-16,26,-6,13,-8,-1,-17],ARMOR_DARK,INK,1.2);
  polygon(ctx,[-9,-4,8,-11,29,-9,26,0,5,7,-13,5],INK,INK,1.4);
  const brightness=guard?1:.78+Math.sin(time*.12)*.1;
  ctx.globalAlpha=brightness;
  line(ctx,-11,0,5,2,'#a63aff',5.5);line(ctx,5,2,25,-6,'#a63aff',5.5);
  line(ctx,-11,0,5,2,'#f0c3ff',1.7);line(ctx,5,2,25,-6,'#f0c3ff',1.7);
  ctx.globalAlpha=1;
  polygon(ctx,[-14,6,-1,10,4,22,-6,22,-17,14],SUIT_LIGHT,INK,1.6);
  polygon(ctx,[1,9,15,5,24,1,20,14,11,23,5,21],ARMOR_DARK,INK,1.6);
  polygon(ctx,[10,10,18,6,17,15,11,20],SUIT,INK,1);
  line(ctx,-8,11,-3,18,SILVER,1);
  polygon(ctx,[-24,-6,-17,-7,-14,3,-18,12,-26,9,-29,1],SUIT_LIGHT,INK,1.7);
  polygon(ctx,[-27,-1,-22,-3,-19,1,-21,6,-26,5],ARMOR_DARK,INK,1);
  line(ctx,-24,0,-22,0,LIME,2);
  insignia(ctx,-3,-16,12);
  if(heavy){
    polygon(ctx,[-21,-14,-26,-32,-15,-24,-9,-21],ARMOR_LIGHT,INK,1.6);
    polygon(ctx,[7,-26,17,-34,18,-23,23,-17],ARMOR_DARK,INK,1.6);
    line(ctx,-19,-19,-16,-25,EDGE,1);
  }
  ctx.restore();
}

function sword(ctx:CanvasRenderingContext2D,wrist:P2,elbow:P2,time:number,attack:boolean) {
  // The blade travels with the actual wrist. It cannot remain behind during a hit.
  const forearm=Math.atan2(wrist.y-elbow.y,wrist.x-elbow.x);
  const angle=forearm+(attack?-.15:.62);
  ctx.save();ctx.translate(wrist.x+3,wrist.y+1);ctx.rotate(angle);
  polygon(ctx,[-15,-4,12,-4,12,4,-15,4],INK,INK,1.4);
  for(let i=-12;i<10;i+=5)line(ctx,i,-3,i+2,3,ARMOR_LIGHT,1.1);
  polygon(ctx,[10,-9,17,-9,17,9,10,9],ARMOR_DARK,INK,1.5);
  line(ctx,12,-6,15,-6,SILVER,1.2);
  polygon(ctx,[17,-5,86,-7,99,-2,89,5,17,5],SUIT_LIGHT,INK,2);
  polygon(ctx,[22,-4,86,-6,97,-2,87,1,22,1],LIME,LIME,0);
  polygon(ctx,[22,2,89,1,87,5,20,5],ARMOR_DARK,INK,.8);
  line(ctx,31,-1,82,-3,LIME_LIGHT,1.7);
  if(attack){
    ctx.globalAlpha=.45+Math.sin(time*.4)*.12;
    line(ctx,25,-8,89,-9,LIME,2);
    ctx.globalAlpha=1;
  }
  ctx.restore();
}

function hammer(ctx:CanvasRenderingContext2D,wrist:P2,elbow:P2,time:number,attack:boolean) {
  const forearm=Math.atan2(wrist.y-elbow.y,wrist.x-elbow.x);
  const angle=forearm+(attack?-.15:-.62);
  ctx.save();ctx.translate(wrist.x,wrist.y);ctx.rotate(angle);
  polygon(ctx,[-31,-4,69,-4,70,4,-31,4,-37,0],SUIT_LIGHT,INK,2);
  for(let i=-22;i<48;i+=12){line(ctx,i,-3,i+3,3,ARMOR,2);line(ctx,i+3,-3,i+3,3,LIME,1.3);}
  polygon(ctx,[52,-28,66,-39,88,-37,97,-25,97,28,84,37,61,33,52,21],ARMOR_DARK,INK,2.6);
  polygon(ctx,[53,-27,67,-38,87,-36,91,-24,67,-23,60,27,53,20],ARMOR,INK,1.4);
  polygon(ctx,[67,-23,91,-24,97,-16,97,28,84,37,61,33],SUIT,INK,1.6);
  polygon(ctx,[54,-27,67,-38,87,-36,91,-29,66,-30,59,-21],ARMOR_LIGHT,INK,1.1);
  polygon(ctx,[55,14,61,16,61,31,84,34,93,27,96,29,85,39,59,35,53,23],LIME,LIME,0);
  line(ctx,57,-17,57,6,LIME,3.5);
  line(ctx,62,-20,62,-7,LIME_LIGHT,1.5);
  insignia(ctx,79,5,25);
  line(ctx,68,-17,88,-18,SUIT_LIGHT,1.2);
  if(attack){
    const flash=.35+Math.sin(time*.6)*.13;ctx.globalAlpha=flash;
    line(ctx,94,-14,100,25,LIME,4);ctx.globalAlpha=1;
  }
  ctx.restore();
}

/**
 * Paint at the same body origin as drawRig. Caller owns x/y, facing and world scale.
 * Only cosmetic surfaces are broadened for the Supreme; no pose normalization,
 * frame-dependent scale, simulation state or hitboxes are touched here.
 */
export function drawTrainingNpc(ctx:CanvasRenderingContext2D,rig:Rig,variant:TrainingNpc,time:number,opts:TrainingNpcDrawOptions={}) {
  const p=rig.p,heavy=variant==='supreme';
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
  if(heavy)cape(ctx,rig,time);
  jetpack(ctx,rig,time,!!opts.jet,heavy);
  leg(ctx,p.hip,p.kB,p.aB,p.tB,false,heavy);
  arm(ctx,p.sh,p.eB,p.wB,false,heavy);
  shoulder(ctx,p.sh,heavy,false);
  torso(ctx,rig,heavy,opts.color);
  leg(ctx,p.hip,p.kF,p.aF,p.tF,true,heavy);
  // Pelvic apron covers the leg roots without hiding the articulated knees.
  polygon(ctx,[p.hip.x-18,p.hip.y-3,p.hip.x+17,p.hip.y-3,p.hip.x+13,p.hip.y+13,p.hip.x-12,p.hip.y+13],ARMOR_DARK);
  polygon(ctx,[p.hip.x-5,p.hip.y,p.hip.x+7,p.hip.y,p.hip.x+5,p.hip.y+12,p.hip.x-4,p.hip.y+12],ARMOR,INK,1.1);
  helmet(ctx,p.head,p.neck,heavy,time,!!opts.guard);
  arm(ctx,p.sh,p.eF,p.wF,true,heavy);
  shoulder(ctx,p.sh,heavy,true);
  const rearStrike=opts.attack&&p.wB.x>p.wF.x+10,wrist=rearStrike?p.wB:p.wF,elbow=rearStrike?p.eB:p.eF;
  if(heavy)hammer(ctx,wrist,elbow,time,!!opts.attack);else sword(ctx,wrist,elbow,time,!!opts.attack);
  glove(ctx,wrist,elbow,true,heavy);
  ctx.restore();
}

/** HUD/circuit portrait, independent from a roster CharId or an image download. */
export function drawTrainingNpcPortrait(ctx:CanvasRenderingContext2D,variant:TrainingNpc,x:number,y:number,size:number,time=0) {
  ctx.save();ctx.translate(x,y);ctx.scale(size/27,size/27);
  helmet(ctx,{x:0,y:0},{x:-2,y:18},variant==='supreme',time,false);
  ctx.restore();
}
