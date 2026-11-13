import {useEffect,useRef,useState} from 'react';
import type {RefObject} from 'react';
import type {Game} from '../game/engine';
import {CanvasSurface,canvasFontRevision,stageDensity} from '../game/canvas';
import {render} from '../game/render';
import {preloadAnimeSprites} from '../game/anime-sprite';
import {W,H,STAGES,STAGE_IDS} from '../game/stage';
import type {StageId} from '../game/stage';
import {createTrainingGame} from '../game/training/verify';
import {activity,DEFAULT_LAB,RANKS} from '../game/training/catalog';
import {abandonTraining,submitTraining} from '../game/training/client';
import {TRAINING_NPCS} from '../game/training/npc';
import type {TrainingNpcId} from '../game/training/npc';
import {TRAINING_STAGE_IDS} from '../game/training/city-stages';
import {masteryLevel,saveLaboratoryTime} from '../game/training/progress';
import {levelFor} from '../game/progression';
import {Frame,getStage} from './common';
import {GameOverlay,TouchControls,useMobile} from './TouchControls';
import {FrameDataLab} from './FrameDataLab';
import {TrainingLabPanel} from './TrainingLabPanel';
import {metricLabel} from './TrainingReborn';
import type {TrainingRun} from './TrainingReborn';
import {keyLabel,keyboard} from '../game/input';
import {touchInput} from '../game/touch';
import {loadBindings} from '../game/input';
import {PaintCadence} from '../game/mobile-settings';
import {errorText} from '../online/api';
import {CHAR_IDS,CHARS} from '../game/data';
import type {CharId} from '../game/data';
import type {LabConfig,TrainingResult} from '../game/training/types';

