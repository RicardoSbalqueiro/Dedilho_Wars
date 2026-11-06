import type { Fighter } from './engine';
import { attackAnimation } from './animation';
import { computeRig, drawRig } from './rig';

/** Motion ink is anchored to the same joints as the animated hands and feet.
 * No extra hitboxes, body transforms or state changes are introduced here. */
export function drawMotionInk(ctx:CanvasRenderingContext2D,f:Fighter,reduced:boolean) {
  const m=f.move;if(!m||f.state!=='attack'||f.poseOverride)return;
  const t=Math.max(0,f.moveT-1),age=t-m.startup;
  if(age<0||age>Math.min(m.active,14)+4)return;
  const heavy=m.kind!=='normal'||m.rank>=3;
  const a=Math.max(0,1-age/(Math.min(m.active,14)+5));
  if(heavy&&!reduced&&age<8){
    const pose=attackAnimation(f.ch,m,Math.max(0,t-2.5),f.connected);
    ctx.save();ctx.globalAlpha*=.12*a;ctx.translate(-f.vx*f.facing*.3,0);
    drawRig(ctx,f.ch,computeRig(f.ch,pose),pose,{time:f.animT-2.5,expr:f.expr,poseName:f.poseName});ctx.restore();
  }
  if(m.grab||m.kind==='super')return;
  const joint=m.trail==='bw'?'wB':m.trail==='ba'?'aB':m.trail==='fa'||/^(k|cK|jK)/.test(m.id)?'aF':'wF';
  const tip=f.rig.p[joint],start=f.rig.p[joint[0]==='a'?'hip':'sh'];
  const dx=tip.x-start.x,dy=tip.y-start.y,L=Math.hypot(dx,dy)||1;
  const nx=-dy/L,ny=dx/L,spread=heavy?22:11;
  ctx.save();ctx.globalAlpha*=a*(reduced?.32:.72);ctx.lineCap='round';
  for(let i=0;i<3;i++){
    const k=(i-1)*spread*.4;
    ctx.beginPath();ctx.moveTo(start.x+dx*.25-nx*spread,start.y+dy*.25-ny*spread);
    ctx.quadraticCurveTo(tip.x-dx*.12-nx*(spread*1.3+k),tip.y-dy*.12-ny*(spread*1.3+k),tip.x+nx*(8+k),tip.y+ny*(8+k));
    ctx.strokeStyle=i===1?'#fff3d7':f.def.glow;ctx.lineWidth=i===1?(heavy?2.8:1.2):heavy?4:1.5;ctx.stroke();
  }
  ctx.restore();
}

export function drawGuardInk(ctx:CanvasRenderingContext2D,f:Fighter,tick:number,reduced:boolean){
  const impact=f.impact;if(!impact||impact.kind==='hit'||impact.kind==='armor')return;
  const age=tick-impact.tick;if(age<0||age>13)return;
  const perfect=impact.kind==='perfect'||impact.kind==='precision';
  const x=f.rig.p.wF.x+9,y=f.rig.p.wF.y,r=18+age*1.4;
  ctx.save();ctx.globalAlpha*=(1-age/14)*(reduced?.4:.8);
  ctx.strokeStyle=impact.kind==='precision'?'#fef08a':perfect?'#67e8f9':'#a5d5ee';ctx.lineWidth=perfect?2.6:1.4;
  ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*.68,y-r*.4);ctx.lineTo(x+r*.5,y+r*.3);ctx.lineTo(x,y+r*.7);ctx.lineTo(x-r*.35,y+r*.25);ctx.lineTo(x-r*.45,y-r*.4);ctx.closePath();ctx.stroke();
  if(perfect){ctx.beginPath();ctx.moveTo(x-r*.6,y);ctx.lineTo(x+r*.65,y);ctx.moveTo(x,y-r*.65);ctx.lineTo(x,y+r*.65);ctx.stroke();}
  ctx.restore();
}
