import type { CharId } from './data';
export const FIGHTER_STYLE:Record<CharId,{name:string;help:string;victory:string}>={
 caetano:{name:'TÉCNICO',help:'Defenda no último instante para carregar a Precisão. Ela fortalece o próximo Dedilho. Confirme Dedilho em Chute para continuar o combo.',victory:'A TÉCNICA VENCEU A TEORIA'},
 orango:{name:'PRESSÃO',help:'Acertos seguidos acumulam até 3 de Ímpeto: mais dano e avanço. Ser atingido ou recuar por muito tempo encerra a pressão.',victory:'A SELVA TEM UM CAMPEÃO'},
 renngotti:{name:'CONTROLE DE ALCANCE',help:'Microfones que não acertam viram armadilhas no chão. Use Grito para ampliar a ressonância dessas zonas.',victory:'O MICROFONE FICOU COM ELE'},
 aneninha:{name:'IMPROVISO',help:'Baixo + ESP 1 troca o soco por uma rasteira. Frente + ESP 2 pinta atrás do rival próximo. Varie os lados e a altura dos ataques.',victory:'OSASCO EM RITMO DE FESTA'},
 tubarao:{name:'AGARRÕES',help:'Aproxime-se, ameace com Mordida e use Engole para punir quem só defende.',victory:'FISCALIZAÇÃO CONCLUÍDA'},
 rickzera:{name:'MOBILIDADE',help:'Controle a distância com notas e Pix; mude a trajetória com salto duplo.',victory:'O PIX DA VITÓRIA CAIU'},
 bieu:{name:'ARMADILHAS',help:'Misture o Rato rasteiro, a Pichação e o avanço da Chave de Fenda.',victory:'PRESTÍGIO NA ARENA'},
 nomad:{name:'PROJÉTEIS',help:'Alterne Burger, tiros altos e Boomerang; respeite o cooldown de distância.',victory:'O LOBBY TEM NOVO DONO'},
};
const lines:Partial<Record<CharId,Partial<Record<CharId,string>>>>={
 caetano:{orango:'Hoje a técnica doma a selva.',renngotti:'Pode gritar. Eu conto os frames.',aneninha:'Teu ritmo tem guarda baixa.'},
 orango:{caetano:'Quero ver o dedilho segurar isto!',renngotti:'Microfone não segura orangotango!',aneninha:'A selva também sabe dançar!'},
 renngotti:{caetano:'Esse dojo agora tem microfone.',orango:'Teu rugido está sem alcance.',aneninha:'Hoje eu faço a trilha!'},
 aneninha:{caetano:'Tenta prever o passo de Osasco!',orango:'Vem dançar, rei da selva!',renngotti:'Aumenta o som da Bolívia!'},
};
const defaults:Record<CharId,string>={caetano:'Um golpe. Uma teoria comprovada.',orango:'Entrou na selva, aguenta a pressão!',renngotti:'Alcance máximo. Volume também.',aneninha:'Osasco muda o passo sem avisar!',tubarao:'A fiscalização chegou na arena!',rickzera:'Pode parcelar essa derrota.',bieu:'O muro já sabe o campeão.',nomad:'O próximo round é no meu lobby!'};
export const matchupLine=(a:CharId,b:CharId)=>lines[a]?.[b]||(a===b?'Até meu espelho vai aprender.':defaults[a]);
export const FINISHER_CALLS:Record<CharId,string>={caetano:'Dedo de precisão absoluta!',orango:'A selva encerrou o expediente!',renngotti:'Direto para a lua, com áudio!',aneninha:'Osasco fez a festa inteira!',tubarao:'Beijo de fiscalização aprovado!',rickzera:'Transferência encerrada em seis vezes!',bieu:'Prestígio carimbado no asfalto!',nomad:'O lobby fechou para balanço!'};
