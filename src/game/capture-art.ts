import type {Game,Fighter} from './engine';
import type {DrawOpts} from './rig';
/** Existing capture movement and contacts remain in the engine. */
export function captureArtOptions(g:Game,f:Fighter):Partial<DrawOpts>{
 const s=g.seq;if(!s||s.kind.startsWith('super'))return {};
 if(s.a===f){
  const clips:Record<string,string>={throw:'throw',puxao:'s2',mordida:'s3',engole:'s2',moon:'s1',vampire:'s2',cupid:'s2'};
  const clip=clips[s.kind];if(!clip)return {};
  const at=s.kind==='throw'?28:s.kind==='moon'?25:s.kind==='vampire'||s.kind==='cupid'?32:s.kind==='engole'?58:s.kind==='puxao'?51:s.kind==='mordida'?12:32;
  const progress=s.t<at?s.t/Math.max(1,at)*.5:.5+(s.t-at)/Math.max(1,s.dur-at)*.5;
  return {actionClip:clip,actionProgress:Math.max(0,Math.min(.999,progress))};
 }
 if(s.d===f){const index=f.poseName==='down'?7:f.y<0?6:2;return {actionClip:'react',actionProgress:(index+.01)/12};}
 return {};
}
