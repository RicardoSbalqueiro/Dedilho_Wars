import type {CharId} from './data';
export interface UltimateBeat {frame:number;damage:number;pose:string;caption:string}
const beats=(frames:number[],damages:number[],poses:string[],caption:string):UltimateBeat[]=>frames.map((frame,i)=>({frame,damage:damages[i],pose:poses[i%poses.length],caption:i===frames.length-1?caption:''}));
// Single source for both actual damage contacts and cinematic contact poses.
export const WOC_ULTIMATES:Partial<Record<CharId,{duration:number;beats:UltimateBeat[]}>>={
 caetano:{duration:180,beats:beats([30,48,66,84,102,132],[30,35,35,40,50,110],['pL_a','pM_a','kM_a','dedo_a','pH_a','kH_a'],'KARATEKA!')},
 rickzera:{duration:180,beats:beats([30,48,66,84,102,132],[28,32,36,40,44,90],['pL_a','kL_a','pM_a','kM_a','pH_a','kH_a'],'COMBO WISE!')},
 bieu:{duration:180,beats:beats([42,63,84,105,132],[35,35,35,35,130],['pL_a','pM_a','kM_a','pH_a'],'CAPÃO REDONDO!')},
 aneninha:{duration:180,beats:beats([42,63,84,105,132],[35,35,35,35,130],['pL_a','kM_a','pM_a','pH_a'],'OSASCO!')},
 patrick:{duration:180,beats:beats([45,78,132],[90,70,140],['w1_a','w2_a','w3_a'],'COLISÃO INVENCÍVEL!')},
 gabrielzin:{duration:180,beats:beats([50,90,132],[60,80,130],['w1_a','w2_a','win'],'KAWAI!')},
 ulisses:{duration:180,beats:beats([38,56,74,92,132],[40,40,40,40,120],['w1_a','pH_a','kH_a'],'RAKUYO!')},
 felipence:{duration:180,beats:beats([50,84,132],[70,80,125],['w1_a','w3_a','w2_a'],'MY IMMORTAL!')},
 hdsh:{duration:180,beats:beats([48,90,132],[50,50,100],['w1_a','w2_a','w3_a'],'FULL BOX 200!')},
};
export function ultimatePose(ch:CharId,frame:number){const track=WOC_ULTIMATES[ch];return track?.beats.filter(b=>b.frame<=frame).at(-1)?.pose??'taunt';}
