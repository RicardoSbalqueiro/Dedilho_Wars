export interface MobileSettings {hand:'right'|'left';largeButtons:boolean;haptics:boolean;graphics:'auto'|'sharp'}
export const DEFAULT_MOBILE_SETTINGS:Readonly<MobileSettings>={hand:'right',largeButtons:false,haptics:false,graphics:'auto'};
const KEY='dedilho-mobile-v1';
export function normalizeMobileSettings(raw:unknown):MobileSettings{
 const r=raw&&typeof raw==='object'?raw as Record<string,unknown>:{};
 return {hand:r.hand==='left'?'left':'right',largeButtons:r.largeButtons===true,haptics:r.haptics===true,graphics:r.graphics==='sharp'?'sharp':'auto'};
}
function read(){try{return normalizeMobileSettings(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{return {...DEFAULT_MOBILE_SETTINGS}}}
let state=read();const listeners=new Set<()=>void>();
export const getMobileSettings=()=>state;
export const subscribeMobileSettings=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}};
export function setMobileSettings(update:Partial<MobileSettings>){
 const next=normalizeMobileSettings({...state,...update});if(JSON.stringify(next)===JSON.stringify(state))return;
 state=next;try{localStorage.setItem(KEY,JSON.stringify(state))}catch{/* preferences are optional */}
 listeners.forEach(fn=>fn());if(typeof window!=='undefined')window.dispatchEvent(new Event('dedilho-display-change'));
}
let coarse:MediaQueryList|undefined;
export function mobileGraphics():MobileSettings['graphics']|undefined{
 if(typeof matchMedia!=='function')return;
 coarse??=matchMedia('(pointer: coarse)');return coarse.matches?state.graphics:undefined;
}
export function touchHaptic(){if(state.haptics&&typeof navigator!=='undefined'&&typeof navigator.vibrate==='function')navigator.vibrate(8)}
/** Caps drawing only. The simulation and online/input pumps still run at every RAF. */
export class PaintCadence {
 private painted=-Infinity;
 constructor(private readonly fps:number){}
 due(now:number){if(!Number.isFinite(now))return false;const step=1000/this.fps,delta=now-this.painted;if(!Number.isFinite(this.painted)||delta>500||delta<-.5){this.painted=now;return true}if(delta<step-.5)return false;this.painted+=Math.max(1,Math.floor((delta+.5)/step))*step;return true;}
}
