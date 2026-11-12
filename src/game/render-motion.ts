import type { Fighter } from './engine';
import { mixAnimation,motionAnimation } from './animation';
import { computeRig } from './rig';
import type { Pose } from './data';

export interface MotionFrame {
  x:number;y:number;pose:Pose;state:string;serial:number;facing:number;guard:boolean;crouch:boolean;
  turn:number;rotAdd:number;impact:number|undefined;
  animT:number;stateT:number;moveT:number;vx:number;vy:number;walking:number;poseName:string;landLag:number;
}
export function captureMotion(f:Fighter):MotionFrame {
  return {x:f.x,y:f.y,pose:{...f.pose},state:f.state,serial:f.serial,facing:f.facing,guard:f.guard,crouch:f.crouch,
    turn:f.turn,rotAdd:f.rotAdd,impact:f.impact?.serial,animT:f.animT,stateT:f.stateT,vx:f.vx,vy:f.vy,
    walking:f.walking,poseName:f.poseName,landLag:f.landLag,moveT:f.moveT};
}
/** Smooth only the rendered body between fixed simulation ticks. New commands,
 * defensive posture, active hitboxes and authored spins stay immediate. */
export function localPresentation(f:Fighter,previous:MotionFrame|undefined,fraction:number,locked:boolean):Fighter {
  const p=previous;
  if(!p||locked||f.hbActive||f.move?.turn||f.poseOverride||f.state!==p.state||f.serial!==p.serial||f.facing!==p.facing||
    f.guard!==p.guard||f.crouch!==p.crouch||f.turn!==p.turn||f.rotAdd!==p.rotAdd||f.impact?.serial!==p.impact)return f;
  const k=Math.max(0,Math.min(1,fraction)),pose=mixAnimation(p.pose,f.pose,k);
  const animT=p.animT+(f.animT-p.animT)*k;
  if(f.state!=='attack'&&f.poseName===p.poseName&&f.walking===p.walking){
    const base=f.def.poses[f.poseName]||f.def.poses.idle;
    const previousTarget=motionAnimation(f.ch,base,p),currentTarget=motionAnimation(f.ch,base,f);
    const linear=mixAnimation(previousTarget,currentTarget,k);
    // Evaluate the denser authored clip at the actual render instant. Preserve
    // the existing transition/smoothing offset rather than replacing the pose.
    const curve=motionAnimation(f.ch,base,{...f,animT,stateT:p.stateT+(f.stateT-p.stateT)*k,
      vx:p.vx+(f.vx-p.vx)*k,vy:p.vy+(f.vy-p.vy)*k});
    for(const key of Object.keys(pose) as (keyof Pose)[]){
      let delta=curve[key]-linear[key];
      if(/^(fa|ba|fl|bl)[12]$/.test(key))delta=((delta+180)%360+360)%360-180;
      pose[key]+=delta;
    }
  }
  return {...f,x:p.x+(f.x-p.x)*k,y:p.y+(f.y-p.y)*k,animT,stateT:p.stateT+(f.stateT-p.stateT)*k,moveT:p.moveT+(f.moveT-p.moveT)*k,pose,rig:computeRig(f.ch,pose)};
}

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
  const sameAction=f.state===c.from.state&&f.serial===c.from.serial&&!f.hbActive&&f.connected===c.from.connected;
  const shown={...f,x:c.from.x+(f.x-c.from.x)*k,y:c.from.y+(f.y-c.from.y)*k,
    animT:sameAction?c.from.animT+(f.animT-c.from.animT)*k:f.animT,
    stateT:sameAction?c.from.stateT+(f.stateT-c.from.stateT)*k:f.stateT,
    moveT:sameAction?c.from.moveT+(f.moveT-c.from.moveT)*k:f.moveT,pose,rig:computeRig(f.ch,pose)};
  c.shown=shown;return shown;
}
