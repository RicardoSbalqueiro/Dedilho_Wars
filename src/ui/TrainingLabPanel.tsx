import {useEffect,useRef,useState} from 'react';
import {CHAR_IDS,CHARS} from '../game/data';
import {TRAINING_NPCS} from '../game/training/npc';
import {TIERS} from '../game/training/catalog';
import type {LabConfig} from '../game/training/types';
import type {StageId} from '../game/stage';
import {GameOverlay} from './TouchControls';
import {LAB_STAGES,labOpponent,labStageName,readLab} from './TrainingArena';
import type {GameReference} from './TrainingArena';
export function TrainingLabPanel({gameRef,onClose}:{gameRef:GameReference;onClose:()=>void}){
 const g=gameRef.current!,[draft,setDraft]=useState<LabConfig>(()=>readLab(g)),[opponent,setOpponent]=useState(g.f[1].npc??g.f[1].ch),[stage,setStage]=useState<StageId>(g.cfg.stage??'twitchcity-capital'),[cleared,setCleared]=useState(false);
 const dialog=useRef<HTMLElement>(null),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{const old=document.activeElement as HTMLElement|null;dialog.current?.focus();const key=(e:KeyboardEvent)=>{e.stopImmediatePropagation();if(e.code==='Escape'){e.preventDefault();close.current();}if(e.code==='Tab'){const nodes=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),select,input');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};window.addEventListener('keydown',key,true);return()=>{window.removeEventListener('keydown',key,true);old?.focus();};},[]);
 const set=<K extends keyof LabConfig>(key:K,value:LabConfig[K])=>setDraft(v=>({...v,[key]:value}));
 const apply=()=>{const o=labOpponent(opponent);g.replaceTrainingOpponent(o.character,o.npc);g.cfg.stage=stage;g.reborn?.configureLab(draft);onClose();};
 return <GameOverlay layer={84}><div className="tr-dialog-shade"><section ref={dialog} role="dialog" aria-modal="true" tabIndex={-1} className="tr-lab-panel" aria-label="Configurações do laboratório">
  <div className="tr-panel-heading"><div><p className="tr-kicker">FERRAMENTAS DE PRÁTICA</p><h1>Laboratório de combate</h1><p>Configurações livres não geram XP para a conta.</p></div><button type="button" onClick={onClose}>FECHAR</button></div>
  <div className="tr-lab-grid">
   <label>Oponente<select aria-label="Oponente do laboratório" value={opponent} onChange={e=>setOpponent(e.target.value as typeof opponent)}><optgroup label="Soldados de Twitchcity">{Object.values(TRAINING_NPCS).map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</optgroup><optgroup label="Elenco">{CHAR_IDS.map(ch=><option key={ch} value={ch}>{CHARS[ch].name}</option>)}</optgroup></select></label>
   <label>Arena<select aria-label="Arena do laboratório" value={stage} onChange={e=>setStage(e.target.value as StageId)}>{LAB_STAGES.map(id=><option value={id} key={id}>{labStageName(id)}</option>)}</select></label>
   <label>Comportamento<select aria-label="Comportamento do laboratório" value={draft.dummy} onChange={e=>set('dummy',e.target.value as LabConfig['dummy'])}>{[['idle','Parado'],['aggressive','IA agressiva'],['defensive','IA defensiva'],['adaptive','IA adaptativa'],['script','Script previsível'],['p2','Controle pelo P2'],['record','Gravar oponente · controles P1'],['playback','Reproduzir gravação em loop']].map(([id,t])=><option key={id} value={id}>{t}</option>)}</select></label>
   <label>Dificuldade livre<select aria-label="Dificuldade livre no laboratório" value={draft.tier} onChange={e=>set('tier',Number(e.target.value) as LabConfig['tier'])}>{TIERS.map((t,i)=><option key={t} value={i}>{t}</option>)}</select></label>
   <label>Script<select aria-label="Script do oponente" value={draft.script} onChange={e=>set('script',e.target.value as LabConfig['script'])}>{[['punch','Soco previsível'],['low','Rasteira'],['mixed','Alto / baixo'],['air','Saltos / jetpack'],['whiff','Erro e recuperação'],['projectile','Especial de distância'],['guard','Defesa constante']].map(([id,t])=><option key={id} value={id}>{t}</option>)}</select></label>
   <label>Guarda do alvo parado<select aria-label="Guarda do laboratório" value={draft.guard} onChange={e=>set('guard',e.target.value as LabConfig['guard'])}><option value="normal">Neutra</option><option value="hold">Defesa em pé</option><option value="low">Defesa agachada</option></select></label>
   <label>Vida inicial · {draft.hp}%<input aria-label="Vida inicial" type="range" min="1" max="100" value={draft.hp} onChange={e=>set('hp',Number(e.target.value))}/></label>
   <label>Distância inicial · {draft.distance}<input aria-label="Distância inicial" type="range" min="70" max="1000" step="10" value={draft.distance} onChange={e=>set('distance',Number(e.target.value))}/></label>
   <label>Barra de ULT<select aria-label="Barra de Ultimate no laboratório" value={draft.meter} onChange={e=>set('meter',Number(e.target.value))}><option value="0">0 · indisponível</option><option value="100">100 · um estoque</option><option value="200">200 · dois estoques / forma</option></select></label>
   <label>Energia / bateria / sangue · {draft.resource}<input aria-label="Recursos exclusivos" type="range" min="0" max="100" value={draft.resource} onChange={e=>set('resource',Number(e.target.value))}/></label>
   <label>Posição do jogador<select aria-label="Lado inicial" value={draft.side} onChange={e=>set('side',Number(e.target.value) as 0|1)}><option value="0">Esquerda</option><option value="1">Direita</option></select></label>
   <div className="tr-lab-checks"><label><input type="checkbox" checked={draft.heal} onChange={e=>set('heal',e.target.checked)}/> Recuperação automática de HP</label><label><input type="checkbox" checked={draft.stamina} onChange={e=>set('stamina',e.target.checked)}/> Stamina infinita</label></div>
  </div>
  <section className="tr-lab-recording"><h2>Gravação do oponente</h2><p>Escolha “Gravar oponente”, aplique e use os controles do P1 para comandar o adversário. São armazenados até 15 segundos de comandos reais, inclusive botões simultâneos. Depois selecione reprodução em loop.</p><p>{cleared?'Gravação limpa.':`${((g.reborn?.recordTicks??0)/60).toFixed(1)} segundos gravados · ${g.reborn?.recording.length??0} trechos`}</p><button type="button" onClick={()=>{g.reborn?.clearRecording();setCleared(true);}}>LIMPAR GRAVAÇÃO</button></section>
  <p className="tr-copy">O botão FRAME DATA abre inputs, dano, escalonamento, comparação de golpes, hitboxes, hurtboxes e avanço de um frame. Use REINICIAR SITUAÇÃO na pausa para repetir os parâmetros acima.</p>
  <div className="tr-panel-actions"><button type="button" className="tr-primary" onClick={apply}>APLICAR E PRATICAR ↗</button><button type="button" onClick={onClose}>VOLTAR SEM APLICAR</button></div>
 </section></div></GameOverlay>;
}
