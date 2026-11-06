import { CHARS } from './data';
import type { CharId, Move } from './data';
import { SUPER_CAPTURE_HEIGHT, SUPER_STARTUP_FRAMES } from './balance';

const PROJECTILES:Partial<Record<CharId,readonly string[]>>={rickzera:['s1','s2'],bieu:['s2','s3'],nomad:['s1','s2','s3'],renngotti:['s2'],aneninha:['s2'],jao:['s1','s2','s3'],jane:['s1'],eneas:['s2','s3']};
export function isProjectileMove(ch:CharId,id:string){return !!PROJECTILES[ch]?.includes(id)}
export const ULT_DAMAGE:Record<CharId,number>={caetano:320,orango:341,tubarao:290,rickzera:280,bieu:275,nomad:285,renngotti:315,aneninha:290,santox:240,jao:260,jane:250,cristyan:260,eneas:275};
const NOTES:Partial<Record<CharId,Record<string,string>>>={
 caetano:{s2:'Avanço 13/f entre os frames 6–14. Precisão: 73 de dano, 20 de hitstun; permite confirmar em ESP 1.',s3:'Preparação de 30f; 60f de recuperação ao errar. Não tem armadura.'},
 orango:{s1:'Sujeito ao limite de distância. Após o segundo normal médio confirmado, prepara em 16f (24f isolado). Momentum pode ampliar dano direto em até 9%.',s2:'Sem tech. Salte, afaste ou interrompa a preparação. Não captura em hitstun/blockstun.',s3:'Captura baixa, sem tech; avança 90 durante os ativos, depois desacelera. Saltar evita; erro custa 48f.'},
 tubarao:{s2:'Engole: 125 de dano, 18f de preparação, captura curta. Salte/afaste/interrompa. Erro custa 48f.',s3:'Armadura apenas dos frames 4–21; recebe 75% do dano. Agarrões vencem a armadura.'},
 rickzera:{s1:'Projétil linear: 12 unidades/f, um contato.',s2:'Três projéteis de 24, disparados nos offsets 0/8/16 após startup. Escala por contato.',s3:'Pulo adicional limitado; duração e recuperação reais dependem do pouso.'},
 bieu:{s2:'Rato baixo: defender agachado ou saltar. Velocidade 8/f.',s3:'Zona dura 64 ticks; até 4 contatos com intervalo 14. Blockstun 9 deixa brechas.'},
 nomad:{s1:'Projétil linear, 9/f.',s2:'Rajada alta: 3 disparos de 20 nos offsets 0/8/16. Agachar evita.',s3:'Um acerto na ida e um na volta. Retorna ao dono, não persegue o inimigo. Vida máxima 110.'},
 renngotti:{s1:'Captura curta, sem tech, lança alto para juggle. Salte/afaste/interrompa.',s2:'Máximo 2 microfones por dono. No chão: baixo, 28 de dano, raio 48, até 80 ticks.',s3:'Grito bloqueável. Ressonância: microfone ancorado passa a 35 de dano/raio 90 e dura no máximo 24 ticks.'},
 aneninha:{s1:'Baixo + ESP 1: rasteira de 78 de dano, hitbox baixa e lançamento menor.',s2:'3 contatos de 20, separados por 20 ticks; vida 96. Frente + ESP 2 pinta atrás do rival a menos de 220.',s3:'Grito de médio alcance; bloqueável e sujeito à recarga de distância.'},
 santox:{s1:'Alcance 370 sem avanço; recarga compartilhada de distância. 42f de recuperação no erro.',s2:'Golpe alto aéreo: o recovery da tabela não é executado no ar; pouso comprometido por 12f.',s3:'8f vulneráveis, 18f de invulnerabilidade, 28f vulneráveis; recarga 480 ticks. Sem dano.'},
 jao:{s1:'Uma zona, raio 110, 180 ticks, sem dano. Reduz movimento no chão em 35%. Saltar evita a lentidão; acertar Jao desfaz a zona.',s2:'Uma fórmula linear, 10/f, sem rastreamento. Encaixe após o segundo médio confirmado: 10f em vez de 18f de preparação.',s3:'Bola em arco, um quique, um contato. 62 de dano bruto; defesa e salto funcionam.'},
 jane:{s1:'Dois comandos de 18, offsets 0/10, velocidade 10/f. A dupla consome um uso de distância.',s2:'11–15 por contato, até 6; intervalo 30 ticks. Soltar entre 12 e 300 ticks lança uma arrancada: 3f de preparação, 16 ativos, 18 de dano e 24+8 de recuperação no erro. Compartilha os seis contatos. Exceder 300 causa tontura de 60; recarga 180.',s3:'Desliza baixo, vira e salta no frame 18. Chute giratório alto no ar a partir do 30: defenda em pé. Sem invulnerabilidade, baixos interrompem a passagem.'},
 cristyan:{s1:'Empurra bastante: vantagem de frames não garante alcance para punir.',s2:'21f de preparação, 48f comprometidos após errar. Sem armadura.',s3:'Um contato, hitbox também atrás; giro visual próprio, sem invulnerabilidade.'},
 eneas:{s1:'Grito bloqueável, usa recarga de distância.',s2:'ECG linear, 11/f. Um contato. Encaixe após o segundo médio confirmado: 12f de preparação em vez de 20f.',s3:'Dois números: 5 causa 28 e lança; 6 causa 34 e derruba. Segundo disparo após 10f, ambos bloqueáveis.'},
};
export function frameData(ch:CharId,id:string){
 const def=CHARS[ch],m=def.moves[id];
 if(id==='super')return {id,name:def.superName,damage:ULT_DAMAGE[ch],startup:SUPER_STARTUP_FRAMES,active:['santox','jao','jane','cristyan','eneas'].includes(ch)?24:34,recovery:34,whiff:0,hitstun:null,blockstun:null,x0:0,x1:100,chip:0,level:'captura',hitAdvantage:null,blockAdvantage:null,notes:`100 de barra. Preparação após a cinematográfica. Captura até altura ${SUPER_CAPTURE_HEIGHT}; salte ou interrompa a preparação. Armadura só no avanço ativo; recuperação vulnerável. Dano solo; escala de combo aplicada na entrada.`,variable:true};
 if(!m)throw new Error('Unknown move');
 const variable=!!m.air||!!m.grab||m.launch>0||m.dmg===0||isProjectileMove(ch,id)||(ch==='jane'&&id==='s2');
 return {id,name:m.label||({pL:'Soco leve',pM:'Soco médio',pH:'Soco forte',kL:'Chute leve',kM:'Chute médio',kH:'Chute forte',cP:'Soco agachado',cK:'Rasteira',jP:'Soco aéreo',jK:'Chute aéreo'} as Record<string,string>)[id]||id,damage:m.dmg,startup:m.startup,active:m.active,recovery:m.recovery,whiff:m.whiff,hitstun:m.hitstun,blockstun:m.blockstun,x0:m.hb[0],x1:m.hb[1],chip:m.kind==='normal'||m.grab?0:m.dmg*(m.chip??.04),level:m.grab?'captura':m.level==='low'?'baixo':m.level==='high'?'alto':'médio',hitAdvantage:variable?null:theoreticalAdvantage(m,'hit'),blockAdvantage:variable?null:theoreticalAdvantage(m,'block'),variable,notes:NOTES[ch]?.[id]||(m.air?'Altura e pouso determinam a recuperação real.':m.launch?'Lança: tempo para responder depende da trajetória e do juggle.':'Normais não causam chip. Cancelamento exige contato; erro mantém recuperação.')};
}
export function theoreticalAdvantage(m:Move,result:'hit'|'block'){
 return (result==='hit'?m.hitstun:m.blockstun)-(m.active-1+m.recovery);
}
