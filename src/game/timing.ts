/** One wall-clock second always contains sixty simulation ticks. Rendering and
 * the number of poses in an animation must never change this rate. */
export const SIMULATION_HZ=60;
export const TICK_MS=1000/SIMULATION_HZ;
export const MAX_FRAME_GAP_MS=250;

export class FrameTimer {
  private last:number|null=null;
  private remainder=0;
  frames=0;
  deltaFrames=0;
  get fraction(){return this.remainder;}

  /** Drops time while paused/hidden and after a long interruption. Normal slow
   * frames (down to 4 Hz) still advance the same amount of game time. */
  sample(nowMs:number,running=true):number {
    this.deltaFrames=0;
    if(!Number.isFinite(nowMs))return 0;
    if(this.last!==null&&nowMs<this.last)return 0;
    const dt=this.last===null?0:nowMs-this.last;
    this.last=nowMs;
    if(!running||dt>MAX_FRAME_GAP_MS){this.remainder=0;return 0;}
    this.deltaFrames=dt/TICK_MS;
    this.frames+=this.deltaFrames;
    this.remainder+=this.deltaFrames;
    const ticks=Math.floor(this.remainder+1e-8);
    this.remainder=Math.max(0,this.remainder-ticks);
    return ticks;
  }

  /** Rebase without rewinding the animation or accumulating hidden-tab debt. */
  rebase(){this.last=null;this.remainder=0;this.deltaFrames=0;}
}
