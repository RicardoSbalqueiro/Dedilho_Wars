import {mobileGraphics} from './mobile-settings';
import {settings} from './visual-settings';

const LEVELS=[{ghosts:1,rays:16,shards:6,particles:180},{ghosts:2,rays:26,shards:9,particles:360},{ghosts:3,rays:42,shards:15,particles:700}] as const;
let average=0,samples=0,slow=0,fast=0,penalty=0;
/** Measured paint cost affects cosmetic detail only. No input, simulation tick,
 * collision, sprite stature or network payload depends on this local budget. */
export function recordDrawCost(ms:number){
 if(!Number.isFinite(ms)||ms<0)return;ms=Math.min(ms,100);
 average=samples?average*.94+ms*.06:ms;samples++;
 if(average>12){slow++;fast=0;if(slow>=20){penalty=Math.min(2,penalty+1);slow=0;}}
 else if(average<7){fast++;slow=0;if(fast>=150){penalty=Math.max(0,penalty-1);fast=0;}}
}
export function effectDetail(){
 const base=mobileGraphics()==='auto'?1:2;
 const level=settings.effects==='light'?0:settings.effects==='full'?2:Math.max(0,base-penalty);
 return LEVELS[level];
}
export const visualBudgetStats=()=>({average,samples,penalty,...effectDetail()});
export function resetVisualBudget(){average=samples=slow=fast=penalty=0;}
