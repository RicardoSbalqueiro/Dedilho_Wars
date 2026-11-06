import { useEffect,useState } from 'react';
import type { RefObject } from 'react';
import { comboRoutes,comboRoute } from '../game/combos';
import type { ComboStep } from '../game/combos';
import { CHARS } from '../game/data';
import type { Game } from '../game/engine';
import { keyLabel } from '../game/input';
import type { Bindings } from '../game/input';

export function comboCommand(step:ComboStep,bindings:Bindings,mobile=false){
 const arrows={down:'↓',up:'↑',left:'←',right:'→'} as Record<string,string>;
 const touch={p:'SOCO',k:'CHUTE',s1:'ESP 1',s2:'ESP 2',s3:'ESP 3'} as Record<string,string>;
 return step.input.map(a=>arrows[a]?`${arrows[a]}${mobile?'':` (${keyLabel(bindings[a][0])})`}`:mobile?touch[a]||a:keyLabel(bindings[a][0])).join(' + ');
}
export function ComboTrainer({gameRef,onPractice,mobile}:{gameRef:RefObject<Game|null>;onPractice:()=>void;mobile:boolean}){
 const [,refresh]=useState(0);
 useEffect(()=>{const id=window.setInterval(()=>refresh(v=>v+1),100);return()=>clearInterval(id)},[]);
 const g=gameRef.current;if(!g)return null;
 const ch=g.f[0].ch,coach=g.coach,selected=coach?comboRoute(coach.routeId):null;
 return <section className="combo-trainer"><h3>ROTAS DE {CHARS[ch].name}</h3><p>Alvo atual: {g.f[1].def.name}. Ele defende depois do primeiro acerto. A rota só passa se os golpes realmente conectarem antes de ele recuperar o controle. Comece perto; contra corpos menores, ajuste a distância e o tempo.</p>
  {coach&&selected&&<div className="combo-coach-result" data-coach-status={coach.status} role="status"><strong>{coach.status==='success'?'COMBO CORRETO':coach.status==='failed'?'TENTE NOVAMENTE':coach.status==='ready'?'PRONTO PARA COMEÇAR':'EM EXECUÇÃO'} · {selected.name}</strong><p>{coach.notice}</p><span>{coach.progress}/{selected.steps.length} etapas · {coach.hits} acertos · {Number(coach.damage.toFixed(2)).toLocaleString('pt-BR')} de dano</span><p>{coach.freeAt!==null?`Rival livre no tick ${coach.freeAt}.`:coach.hits?'Aguardando a recuperação real do rival.':'Aguardando o primeiro acerto.'}</p><button type="button" onClick={()=>{g.startComboLesson(coach.routeId);onPractice()}}>REPETIR ROTA</button></div>}
  <div className="combo-route-grid">{comboRoutes(ch).map(route=><button type="button" key={route.id} data-combo-route={route.id} className="combo-route-card" onClick={()=>{g.startComboLesson(route.id);onPractice()}}><span>{route.level}</span><strong>{route.name}</strong><div className="combo-command-row">{route.steps.map((s,i)=><i key={i}>{comboCommand(s,g.cfg.bindings[0],mobile)}</i>)}</div><p>{route.help}</p><small>PRATICAR ESTA ROTA</small></button>)}</div>
  <p>Segure baixo + chute para dar uma rasteira. As rotas aéreas usam esse lançamento e o salto confirmado; soco aéreo pode conectar em um chute, sem voltar a soco ou liberar especiais no ar. Solte baixo depois da rasteira.</p>
  <p>O encaixe de Orango, Jao e Enéas só reduz a preparação do especial indicado após o segundo normal médio confirmado. Agarrões, defesas especiais e ULTs conservam suas restrições. Erros e bloqueios não dão esse encaixe.</p>
  <button type="button" onClick={()=>{g.startComboLesson(null);onPractice()}}>TREINO LIVRE · DESATIVAR TREINADOR</button>
 </section>;
}
