// New model-sheet fighters. Numeric tuning is experimental; timings remain combat ticks.
import type {CharDef,Move,Pose} from './data';
export const NEW_FIGHTERS=['patrick','gabrielzin','ulisses','felipence','hdsh'] as const;
export type NewFighter=typeof NEW_FIGHTERS[number];
export function createWocFighters(normals:(power:number,lag:number,reach:number)=>Record<string,Move>,base:Record<string,Pose>):Record<NewFighter,CharDef>{
 const make=(id:NewFighter,name:string,color:string,hp:number,walk:number,reach:number,poses:Partial<Pose>[],specials:[string,string,string],superName:string,bio:string):CharDef=>{
  const ps:Record<string,Pose>=Object.fromEntries(Object.entries(base).map(([k,v])=>[k,{...v}]));
  ps.idle={...base.idle,...poses[0]};
  for(let i=0;i<3;i++){ps[`w${i+1}_s`]={...ps.idle,...poses[i+1],lean:(poses[i+1]?.lean??0)-12};ps[`w${i+1}_a`]={...ps.idle,...poses[i+1]};}
  const moves=normals(id==='patrick'?1.05:id==='gabrielzin'?.85:.95,id==='patrick'?2:0,reach);
  const timings=id==='patrick'?[[16,4,25,65],[19,6,30,78],[28,4,36,96]]:id==='gabrielzin'?[[15,3,24,38],[21,4,30,64],[18,3,26,42]]:id==='ulisses'?[[16,5,27,62],[20,3,32,58],[22,3,29,48]]:id==='felipence'?[[18,4,28,60],[20,6,30,66],[23,3,29,52]]:[[18,3,28,0],[20,3,27,46],[30,3,32,60]];
  for(let i=0;i<3;i++){const [startup,active,recovery,dmg]=timings[i];moves[`s${i+1}`]={...baseMove,id:`s${i+1}`,startup,active,recovery,dmg,whiff:10,hb:[15,135+reach,40,155],poses:[`w${i+1}_s`,`w${i+1}_a`],label:specials[i].toUpperCase()};}
  return {id,name,short:name.split(' ')[0].toUpperCase(),title:({patrick:'O EMPRESÁRIO DA COURAÇA',gabrielzin:'CARISMA EM COMBATE',ulisses:'O VAMPIRO DE TWITCHCITY',felipence:'A SINFONIA DOS CAMPEÕES',hdsh:'O ANALISTA DA ARENA'})[id],color,color2:'#262031',glow:color,hp,walk,walkBack:walk*.79,jumpVy:16,jumpVx:walk+1,dashVx:walk*2.5,dashDur:15,pushW:id==='patrick'?32:26,hurtH:id==='gabrielzin'?159:id==='patrick'?185:178,crouchH:106,moves,poses:ps,attrs:[{label:'VELOCIDADE',v:id==='patrick'?2:4},{label:'FORÇA',v:id==='patrick'?5:3},{label:'ALCANCE',v:reach>15?5:3},{label:'TÉCNICA',v:4}],specials:specials.map((name,i)=>({key:['U','I','O'][i],name,desc:''})),superName,quote:bio,bio};
 };
 const defs={
  patrick:make('patrick','PATRICK INVINCIBLE','#dc6464',1160,3.45,8,[{lean:2,fa1:48,fa2:-85,ba1:100,ba2:-90},{lean:8,fa1:-30,fa2:-110,ba1:75,ba2:-120},{lean:40,fa1:80,fa2:-100,ba1:110,ba2:-90},{lean:30,ba1:0,ba2:-5,fa1:95,fa2:-100}],['Escudo de Casco','Investida Blindada','Punho Couraçado'],'COLISÃO INVENCÍVEL','Ex-lutador de MMA. Armadura com compromisso e contra-ataques de perto.'),
  gabrielzin:make('gabrielzin','GABRIELZIN','#f472b6',930,4.45,-5,[{lean:6,fa1:40,fa2:-100,ba1:115,ba2:-65},{lean:16,fa1:0,fa2:-5,finger:1},{lean:25,fa1:0,fa2:-25,ba1:155,ba2:175},{lean:4,fa1:-35,fa2:-65,finger:1}],['Beijinho','Abraço de Cupido','Piscadinha'],'KAWAI!','Charme em combate: projéteis de coração e captura de perto, com preparação visível.'),
  ulisses:make('ulisses','ULISSES O NEFASTO','#b91c3c',1020,4.1,24,[{lean:3,fa1:60,fa2:-65,ba1:110,ba2:-80},{lean:24,fa1:-10,fa2:-5,ba1:140,ba2:-60},{lean:35,head:-12,fa1:25,fa2:-30,mouth:1},{lean:18,fa1:-10,fa2:0,finger:1}],['Distorção de Membros','Presas Sugadoras','Manipulação de Sangue'],'CORTES DE RAKUYO','Vampiro de Twitchcity. Capture sangue com as presas para sustentar a regeneração.'),
  felipence:make('felipence','FELIPENCE','#fb923c',1010,3.95,16,[{lean:4,fa1:50,fa2:-70,ba1:120,ba2:-55},{lean:22,fa1:28,fa2:-10,ba1:115,ba2:-40},{lean:-8,fa1:-40,fa2:-100,ba1:145,ba2:-120,mouth:1},{lean:22,fa1:30,fa2:-10,ba1:120,ba2:-50}],['Riff Impacto','Pulso de Som','Lamento Ressonante'],'MY IMMORTAL','Guitarrista de Lea Amy. Alcance musical e ondas sonoras com pausas para resposta.'),
  hdsh:make('hdsh','H?D?SH','#b667ff',980,3.85,6,[{lean:3,fa1:45,fa2:-90,ba1:110,ba2:-65},{lean:35,fa1:20,fa2:0,ba1:120,ba2:-65},{lean:10,fa1:-8,fa2:0,finger:1},{lean:0,fa1:-70,fa2:-110,ba1:115,ba2:-70}],['Atari de Território','Análise de Tendência','Airdrop Hunter'],'FULL BOX 200','Análise e desenvolvimento: feche território, intercepte trajetórias e anuncie o airdrop.'),
 };
 Object.assign(defs.patrick.moves.s1,{hb:[10,116,55,165],kb:7});
 Object.assign(defs.patrick.moves.s2,{advance:[15,27,8],hb:[15,155,35,170],kb:9});
 Object.assign(defs.patrick.moves.s3,{kb:10,pierce:.12,blockstun:18,launch:7,charge:true,whiff:16});
 Object.assign(defs.gabrielzin.moves.s1,{dmg:38,kb:6});
 Object.assign(defs.gabrielzin.moves.s2,{grab:'cupid',unblockable:true,hb:[0,92,0,160],advance:[16,22,5],whiff:18});
 Object.assign(defs.ulisses.moves.s1,{hb:[25,235,65,155],recovery:31,kb:7});
 Object.assign(defs.ulisses.moves.s2,{grab:'vampire',unblockable:true,hb:[0,88,0,170],whiff:18});
 Object.assign(defs.felipence.moves.s1,{hb:[15,195,45,160],kb:9});
 Object.assign(defs.felipence.moves.s2,{hb:[-110,145,20,175],kb:10,launch:5,whiff:16});
 Object.assign(defs.hdsh.moves.s3,{level:'high',launch:5,hitstun:23});
 // Authored character gestures, independent of their common input timings.
 Object.assign(defs.patrick.poses.win,{lean:-3,fa1:95,fa2:90,ba1:105,ba2:95,head:-8});
 Object.assign(defs.gabrielzin.poses.win,{lean:-7,fa1:-25,fa2:-95,ba1:115,ba2:-110,finger:1,mouth:1});
 Object.assign(defs.ulisses.poses.win,{lean:-4,fa1:70,fa2:25,ba1:-80,ba2:-135,head:-12});
 Object.assign(defs.felipence.poses.win,{lean:-12,fa1:48,fa2:0,ba1:145,ba2:175,head:-15,mouth:1});
 Object.assign(defs.hdsh.poses.win,{lean:-2,fa1:-60,fa2:-120,ba1:110,ba2:80,head:-6,finger:1});
 for(const id of NEW_FIGHTERS)defs[id].poses.taunt={...defs[id].poses.win,lean:defs[id].poses.win.lean+4};
 const descriptions:Record<NewFighter,string[]>={
  patrick:['Protege o braço nos frames ativos; perde para agarrões e recupera vulnerável.','Avanço anunciado, sem invulnerabilidade. Bloqueie e puna.','Soco lento que pressiona a guarda, sem tornar a defesa inútil.'],
  gabrielzin:['Coração que explode em um contato, empurra e pode ser bloqueado.','Abraço capturado apenas de perto e fora de combos verdadeiros. Erro é punível.','Projétil rosa de um acerto; usa o limite universal de distância.'],
  ulisses:['Braço distorcido de alcance elevado, recuperação longa e sem rastreamento.','Presas de perto: captura sangue, restaura pouca vida e perde para ataques.','Lâmina de sangue em linha reta. Defenda ou salte.'],
  felipence:['Golpe de guitarra que empurra; espaço para punir se errar.','Explosão sonora próxima dos dois lados, sem invulnerabilidade.','Nota sonora de um contato com chip reduzido.'],
  hdsh:['Uma área de Go por vez, dura até 2 s e reduz o avanço. Salte ou acerte o analista.','Seta em linha reta de um acerto, sem rastreamento.','Marca o chão por 30 frames antes da queda. Mova-se, salte ou defenda em pé.'],
 };
 for(const id of NEW_FIGHTERS)defs[id].specials.forEach((s,i)=>s.desc=descriptions[id][i]);
 return defs;
}
const baseMove:Move={id:'',kind:'special',rank:9,startup:18,active:4,recovery:26,whiff:10,dmg:60,hitstun:22,blockstun:12,kb:6,kbBlock:4,hb:[15,135,40,155],level:'mid',launch:0,launchVx:5,hitstop:8,shake:7,power:1.4,poses:['idle','idle']};
