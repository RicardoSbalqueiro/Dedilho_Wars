import { CHAR_IDS } from './data';
import type { CharId } from './data';
import type { Action } from './input';

export type ComboKind='basic'|'advanced'|'punish';
export interface ComboResult {hits:number;damage:number;moves:string[];kind:ComboKind;freeAt:number|null}
export interface ComboStep {input:Action[];move:string;hint:string}
export interface ComboRoute {id:string;ch:CharId;name:string;level:'Básico'|'Intermediário'|'Aéreo';steps:ComboStep[];help:string}
const step=(move:string,input:Action[],hint='Confirme o acerto antes de continuar.'):ComboStep=>({move,input,hint});
const SPECIAL:Record<CharId,[Action,string]>={caetano:['s2','Dedilho técnico'],orango:['s1','Dedilho Supremo'],tubarao:['s1','Mordida do Fiscal'],rickzera:['s1','Franco confirmado'],bieu:['s1','Chave confirmada'],nomad:['s1','Lanche na sequência'],renngotti:['s2','Microfone no combo'],aneninha:['s1','Osasco confirmado'],santox:['s2','Chute do Coelho'],jao:['s2','Equação confirmada'],jane:['s2','Grau na sequência'],cristyan:['s1','Teep baiano'],eneas:['s2','Diagnóstico confirmado']};
export const COMBO_ROUTES:ComboRoute[]=CHAR_IDS.flatMap(ch=>{
 const [special,name]=SPECIAL[ch],longAir=!['orango','tubarao','eneas'].includes(ch);
 return [
  {id:`${ch}-two`,ch,name:'Um, dois!',level:'Básico',steps:[step('pL',['p']),step('kM',['k'])],help:'Dois golpes com soco e chute. Comece perto e aperte o segundo durante o impacto.'},
  {id:`${ch}-three`,ch,name:'Três tempos',level:'Básico',steps:[step('pL',['p']),step('kM',['k']),step('pH',['p'])],help:'Leve → médio → forte. O forte termina a cadeia; errar continua punível.'},
  {id:`${ch}-special`,ch,name,level:'Intermediário',steps:[step('pL',['p']),step('kM',['k']),step(special,[special])],help:ch==='jane'?'Confirme os dois normais em ESP 2. Soltar a moto inicia a arrancada; não exceda cinco segundos.':`Confirme os normais no especial. ${['orango','jao','eneas'].includes(ch)?'Este encaixe específico tem preparação reduzida após o médio confirmado.':'A preparação e a recuperação próprias do especial continuam valendo.'}`},
  {id:`${ch}-air`,ch,name:'Rasteira e perseguição',level:'Aéreo',steps:[step('cK',['down','k'],'Segure baixo e aperte chute: rasteira.'),step('jump',['up'],'Aperte salto nos seis frames após o lançamento confirmado.'),...(longAir?[step('jP',['p'],'Soco no ar, perto do rival.'),step('jK',['k'],'Confirme o soco em um chute aéreo.')]:[step('jK',['k'],'Chute no ar. A força do lançamento pede uma finalização curta.')])],help:'Rasteira baixa → salto de perseguição → ataque aéreo. O salto exige acerto; quatro contatos de juggle encerram as extensões.'},
 ] as ComboRoute[];
});
export const comboRoutes=(ch:CharId)=>COMBO_ROUTES.filter(r=>r.ch===ch);
export const comboRoute=(id:string)=>COMBO_ROUTES.find(r=>r.id===id);
export interface CoachEvent {type:'start'|'hit'|'block'|'jump'|'free'|'whiff';actor:0|1;move:string;serial:number;tick:number;hits:number;damage:number}
export interface ComboCoach {routeId:string;status:'ready'|'active'|'success'|'failed';progress:number;hits:number;damage:number;freeAt:number|null;notice:string;lastSerial:number}
export function newComboCoach(id:string):ComboCoach{return {routeId:id,status:'ready',progress:0,hits:0,damage:0,freeAt:null,notice:'Comece perto. O treinador conta acertos reais, não só botões.',lastSerial:-1}}
export function advanceComboCoach(c:ComboCoach,e:CoachEvent){
 if(c.freeAt!==null)return;
 const route=comboRoute(c.routeId);if(!route)return;
 if(e.type==='free'&&e.actor===1){
  if(c.progress>0){c.freeAt=e.tick;if(c.status==='active'){c.status='failed';c.notice='O rival recuperou o controle antes do fim. Confirme mais cedo ou ajuste a distância.'}}
  return;
 }
 if(e.actor!==0)return;
 if(e.type==='hit'&&c.status!=='failed'){c.hits=e.hits;c.damage=e.damage;}
 if(c.status==='failed'||c.status==='success')return;
 const expected=route.steps[c.progress];if(!expected)return;
 if(e.type==='start'){
  c.status='active';
  if(expected.move!==e.move){c.status='failed';c.notice='Golpe diferente da rota. Solte as direções e tente novamente.'}
 }else if(e.type==='block'||e.type==='whiff'){
  if(c.status==='active'){c.status='failed';c.notice=e.type==='block'?'Bloqueado: houve uma brecha ou o comando chegou tarde.':'O golpe errou. Aproxime-se antes de repetir.'}
 }else if((e.type==='jump'&&expected.move==='jump')||(e.type==='hit'&&e.move===expected.move&&e.serial!==c.lastSerial)){
  c.status='active';c.lastSerial=e.serial;c.progress++;
  if(c.progress===route.steps.length){c.status='success';c.notice='COMBO CORRETO! Todos os golpes da rota acertaram sem uma recuperação entre eles.'}
  else c.notice=route.steps[c.progress].hint;
 }
}
