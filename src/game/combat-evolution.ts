import type {CharId,Move} from './data';

export const GUARD_RULES={max:100,delay:135,regen:.32,breakFrames:42,restore:45} as const;
export const STANDING_COMBO_LIMIT=10;
export const SIGNATURES:Record<CharId,{name:string;buttons:string;art:string;guard:number}>={
 caetano:{name:'Kata Senbukan',buttons:'pkppkp',art:'s2',guard:26},
 orango:{name:'Fúria da Selva',buttons:'pppkpk',art:'s1',guard:34},
 tubarao:{name:'Maré Predatória',buttons:'pkkppk',art:'s1',guard:30},
 rickzera:{name:'Fluxo de Energia',buttons:'ppkpkp',art:'pH',guard:24},
 bieu:{name:'Malícia do Capão',buttons:'pkpkkp',art:'s1',guard:24},
 nomad:{name:'Combo do Lobby',buttons:'ppkkpk',art:'s2',guard:28},
 renngotti:{name:'Sem Controle',buttons:'pkpkpp',art:'pH',guard:32},
 aneninha:{name:'Passo de Osasco',buttons:'pkkkkp',art:'s1',guard:24},
 santox:{name:'Erro de Continuidade',buttons:'ppkppk',art:'s1',guard:24},
 jao:{name:'Xeque em Seis',buttons:'pppkkp',art:'pH',guard:24},
 jane:{name:'Protocolo de Impacto',buttons:'pkkpkp',art:'pH',guard:26},
 cristyan:{name:'Seis Armas',buttons:'pkkkpp',art:'s1',guard:30},
 eneas:{name:'Sequência Nacional',buttons:'ppppkk',art:'pH',guard:32},
 patrick:{name:'Pressão Blindada',buttons:'ppkkkk',art:'s3',guard:34},
 gabrielzin:{name:'Charme em Cadeia',buttons:'pkkkpk',art:'pH',guard:22},
 ulisses:{name:'Valsa do Nefasto',buttons:'pkpppk',art:'pH',guard:28},
 felipence:{name:'Cadência do Caos',buttons:'ppkkkp',art:'s1',guard:30},
 hdsh:{name:'Padrão Decifrado',buttons:'pkpkpk',art:'pH',guard:24},
};
const standing=/^(p[LMH]|k[LMH])$/;
export function signatureContinuation(ch:CharId,history:readonly string[],button:'p'|'k',moves:Record<string,Move>):Move|undefined{
 const s=SIGNATURES[ch],n=history.length;
 if(n<2||n>=s.buttons.length||history.some((id,i)=>!standing.test(id)||id[0]!==s.buttons[i])||s.buttons[n]!==button)return;
 const id=button+(n===3?'M':'H'),base=moves[id],last=n===s.buttons.length-1;
 // The first three ordinary hits retain their own timing. Only a confirmed,
 // exact command order unlocks the additional three grounded contacts.
 return {...base,...(n>=3?{startup:6,active:3,recovery:last?31:19,whiff:16,hitstun:last?27:24,kb:last?4:1.4,launch:0,rank:3,advance:[0,5,1.6] as [number,number,number]}:{}),
  signature:{step:n+1,total:s.buttons.length,name:s.name},label:`${s.name} · ${n+1}/${s.buttons.length}`,artMove:last?s.art:undefined,guardDamage:last?s.guard:undefined};
}
export function guardPressure(m:Move){return m.guardDamage??(m.kind==='super'?32:m.kind==='special'?Math.min(30,14+m.power*4):m.id==='headbutt'?22:m.rank>=3?22:m.rank===2?13:8)}
