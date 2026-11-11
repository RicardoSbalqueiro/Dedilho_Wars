// Visual choreography only. No timing, collision, input or damage rules live here.
import { CHARS } from './data';
import type { CharId, Move, Pose } from './data';

export const ANIMATION_STYLE: Record<CharId, { weight: number; tempo: number; swing: number; recoil: number }> = {
  caetano: { weight: .8, tempo: .075, swing: 15, recoil: .8 },
  orango: { weight: 1.5, tempo: .052, swing: 28, recoil: 1.3 },
  tubarao: { weight: 1.35, tempo: .055, swing: 16, recoil: 1.15 },
  rickzera: { weight: .75, tempo: .085, swing: 19, recoil: .85 },
  bieu: { weight: .95, tempo: .08, swing: 22, recoil: 1 },
  nomad: { weight: 1.3, tempo: .065, swing: 24, recoil: 1.2 },
  renngotti: { weight: 1, tempo: .06, swing: 14, recoil: .9 },
  aneninha: { weight: .8, tempo: .095, swing: 25, recoil: 1.2 },
  santox: { weight: .65, tempo: .085, swing: 31, recoil: 1.35 },
  jao: { weight: .85, tempo: .065, swing: 15, recoil: .75 },
  jane: { weight: .65, tempo: .095, swing: 23, recoil: 1 },
  cristyan: { weight: 1.1, tempo: .08, swing: 18, recoil: 1 },
  patrick:{weight:1.4,tempo:.052,swing:12,recoil:1.2},
  gabrielzin:{weight:.65,tempo:.09,swing:27,recoil:.9},
  ulisses:{weight:.95,tempo:.062,swing:17,recoil:1.1},
  felipence:{weight:1.1,tempo:.075,swing:22,recoil:1.15},
  hdsh:{weight:.85,tempo:.068,swing:14,recoil:.8},
  eneas: { weight: 1.3, tempo: .055, swing: 12, recoil: 1.1 },
};

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const JOINT = /^(fa|ba|fl|bl)[12]$/;
export function mixAnimation(a: Pose, b: Pose, amount: number): Pose {
  const k = clamp(amount), out = { ...a };
  if(k===0)return out;
  if(k===1)return {...b};
  for (const key of Object.keys(a) as (keyof Pose)[]) {
    let d = b[key] - a[key];
    if (JOINT.test(key)) d = ((d + 180) % 360 + 360) % 360 - 180;
    out[key] = a[key] + d * k;
  }
  return out;
}
type Keyframe = readonly [number, Pose];
export function sampleTrack(keys: readonly Keyframe[], time: number): Pose {
  for (let i = 1; i < keys.length; i++) {
    if (time <= keys[i][0]) {
      const [a, p] = keys[i - 1], [b, q] = keys[i];
      return mixAnimation(p, q, ease((time - a) / Math.max(.001, b - a)));
    }
  }
  return { ...keys[keys.length - 1][1] };
}

/** Eight authored beats: ready, anticipation, coil, release, extension,
 * follow-through, recoil and settle. The contact pose lands on the first active
 * frame, even for the five-frame jab. Long active/charged moves retain their pose.
 * Existing move-specific rotations and cinematic pose overrides stay authoritative.
 */
