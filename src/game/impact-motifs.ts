import type {CharId} from './data';
import {settings} from './visual-settings';
/** Character-specific strokes keep impacts readable at small mobile sizes. */
export function drawImpactMotif(c:CanvasRenderingContext2D,ch:CharId,age:number,color:string,power=1){
 const u=age/28,r=26+age*2;c.save();c.strokeStyle=color;c.fillStyle=color;c.lineWidth=2;c.globalAlpha*=(settings.reducedFlash?.25:.65)*(1-u);c.font='bold 22px sans-serif';
 const line=(pts:number[][])=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke()};
 const ring=(x:number,y:number,a:number,b=a)=>{c.beginPath();c.ellipse(x,y,a,b,0,0,Math.PI*2);c.stroke()};
 switch(ch){
  case 'caetano':for(let i=0;i<3;i++)line([[-r,25+i*9],[0,-20-i*7],[r,12-i*10]]);break;
  case 'orango':case 'ulisses':for(let i=-1;i<=1;i++)line([[-r+i*15,38],[i*15,-10],[r+i*15,-40]]);break;
  case 'tubarao':for(let i=0;i<4;i++){c.beginPath();c.arc(i*16-24,0,r*.65,Math.PI,Math.PI*2);c.stroke();}break;
  case 'rickzera':for(let i=0;i<4;i++){const a=i*Math.PI/2+u;ring(Math.cos(a)*r,Math.sin(a)*r,6+power*2);line([[0,0],[Math.cos(a)*r,Math.sin(a)*r]]);}break;
  case 'bieu':case 'aneninha':for(let i=0;i<7;i++){const a=i/7*Math.PI*2;ring(Math.cos(a)*r,Math.sin(a)*r*.7,3+i%3*2);line([[0,0],[Math.cos(a)*r,Math.sin(a)*r*.7]]);}break;
  case 'nomad':for(let i=0;i<4;i++){const x=(i-1.5)*26,y=Math.sin(i+u*4)*28;line([[x-8,y],[x+8,y],[x,y-13],[x,y+13],[x-8,y]]);}break;
  case 'renngotti':line([[-r,5],[-r*.7,-30],[-r*.3,32],[0,-44],[r*.4,37],[r*.7,-28],[r,3]]);break;
  case 'santox':for(let i=0;i<7;i++)c.strokeRect(-r+i*15,Math.sin(i*4+age*.2)*30,13+i%3*4,6);break;
  case 'jao':c.fillText('Σ',-r,-14);c.fillText('π',r*.4,27);line([[-20,-35],[22,-35],[22,35],[-20,35],[-20,-35]]);break;
  case 'jane':for(let i=0;i<4;i++){const a=i*Math.PI/2;c.save();c.rotate(a);line([[12,0],[36,0],[36,23],[r+20,23]]);ring(r+20,23,4);c.restore();}break;
  case 'cristyan':for(let i=0;i<3;i++){c.save();c.rotate(i*.5-.5);line([[-r,20],[r*.4,-20],[r,0]]);c.restore();}break;
  case 'eneas':line([[0,-r],[r,0],[0,r],[-r,0],[0,-r]]);ring(0,0,r*.48);c.fillText('56',-14,8);break;
  case 'patrick':for(let i=0;i<3;i++){const x=(i-1)*28;line([[x-18,-18],[x,-33],[x+18,-18],[x+12,20],[x,30],[x-12,20],[x-18,-18]]);}break;
  case 'gabrielzin':for(let i=0;i<3;i++){const x=(i-1)*33,y=i%2*25;c.beginPath();c.moveTo(x,y+12);c.bezierCurveTo(x-25,y-3,x-12,y-22,x,y-10);c.bezierCurveTo(x+12,y-22,x+25,y-3,x,y+12);c.stroke();}break;
  case 'felipence':for(let j=0;j<3;j++){const pts=Array.from({length:20},(_,i)=>[-r+i*r/9.5,(j-1)*19+Math.sin(i*.8-age*.25)*12]);line(pts);}break;
  case 'hdsh':line([[-r,25],[-r*.4,8],[0,18],[r*.4,-22],[r,-38]]);for(let i=0;i<4;i++)c.strokeRect((i-2)*21,-35+i%2*20,9,38-i*5);break;
 }
 c.restore();
}
