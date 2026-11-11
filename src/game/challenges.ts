import { RANGED_MOVES } from './data';
import type { CharId } from './data';
export const TRAINING_CHALLENGES = [
 {id:'transform',title:'Dois estoques, uma forma',description:'Ative uma transformação sem ser interrompido.',hint:'Guarde 200 ULT. Em neutro, use F / FORMA com fôlego. A preparação pode ser punida.',metric:'transform',target:1,unit:'forma ativa'},
 {id:'stamina',title:'Respira e responde',description:'Recupere 50 de fôlego descansando.',hint:'Gaste stamina com golpes e mobilidade, depois solte os ataques em neutro.',metric:'stamina',target:50,unit:'fôlego recuperado'},
 {id:'energy',title:'Energia não é Ultimate',description:'Acumule 40 de energia com Rickzera.',hint:'Segure C / CARREGAR em neutro. A Cruz de Energia impede a recarga enquanto está ativa.',metric:'energy',target:40,unit:'energia carregada'},
 {id:'hits',title:'Primeiro contato',description:'Acerte 5 golpes no adversário.',hint:'Aproxime-se e use soco ou chute.',metric:'hits',target:5,unit:'acertos'},
 {id:'low',title:'Rasteiras de respeito',description:'Acerte 3 ataques agachados.',hint:'Segure baixo e use soco ou chute.',metric:'low',target:3,unit:'rasteiros'},
 {id:'air',title:'Domínio dos ares',description:'Acerte 2 ataques aéreos.',hint:'Pule perto do adversário e ataque durante o salto.',metric:'air',target:2,unit:'aéreos'},
 {id:'jump',title:'Sai do chão',description:'Execute 5 saltos.',hint:'Solte o comando de pulo antes de saltar novamente.',metric:'jump',target:5,unit:'saltos'},
 {id:'dash',title:'Passo relâmpago',description:'Execute 3 dashes.',hint:'Toque duas vezes rapidamente na mesma direção.',metric:'dash',target:3,unit:'dashes'},
 {id:'crouch',title:'Perfil baixo',description:'Fique agachado por 3 segundos no total.',hint:'Mantenha o direcional para baixo.',metric:'crouch',target:180,unit:'quadros'},
 {id:'block',title:'Muralha',description:'Defenda 3 golpes da IA.',hint:'Segure Defesa: altos e médios. Baixo + Defesa: baixos e médios. Pode manter o botão durante hitstun.',metric:'block',target:3,unit:'bloqueios',cpu:true},
 {id:'combo',title:'Três é combo',description:'Conecte um combo de pelo menos 3 acertos.',hint:'Combine soco, chute e especial sem deixar o rival se recuperar.',metric:'combo',target:3,unit:'no combo'},
 {id:'special',title:'Arsenal completo',description:'Use os 3 especiais diferentes com efeito real.',hint:'Acerte golpes; com Santox, evite um ataque usando ESP 3. Com Jao ou H?D?SH, limite um rival em movimento no tabuleiro.',metric:'special',target:3,unit:'especiais'},
 {id:'damage',title:'Pressão constante',description:'Cause 500 de dano acumulado.',hint:'O boneco se recupera: continue variando seus golpes.',metric:'damage',target:500,unit:'de dano'},
 {id:'super',title:'Assinatura final',description:'Acerte uma ULT.',hint:'A barra fica cheia no treino. Aproxime-se antes de ativar.',metric:'super',target:1,unit:'ULT acertada'},
 {id:'range',title:'Sem spam',description:'Use 3 golpes à distância e espere o cooldown terminar.',hint:'Durante os 5 segundos, use corpo a corpo ou defenda.',metric:'range',target:1,unit:'cooldown concluído',ranged:true},
 {id:'turn',title:'De olho no outro lado',description:'Execute 3 viradas manuais no chão.',hint:'Use Virar (Q por padrão ou o botão VIRAR). Solte entre apertos; a direção fica manual até receber um golpe ou entrar numa sequência.',metric:'turn',target:3,unit:'viradas'},
 {id:'perfect',title:'No último instante',description:'Faça 3 defesas perfeitas.',hint:'Aperte Defesa até 3 frames antes do contato, estando livre. Segurar não renova a janela. Caetano também conta com sua Leitura.',metric:'perfect',target:3,unit:'perfeitas',cpu:true},
 {id:'blockLow',title:'Base firme',description:'Bloqueie 3 golpes baixos da IA.',hint:'Baixo + Defesa. Médios também são bloqueados; ataques que exigem defesa em pé continuam perigosos. O HUD mostra quando você está livre.',metric:'blockLow',target:3,unit:'baixos defendidos',cpu:true},
] as const;
export type ChallengeId=(typeof TRAINING_CHALLENGES)[number]['id'];
export interface ChallengeProgress {id:ChallengeId;current:number;done:boolean;seen:string[]}
export const challengeDefinition=(id:ChallengeId)=>TRAINING_CHALLENGES.find(c=>c.id===id)!;
export const challengeAvailable=(id:ChallengeId,ch:CharId)=>(id!=='range'||RANGED_MOVES[ch].length>0)&&(id!=='energy'||ch==='rickzera');
const STORE='dedilho-wars-training-badges-v1';
export function completedChallenges():string[]{try{const x=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(x)?x.filter(v=>typeof v==='string'):[]}catch{return []}}
export function saveChallengeBadge(id:ChallengeId){try{localStorage.setItem(STORE,JSON.stringify([...new Set([...completedChallenges(),id])]))}catch{/* badges are optional when browser storage is unavailable */}}
