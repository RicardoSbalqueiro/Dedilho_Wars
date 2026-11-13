import {ResourceLab} from './ResourceLab';
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { createPortal } from 'react-dom';
import { CHAR_IDS, CHARS, movePhase } from '../game/data';
import type { CharId } from '../game/data';
import { settings } from '../game/engine';
import type { Game } from '../game/engine';
import { frameData } from '../game/frame-data';
import { comboDamageScale } from '../game/balance';
import { touchInput } from '../game/touch';
import { useMobile } from './TouchControls';
import { ComboTrainer,comboCommand } from './ComboTrainer';
import { comboRoute } from '../game/combos';
import { keyLabel } from '../game/input';
import type { Action } from '../game/input';
import { AnimationGallery } from './AnimationGallery';

const signed=(v:number|null)=>v===null?'Variável':`${v>0?'+':''}${v}f`;
const number=(v:number)=>Number(v.toFixed(2)).toLocaleString('pt-BR');
function readGame(g:Game|null){
 return g?{tick:g.tick,hitstop:g.hitstop,inputs:g.f[0].pad.history.slice(-10).map(i=>({...i,directions:[...i.directions]})),coach:g.coach?{...g.coach}:null,sequence:g.seq?.kind||g.cine&&'anúncio de ULT'||g.clash&&'batalha de ULTs'||'',fighters:g.f.map(f=>({name:f.def.short,state:f.state,phase:f.move?movePhase(f.move,f.moveT,f.connected).phase:'—',move:f.move?.label||f.move?.id||'neutro',frame:f.moveT,contact:f.contact,hitstun:f.hitstun,blockstun:f.blockstun,landing:f.landLag,hits:f.comboHits||f.comboResult?.hits||0,damage:f.comboHits?f.comboDmg:f.comboResult?.damage||0,scale:g.seq?.d===f?g.seq.damageScale:comboDamageScale(f.comboHits),free:g.phase==='fight'&&!g.seq&&!g.cine&&!g.clash&&f.state==='ground'&&f.landLag===0,freeAt:f.comboHits?null:f.comboResult?.freeAt,hp:f.hp}))}:null;
}