export function attackAnimation(ch: CharId, m: Move, frame: number, connected: boolean, neutral?: Pose): Pose {
  const poses = CHARS[ch].poses, idle = neutral || poses[m.air ? 'jump' : m.id[0] === 'c' ? 'crouch' : 'idle'];
  const wind = poses[m.poses[0]] || idle, strike = poses[m.poses[1]] || wind;
  const style = ANIMATION_STYLE[ch], kick = /^(k|cK|jK)/.test(m.id) || m.trail === 'fa' || m.trail === 'ba';
  const amount = (m.kind === 'normal' && m.rank === 1 ? .55 : 1) * style.recoil;
  const anticipation = mixAnimation(idle, wind, .52);
  anticipation.lean -= 3 * amount; anticipation.head += 2 * amount;
  const coil = { ...wind, lean: wind.lean - 2.5 * amount, head: wind.head + 2 * amount };
  // The knee chambers before a kick; punches retract the elbow and rotate the torso.
  if (kick) { coil.fl2 += 7 * amount; coil.ba2 -= 4 * amount; }
  else { coil.fa2 -= 5 * amount; coil.ba1 += 3 * amount; }
  const follow = { ...strike, lean: strike.lean + 2.5 * amount, head: strike.head - 1.5 * amount };
  const recoil = mixAnimation(poses[m.recoveryPose || m.poses[1]] || strike, wind, .28);
  recoil.lean -= 2 * amount;
  const activeEnd = m.startup + m.active;
  const end = activeEnd + m.recovery + (connected ? 0 : m.whiff);
  let keys: Keyframe[] = [
    [0, mixAnimation(idle, wind, .18)],
    [m.startup * .27, anticipation], [m.startup * .66, coil],
    [Math.max(m.startup * .67, m.startup - 1), mixAnimation(wind, strike, .32)],
    [m.startup, strike], [activeEnd - .01, follow],
    [activeEnd + (end - activeEnd) * .3, recoil], [end - 1, idle],
  ];
  if (ch === 'jane' && m.id === 's3') {
    // Preserve the slide -> visible jump -> airborne spin telegraph and its timing.
    const hop = { ...poses.jump, fa1: -35, ba1: 155, fl1: -15, fl2: 120 };
    keys = [[0, wind], [10, { ...wind, lean: wind.lean + 3 }], [17, wind], [21, hop],
      [m.startup - 3, mixAnimation(hop, strike, .28)], [m.startup, strike],
      [activeEnd, follow], [end - 1, idle]];
  }
  // Engine-controlled spins must not be recreated as skeletal rotations.
  const result=sampleTrack(keys,Math.max(0,frame));
  if(ch==='rickzera'&&m.id==='s1'&&frame>=m.startup&&frame<activeEnd){
    const flick=Math.sin(((frame-m.startup)%6)/6*Math.PI);result.ba1-=flick*8;result.ba2-=flick*6;
  }
  return result;
}

export interface MotionState {
  state: string; stateT: number; animT: number; vx: number; vy: number;
  walking: number; facing: number; crouch: boolean; guard: boolean; landLag: number;
}
/** Continuous gait, breathing, weight shifts and readable defensive reactions. */
function proceduralMotion(ch: CharId, base: Pose, f: MotionState): Pose {
  const p = { ...base }, s = ANIMATION_STYLE[ch], t = f.animT, breath = Math.sin(t * s.tempo);
  if (f.state === 'ground') {
    if (f.landLag > 0) return mixAnimation(base, CHARS[ch].poses.crouch, Math.min(1, f.landLag / 4));
    if (f.walking && !f.crouch && !f.guard) {
      const speed = Math.min(1, Math.abs(f.vx) / CHARS[ch].walk), phase = t * .24;
      const front = Math.sin(phase), back = Math.sin(phase + Math.PI);
      p.fl1 += front * 24 * speed; p.bl1 += back * 24 * speed;
      p.fl2 += (front * 8 - Math.max(0, Math.cos(phase)) * 22) * speed;
      p.bl2 += (back * 8 - Math.max(0, Math.cos(phase + Math.PI)) * 22) * speed;
      p.fa1 -= front * s.swing * speed; p.ba1 -= back * s.swing * speed;
      p.fa2 += front * 8 * speed; p.ba2 += back * 8 * speed;
      p.lean += f.vx * f.facing * 1.2; p.head -= front * 1.6 * speed;
    } else {
      p.lean += breath * (f.guard ? .45 : 1.25); p.head -= breath * .75;
      p.fa1 += breath * (f.guard ? .7 : 2.8); p.ba1 -= breath * 1.8;
      p.fa2 += Math.sin(t * s.tempo - .6) * 1.7;
      if (!f.crouch && !f.guard) { p.fl1 += breath * .8; p.bl1 -= breath * .8; }
    }
  } else if (f.state === 'jump') {
    const rise = Math.max(-1, Math.min(1, f.vy / 10));
    p.fl1 += rise * 14; p.fl2 -= rise * 16; p.bl1 -= rise * 12; p.bl2 += rise * 15;
    p.fa1 += rise * 16; p.ba1 -= rise * 12; p.lean += f.vx * f.facing * 1.2;
  } else if (f.state === 'dash') {
    const phase = Math.sin(t * .7); p.fl1 += phase * 25; p.bl1 -= phase * 25;
    p.fl2 -= Math.max(0, phase) * 25; p.bl2 += Math.min(0, phase) * 25;
    p.fa1 -= phase * s.swing * .6; p.ba1 += phase * s.swing * .6; p.head += Math.cos(t*.7)*1.1;
  } else if (f.state === 'hit' || f.state === 'block') {
    const shock = Math.exp(-f.stateT * .25) * Math.sin(f.stateT * 1.25);
    p.lean -= shock * (f.state === 'hit' ? 7 : 3); p.head -= shock * 4;
    p.fa2 += shock * 7; p.ba2 -= shock * 5;
  } else if (f.state === 'getup') {
    return mixAnimation(p, CHARS[ch].poses.idle, ease(f.stateT / 18));
  } else if (f.state === 'dizzy') {
    p.lean += Math.sin(t * .18) * 7; p.head -= Math.sin(t * .18 + .7) * 9;
  } else if (f.state === 'win') {
    p.lean += breath * 2; p.head += Math.cos(t*s.tempo)*2-breath;
    p.fa2 += Math.sin(t*s.tempo*2) * (ch === 'orango' ? 24 : 3);
    p.ba2 -= Math.sin(t*s.tempo*2) * (ch === 'orango' ? 24 : 3);
  }
  return p;
}

