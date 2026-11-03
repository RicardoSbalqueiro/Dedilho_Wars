import { useEffect, useRef, useState } from 'react';
import { Game } from '../game/engine';
import type { GameConfig } from '../game/engine';
import { render } from '../game/render';
import { W, H } from '../game/stage';
import { CHARS } from '../game/data';
import { audio } from '../game/audio';
import { getStage, SkewBtn } from './common';

export function GameScreen({ cfg, onExit }: { cfg: GameConfig; onExit: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const stage = getStage();
    const game = new Game(cfg, (e) => {
      if (e.type === 'pause') setPaused(!!e.paused);
      if (e.type === 'matchEnd') window.setTimeout(() => setResult(e.winner ?? 0), 700);
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
      game.destroy();
      gameRef.current = null;
    };
  }, [cfg]);

  // navegação por teclado nos menus de pausa / vitória
  useEffect(() => {
    if (!paused && result === null) return;
    const onKey = (e: KeyboardEvent) => {
      const n = paused ? (cfg.mode === 'training' ? 4 : 3) : 2;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') setSel((s) => (s + 1) % n);
      if (e.code === 'ArrowUp' || e.code === 'KeyW') setSel((s) => (s + n - 1) % n);
      if (e.code === 'Enter') {
        e.preventDefault();
        const b = document.querySelector<HTMLButtonElement>(`[data-menu-idx="${sel}"] button`);
        b?.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paused, result, sel, cfg.mode]);

  const g = gameRef.current;
  const rematch = () => {
    setResult(null);
    setPaused(false);
    setSel(0);
    audio.confirm();
    gameRef.current?.restart();
  };

  const winnerChar = result !== null ? CHARS[gameRef.current?.f[result]?.ch ?? 'caetano'] : null;
  const who = result === null ? '' : cfg.mode === 'ai' ? (result === 0 ? 'VOCÊ VENCEU!' : 'O COMPUTADOR VENCEU!') : `JOGADOR ${result + 1} VENCEU!`;

  return (
    <div className="absolute inset-0">
      <canvas ref={ref} width={W} height={H} className="absolute inset-0" />
      <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 text-[10px] tracking-widest text-white/50 pointer-events-none">ESC / P : PAUSA</div>

      {paused && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 fade-in">
          <div className="title-main text-6xl text-white mb-3" style={{ textShadow: '0 0 20px #a855f7, 4px 4px 0 #000' }}>
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
              <MB idx={3} sel={sel} setSel={setSel} onClick={onExit}>
                MENU PRINCIPAL
              </MB>
            </>
          ) : (
            <MB idx={2} sel={sel} setSel={setSel} onClick={onExit}>
              MENU PRINCIPAL
            </MB>
          )}
          <div className="mt-4 text-xs text-white/60 text-center leading-5">
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
            <div className="title-main text-[34px]" style={{ color: winnerChar.glow, textShadow: `0 0 18px ${winnerChar.color}, 3px 3px 0 #000` }}>
              “{winnerChar.quote}”
            </div>
          </div>
          <div className="absolute bottom-6 w-full flex justify-center gap-6 pointer-events-auto slide-up" style={{ animationDelay: '0.9s' }}>
            <MB idx={0} sel={sel} setSel={setSel} onClick={rematch} color={winnerChar.color} small>
              REVANCHE
            </MB>
            <MB idx={1} sel={sel} setSel={setSel} onClick={onExit} color={winnerChar.color} small>
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
