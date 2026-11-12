import {WOC_ULTIMATES} from './woc-choreography';
import {SHARK_ULT_BEATS} from './shark-choreography';
import type {CharId} from './data';
import type {DrawOpts} from './rig';

// Presentation contacts mirror the engine's existing sequences; drawing never
// applies a hit. Regression tests compare these instants with real HP changes.
export const OTHER_ULTIMATE_CONTACTS:Partial<Record<CharId,readonly number[]>>={
 orango:[4,12,20,28,36,44,52,60,68,76,154],tubarao:SHARK_ULT_BEATS.map(([t])=>t),nomad:[60],renngotti:[65],santox:[48,78,108,144],jao:[52,90,128,162],jane:[65,86,107,128,149],cristyan:[55,118,153],eneas:[143,178],
};
export function ultimateContacts(ch:CharId):readonly number[]{return WOC_ULTIMATES[ch]?.beats.map(b=>b.frame)??OTHER_ULTIMATE_CONTACTS[ch]??[132];}
export function ultimateDuration(ch:CharId):number{return WOC_ULTIMATES[ch]?.duration??({orango:215,tubarao:210,nomad:150,renngotti:155,santox:180,jao:195,jane:180,cristyan:185,eneas:195} as Partial<Record<CharId,number>>)[ch]??180;}
const DRAWING_CONTACTS:Partial<Record<CharId,readonly number[]>>={caetano:[3,7,11,15,19,22],rickzera:[3,7,11,15,19,22],bieu:[4,8,12,16,20],aneninha:[4,8,12,16,20],ulisses:[3,7,11,15,20],patrick:[9,14,19],gabrielzin:[7,13,18],felipence:[9,16,20],hdsh:[10,15,18],renngotti:[16],tubarao:[5,9,11,16],orango:[1,2,3,4,5,6,7,8,9,10,18],jane:[13,15,17,19,21],cristyan:[4,10,16],eneas:[17,20],santox:[4,9,15,20],jao:[4,10,16,21]};
export function ultimateBodyOptions(ch:CharId,time:number,duration:number,form=false):DrawOpts{
 const t=Math.max(0,time),p=Math.max(0,Math.min(1,t/Math.max(1,duration)));
 const opts:DrawOpts={time:t,transformation:form,formTime:t,actionClip:'ult',actionProgress:p};
 if(ch==='jane'){
  // Charging/morphing precedes the real five contacts. Keep the cannon's
  // illustrated firing/recoil cycle active until the final hit, then vent.
  const first=65,last=149,start=form?12:14,end=form?15:16;
  const frame=t<first?t/first*start:t<=last?start+Math.floor((t-first)/6)%(end-start+1):end+1+Math.min(23-end-1,(t-last)/Math.max(1,duration-last)*(24-end-1));
  opts.actionProgress=(frame+.01)/24;return opts;
 }
 if(ch==='nomad'){
  // The cannon is fired at tick 35. Recoil drawings continue while the actual
  // projectile flies; victim reactions are driven by the authoritative impact.
  const frame=t<35?t/35*15:t<105?[15,16,17,18,17,16][Math.floor((t-35)/4)%6]:19+Math.min(4,(t-105)/Math.max(1,duration-105)*5);
  opts.actionProgress=(frame+.01)/24;return opts;
 }
 const contacts=ultimateContacts(ch),indices=DRAWING_CONTACTS[ch]??contacts.map((_,i)=>3+i*18/Math.max(1,contacts.length-1));
 const marks:readonly (readonly [number,number])[]=[[0,0],...contacts.map((at,i)=>[at,indices[i]??20] as const),[duration,23.9]];
 for(let i=1;i<marks.length;i++)if(t<=marks[i][0]){const [a,x]=marks[i-1],[b,y]=marks[i];opts.actionProgress=(x+(y-x)*Math.max(0,Math.min(1,(t-a)/Math.max(1,b-a)))+.01)/24;break;}
 return opts;
}