/** Explicit, inspectable frame library. These frames drive the live fighter;
 * the catalogue is not an unused export or a counter of repeated idle images. */
export const ANIMATION_SUBFRAMES=3;
export const ANIMATION_FPS=60*ANIMATION_SUBFRAMES;
export const ANIMATION_CLIPS = {
  idle: { label:'Prontidão e respiração', ticks:120, frames:360, pose:'idle', loop:true },
  walk: { label:'Caminhada', ticks:32, frames:96, pose:'idle', loop:true },
  dash: { label:'Dash e corrida', ticks:24, frames:72, pose:'rush', loop:true },
  jump: { label:'Salto: subida e queda', ticks:24, frames:72, pose:'jump', loop:false },
  guard: { label:'Defesa alta', ticks:36, frames:108, pose:'block', loop:true },
  crouch: { label:'Agachar e apoio baixo', ticks:36, frames:108, pose:'crouch', loop:true },
  hit: { label:'Reação ao impacto', ticks:16, frames:48, pose:'hit', loop:false },
  getup: { label:'Levantar', ticks:18, frames:54, pose:'getup', loop:false },
  win: { label:'Comemoração', ticks:60, frames:180, pose:'win', loop:true },
} as const;
export type AnimationClip = keyof typeof ANIMATION_CLIPS;
export const ANIMATION_CLIP_IDS=Object.keys(ANIMATION_CLIPS) as AnimationClip[];
export const ANIMATION_FRAMES_PER_FIGHTER=ANIMATION_CLIP_IDS.reduce((sum,id)=>sum+ANIMATION_CLIPS[id].frames,0);
const frameLibrary=new Map<string,readonly Readonly<Pose>[]>();
export function animationFrames(ch:CharId,id:AnimationClip):readonly Readonly<Pose>[] {
  const key=ch+':'+id,old=frameLibrary.get(key);if(old)return old;
  const clip=ANIMATION_CLIPS[id],def=CHARS[ch],base=def.poses[clip.pose]||def.poses.idle;
  const result=Array.from({length:clip.frames},(_,i)=>{
    const phase=i/clip.frames*Math.PI*2;
    const animT=id==='walk'?phase/.24:id==='dash'?phase/.7:phase/ANIMATION_STYLE[ch].tempo;
    const f:MotionState={state:id==='idle'||id==='walk'||id==='guard'||id==='crouch'?'ground':id,
      stateT:i/ANIMATION_SUBFRAMES,animT,vx:id==='walk'?def.walk:0,vy:-10+i/(clip.frames-1)*20,
      walking:id==='walk'?1:0,facing:1,crouch:id==='crouch',guard:id==='guard',landLag:0};
    return Object.freeze(proceduralMotion(ch,base,f));
  });
  Object.freeze(result);frameLibrary.set(key,result);return result;
}
/** Linear between adjacent *finished* frames: no easing discontinuity at every
 * frame boundary. Easing belongs to the authored motion, not the playback clock. */