function ComparisonCard({side,ch,move,onChar,onMove}:{side:string;ch:CharId;move:string;onChar:(ch:CharId)=>void;onMove:(id:string)=>void}){
 const c=CHARS[ch],m=frameData(ch,move);
 const values:[string,string][]=[['Dano base / por contato',number(m.damage)],['Startup',`${m.startup}f`],['Janela ativa da animação',`${m.active}f`],['Recuperação da ficha',`${m.recovery}f`],['Recuperação extra no erro',`${m.whiff}f`],['Hitstun / blockstun',`${m.hitstun??'—'} / ${m.blockstun??'—'}`],['Vantagem teórica ao acertar',signed(m.hitAdvantage)],['Vantagem teórica ao bloquear',signed(m.blockAdvantage)],['Hitbox X local',`${m.x0} … ${m.x1}`],['Altura de defesa',m.level],['Chip comum por contato',number(m.chip)],['Pressão na guarda',`${number(m.guardDamage)} / 100`]];
 return <section className="frame-comparison-card" style={{borderColor:c.color}}>
  <label>Lutador {side}<select aria-label={`Lutador ${side}`} value={ch} onChange={e=>onChar(e.target.value as CharId)}>{CHAR_IDS.map(id=><option key={id} value={id}>{CHARS[id].name}</option>)}</select></label>
  <div className="frame-character-stats"><strong>{c.hp} HP</strong><span>Andar {c.walk} / recuar {c.walkBack}</span><span>Dash {c.dashVx} · {c.dashDur}f</span><span>Salto Vy {c.jumpVy} / Vx {c.jumpVx}</span><span>Corpo: meia largura {c.pushW+4} · altura {c.hurtH} / {c.crouchH}</span></div>
  <label>Golpe {side}<select aria-label={`Golpe ${side}`} value={move} onChange={e=>onMove(e.target.value)}>{[...Object.keys(c.moves),'super'].map(id=><option key={id} value={id}>{id} · {frameData(ch,id).name}</option>)}</select></label>
  <dl>{values.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  <p className="frame-move-note">{m.notes}</p>
 </section>;
}

export function FrameDataLab({gameRef,onOpenChange}:{gameRef:RefObject<Game|null>;onOpenChange?:(open:boolean)=>void}){
 const mobile=useMobile(),[open,setOpen]=useState(false),[monitor,setMonitor]=useState(false),[live,setLive]=useState(()=>readGame(gameRef.current));
 const [tab,setTab]=useState<'frame'|'combos'|'animation'|'resources'>('frame'),[showInputs,setShowInputs]=useState(true);
 const [left,setLeft]=useState<CharId>('caetano'),[right,setRight]=useState<CharId>('orango'),[moves,setMoves]=useState<[string,string]>(['pL','pL']);
 const [boxes,setBoxes]=useState(settings.hitboxes),[notice,setNotice]=useState('');
 const dialog=useRef<HTMLDivElement>(null),previousPause=useRef(false);
 useEffect(()=>{onOpenChange?.(open)},[open,onOpenChange]);
 const refresh=()=>setLive(readGame(gameRef.current));
 const close=()=>{setOpen(false);touchInput.clear();gameRef.current?.togglePause(previousPause.current)};
 const show=()=>{const g=gameRef.current;if(!g)return;previousPause.current=g.paused;setLeft(g.f[0].ch);setRight(g.f[1].ch);setNotice('');setBoxes(settings.hitboxes);touchInput.clear();g.togglePause(true);refresh();setOpen(true)};
 useEffect(()=>{if(!open&&!monitor)return;const timer=window.setInterval(()=>setLive(readGame(gameRef.current)),80);return()=>clearInterval(timer)},[gameRef,open,monitor]);
 useEffect(()=>{
  if(!open)return;
  const focus=document.activeElement as HTMLElement|null;dialog.current?.focus();
  const key=(e:KeyboardEvent)=>{
   // Keep pause/menu bindings out of the inspection dialog; native form keys work.
   e.stopImmediatePropagation();
   if(e.code==='Escape'){e.preventDefault();setOpen(false);touchInput.clear();gameRef.current?.togglePause(previousPause.current);return;}
   if(e.code==='Tab'){
    const nodes=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select, input, a[href]');
    if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];
    if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
   }
  };
  window.addEventListener('keydown',key,true);
  return()=>{window.removeEventListener('keydown',key,true);focus?.focus()};
 },[open,gameRef]);
 const step=()=>{gameRef.current?.stepTrainingFrame();refresh()};
 const execute=()=>{const g=gameRef.current;if(!g)return;if(left!==g.f[0].ch){setNotice(`Para executar, compare o lutador atual do P1: ${g.f[0].def.name}. Troque os lutadores no menu de pausa para praticar com outro.`);return}setNotice(g.previewTrainingMove(moves[0])?'Golpe preparado. Avance os frames ou volte ao treino para executá-lo.':'Aguarde o P1 ficar livre no chão. Aéreos precisam de um salto no treino. Recargas e compromissos continuam valendo.');refresh()};
 const inputName=(a:Action)=>mobile?({p:'SOCO',k:'CHUTE',up:'↑',down:'↓',left:'←',right:'→',s1:'ESP1',s2:'ESP2',s3:'ESP3'} as Record<string,string>)[a]||a:keyLabel(gameRef.current!.cfg.bindings[0][a][0]);
 const inputText=live?.inputs.map(i=>`${[...i.directions.filter(d=>d!==i.action),i.action].map(inputName).join(' + ')} [${i.tick}]`).join(' · ');
 const lesson=live?.coach?comboRoute(live.coach.routeId):null;
 const next=live?.coach&&lesson?.steps[live.coach.progress];
 const widget=<div className={`frame-widget${mobile?' frame-widget-mobile':''}`}><button type="button" onClick={()=>{setTab('frame');show()}}>FRAME DATA</button><button type="button" onClick={()=>{setTab('combos');show()}}>COMBOS</button>{monitor&&!open&&live&&<div className="frame-live-monitor" aria-label="Monitor de combate"><strong>{live.fighters[0].move} · {live.fighters[0].phase}</strong><span>P2: {live.fighters[1].free?'LIVRE PARA AGIR':live.fighters[1].state} · H {live.fighters[1].hitstun} / B {live.fighters[1].blockstun}</span><span>{live.fighters[1].hits} acertos · {number(live.fighters[1].damage)} dano</span>{live.fighters[1].freeAt!==null&&live.fighters[1].freeAt!==undefined&&<span>Recuperou no tick {live.fighters[1].freeAt}</span>}{showInputs&&<span className="combo-input-history">{inputText||'Inputs: aguardando comandos'}</span>}{live.coach&&<div className="combo-live-coach" data-coach-status={live.coach.status}><strong>{live.coach.status==='success'?'COMBO CORRETO!':live.coach.status==='failed'?'TENTE NOVAMENTE':next?`PRÓXIMO: ${comboCommand(next,gameRef.current!.cfg.bindings[0],mobile)}`:'PRONTO'}</strong><span>{live.coach.progress}/{lesson?.steps.length} · {live.coach.notice}</span></div>}</div>}</div>;
 return <>{mobile?createPortal(widget,document.body):widget}{open&&createPortal(<div className="frame-lab-backdrop"><div className="frame-lab-dialog" role="dialog" aria-modal="true" aria-label="Laboratório de frame data" tabIndex={-1} ref={dialog}>
  <header><div><p>TREINAMENTO · 60 FRAMES POR SEGUNDO</p><h2>LABORATÓRIO DE COMBATE</h2></div><button type="button" onClick={close}>VOLTAR AO TREINO</button></header>
  <nav className="combo-lab-tabs"><button type="button" aria-pressed={tab==='frame'} onClick={()=>setTab('frame')}>FRAME DATA</button><button type="button" aria-pressed={tab==='combos'} onClick={()=>setTab('combos')}>TREINADOR DE COMBOS</button><button type="button" aria-pressed={tab==='resources'} onClick={()=>setTab('resources')}>RECURSOS E FORMAS</button><button type="button" aria-pressed={tab==='animation'} onClick={()=>setTab('animation')}>ANIMAÇÕES</button></nav>
  <div className="combo-display-options"><label><input type="checkbox" checked={monitor} onChange={e=>setMonitor(e.target.checked)}/> Exibir inputs, dano, acertos e recuperação na luta</label><label><input type="checkbox" checked={showInputs} onChange={e=>setShowInputs(e.target.checked)}/> Histórico de inputs</label></div>
  {tab==='resources'?<ResourceLab gameRef={gameRef}/>:tab==='animation'?<AnimationGallery initial={gameRef.current?.f[0].ch||'caetano'}/>:tab==='combos'?<ComboTrainer gameRef={gameRef} mobile={mobile} onPractice={()=>{setMonitor(true);refresh();close()}}/>:<>
  <p className="frame-lab-help">Compare os 18 lutadores e observe a luta quadro a quadro. Os valores vêm da ficha atual dos golpes. A vantagem teórica considera contato no primeiro frame ativo, sem cancelamento. Distância, avanço e pushback também importam.</p>
  <div className="frame-comparison"><ComparisonCard side="A" ch={left} move={moves[0]} onChar={setLeft} onMove={id=>setMoves([id,moves[1]])}/><ComparisonCard side="B" ch={right} move={moves[1]} onChar={setRight} onMove={id=>setMoves([moves[0],id])}/></div>
  <p className="frame-lab-help">“Variável” exige observar o contato: projéteis têm trajeto e duração próprios; lançamentos, agarrões, ULTs e aéreos usam outras regras. Chip indicado é o bloqueio comum de um contato; Precisão de Caetano zera chip. Alcance X não soma avanço nem largura do adversário.</p>
  <section className="frame-observer"><h3>OBSERVAÇÃO DA LUTA PAUSADA</h3><div className="frame-observer-controls"><button type="button" onClick={step}>AVANÇAR 1 FRAME</button><button type="button" onClick={execute}>PREPARAR GOLPE A NO P1</button><button type="button" onClick={()=>{gameRef.current?.resetPositions();setNotice('Posições e recargas reiniciadas.');refresh()}}>REINICIAR POSIÇÕES</button><label><input type="checkbox" checked={boxes} onChange={e=>{settings.hitboxes=e.target.checked;setBoxes(e.target.checked)}}/> Hitboxes</label><label><input type="checkbox" checked={monitor} onChange={e=>setMonitor(e.target.checked)}/> Monitor durante a luta</label></div>
   {live&&<><p>Tick {live.tick} · pausa de impacto: {live.hitstop}f{live.sequence&&` · ${live.sequence}`}</p><div className="frame-observation-table"><table><thead><tr><th>Lutador</th><th>Estado / golpe</th><th>Próximo frame (base 0)</th><th>Contato</th><th>Stun H / B / pouso</th><th>Combo / dano</th><th>Próximo dano</th></tr></thead><tbody>{live.fighters.map((f,i)=><tr key={i}><th>P{i+1} · {f.name}</th><td>{f.state} · {f.move}<small>{f.phase}{f.free?' · LIVRE':''}</small></td><td>{f.frame}</td><td>{f.contact==='hit'?'Acertou':f.contact==='block'?'Bloqueado':f.contact==='whiff'?'Errou':'Pendente'}</td><td>{f.hitstun} / {f.blockstun} / {f.landing}</td><td>{f.hits} / {number(f.damage)}</td><td>{Math.round(f.scale*100)}%</td></tr>)}</tbody></table></div></>}
   <p role="status">{notice}</p><p className="frame-lab-help">O hitstop também avança um tick por clique e congela os frames de ação. A preparação de golpes só funciona com o P1 livre no treino offline. Os comandos, recargas e estados vulneráveis continuam ativos.</p>
  </section>
  </>}
 </div></div>,document.body)}</>;
}
