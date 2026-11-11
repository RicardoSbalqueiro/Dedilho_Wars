import type { CharId } from './data';
export const FIGHTER_STYLE:Record<CharId,{name:string;help:string;victory:string}>={
 patrick:{name:'COURAÇA E CONTRA-ATAQUE',help:'Escudo tem armadura só na janela ativa. Investida e Punho cobram preparação; agarrões vencem a proteção.',victory:'O REI TATU SEGUE EM PÉ'},
 gabrielzin:{name:'CHARME E CAPTURA',help:'Projéteis rosas criam espaço para o Abraço. Captura exige curta distância e recuperação do rival.',victory:'O CHARME TOMOU A ARENA'},
 ulisses:{name:'SANGUE E ALCANCE',help:'Ataque com a katana nos normais, capture sangue com Presas e guarde estoques para a regeneração.',victory:'A NOITE PERTENCE AO NEFASTO'},
 felipence:{name:'PRESSÃO SONORA',help:'Normais golpeiam com a guitarra. Riff empurra e Pulso afasta e Lamento lança uma nota. Respeite a distância e o fôlego.',victory:'O ÚLTIMO ACORDE É DELE'},
 hdsh:{name:'ANÁLISE E TERRITÓRIO',help:'Controle o chão com Go, intercepte com setas e anuncie o airdrop. Salto e acertos desfazem sua zona.',victory:'A ANÁLISE FECHOU O BOX'},
 caetano:{name:'TÉCNICO',help:'Defenda no último instante para carregar a Precisão. Ela fortalece o próximo Dedilho. Confirme Dedilho em Chute para continuar o combo.',victory:'A TÉCNICA VENCEU A TEORIA'},
 orango:{name:'PRESSÃO',help:'Acertos seguidos acumulam até 3 de Ímpeto: mais dano e avanço. Ser atingido ou recuar por muito tempo encerra a pressão.',victory:'A SELVA TEM UM CAMPEÃO'},
 renngotti:{name:'CONTROLE DE ALCANCE',help:'Microfones que não acertam viram armadilhas no chão. Use Grito para ampliar a ressonância dessas zonas.',victory:'O MICROFONE FICOU COM ELE'},
 aneninha:{name:'IMPROVISO',help:'Baixo + ESP 1 troca o soco por uma rasteira. Frente + ESP 2 pinta atrás do rival próximo. Varie os lados e a altura dos ataques.',victory:'OSASCO EM RITMO DE FESTA'},
 tubarao:{name:'AGARRÕES',help:'Mordida avança, Beijo pressiona de perto e Engole pune a guarda. A ULT termina com uma rabada de longa distância.',victory:'FISCALIZAÇÃO CONCLUÍDA'},
 rickzera:{name:'MOBILIDADE',help:'Carregue energia em neutro ou ao receber dano. Converta em orbes, punho projetado e salto elevado.',victory:'O PIX DA VITÓRIA CAIU'},
 bieu:{name:'ARMADILHAS',help:'Misture o Rato rasteiro, a Pichação e o avanço da Chave de Fenda.',victory:'PRESTÍGIO NA ARENA'},
 nomad:{name:'PROJÉTEIS',help:'Alterne Burger Cósmico, Soco Gigante e Boomerang; respeite o cooldown de distância.',victory:'O LOBBY TEM NOVO DONO'},
 santox:{name:'ALCANCE E ESQUIVA',help:'Soco elástico domina a média distância. Chute do Coelho é alto; Quarta Parede evita golpes por 0,3 s, com preparação e recarga de 8 s.',victory:'O ROTEIRO MUDOU DE DONO'},
 jao:{name:'CONTROLE E CÁLCULO',help:'O tabuleiro reduz o movimento no chão por até 3 s. Um por vez: pular ou acertar Jao rompe o controle. Alterne fórmulas e bola.',victory:'XEQUE-MATE NA ARENA'},
 jane:{name:'MOBILIDADE E GADGETS',help:'Segure ESP 2 para manter a moto. Solte antes de 5 s: ultrapassar derruba a moto e deixa Jane tonta por 1 s. Recarga de 3 s; baixos interrompem seu deslize.',victory:'DEPLOY CONCLUÍDO SEM REUNIÃO'},
 cristyan:{name:'MUAY THAI E ESPAÇO',help:'Teep cria distância; Soco Poderoso arremessa o rival, mas prepara e recupera devagar. Pirueta acerta uma vez e pode ser punida.',victory:'A REDE NÃO AGUENTOU O PESO'},
 eneas:{name:'CIÊNCIA DE MÉDIO ALCANCE',help:'Voz empurra, ECG pressiona e 5 → 6 lança e derruba. Os três especiais compartilham o limite de distância. Sem invulnerabilidade.',victory:'MEU NOME É CAMPEÃO!'},
};
const lines:Partial<Record<CharId,Partial<Record<CharId,string>>>>={
 caetano:{orango:'Hoje a técnica doma a selva.',renngotti:'Pode gritar. Eu conto os frames.',aneninha:'Teu ritmo tem guarda baixa.'},
 orango:{caetano:'Quero ver o dedilho segurar isto!',renngotti:'Microfone não segura orangotango!',aneninha:'A selva também sabe dançar!'},
 renngotti:{caetano:'Esse dojo agora tem microfone.',orango:'Teu rugido está sem alcance.',aneninha:'Hoje eu faço a trilha!'},
 aneninha:{caetano:'Tenta prever o passo de Osasco!',orango:'Vem dançar, rei da selva!',renngotti:'Aumenta o som da Bolívia!'},
 santox:{jao:'Você calculou a pessoa atrás da tela?',caetano:'Teu dedilho alcança a quarta parede?',aneninha:'Se mudar o ritmo, eu mudo o roteiro.'},
 jao:{santox:'Até o caos tem uma solução.',caetano:'Hoje a técnica encontra o cálculo.',orango:'Força bruta não dá xeque-mate.'},
 jane:{jao:'Pode calcular. Eu já dei deploy.',cristyan:'Teu descanso é na rede. O meu é no laptop.',eneas:'Doutor, meu código está com sono.'},
 cristyan:{jane:'Moto não vale na roda de treino!',caetano:'Hoje a teoria encontra um teep.',eneas:'Pode falar. Eu espero o intervalo.'},
 eneas:{jane:'Isso não é sono, é economia de energia!',jao:'Matemática também é ciência!',cristyan:'Vou medir esse batimento!'},
};
const defaults:Record<CharId,string>={patrick:'Couraça também exige estratégia.',gabrielzin:'O charme também tem frame data.',ulisses:'O sangue conta uma história.',felipence:'A próxima nota vai te alcançar.',hdsh:'O padrão já está na minha análise.',caetano:'Um golpe. Uma teoria comprovada.',orango:'Entrou na selva, aguenta a pressão!',renngotti:'Alcance máximo. Volume também.',aneninha:'Osasco muda o passo sem avisar!',tubarao:'A fiscalização chegou na arena!',rickzera:'Pode parcelar essa derrota.',bieu:'O muro já sabe o campeão.',nomad:'O próximo round é no meu lobby!',santox:'A câmera também está me olhando?',jao:'Já calculei os próximos três lances.',jane:'Não me acorde antes do deploy.',cristyan:'Na minha rede, o descanso é curto.',eneas:'Meu nome é Acreano! E agora é ciência!'};
export const matchupLine=(a:CharId,b:CharId)=>lines[a]?.[b]||(a===b?'Até meu espelho vai aprender.':defaults[a]);
export const FINISHER_CALLS:Record<CharId,string>={patrick:'Colisão invencível concluída!',gabrielzin:'Kawai em volume máximo!',ulisses:'Rakuyo encerrou a noite!',felipence:'O último acorde venceu!',hdsh:'Full box! Duzentos!',caetano:'Dedo de precisão absoluta!',orango:'A selva encerrou o expediente!',renngotti:'Direto para a lua, com áudio!',aneninha:'Osasco fez a festa inteira!',tubarao:'Beijo de fiscalização aprovado!',rickzera:'Transferência encerrada em seis vezes!',bieu:'Prestígio carimbado no asfalto!',nomad:'O lobby fechou para balanço!',santox:'O coelho saiu do roteiro!',jao:'Xeque-mate absoluto! A conta fechou!',jane:'Deploy do AreiaZord autorizado!',cristyan:'Sentença da rede! Hora de acordar!',eneas:'Cinquenta e seis no placar! Meu nome é Acreano!'};
