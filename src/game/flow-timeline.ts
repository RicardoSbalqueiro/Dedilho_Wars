import type {CharId} from './data';
import type {DrawOpts} from './rig';

export const FLOW_BRIDGE_MOVES=['pL','pM','pH','kL','kM','kH'] as const;
export const FLOW_SUPPORT_POSES=['dashPush','dashStrideA','dashStrideB','dashBrake','jumpRise','jumpApex','jumpFall','land','guardEnter','guardBrace','guardLow','guardBreak'] as const;
export interface FlowFrame {atlas:string;frame:number;action:string}
const finite=(n:number|undefined,fallback=0)=>Number.isFinite(n)?n!:fallback;

/** Select real added drawings from authoritative state. Contact, damage and
 * recovery lengths remain entirely owned by the simulation. */
export function sampleFlowFrame(ch:CharId,o:DrawOpts):FlowFrame|undefined{
 const offset=o.transformation?12:0,t=Math.max(0,finite(o.spriteStateTime)),p=Math.max(0,Math.min(1,finite(o.spriteProgress)));
 if(o.actionClip&&o.actionClip!=='react')return;
 if(o.spriteState==='attack'){
  if(o.actionClip||o.actionProgress!==undefined)return;
  const index=FLOW_BRIDGE_MOVES.indexOf(o.spriteMove as typeof FLOW_BRIDGE_MOVES[number]);
  if(index<0)return;
  const part=o.spritePhase==='startup'&&p>=.68?0:o.spritePhase==='recovery'&&p<.34?1:-1;
  return part<0?undefined:{atlas:ch+'-bridges',frame:offset+index*2+part,action:o.spriteMove!};
 }
 let frame:number|undefined;
 if((o.spriteGuardBreak??0)>0)frame=(o.spriteGuardBreak??0)>9?11:8;
 else if(o.spriteAction==='dash'){
  const progress=t/Math.max(1,finite(o.spriteDashDuration,16));
  frame=progress<.19?0:progress<.48?1:progress<.77?2:3;
 }else if((o.spriteLanding??0)>0&&o.spriteAction==='ground')frame=7;
 else if(o.spriteState==='jump'){
  const vy=finite(o.spriteVelocityY,t<12?-5:t<20?0:5);
  frame=vy< -2.4?4:vy<=2.4?5:6;
 }else if(o.spriteState==='guard'){
  frame=o.spriteLow?10:o.spriteAction==='block'?9:finite(o.spriteGuardAge,10)<5?8:9;
 }
 return frame===undefined?undefined:{atlas:ch+'-support',frame:offset+frame,action:FLOW_SUPPORT_POSES[frame]};
}
