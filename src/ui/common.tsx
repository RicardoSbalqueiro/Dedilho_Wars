import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Stage, W, H, FLOOR_Y } from '../game/stage';
import { drawFullBody } from '../game/rig';
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

export type ArtVariant = 'menu' | 'select';

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
      const base = (screenX: number) => screenX;
      if (v === 'menu') {
        const cx = 520;
        const ox = 790;
        glowBehind(ctx, cx, '#a855f7', t);
        glowBehind(ctx, ox, '#ef4444', t);
        drawFullBody(ctx, 'caetano', base(cx), FLOOR_Y, 1.55, t, POSES.caetano[Math.floor(t / 110) % 10], false);
        drawFullBody(ctx, 'orango', base(ox), FLOOR_Y, 1.55, t, POSES.orango[Math.floor(t / 110) % 10], true);
      } else {
        const sc = 1.65;
        const pos: [CharId, number, boolean][] = [
          ['caetano', 345, false],
          ['orango', 640, true],
        ];
        for (const [ch, x, flip] of pos) {
          const on = sel === ch;
          const col = ch === 'caetano' ? '#a855f7' : '#ef4444';
          if (on) glowBehind(ctx, x, col, t, 1.4);
          const list = POSES[ch];
          const pn = on ? list[Math.floor(t / 70) % list.length] : 'idle';
          const yy = FLOOR_Y + (on ? -Math.abs(Math.sin(t * 0.05)) * 4 : 0);
          ctx.save();
          ctx.globalAlpha = on ? 1 : 0.5;
          drawFullBody(ctx, ch, x, yy, on ? sc * 1.06 : sc * 0.95, t, pn, flip);
          ctx.restore();
        }
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

export function Panel({ children, className = '', style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`absolute ${className}`} style={style}>
      {children}
    </div>
  );
}

export function SkewBtn({ children, onClick, active, onHover, color = '#a855f7', small, medium }: { children: ReactNode; onClick?: () => void; active?: boolean; onHover?: () => void; color?: string; small?: boolean; medium?: boolean }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      className="fight-btn"
      style={{
        ['--c' as string]: color,
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
