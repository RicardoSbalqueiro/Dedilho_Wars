import { useEffect, useRef, useState } from 'react';
import { Game } from '../game/engine';
import type { GameConfig } from '../game/engine';
import { render } from '../game/render';
import { W, H } from '../game/stage';
import { keyLabel } from '../game/input';
import { CHARS } from '../game/data';
import { audio } from '../game/audio';
import { getStage, SkewBtn } from './common';

export function GameScreen({ cfg, onExit, onSelect, onRadio, inputSuspended = false }: { cfg: GameConfig; onExit: () => void; onSelect: () => void; onRadio: () => void; inputSuspended?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [sel, setSel] = useState(0);
  const resultTimerRef = useRef<number | undefined>(undefined);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const stage = getStage();
    const game = new Game(cfg, (e) => {
      if (e.type === 'pause') { setPaused(!!e.paused); setSel(0); }
      if (e.type === 'matchEnd') {
        window.clearTimeout(resultTimerRef.current);
        resultTimerRef.current = window.setTimeout(() => { setResult(e.winner ?? 0); setSel(0); }, 700);
      }
    });
    gameRef.current = game;
    (window as unknown as { __game?: Game }).__game = game;
    let raf = 0;
    const loop = (now: number) => {
      game.advance(now);
      render(ctx, game, stage, game.tick);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resultTimerRef.current);
      const debugWindow = window as unknown as { __game?: Game };
      if (debugWindow.__game === game) delete debugWindow.__game;
      game.destroy();
      gameRef.current = null;
    };
  }, [cfg]);

  // navegação por teclado nos menus de pausa / vitória
  useEffect(() => {
    if (inputSuspended || (!paused && result === null)) return;
    const onKey = (e: KeyboardEvent) => {
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'KeyS', 'KeyW', 'Enter', 'Space'].includes(e.code)) return;
      e.preventDefault();
      if (e.repeat) return;
      const n = paused ? (cfg.mode === 'training' ? 6 : 5) : 3;
      if (e.code === 'ArrowDown' || e.code === 'KeyS' || (!paused && e.code === 'ArrowRight')) setSel((s) => (s + 1) % n);
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || (!paused && e.code === 'ArrowLeft')) setSel((s) => (s + n - 1) % n);
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        const b = overlayRef.current?.querySelector<HTMLButtonElement>(`[data-menu-idx="${sel}"] button`);
        b?.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paused, result, sel, cfg.mode, inputSuspended]);

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
      <canvas ref={ref} width={W} height={H} className="absolute inset-0" />
      <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 text-[10px] tracking-widest text-white/50 pointer-events-none">P1: {keyLabel(cfg.bindings[0].down[0])} AGACHAR · P2: {keyLabel(cfg.bindings[1].down[0])} AGACHAR · ESC / P: PAUSA</div>

      {paused && (
        <div className="pause-menu absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 fade-in">
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
              <MB idx={4} sel={sel} setSel={setSel} onClick={onRadio} color="#f472b6">
                ESTAÇÃO DE RÁDIO
              </MB>
              <MB idx={5} sel={sel} setSel={setSel} onClick={onExit}>
                MENU PRINCIPAL
              </MB>
            </>
          ) : (
            <>
              <MB idx={2} sel={sel} setSel={setSel} onClick={onSelect}>TROCAR LUTADORES</MB>
              <MB idx={3} sel={sel} setSel={setSel} onClick={onRadio} color="#f472b6">ESTAÇÃO DE RÁDIO</MB>
              <MB idx={4} sel={sel} setSel={setSel} onClick={onExit}>MENU PRINCIPAL</MB>
            </>
          )}
          <div className="mt-3 text-[10px] text-white/60 text-center leading-5">
            P1: A/D mover · W pular · S agachar · J soco · K chute · L defesa · U/I/O especiais · H super
            <br />
            P2: Setas · Num 1/2/3 soco/chute/defesa · Num 4/5/6 especiais · Num 0 super (ou , . / ; &apos; Enter ShiftD)
          </div>
        </div>
      )}

      {result !== null && winnerChar && (
        <div className="absolute inset-0 pointer-events-none fade-in" style={{ background: `linear-gradient(180deg, ${winnerChar.color}55 0%, transparent 35%, transparent 62%, rgba(0,0,0,0.85) 100%)` }}>
          <div className="absolute top-5 w-full text-center">
            <div className="title-main text-[22px] tracking-[0.3em] text-white/90 pop-in">{who}</div>
            <div className="title-main text-[56px] pop-in" style={{ color: '#fff', WebkitTextStroke: `2px ${winnerChar.color2}`, textShadow: `0 0 28px ${winnerChar.color}, 5px 5px 0 #000`, animationDelay: '0.15s' }}>
              {winnerChar.name}
            </div>
          </div>
          <div className="absolute bottom-[112px] w-full text-center slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="title-main text-[27px] px-8 leading-8" style={{ color: winnerChar.glow, textShadow: `0 0 18px ${winnerChar.color}, 3px 3px 0 #000` }}>
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
            <MB idx={2} sel={sel} setSel={setSel} onClick={onExit} color={winnerChar.color} small>
              MENU PRINCIPAL
            </MB>
          </div>
        </div>
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
