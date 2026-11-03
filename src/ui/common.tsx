import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Stage, W, H, FLOOR_Y } from '../game/stage';
import { drawFullBody, drawPortrait } from '../game/rig';
import { CHARS, CHAR_IDS } from '../game/data';
import type { CharId } from '../game/data';

let stageInstance: Stage | null = null;
export function getStage() {
  if (!stageInstance) stageInstance = new Stage();
  return stageInstance;
}

/** Palco de 960x540 escalado para caber na janela. */
export function Frame({ children }: { children: ReactNode }) {
  const [s, setS] = useState(1);
  useEffect(() => {
    const f = () => setS(Math.min(window.innerWidth / W, window.innerHeight / H));
    f();
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden select-none">
      <div style={{ width: W, height: H, transform: `scale(${s})`, position: 'relative', flexShrink: 0, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

export type ArtVariant = 'menu' | 'select' | 'splash';

interface Leaf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  s: number;
}

const POSES: Record<CharId, string[]> = {
  caetano: ['idle', 'idle', 'pM_a', 'idle', 'dedo_a', 'idle', 'kH_a', 'idle', 'soco_a', 'win'],
  orango: ['idle', 'idle', 'pH_a', 'idle', 'dedo_a', 'idle', 'roar', 'idle', 'kH_a', 'win'],
  tubarao: ['idle', 'idle', 'bite_a', 'idle', 'fin_a', 'idle', 'roar', 'idle', 'kiss', 'win'],
  rickzera: ['idle', 'idle', 'franco_a', 'idle', 'pix_a', 'idle', 'double_a', 'idle', 'taunt', 'win'],
  bieu: ['idle', 'idle', 'driver_a', 'idle', 'rat_a', 'idle', 'spray_a', 'idle', 'taunt', 'win'],
  nomad: ['idle', 'idle', 'burger_a', 'idle', 'glock_a', 'idle', 'boomerang_a', 'idle', 'taunt', 'win'],
};

export function ArtCanvas({ variant, selected }: { variant: ArtVariant; selected?: CharId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ variant, selected });
  propsRef.current = { variant, selected };
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const stage = getStage();
    let raf = 0;
    let t = 0;
    const leaves: Leaf[] = Array.from({ length: 24 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: -1 - Math.random() * 1.5, vy: 0.5 + Math.random(), r: Math.random() * 6, s: 3 + Math.random() * 5 }));
    const loop = () => {
      t++;
      const { variant: v, selected: sel } = propsRef.current;
      const camX = 800 + Math.sin(t * 0.006) * 40;
      stage.hype = 0.15;
      stage.drawBackground(ctx, camX, 1, t);
      ctx.save();
      ctx.translate(W / 2, FLOOR_Y);
      ctx.translate(-camX, -FLOOR_Y);
      stage.drawFloor(ctx);
      stage.drawLights(ctx, camX, null, 0);
      ctx.restore();
      if (v === 'menu' || v === 'splash') {
        const positions = v === 'splash' ? [110, 255, 400, 550, 700, 845] : [425, 520, 615, 710, 810, 905];
        CHAR_IDS.forEach((ch, i) => {
          const x = positions[i];
          const sc = v === 'splash' ? 1.13 : .97;
          glowBehind(ctx, x, CHARS[ch].color, t + i * 20, .72);
          drawFullBody(ctx, ch, x, v === 'splash' ? 480 : FLOOR_Y, sc, t, POSES[ch][Math.floor((t + i * 28) / 110) % 10], i >= 3);
        });
      } else if (sel) {
        const ch = sel;
        glowBehind(ctx, 488, CHARS[ch].color, t, .95);
        drawFullBody(ctx, ch, 488, 422, 1.48, t, POSES[ch][Math.floor(t / 130) % 10]);
      }
      // folhas
      for (const l of leaves) {
        l.x += l.vx;
        l.y += l.vy;
        l.r += 0.05;
        if (l.x < -10 || l.y > H + 10) {
          l.x = W + Math.random() * 100;
          l.y = -10 - Math.random() * 200;
        }
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.r);
        ctx.fillStyle = '#f0884a';
        ctx.beginPath();
        ctx.ellipse(0, 0, l.s, l.s * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      const vg = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 640);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} width={W} height={H} className="absolute inset-0" />;
}

function glowBehind(ctx: CanvasRenderingContext2D, x: number, col: string, t: number, k = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const r = (190 + Math.sin(t * 0.07) * 14) * k;
  const g = ctx.createRadialGradient(x, FLOOR_Y - 100, 10, x, FLOOR_Y - 100, r);
  g.addColorStop(0, col + 'aa');
  g.addColorStop(1, col + '00');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, FLOOR_Y - 100 - r, r * 2, r * 2);
  ctx.restore();
}

export function FighterPortrait({ ch, size = 32, className = '' }: { ch: CharId; size?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPortrait(ctx, ch, size + 6, size + 8, size, { time: 0 });
  }, [ch, size]);
  return <canvas aria-hidden="true" ref={ref} width={(size + 6) * 2} height={(size + 8) * 2} className={className} />;
}

export function Panel({ children, className = '', style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`absolute ${className}`} style={style}>
      {children}
    </div>
  );
}

export function SkewBtn({ children, onClick, active, onHover, color = '#a855f7', small, medium, disabled = false }: { children: ReactNode; onClick?: () => void; active?: boolean; onHover?: () => void; color?: string; small?: boolean; medium?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onHover}
      className="fight-btn"
      style={{
        ['--c' as string]: color,
        opacity: disabled ? .4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: small ? '6px 22px' : medium ? '7px 36px' : '10px 40px',
        fontSize: small ? 16 : medium ? 21 : 24,
        minWidth: small ? 0 : medium ? 300 : 330,
      }}
      data-active={active ? '1' : '0'}
    >
      <span>{children}</span>
    </button>
  );
}
