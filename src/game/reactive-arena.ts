import type {Game} from './engine';
import {FLOOR_Y} from './stage';
import {settings} from './visual-settings';
import {effectDetail} from './visual-budget';
const POSITIONS=[250,800,1350];
/** Background objects have visible damage stages, but never alter collision. */
export function drawReactiveArena(c:CanvasRenderingContext2D,g:Game){
 const stage=g.cfg.stage??'dojo',wood=['dojo','liberdade','zoologico'].includes(stage),cosmic=['casabranca','ngb','termodinamica'].includes(stage),age=g.tick-g.arena.tick;
 const excitement=Math.max(0,...g.f.map(f=>f.impact?1-(g.tick-f.impact.tick)/65:0)),form=g.f.find(f=>f.formT>0);
 if(form){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=settings.reducedFlash?.035:.09;c.fillStyle=form.def.color;c.fillRect(g.cam.x-600,120,1200,FLOOR_Y-120);c.restore();}
 for(let i=0;i<3;i++){
  const x=POSITIONS[i],damage=g.arena.damage[i];if(Math.abs(x-g.cam.x)>760)continue;
  c.save();c.translate(x,FLOOR_Y-205);c.lineWidth=3;c.strokeStyle='#20172b';
  if(damage<3){
   c.fillStyle=wood?'#b57e48':cosmic?'#292b58':'#353044';c.fillRect(-38,-95,76,150);c.strokeRect(-38,-95,76,150);
   c.strokeStyle=wood?'#f9d28e':cosmic?'#a2a1ff':'#75e7ff';c.lineWidth=2;
   if(wood){for(let j=0;j<3;j++){c.beginPath();c.moveTo(-26,-74+j*40);c.lineTo(26,-62+j*40);c.stroke();}}
   else {c.strokeRect(-27,-80,54,112);c.beginPath();c.moveTo(-18,-23);c.lineTo(0,-60);c.lineTo(17,-24);c.lineTo(-15,10);c.stroke();}
   if(damage){c.strokeStyle='#120d1c';c.lineWidth=4;for(let j=0;j<damage+1;j++){c.beginPath();c.moveTo(-20+j*18,-86);c.lineTo(12-j*9,-35);c.lineTo(-15+j*16,9);c.lineTo(10+j*5,48);c.stroke();}}
  }else{
   c.strokeStyle='#41364b';c.lineWidth=7;c.beginPath();c.moveTo(-39,-98);c.lineTo(-39,55);c.lineTo(39,55);c.lineTo(39,15);c.stroke();
   c.fillStyle=wood?'#99704d':'#555167';for(let j=0;j<5;j++){c.save();c.translate((j-2)*18,188+(j%2)*7);c.rotate(j*.7);c.fillRect(-12,-5,24,10);c.restore();}
  }
  if(age>=0&&age<50&&g.arena.slot===i){
   const n=effectDetail().shards;c.fillStyle=wood?'#edb36e':'#bce7ff';c.globalAlpha=1-age/50;
   for(let j=0;j<n;j++){const dir=j%2?1:-1,u=(j+1)/n;c.save();c.translate(dir*age*(.8+u*2),-50-age*(1+u*2)+age*age*.075);c.rotate(age*.1+j);c.fillRect(-4,-4,8+j%3*4,5);c.restore();}
   c.strokeStyle='#fff1ca';c.lineWidth=2;c.beginPath();c.ellipse(0,202,25+age*3,5+age*.3,0,0,Math.PI*2);c.stroke();
  }
  c.restore();
 }
 // Extra gestures sit behind the fighters, with deterministic jumps and claps.
 const count=effectDetail().shards;
 for(let i=0;i<count;i++){
  const x=160+i*140;if(Math.abs(x-g.cam.x)>700)continue;
  const jump=excitement*Math.max(0,Math.sin(g.tick*.28+i))*15,y=FLOOR_Y-32-jump;
  c.save();c.translate(x,y);c.fillStyle=['#6b447c','#3a627a','#a47b5c'][i%3];c.beginPath();c.arc(0,-18,8,0,Math.PI*2);c.fill();c.fillRect(-7,-10,14,30);
  c.strokeStyle=c.fillStyle;c.lineWidth=5;const hands=excitement> .15?Math.sin(g.tick*.35+i)*12:4;c.beginPath();c.moveTo(-5,-5);c.lineTo(-16,-8-hands);c.moveTo(5,-5);c.lineTo(16,-8-hands);c.stroke();c.restore();
 }
}
