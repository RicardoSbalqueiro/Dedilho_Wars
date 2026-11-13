import {CHARS} from '../data';
import type {CharDef,CharId,Move} from '../data';
import type {Fighter} from '../engine';
export type TrainingNpcId='moderator'|'supreme';
export const TRAINING_NPCS={moderator:{id:'moderator',name:'Moderador de Twitchcity',short:'MODERADOR',base:'ulisses' as CharId,weapon:'Espada moderna',description:'Espada de energia estabilizada, armadura tática e jetpack. Unidade de arquivo do antigo governo, recriada no simulador.',hp:1000},supreme:{id:'supreme',name:'Moderador Supremo',short:'MODERADOR SUPREMO',base:'renngotti' as CharId,weapon:'Martelo de execução',description:'Comandante de armadura pesada, capa e jetpack avançado. Golpes lentos e fortes, com recuperação que pode ser punida.',hp:1250}} as const;
export function npcDefinition(id:TrainingNpcId):CharDef{
 const meta=TRAINING_NPCS[id],source=CHARS[meta.base],heavy=id==='supreme';
 const moves:Record<string,Move>=Object.fromEntries(Object.entries(source.moves).map(([key,m])=>[key,{...m,hb:[...m.hb] as Move['hb'],accessory:undefined,signature:m.signature?{...m.signature,name:heavy?'Protocolo de Execução':'Protocolo de Contenção'}:undefined}]));
 const normal=CHARS.caetano.moves.pH;
 moves.s1={...normal,id:'s1',kind:'special',rank:3,startup:heavy?24:12,active:6,recovery:heavy?34:22,whiff:14,dmg:heavy?115:68,hb:[15,heavy?175:160,-150,-30],hitstun:24,blockstun:19,poses:source.moves.pH.poses,label:heavy?'MARTELO DE EXECUÇÃO':'CORTE DE CONTENÇÃO',trail:'fw',grab:undefined,charge:false,dedilho:false,advance:[3,8,heavy?1.7:2.6]};
 moves.s2={...CHARS.caetano.moves.kH,id:'s2',kind:'special',startup:15,active:10,recovery:25,whiff:14,dmg:heavy?76:58,hb:[10,145,-132,-26],poses:source.moves.kH.poses,label:'AVANÇO TÁTICO',advance:[4,14,heavy?3:5],grab:undefined};
 moves.s3={...normal,id:'s3',kind:'special',startup:heavy?28:18,active:8,recovery:30,whiff:14,dmg:heavy?125:78,hb:[10,135,-205,-15],launch:9,launchVx:3.5,poses:source.moves.pH.poses,label:heavy?'ONDA DE IMPACTO':'ASCENSÃO DO JETPACK',trail:'fw',grab:undefined,charge:false,dedilho:false};
 return {...source,name:meta.name,short:meta.short,title:heavy?'COMANDANTE DOS MODERADORES':'FORÇA DE SEGURANÇA · ARQUIVO',color:'#a46cd9',color2:'#442052',glow:'#a8ff3b',hp:meta.hp,pushW:heavy?36:28,hurtH:heavy?194:180,crouchH:heavy?124:112,walk:heavy?3.4:4.2,walkBack:heavy?2.8:3.5,jumpVy:heavy?16.5:17.6,moves};
}
export function applyTrainingNpc(f:Fighter,id:TrainingNpcId){const def=npcDefinition(id);f.npc=id;f.def=def;f.maxHp=f.hp=f.dispHp=def.hp;return f;}
