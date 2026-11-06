import type {P2} from './rig';

export function drawKnuckleEnergy(ctx:CanvasRenderingContext2D,hand:P2,frame:number,startup:number,active:number,reduced:boolean){
  const age=frame-startup;if(age>=active+8)return;
  const charge=Math.max(.1,Math.min(1,frame/Math.max(1,startup))),fade=age>active?Math.max(0,1-(age-active)/8):1;
  ctx.save();ctx.translate(hand.x,hand.y);ctx.globalAlpha*=fade*(reduced?.4:1);
  const r=17+charge*13,g=ctx.createRadialGradient(0,0,5,0,0,r*1.8);
  g.addColorStop(0,'#9dff3b00');g.addColorStop(.4,'#8eff4b35');g.addColorStop(1,'#38d96600');ctx.fillStyle=g;ctx.fillRect(-r*2,-r*2,r*4,r*4);
  ctx.strokeStyle='#a3ff36';ctx.lineWidth=2.3;
  for(let i=0;i<3;i++){
    const a=frame*.19+i*Math.PI*.66;
    ctx.beginPath();ctx.ellipse(0,0,r,r*.64,a,a+.2,a+1.8);ctx.stroke();
  }
  if(age>=0&&age<active+3){
    ctx.lineCap='round';ctx.strokeStyle='#3bdf64';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-48,-112);ctx.quadraticCurveTo(-2,-110,2,2);ctx.stroke();
    ctx.strokeStyle='#d8ffad';ctx.lineWidth=2.3;ctx.stroke();
  }
  ctx.restore();
}

export function drawKnuckleCrater(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,fade:number){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha*=Math.min(1,fade*4);
  ctx.fillStyle='#111a14';ctx.strokeStyle='#6e705b';ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(0,0,r,r*.22,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  for(let i=0;i<13;i++){
    const a=i/13*Math.PI*2,xx=Math.cos(a)*r,yy=Math.sin(a)*r*.22;
    ctx.fillStyle=i%2?'#9b927a':'#b7ac8c';ctx.strokeStyle='#42483c';ctx.lineWidth=1.4;
    ctx.beginPath();ctx.moveTo(xx-7,yy);ctx.lineTo(xx-4,yy-6-(i%3)*2);ctx.lineTo(xx+7,yy-4);ctx.lineTo(xx+9,yy+3);ctx.closePath();ctx.fill();ctx.stroke();
    const outer=r+15+(i%3)*9;
    ctx.beginPath();ctx.moveTo(xx*.83,yy*.8);ctx.lineTo(Math.cos(a+.06)*outer,Math.sin(a+.06)*outer*.23);ctx.lineTo(Math.cos(a+.01)*(outer+9),Math.sin(a+.01)*(outer+9)*.23);
    ctx.strokeStyle='#343f31';ctx.lineWidth=2.3;ctx.stroke();ctx.strokeStyle='#8fff4599';ctx.lineWidth=.8;ctx.stroke();
  }
  ctx.strokeStyle='#8aff48';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(0,1,r*.82,r*.14,0,Math.PI*.15,Math.PI*.91);ctx.stroke();
  ctx.restore();
}
