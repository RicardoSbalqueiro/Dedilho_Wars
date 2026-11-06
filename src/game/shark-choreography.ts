// Shared cinematic beats: drawing never applies damage or changes simulation time.
export const SHARK_KISS_DAMAGE=64;
export const SHARK_ULT_DURATION=210;
export const SHARK_ULT_TAIL_FRAME=138;
export const SHARK_ULT_THROW=700;
export const SHARK_ULT_BEATS=[[60,12],[82,12],[104,12],[SHARK_ULT_TAIL_FRAME,254]] as const;
export const SHARK_ULT_DAMAGE=SHARK_ULT_BEATS.reduce((sum,[,damage])=>sum+damage,0);
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export function sharkUltMotion(t:number){
  return {
    phase:t<30?'transform':t<52?'approach':t<116?'lick':t<SHARK_ULT_TAIL_FRAME?'windup':t<148?'tail':t<190?'flight':'restore',
    transform:clamp(t/30),restore:clamp((t-190)/20),
    tongue:Math.max(0,...SHARK_ULT_BEATS.slice(0,3).map(([at])=>1-Math.abs(t-at)/8)),
    windup:clamp((t-116)/22),flight:clamp((t-SHARK_ULT_TAIL_FRAME)/47),
  };
}