export function animationFrame(ch:CharId,id:AnimationClip,frame:number):Pose {
  const frames=animationFrames(ch,id),n=frames.length,loop=ANIMATION_CLIPS[id].loop;
  const t=loop?((frame%n)+n)%n:Math.max(0,Math.min(n-1,frame));
  const a=Math.floor(t),b=loop?(a+1)%n:Math.min(n-1,a+1);
  return mixAnimation(frames[a],frames[b],t-a);
}
function relativeFrame(ch:CharId,id:AnimationClip,tick:number,base:Pose):Pose {
  const canonical=CHARS[ch].poses[ANIMATION_CLIPS[id].pose]||CHARS[ch].poses.idle;
  const p=animationFrame(ch,id,tick*ANIMATION_SUBFRAMES);
  for(const k of Object.keys(p) as (keyof Pose)[])p[k]+=base[k]-canonical[k];
  return p;
}
export function motionAnimation(ch:CharId,base:Pose,f:MotionState):Pose {
  if(f.state==='ground'){
    if(f.landLag>0)return mixAnimation(base,CHARS[ch].poses.crouch,Math.min(1,f.landLag/4));
    const id:AnimationClip=f.guard?'guard':f.crouch?'crouch':f.walking?'walk':'idle';
    // Speed changes the stride amplitude, not the absolute phase. Multiplying
    // a long-running clock by velocity would make the gait jump on acceleration.
    const rate=id==='walk'?1:ANIMATION_STYLE[ch].tempo/.075;
    let p=relativeFrame(ch,id,f.animT*rate,base);
    if(id==='walk'){
      p=mixAnimation(base,p,Math.min(1,Math.abs(f.vx)/CHARS[ch].walk));
      p.lean+=(f.vx*f.facing-Math.abs(f.vx))*1.2;
    }
    return p;
  }
  if(f.state==='jump'){
    const p=relativeFrame(ch,'jump',clamp((f.vy+10)/20)*(ANIMATION_CLIPS.jump.frames-1)/ANIMATION_SUBFRAMES,base);p.lean+=f.vx*f.facing*1.2;return p;
  }
  if(f.state==='dash')return relativeFrame(ch,'dash',f.animT,base);
  if(f.state==='hit')return relativeFrame(ch,'hit',f.stateT,base);
  if(f.state==='getup')return relativeFrame(ch,'getup',f.stateT,base);
  if(f.state==='win')return relativeFrame(ch,'win',f.animT*ANIMATION_STYLE[ch].tempo/.075,base);
  if(f.state==='block'){
    const p=relativeFrame(ch,'guard',f.animT,base),shock=Math.exp(-f.stateT*.25)*Math.sin(f.stateT*1.25);
    p.lean-=shock*3;p.head-=shock*4;p.fa2+=shock*7;p.ba2-=shock*5;return p;
  }
  return proceduralMotion(ch,base,f);
}

export function menuAnimation(ch: CharId, poseName: string, time: number): Pose {
  const def = CHARS[ch], base = def.poses[poseName] || def.poses.idle;
  return motionAnimation(ch, base, { state: poseName === 'win' ? 'win' : 'ground', stateT: 30, animT: time,
    vx: 0, vy: 0, walking: 0, facing: 1, crouch: poseName === 'crouch', guard: false, landLag: 0 });
}

const illustrationTracks=new WeakMap<object,Map<string,{name:string;time:number;changed:number;from:Pose;shown:Pose}>>();
/** Comic/Ultimate actors also transition between key poses instead of cutting
 * between illustrations. This cache is presentation-only and resets on seeks. */
export function cinematicAnimation(canvas:object,ch:CharId,poseName:string,time:number,flip:boolean):Pose {
  let tracks=illustrationTracks.get(canvas);if(!tracks){tracks=new Map();illustrationTracks.set(canvas,tracks);}
  const key=ch+':'+flip,target=menuAnimation(ch,poseName,time),old=tracks.get(key);
  if(!old||time<old.time||time-old.time>12){tracks.set(key,{name:poseName,time,changed:time-6,from:target,shown:target});return target;}
  if(old.name!==poseName){old.from=old.shown;old.name=poseName;old.changed=time;}
  old.shown=mixAnimation(old.from,target,ease((time-old.changed)/6));old.time=time;
  return old.shown;
}
