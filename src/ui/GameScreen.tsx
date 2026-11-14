import {preloadAnimeSprites} from '../game/anime-sprite';
import {CanvasSurface,stageDensity,canvasFontRevision} from '../game/canvas';
import { victoryLine } from '../game/presentation';
import { FINISHER_NAMES } from '../game/finishers-art';
import { rememberLocal } from '../game/progression';
import { FinisherPrompt } from './FinisherPrompt';
import { useEffect, useRef, useState } from 'react';
import { TrainingChallenges } from './TrainingChallenges';
import { FrameDataLab } from './FrameDataLab';
import { GameOverlay, TouchControls } from './TouchControls';
import { Game } from '../game/engine';
import type { GameConfig } from '../game/engine';
import { render } from '../game/render';
import { W, H } from '../game/stage';
import { keyLabel } from '../game/input';
import { CHARS } from '../game/data';
import { audio } from '../game/audio';
import {PaintCadence} from '../game/mobile-settings';
import { getStage, SkewBtn } from './common';

export function GameScreen({ cfg, onExit, onSelect, onMap, onRadio, inputSuspended = false }: { cfg: GameConfig; onExit: () => void; onSelect: () => void; onMap: () => void; onRadio: () => void; inputSuspended?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [cinematic,setCinematic]=useState(false);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [sel, setSel] = useState(0);
  const [dummy, setDummy] = useState(0);
  const [frameLabOpen,setFrameLabOpen]=useState(false);
  const displayBlocked=useRef(false);displayBlocked.current=inputSuspended||frameLabOpen;
  const resultTimerRef = useRef<number | undefined>(undefined);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void preloadAnimeSprites([cfg.p1,cfg.p2],true);
    const canvas = ref.current!;
    const surface=new CanvasSurface(canvas,W,H,'scene'),ctx=surface.ctx;surface.prepare();
    let stage=getStage(cfg.stage??'dojo',surface.scale);
    const game = new Game(cfg, (e) => {
      if (e.type === 'pause') { setPaused(!!e.paused); setSel(0); }
      if (e.type === 'matchEnd') {
        rememberLocal(game);
        window.clearTimeout(resultTimerRef.current);
        resultTimerRef.current = window.setTimeout(() => { setResult(e.winner ?? 0); setSel(0); }, 700);
      }
    });
    gameRef.current = game;
    const visibility=()=>{game.resetClock();if(document.hidden&&!game.paused)game.togglePause(true)};
    document.addEventListener('visibilitychange',visibility);
    (window as unknown as { __game?: Game }).__game = game;
    let raf = 0,lastCinematic=false;const cadence=matchMedia('(pointer:coarse)').matches?new PaintCadence(60):null,pausedCadence=new PaintCadence(10);
    const loop = (now: number) => {
      game.advance(now);
      if((game.phase==='finisher'||!!game.seq?.kind.startsWith('super'))!==lastCinematic){lastCinematic=game.phase==='finisher'||!!game.seq?.kind.startsWith('super');setCinematic(lastCinematic);}
      if(!document.hidden&&!displayBlocked.current&&(game.paused?pausedCadence.due(now):!cadence||cadence.due(now))){surface.prepare();const density=stageDensity(surface.scale);
      if(stage.density!==density||stage.fontRevision!==canvasFontRevision())stage=getStage(cfg.stage??'dojo',density);
      render(ctx, game, stage, game.tick,undefined,!!cadence);}
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange',visibility);
      window.clearTimeout(resultTimerRef.current);
      const debugWindow = window as unknown as { __game?: Game };
      if (debugWindow.__game === game) delete debugWindow.__game;
      game.destroy();
      gameRef.current = null;
    };
  }, [cfg]);

  // navegação por teclado nos menus de pausa / vitória
  useEffect(() => {
    if (inputSuspended || frameLabOpen || (!paused && result === null)) return;
    const onKey = (e: KeyboardEvent) => {
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'KeyS', 'KeyW', 'Enter', 'Space'].includes(e.code)) return;
      if (['Enter', 'Space'].includes(e.code) && e.target instanceof Element && e.target.closest('button') && !e.target.closest('[data-menu-idx]')) return;
      e.preventDefault();
      if (e.repeat) return;
      const n = paused ? (cfg.mode === 'training' ? 7 : 6) : 4;
      const direction = e.code === 'ArrowDown' || e.code === 'KeyS' || (!paused && e.code === 'ArrowRight') ? 1 : e.code === 'ArrowUp' || e.code === 'KeyW' || (!paused && e.code === 'ArrowLeft') ? -1 : 0;
      if (direction) {
        const next = (sel + direction + n) % n;
        setSel(next);
        document.querySelector<HTMLButtonElement>(`.dw-game-overlay [data-menu-idx="${next}"] button`)?.focus();
      }
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        const b = document.querySelector<HTMLButtonElement>(`.dw-game-overlay [data-menu-idx="${sel}"] button`);
        b?.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paused, result, sel, cfg.mode, inputSuspended,frameLabOpen]);

  const g = gameRef.current;
  const rematch = () => {
    window.clearTimeout(resultTimerRef.current);
    setResult(null);
    setPaused(false);
    setSel(0);
    audio.confirm();
    gameRef.current?.restart();
  };

  const winnerChar = result !== null ? CHARS[gameRef.current?.f[result]?.ch ?? 'caetano'] : null;
  const who = result === null ? '' : cfg.mode === 'ai' ? (result === 0 ? 'VOCÊ VENCEU!' : 'O COMPUTADOR VENCEU!') : `JOGADOR ${result + 1} VENCEU!`;

  return (
    <div ref={overlayRef} className="absolute inset-0">
      {cfg.mode === 'training' && <TrainingChallenges gameRef={gameRef}/>}
      {cfg.mode === 'training' && <FrameDataLab gameRef={gameRef} onOpenChange={setFrameLabOpen}/>}
      <FinisherPrompt gameRef={gameRef}/>
      <canvas ref={ref} width={W} height={H} className="absolute inset-0 w-full h-full" />
      {!cinematic && !paused && result===null && <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 text-[10px] tracking-widest text-white/50 pointer-events-none">P1: {keyLabel(cfg.bindings[0].down[0])} AGACHAR · P2: {keyLabel(cfg.bindings[1].down[0])} AGACHAR · ESC / P: PAUSA</div>}

      {!paused && !cinematic && result === null && <TouchControls gameRef={gameRef} onMenu={() => gameRef.current?.togglePause()}/>}
      {paused && !frameLabOpen && (
        <GameOverlay><div className="pause-menu absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 fade-in">
          <div className="title-main text-5xl text-white mb-2" style={{ textShadow: '0 0 20px #a855f7, 4px 4px 0 #000' }}>
            PAUSADO
          </div>
          <MB idx={0} sel={sel} setSel={setSel} onClick={() => g?.togglePause(false)}>
            RETOMAR
          </MB>
          <MB idx={1} sel={sel} setSel={setSel} onClick={rematch}>
            REINICIAR PARTIDA
          </MB>
          {cfg.mode === 'training' ? (
            <>
              <MB
                idx={2}
                sel={sel}
                setSel={setSel}
                onClick={() => {
                  g?.resetPositions();
                  g?.togglePause(false);
                }}
              >
                REINICIAR POSIÇÕES
              </MB>
              <MB idx={3} sel={sel} setSel={setSel} onClick={onSelect}>
                TROCAR LUTADORES
              </MB>
              <MB idx={4} sel={sel} setSel={setSel} onClick={onMap}>TROCAR MAPA</MB>
              <MB idx={5} sel={sel} setSel={setSel} onClick={onRadio} color="#f472b6">
                MÚSICA
              </MB>
              <MB idx={6} sel={sel} setSel={setSel} onClick={onExit}>
                MENU PRINCIPAL
              </MB>
            </>
          ) : (
            <>
              <MB idx={2} sel={sel} setSel={setSel} onClick={onSelect}>TROCAR LUTADORES</MB>
              <MB idx={3} sel={sel} setSel={setSel} onClick={onMap}>TROCAR MAPA</MB>
              <MB idx={4} sel={sel} setSel={setSel} onClick={onRadio} color="#f472b6">MÚSICA</MB>
              <MB idx={5} sel={sel} setSel={setSel} onClick={onExit}>MENU PRINCIPAL</MB>
            </>
          )}
          {cfg.mode === 'training' && <button className="text-xs py-2 px-4 bg-white/10 rounded cursor-pointer" onClick={() => {if(g){g.train.dummy=(g.train.dummy+1)%4;g.f[1].cpu=g.train.dummy===1;g.f[1].pad.reset();setDummy(g.train.dummy)}}}>OPONENTE: {['PARADO','IA','DEFENDE','P2'][g?.train.dummy ?? dummy]}</button>}
          <div className="mt-3 text-[10px] text-white/60 text-center leading-5">
            P1: G agarrar · A/D mover · W pular · S agachar · J soco · K chute · L cabeçada · E defesa · U/I/O especiais · H super
            <br />
            P2: Num 9 cabeçada · Num 7 agarrar · Setas · Num 1/2/3 soco/chute/defesa · Num 4/5/6 especiais · Num 0 super (ou , . / ; &apos; Enter ShiftD)
          </div>
        </div></GameOverlay>
      )}

      {result !== null && winnerChar && (
        <GameOverlay><div className="result-menu absolute inset-0 pointer-events-none fade-in" style={{ background: `linear-gradient(180deg, ${winnerChar.color}55 0%, transparent 35%, transparent 62%, rgba(0,0,0,0.85) 100%)` }}>
          <div className="absolute top-5 w-full text-center">
            <div className="title-main text-[22px] tracking-[0.3em] text-white/90 pop-in">{who}</div>
            <div className="title-main victory-name text-[56px] pop-in" style={{ color: '#fff', WebkitTextStroke: `2px ${winnerChar.color2}`, textShadow: `0 0 28px ${winnerChar.color}, 5px 5px 0 #000`, animationDelay: '0.15s' }}>
              {winnerChar.name}
            </div><div className="mt-3 text-xs text-white/80">{g?.f[0].wins} × {g?.f[1].wins} · {victoryLine(winnerChar.id,g!.f[1-result].ch)}</div>
            {g?.finishedBy!==null&&g?.finishedBy!==undefined&&<div className="title-main text-xl text-amber-300 mt-2">FINISHER · {FINISHER_NAMES[winnerChar.id]}</div>}
          </div>
          <div className="absolute bottom-[112px] w-full text-center slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="title-main victory-quote text-[27px] px-8 leading-8" style={{ color: winnerChar.glow, textShadow: `0 0 18px ${winnerChar.color}, 3px 3px 0 #000` }}>
              “{winnerChar.quote}”
            </div>
          </div>
          <div className="absolute bottom-6 w-full flex justify-center gap-5 pointer-events-auto slide-up" style={{ animationDelay: '0.9s' }}>
            <MB idx={0} sel={sel} setSel={setSel} onClick={rematch} color={winnerChar.color} small>
              REVANCHE
            </MB>
            <MB idx={1} sel={sel} setSel={setSel} onClick={onSelect} color={winnerChar.color} small>
              TROCAR LUTADORES
            </MB>
            <MB idx={2} sel={sel} setSel={setSel} onClick={onMap} color={winnerChar.color} small>TROCAR MAPA</MB>
            <MB idx={3} sel={sel} setSel={setSel} onClick={onExit} color={winnerChar.color} small>MENU PRINCIPAL</MB>
          </div>
        </div></GameOverlay>
      )}
    </div>
  );
}

function MB({ idx, sel, setSel, onClick, children, color = '#a855f7', small }: { idx: number; sel: number; setSel: (n: number) => void; onClick: () => void; children: React.ReactNode; color?: string; small?: boolean }) {
  return (
    <span data-menu-idx={idx} className="inline-block">
      <SkewBtn active={sel === idx} onHover={() => setSel(idx)} onClick={onClick} color={color} small={small}>
        {children}
      </SkewBtn>
    </span>
  );
}