export function TrainingArena({run,onExit,onSaved,onRetry,onNext}:{run:TrainingRun;onExit:()=>void;onSaved:(r:TrainingResult)=>TrainingResult;onRetry:()=>void;onNext:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),timingCue=useRef<HTMLDivElement>(null),gameRef=useRef<Game|null>(null),alive=useRef(true),submitted=useRef(false),saved=useRef(false);
 const [paused,setPaused]=useState(false),[result,setResult]=useState<TrainingResult|null>(null),[saveState,setSaveState]=useState<'saving'|'verified'|'local'|'error'>('saving'),[saveError,setSaveError]=useState(''),[,refresh]=useState(0),[labOpen,setLabOpen]=useState(false),[frameOpen,setFrameOpen]=useState(false),[hudTop,setHudTop]=useState(0);
 const mobile=useMobile(),d=activity(run.spec.activityId),isLab=run.spec.activityId==='lab';
 const blocked=useRef(false);blocked.current=labOpen||frameOpen||!!result;
 const modal=useRef(false);modal.current=labOpen||frameOpen||paused||!!result;
 const saveCallback=useRef(onSaved);saveCallback.current=onSaved;
 const saveResult=async(r:TrainingResult,forceLocal=false)=>{
  if(saved.current)return;
  setSaveError('');setSaveState('saving');
  if(!run.account||forceLocal){const value=saveCallback.current({...r,verified:false});saved.current=true;if(alive.current){setResult(value);setSaveState('local');}return;}
  const g=gameRef.current;if(!g?.reborn)return;
  try{const answer=await submitTraining(run.spec.verifiedSession!,g.reborn.transcript);if(!alive.current)return;const value=saveCallback.current(answer.result);saved.current=true;setResult(value);setSaveState('verified');}
  catch(e){if(alive.current){setSaveError(errorText(e));setSaveState('error');}}
 };
 const saveRef=useRef(saveResult);saveRef.current=saveResult;
 useEffect(()=>{
  alive.current=true;const surface=new CanvasSurface(canvas.current!,W,H,'scene');let raf=0,stage=getStage(run.spec.stage??d?.stage??'dojo',1);
  const g=createTrainingGame(run.spec,e=>{
   if(e.type==='pause')setPaused(!!e.paused);
   if(e.type==='training')refresh(v=>v+1);
   if(e.type==='trainingResult'&&e.result&&!submitted.current){submitted.current=true;setResult(e.result);void saveRef.current(e.result);}
  });g.cfg.bindings=loadBindings();gameRef.current=g;
  void preloadAnimeSprites([g.f[0].ch,g.f[1].ch],true);(window as unknown as {__game?:Game}).__game=g;
  const cadence=new PaintCadence(mobile?30:60);
  let labTicks=0,lastTick=g.tick;
  const flushLab=()=>{if(isLab&&labTicks){saveLaboratoryTime(labTicks/60);labTicks=0;}};
  const measure=()=>{const rect=canvas.current?.getBoundingClientRect();if(rect)setHudTop(rect.bottom+7);};
  const visibility=()=>{g.resetClock();if(document.hidden&&!g.paused)g.togglePause(true);};
  const blur=()=>{keyboard.down.clear();keyboard.pressed.clear();touchInput.clear();if(!g.paused)g.togglePause(true);};
  document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',blur);window.addEventListener('pagehide',flushLab);window.addEventListener('dedilho-display-change',measure);window.addEventListener('resize',measure);
  const loop=(now:number)=>{if(blocked.current)g.resetClock();else g.advance(now);if(isLab){labTicks+=Math.max(0,g.tick-lastTick);lastTick=g.tick;if(labTicks>=600)flushLab();}if(timingCue.current){const f=g.f[1],m=f.move;timingCue.current.textContent=!m?'OBSERVE A PRÓXIMA PREPARAÇÃO':f.moveT<m.startup?`PREPARAÇÃO · contato em ${m.startup-f.moveT}f`:f.moveT<m.startup+m.active?'CONTATO':'RECUPERAÇÃO · RESPONDA';timingCue.current.dataset.phase=!m?'idle':f.moveT<m.startup?'startup':f.moveT<m.startup+m.active?'active':'recovery';}if(!document.hidden&&!modal.current&&cadence.due(now)){surface.prepare();const id=g.cfg.stage??'dojo',density=stageDensity(surface.scale);if(stage.id!==id||stage.density!==density||stage.fontRevision!==canvasFontRevision())stage=getStage(id,density);render(surface.ctx,g,stage,g.tick,undefined,mobile);}raf=requestAnimationFrame(loop);};
  raf=requestAnimationFrame(loop);requestAnimationFrame(measure);refresh(v=>v+1);
  return()=>{alive.current=false;cancelAnimationFrame(raf);flushLab();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',blur);window.removeEventListener('pagehide',flushLab);window.removeEventListener('dedilho-display-change',measure);window.removeEventListener('resize',measure);g.destroy();if((window as unknown as {__game?:Game}).__game===g)delete (window as unknown as {__game?:Game}).__game;gameRef.current=null;};
 },[run.spec,mobile,d?.stage]);
 const g=gameRef.current,s=g?.reborn,portrait=mobile&&innerHeight>innerWidth;
 const leave=()=>{if(run.spec.verifiedSession&&!saved.current)void abandonTraining(run.spec.verifiedSession).catch(()=>{});onExit();};
 const showLab=()=>{g?.togglePause(true);setLabOpen(true);};
 const liveNotice=s?.notice??d?.hint??'Monte a situação que deseja praticar.';
 const emptyTrace=isLab&&s?.lab.dummy==='playback'&&!s.recording.length;
 return <main className="tr-arena" data-training-reborn={isLab?'laboratory':'arena'} data-training-status={result?'result':paused?'paused':'playing'}>
  <Frame game topInset={56} topGap={portrait?(isLab?70:16):0}><canvas ref={canvas} width={W} height={H} className="absolute inset-0 w-full h-full" aria-label="Combate do Training Reborn"/></Frame>
  <header className="tr-run-toolbar"><button type="button" onClick={()=>g?.togglePause(true)}>PAUSA</button><div><small>TRAINING REBORN · {run.account?'TENTATIVA DE CONTA':'TREINO LOCAL'}</small><strong>{d?.title??'LABORATÓRIO DE COMBATE'}</strong></div>{isLab&&<button type="button" onClick={showLab}>CONFIGURAR</button>}<button type="button" onClick={leave}>SAIR</button></header>
  {!paused&&!result&&!frameOpen&&!labOpen&&<>
   <aside className={'tr-objective '+(portrait?'tr-objective-portrait':'')} style={portrait?{top:hudTop||'auto'}:undefined} aria-label="Objetivo e treinador">
    <div className="tr-objective-title"><span>{isLab?'PRÁTICA LIVRE':'TREINADOR'}</span><b>{s?Math.floor(s.metrics.activeTicks/60):0}s ATIVOS</b></div>
    {d?.goals.map(goal=><div className="tr-live-goal" key={goal.metric}><strong>{metricLabel(goal.metric)}</strong><span>{goal.metric==='activeTicks'?Math.floor((s?.metrics.activeTicks??0)/60):Math.min(goal.target,Math.floor(s?.metrics[goal.metric]??0))}/{goal.metric==='activeTicks'?goal.target/60:goal.target}</span><i><em style={{width:Math.min(100,(s?.metrics[goal.metric]??0)/goal.target*100)+'%'}}/></i></div>)}
    {isLab&&<><p>Dano {Math.round(s?.metrics.damage??0)} · combo {s?.metrics.bestCombo??0}</p><span>{s?.lab.dummy==='record'?`GRAVANDO OPONENTE · ${((s?.recordTicks??0)/60).toFixed(1)} / 15s`:s?.lab.dummy==='playback'?'REPRODUZINDO SEQUÊNCIA':g?.f[1].def.name}</span></>}
    <details open={!mobile}><summary>Orientação e comandos</summary><p>{emptyTrace?'Grave um padrão do oponente antes de selecionar reprodução.':liveNotice}</p>
     {g&&<div className="tr-command-guide">{[['p','Soco'],['k','Chute'],['block','Defesa'],['up','Pular'],['down','Agachar'],['headbutt','Cabeçada'],['grab','Agarrão'],['s1','Esp 1'],['s2','Esp 2'],['s3','Esp 3'],['super','ULT'],['transform','Forma'],['turn','Virar']].map(([a,label])=><span key={a}><kbd>{keyLabel(g.cfg.bindings[0][a as keyof typeof g.cfg.bindings[0]][0])}</kbd>{label}</span>)}</div>}
     {g?.f[0].ch==='rickzera'&&<p>Segure {keyLabel(g.cfg.bindings[0].charge[0])} para carregar energia fora da Cruz de Energia.</p>}
    </details>
    {d?.script&&<div ref={timingCue} className="tr-timing-cue">OBSERVE A PRÓXIMA PREPARAÇÃO</div>}
   </aside>
   <TouchControls gameRef={gameRef} onMenu={()=>g?.togglePause(true)}/>
  </>}
  {isLab&&!result&&<FrameDataLab gameRef={gameRef} onOpenChange={setFrameOpen}/>}
  {paused&&!result&&!frameOpen&&!labOpen&&<GameOverlay><section className="tr-dialog-shade"><div className="tr-pause-panel"><p className="tr-kicker">ACADEMIA DOS CAMPEÕES</p><h2>Respire. Observe.<br/>Volte melhor.</h2><p>O tempo ativo e os comandos estão pausados.</p><button type="button" className="tr-primary" onClick={()=>g?.togglePause(false)}>CONTINUAR ↗</button>{isLab?<><button type="button" onClick={()=>{g?.reborn?.configureLab(g.reborn.lab);g?.togglePause(false);}}>REINICIAR SITUAÇÃO</button><button type="button" onClick={showLab}>CONFIGURAR LABORATÓRIO</button></>:<button type="button" onClick={()=>{if(run.spec.verifiedSession)void abandonTraining(run.spec.verifiedSession).catch(()=>{});onRetry();}}>RECOMEÇAR · SEM XP DESTA TENTATIVA</button>}<button type="button" onClick={leave}>VOLTAR À ACADEMIA</button></div></section></GameOverlay>}
  {labOpen&&g&&<TrainingLabPanel gameRef={gameRef} onClose={()=>{setLabOpen(false);g.togglePause(false);}}/>}
  {result&&<GameOverlay layer={85}><section className="tr-dialog-shade tr-result-shade" data-training-result={result.success?'success':'failed'}><article className="tr-result-panel">
   <div className="tr-result-heading"><div><p className="tr-kicker">{result.success?'DESAFIO CONCLUÍDO':'MAIS UMA TENTATIVA. MAIS UMA DESCOBERTA.'}</p><h1>{result.success?(d?.finite?'VITÓRIA':'OBJETIVO CUMPRIDO'):'TENTE NOVAMENTE'}</h1><p>{d?.title}</p></div><span className={'tr-result-grade tr-grade-'+result.grade}>{result.grade}</span></div>
   {result.promoted&&<div className="tr-promotion"><span>✦</span><strong>NOVA PATENTE · {RANKS[d?.exam??0]}</strong><small>Insígnia e título conquistados.</small></div>}
   <div className="tr-result-reward"><div><b>{saveState==='saving'?'VALIDANDO…':saveState==='error'?'SALVAMENTO PENDENTE':`+${result.xp} XP`}</b><span>{saveState==='verified'?'RECOMPENSA DE CONTA VERIFICADA':saveState==='local'?'RECOMPENSA LOCAL · NESTE DISPOSITIVO':'O servidor verifica a execução antes de conceder XP.'}</span></div><div><strong>Domínio +{result.masteryGained}</strong><span>{CHARS[result.character].short} · nível {Math.min(10,masteryLevel(run.progressBefore,result.character)+(Math.floor(((run.progressBefore.mastery[result.character]??0)%120+result.masteryGained)/120)))}/10</span></div></div>
   {saveState!=='saving'&&saveState!=='error'&&<p className="tr-level-result">Nível {levelFor(run.xpBefore+result.xp).level} · {run.xpBefore+result.xp} XP totais · próximo nível em {levelFor(run.xpBefore+result.xp).next-run.xpBefore-result.xp} XP</p>}
   {saveError&&<div className="tr-error" role="alert"><p>{saveError}</p><button type="button" onClick={()=>void saveRef.current(result)}>TENTAR SALVAR NOVAMENTE</button><button type="button" onClick={()=>void saveRef.current(result,true)}>GUARDAR SOMENTE NESTE DISPOSITIVO</button></div>}
   <div className="tr-result-actions"><button type="button" className="tr-primary" onClick={onNext} disabled={run.account&&saveState==='saving'}>{result.success&&d?.floor&&d.floor<50?'PRÓXIMO ANDAR ↗':'CONTINUAR ↗'}</button><button type="button" onClick={onRetry} disabled={run.account&&saveState==='saving'}>TENTAR NOVAMENTE</button><button type="button" onClick={leave}>VOLTAR À ACADEMIA</button></div>
   <div className="tr-result-metrics">{[[Math.round(result.metrics.damage),'DANO CAUSADO'],[Math.round(result.metrics.damageTaken),'DANO RECEBIDO'],[result.metrics.bestCombo,'MELHOR COMBO'],[(result.metrics.attempts?Math.round(100*result.metrics.connected/result.metrics.attempts):100)+'%','PRECISÃO'],[(result.metrics.enemyStarts?Math.min(100,Math.round(result.metrics.blocks/result.metrics.enemyStarts*100)):0)+'%','TAXA DE DEFESA'],[Math.round(result.metrics.staminaUsed),'STAMINA USADA'],[Math.round(result.activeSeconds)+'s','TEMPO ATIVO'],[result.metrics.perfects,'DEFESAS PERFEITAS']].map(([v,label])=><div key={label}><b>{v}</b><span>{label}</span></div>)}</div>
   <section className="tr-result-analysis"><h2>Por que esta nota?</h2>{result.breakdown.map(v=><div key={v.label}><label>{v.label}<b>{v.value}/100</b></label><div className="tr-meter"><i style={{width:v.value+'%'}}/></div><small>{v.help}</small></div>)}</section>
   <section className="tr-result-tips"><h2>Seu próximo passo</h2><p>{result.reason}</p>{result.recommendations.map(t=><p key={t}>↗ {t}</p>)}</section>
   <p className="tr-result-note">{result.rewardNote??(saveState==='local'?'Este progresso fica neste navegador e não é convertido automaticamente em XP online.':'Nenhum ponto competitivo de PvP é concedido pelo treinamento.')}</p>
  </article></section></GameOverlay>}
 </main>;
}
export const LAB_STAGES=[...TRAINING_STAGE_IDS,...STAGE_IDS];
export const labStageName=(id:StageId)=>STAGES[id].name;
export const labOpponent=(value:string)=>value in TRAINING_NPCS?{character:TRAINING_NPCS[value as TrainingNpcId].base,npc:value as TrainingNpcId}:{character:CHAR_IDS.includes(value as CharId)?value as CharId:'caetano' as CharId,npc:undefined};
export function readLab(g:Game|null):LabConfig{return {...DEFAULT_LAB,...g?.reborn?.lab};}
export type GameReference=RefObject<Game|null>;
