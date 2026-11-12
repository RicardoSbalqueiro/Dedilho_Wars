import { useEffect,useState } from 'react';
import { createPortal } from 'react-dom';
import type { RefObject } from 'react';
import type { Game } from '../game/engine';
import { TRAINING_CHALLENGES,challengeDefinition,challengeAvailable,completedChallenges } from '../game/challenges';
import type { ChallengeId,ChallengeProgress } from '../game/challenges';
import { GameOverlay,useMobile } from './TouchControls';
export function TrainingChallenges({gameRef}:{gameRef:RefObject<Game|null>}) {
 const mobile=useMobile(),[open,setOpen]=useState(false),[progress,setProgress]=useState<ChallengeProgress|null>(null),[badges,setBadges]=useState<string[]>(completedChallenges);
 useEffect(()=>{const timer=window.setInterval(()=>{const c=gameRef.current?.challenge;setProgress(c?{...c,seen:[...c.seen]}:null)},150);return()=>clearInterval(timer)},[gameRef]);
 const show=()=>{gameRef.current?.togglePause(true);setBadges(completedChallenges());setOpen(true)};
 const close=()=>{setOpen(false);gameRef.current?.togglePause(false)};
 const pick=(id:ChallengeId|null)=>{gameRef.current?.startChallenge(id);close()};
 const def=progress?challengeDefinition(progress.id):null;
 const current=progress?.id==='crouch'?((progress.current||0)/60).toFixed(1):Math.floor(progress?.current||0);
 const goal=def?.id==='crouch'?'3 s':`${def?.target||0} ${def?.unit||''}`;
 const widget=<div data-challenge-active={progress?'1':'0'} className={mobile?'training-touch-widget':'training-widget absolute right-4 top-[155px] w-[218px] z-10'}>
  <div className="training-status"><strong>{progress?.done?'✓ DESAFIO CONCLUÍDO':def?.title||'TREINAMENTO LIVRE'}</strong><p>{def?`${current} / ${goal}`:`${TRAINING_CHALLENGES.length} desafios para dominar a luta`}</p>{def&&<div className="training-progress"><i style={{width:`${Math.min(100,100*(progress?.current||0)/def.target)}%`}}/></div>}</div>
  <button type="button" onClick={show}>DESAFIOS</button>
 </div>;
 return <>{mobile?createPortal(widget,document.body):widget}{open&&<GameOverlay layer={80}><div role="dialog" aria-label="Desafios de treinamento" className="training-dialog absolute inset-0 z-40 bg-[#0b0615f5] text-white p-6 overflow-y-auto">
  <div className="flex items-center justify-between gap-4 mb-4"><div><h2 className="title-main text-3xl">DESAFIOS DO DOJO</h2><p className="text-xs text-white/60 mt-2">Conquistas salvas neste navegador · {badges.length}/{TRAINING_CHALLENGES.length}</p></div><button className="px-4 py-3 border border-white/30 rounded cursor-pointer text-xs" onClick={close}>VOLTAR AO TREINO</button></div>
  <button className="mb-4 rounded px-4 py-3 border border-white/20 bg-white/5 text-sm cursor-pointer" onClick={()=>pick(null)}>TREINAMENTO LIVRE</button>
  <div className="training-challenge-grid">{TRAINING_CHALLENGES.map(c=>{const available=challengeAvailable(c.id,gameRef.current?.f[0].ch||'caetano');return <button key={c.id} data-challenge={c.id} disabled={!available} onClick={()=>pick(c.id)} className="training-challenge-card"><div className="flex justify-between gap-2"><strong>{c.title}</strong><span className="text-emerald-300">{badges.includes(c.id)?'✓':''}</span></div><p>{c.description}</p><small>{available?c.hint:c.id==='energy'?'Escolha Rickzera para este desafio.':'Escolha um lutador com ataques à distância para este desafio.'}</small></button>})}</div>
 </div></GameOverlay>}</>;
}
