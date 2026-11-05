import { FinisherPrompt } from './FinisherPrompt';
import { FINISHER_NAMES } from '../game/finishers-art';
import { FIGHTER_STYLE } from '../game/presentation';
import { useEffect, useRef, useState } from 'react';
import { touchInput } from '../game/touch';
import { GameOverlay, TouchControls } from './TouchControls';
import { Game } from '../game/engine';
import { ACTIONS, MAX_INPUT_MASK, keyboard, keyLabel, loadBindings } from '../game/input';
import { captureState, applyState } from '../game/net-state';
import { render } from '../game/render';
import { W, H } from '../game/stage';
import { CHARS } from '../game/data';
import { audio } from '../game/audio';
import { api } from '../online/api';
import type { Room, User } from '../online/api';
import { FightConnection } from '../online/connection';
import { getStage, SkewBtn } from './common';

export function OnlineGame({room,user,onLobby,onLeave}:{room:Room;user:User;onLobby:()=>void;onLeave:()=>void}) {
 const canvas=useRef<HTMLCanvasElement>(null);
 const gameRef=useRef<Game|null>(null);
 const [reward,setReward]=useState('');
 const [finishName,setFinishName]=useState('');
 const [cinematic,setCinematic]=useState(false);
 const [network,setNetwork]=useState('CONECTANDO');
 const [ping,setPing]=useState(0);
 const [lost,setLost]=useState('');
 const [result,setResult]=useState<number|null>(null);
 const [leaving,setLeaving]=useState(false);
 const blocked=useRef(false);blocked.current=leaving;
 const host=room.host.id===user.id;
 useEffect(()=>{
  const ctx=canvas.current!.getContext('2d')!,bindings=loadBindings();
  const game=new Game({mode:'versus',online:true,p1:room.host.char,p2:room.guest!.char,stage:room.stage,difficulty:'normal',bindings},()=>{});
  gameRef.current=game;
  (window as unknown as {__game?:Game}).__game=game;
  let otherInput=0,done=false,lastSend=0,raf=0,stopped=false,lastMask=0,eventId=0,lastEvent=0,physicalPressed=0,lastCinematic=false;
  let pending:{id:number;mask:number;clash?:number;clashFrame?:number}[]=[];
  const link=new FightConnection(room,user,{
   state:s=>{const hp=game.f.map(f=>f.hp),previous=game.f.map(f=>f.impact),cine=game.cine?.f.idx,clash=game.clash;if(applyState(game,s)){
    pending=pending.filter(e=>e.id>(s.inputAck||0));
    game.f.forEach((f,i)=>{const impact=f.impact;if(impact&&(impact.serial!==previous[i]?.serial||impact.tick!==previous[i]?.tick)){if(impact.kind==='perfect'||impact.kind==='precision')audio.perfectBlock(impact.kind==='precision');else if(impact.kind==='block')audio.block();else audio.hit(impact.strength)}else if(f.hp<hp[i])audio.hit(1)});
    if(game.cine&&game.cine.f.idx!==cine){audio.boom(.8);audio.say(game.cine.f.def.superName)}
    if(game.clash&&(!clash||Math.floor(game.clash.t/12)>Math.floor(clash.t/12)))audio.clash();
   }},
   input:n=>{otherInput=n.mask;for(const e of n.events)if(e&&Number.isSafeInteger(e.id)&&e.id>lastEvent&&Number.isInteger(e.mask)&&e.mask>=0&&e.mask<=MAX_INPUT_MASK){
    let mask=e.mask;
    if(game.clash){game.queueClashInput(1,e.clash??-1,mask,e.clashFrame??-1);mask&=~(1<<ACTIONS.indexOf(game.clash.kind==='super'?'super':'p'));}
    game.onlinePressed[1]|=mask;lastEvent=e.id;
   }},status:(s,ms)=>{if(!stopped){setNetwork(s);setPing(ms);if(s!=='RECONECTANDO')setLost('')}},lost:message=>{if(!stopped)setLost(message)},
  });
  link.start();
  const keydown=(e:KeyboardEvent)=>{if(!e.repeat&&!blocked.current)ACTIONS.forEach((a,i)=>{if(bindings[0][a].includes(e.code))physicalPressed|=1<<i})};
  const blur=()=>{keyboard.down.clear();physicalPressed=0};window.addEventListener('blur',blur);window.addEventListener('keydown',keydown);
  const stage=getStage(room.stage);
  const loop=(now:number)=>{
   const mask=blocked.current?0:ACTIONS.reduce((m,a,i)=>m|((bindings[0][a].some(k=>k&&keyboard.down.has(k))||touchInput.held.has(a))?1<<i:0),0);
   const touchPressed=touchInput.consume().reduce((m,a)=>m|(1<<ACTIONS.indexOf(a)),0),pressed=(mask&~lastMask)|touchPressed|physicalPressed;physicalPressed=0;
   if(!host&&pressed)pending.push({id:++eventId,mask:pressed,...(game.clash?{clash:game.clash.startedAt,clashFrame:game.clash.t}:{})});pending=pending.slice(-32);
   if(host){game.onlinePressed[0]|=pressed;game.onlineInputs=[mask,link.inputStale()?0:otherInput];game.paused=link.stale();game.advance(now)}
   if(now-lastSend>=50||mask!==lastMask||pressed){if(host){const s=captureState(game);s.inputAck=lastEvent;link.sendState(s)}else link.sendInput({mask,events:pending});lastSend=now}lastMask=mask;
   if((game.phase==='finisher'||!!game.seq?.kind.startsWith('super'))!==lastCinematic){lastCinematic=game.phase==='finisher'||!!game.seq?.kind.startsWith('super');setCinematic(lastCinematic);}
   render(ctx,game,stage,game.tick);
   if(game.phase==='matchEnd'&&!done){
    done=true;setResult(game.winner);setFinishName(game.finishedBy!==null?FINISHER_NAMES[game.f[game.finishedBy].ch]:'');
    const report={winner:game.winner,hostScore:game.f[0].wins,guestScore:game.f[1].wins,finisher:game.finishedBy??-1};
    let tries=0;
    const confirm=async()=>{if(stopped)return;tries++;try{const r=await api<{status:string;award:{xp:number;points:number}|null}>('/results/'+room.epoch,report);if(stopped)return;if(r.status==='confirmed')setReward(`+${r.award?.xp||0} XP · +${r.award?.points||0} pontos`);else if(r.status==='disputed')setReward('Resultados divergentes: esta partida não altera o ranking.');else {setReward('Aguardando confirmação do adversário…');if(tries<12)window.setTimeout(confirm,1800)}}catch(e){if(!stopped)setReward((e as Error).message)}};
    confirm();if(host)api('/rooms/'+room.code+'/finish',{epoch:room.epoch}).catch(()=>{});
   }
   raf=requestAnimationFrame(loop);
  };
  raf=requestAnimationFrame(loop);
  return ()=>{stopped=true;cancelAnimationFrame(raf);window.removeEventListener('blur',blur);window.removeEventListener('keydown',keydown);link.close();game.destroy();const w=window as unknown as {__game?:Game};if(w.__game===game)delete w.__game};
 },[room,user,host]);
 const winner=result===0?room.host:room.guest;
 return <div className="absolute inset-0">
  {result===null && !leaving && !cinematic && <TouchControls gameRef={gameRef} side={host?0:1} onMenu={()=>setLeaving(true)}/>}
  <FinisherPrompt gameRef={gameRef} side={host?0:1}/>
  <canvas ref={canvas} width={W} height={H} className="absolute inset-0"/>
  {!cinematic && <div className="absolute left-1/2 -translate-x-1/2 top-[70px] text-center pointer-events-none text-[9px] text-white/80 bg-black/45 px-3 py-1 rounded">
   <span className={network==='RECONECTANDO'?'text-amber-300':'text-cyan-300'}>● {network}{ping>0?` · ${ping} ms`:''}</span><br/>{room.host.username} × {room.guest?.username} · VOCÊ É P{host?1:2}
  </div>}
  <button className="absolute right-3 bottom-0 text-[9px] text-white/70 hover:text-white bg-black/60 px-2 py-1 cursor-pointer" onClick={()=>setLeaving(true)}>SAIR DA PARTIDA</button>
  {!cinematic && result===null && <div className="absolute bottom-0 left-3 text-[8px] text-white/60 pointer-events-none">SEUS CONTROLES: WASD · J/K/L · U/I/O · {keyLabel(loadBindings()[0].turn[0])} VIRAR · H · SEM PAUSA NO ONLINE</div>}
  {(lost||network==='RECONECTANDO'||network==='CONECTANDO')&&result===null&&<div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/85 border border-cyan-300/40 px-5 py-3 text-center text-xs"><div>{lost||'Aguardando conexão com o adversário…'}</div>{lost&&<button className="text-cyan-300 underline mt-2 cursor-pointer" onClick={onLobby}>VOLTAR À SALA</button>}</div>}
  {result!==null&&winner&&<GameOverlay><div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/75 fade-in">
   <div className="title-main text-xl text-white/80">{(host?0:1)===result?'VOCÊ VENCEU!':'FIM DA PARTIDA'}</div>
   <div className="title-main text-5xl" style={{color:CHARS[winner.char].glow}}>{winner.username}</div>
   <div className="text-sm">{CHARS[winner.char].name}</div><div className="text-xs text-white/70 text-center px-5">{FIGHTER_STYLE[winner.char].victory}</div>{finishName&&<div className="text-amber-300 text-sm">FINISHER · {finishName}</div>}<div className="text-xs text-cyan-200 text-center px-5">{reward}</div>
   <SkewBtn onClick={onLobby} color="#22d3ee">VOLTAR À SALA</SkewBtn>
   <p className="text-xs text-white/60">Para a revanche, os dois confirmam PRONTO novamente.</p>
  </div></GameOverlay>}
  {leaving&&<GameOverlay><div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-5"><div className="title-main text-3xl">SAIR DA PARTIDA?</div><p className="text-sm text-white/70">A partida continua enquanto você decide.</p><SkewBtn onClick={()=>setLeaving(false)}>CONTINUAR LUTANDO</SkewBtn><SkewBtn onClick={onLeave} color="#fb7185">SAIR DA SALA</SkewBtn></div></GameOverlay>}
 </div>;
}
