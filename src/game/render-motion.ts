import type { Fighter } from './engine';
import { mixAnimation } from './animation';
import { computeRig } from './rig';

interface Frame { tick:number; at:number; duration:number; from:Fighter; shown:Fighter; facing:number }
const remoteFrames=new WeakMap<Fighter,Frame>();
/** The guest receives 20 snapshots/s. Interpolate their presentation at RAF rate,
 * keeping the actual fighter, hitboxes, projectiles and input stream untouched.
 * Contacts/hitstop, facing changes and cinematics always snap to the real pose.
 */
export function remotePresentation(f:Fighter,now:number,locked:boolean):Fighter {
  let c=remoteFrames.get(f);
  const snap=()=>{const shown={...f,pose:{...f.pose}};remoteFrames.set(f,{tick:f.animT,at:now,duration:0,from:shown,shown,facing:f.facing});return shown;};
  if(!c||locked||f.facing!==c.facing||f.state==='seq'||f.state==='cine'||Math.abs(f.x-c.shown.x)>160)return snap();
  if(f.animT!==c.tick){
    const duration=Math.max(16.67,Math.min(50,(f.animT-c.tick)*1000/60));
    c={tick:f.animT,at:now,duration,from:c.shown,shown:c.shown,facing:f.facing};remoteFrames.set(f,c);
  }
  const k=Math.max(0,Math.min(1,(now-c.at)/Math.max(1,c.duration)));
  const pose=mixAnimation(c.from.pose,f.pose,k);
  const shown={...f,x:c.from.x+(f.x-c.from.x)*k,y:c.from.y+(f.y-c.from.y)*k,pose,rig:computeRig(f.ch,pose)};
  c.shown=shown;return shown;
}
