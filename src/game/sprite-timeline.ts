import type {DrawOpts} from './rig';
/** Drawing selection only: no simulation time, damage or collision changes. */
export interface DrawnFrame {bank:'base'|'motion';index:number}
const b=(index:number):DrawnFrame=>({bank:'base',index}),n=(index:number):DrawnFrame=>({bank:'motion',index});
const WALK=[b(2),n(1),n(0),b(3),n(3),n(2)] as const;
const clamp=(v:number)=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
const part=(p:number,frames:readonly DrawnFrame[])=>frames[Math.min(frames.length-1,Math.floor(clamp(p)*frames.length))];
export function sampleDrawnFrame(legacy:number,o:DrawOpts):DrawnFrame {
 const p=clamp(o.spriteProgress??0),state=o.spriteState??(o.spritePhase?'attack':legacy===2||legacy===3?'walk':undefined);
 if(state==='walk')return WALK[((Math.floor((o.time||0)/4.5)%WALK.length)+WALK.length)%WALK.length];
 if(o.spriteAction==='getup')return part((o.spriteStateTime??0)/24,[b(7),b(4),b(0)]);
 if(state==='charge'&&o.spriteAction==='transform')return part((o.spriteStateTime??0)/36,[b(0),n(4),b(11)]);
 if(state!=='attack')return b(legacy);
 const phase=o.spritePhase??'active',low=/^(cP|cK)|sweep|lowkick|kicklow|slide|crouch/i.test(o.spriteMove??o.poseName??'');
 const weapon=o.normalAccessory==='katana'||o.normalAccessory==='guitar';
 if(low){
  if(o.spriteKind==='kick'&&!weapon){
   if(phase==='startup')return p<.6?b(7):n(8);
   if(phase==='active')return p<.65?n(9):n(10);
   return p<.3?n(10):b(7);
  }
  return phase==='active'?n(11):phase==='recovery'&&p<.22?n(11):b(7);
 }
 if(o.spriteMove==='headbutt')return phase==='startup'?b(0):phase==='active'?n(4):p<.5?n(7):b(0);
 if(o.spriteAir&&phase==='startup'&&p<.3)return b(8);
 const kick=o.spriteKind==='kick'||legacy===6&&o.spriteKind!=='punch';
 if(weapon&&kick){
  if(phase==='startup')return part(p,[b(0),n(8),b(6),n(9)]);
  if(phase==='active')return n(10);
  return part(p,[n(10),n(7),n(4),b(0)]);
 }
 if(kick){
  if(phase==='startup')return part(p,[b(0),b(4),n(8),n(9)]);
  if(phase==='active')return p<.65?b(6):n(10);
  return part(p,[n(10),n(8),b(4),b(0)]);
 }
 if(phase==='startup')return part(p,[b(0),n(4),b(4),n(5)]);
 if(phase==='active')return p<.55?b(5):n(6);
 return part(p,[n(6),n(7),n(4),b(0)]);
}
export const DRAWN_WALK_FRAMES=WALK;
