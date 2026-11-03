import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { Stage, STAGE_IDS, W, H, FLOOR_Y } from '../game/stage';
import { drawFullBody, drawPortrait } from '../game/rig';
import { CHARS, CHAR_IDS } from '../game/data';
import type { CharId } from '../game/data';
import type { StageId } from '../game/stage';
import { audio } from '../game/audio';

const stageCache = new Map<StageId, Stage>();
export function getStage(id: StageId = 'dojo') {
  let stage = stageCache.get(id);
  if (!stage) { stage = new Stage(id); stageCache.set(id, stage); }
  return stage;
}

function drawStageScene(ctx: CanvasRenderingContext2D, stage: Stage, t: number, camX = 800) {
  stage.drawBackground(ctx, camX, 1, t);
  ctx.save();
  ctx.translate(W / 2, FLOOR_Y);
  ctx.translate(-camX, -FLOOR_Y);
  stage.drawFloor(ctx);
  stage.drawLights(ctx, camX, null, 0);
  ctx.restore();
}

export function StagePreview({ stageId, animated = false, className = '' }: { stageId: StageId; animated?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const stage = getStage(stageId);
    let raf = 0;
    let t = 0;
    const draw = () => { drawStageScene(ctx, stage, t++); if (animated) raf = requestAnimationFrame(draw); };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [stageId, animated]);
  return <canvas ref={ref} width={W} height={H} className={className} aria-hidden="true" />;
}

export function MusicButton({ onClick }: { onClick: () => void }) {
  const radio = useSyncExternalStore(audio.subscribeRadio, audio.getRadioSnapshot);
  return <button type="button" aria-label="Música" onClick={onClick} className="music-mini flex items-center gap-2 border border-fuchsia-300/50 bg-[#160b26e8] px-3 py-2 text-[12px] text-fuchsia-100 cursor-pointer hover:bg-fuchsia-950 focus:outline-2 focus:outline-fuchsia-300">
    <span className={`music-eq ${radio.playing ? 'playing' : ''}`} aria-hidden="true">{[0, 1, 2, 3].map((i) => <span key={i} style={{ animationDelay: `${i * -.17}s` }} />)}</span>
    <span>Música</span>
  </button>;
}

/** Palco de 960x540 escalado para caber na janela. */
export function Frame({ children, game = false }: { children: ReactNode; game?: boolean }) {
  const [s, setS] = useState(1);
  useEffect(() => {
    const f = () => { const portrait = matchMedia('(pointer: coarse)').matches && window.innerHeight > window.innerWidth; setS(Math.min(window.innerWidth / W, (window.innerHeight - (game && portrait ? 190 : 0)) / H)); };
    f();
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, [game]);
  return (
    <div data-game-frame={game ? '1' : '0'} className="game-frame fixed inset-0 bg-black flex items-center justify-center overflow-hidden select-none">
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
  renngotti: ['idle', 'idle', 'pM_a', 'idle', 'kH_a', 'idle', 'taunt', 'idle', 'pH_a', 'win'],
  aneninha: ['idle','dance1','osasco_a','idle','paint_a','dance2','shout_a','idle','win','dance1'],
};

export function ArtCanvas({ variant, selected }: { variant: ArtVariant; selected?: CharId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ variant, selected });
  propsRef.current = { variant, selected };
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const stage = getStage(STAGE_IDS[Math.floor(Math.random() * STAGE_IDS.length)]);
    let raf = 0;
    let t = 0;
    const leaves: Leaf[] = Array.from({ length: 24 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: -1 - Math.random() * 1.5, vy: 0.5 + Math.random(), r: Math.random() * 6, s: 3 + Math.random() * 5 }));
    const loop = () => {
      t++;
      const { variant: v, selected: sel } = propsRef.current;
      const camX = 800 + Math.sin(t * 0.006) * 40;
      stage.hype = 0.15;
      drawStageScene(ctx, stage, t, camX);
      if (v === 'menu' || v === 'splash') {
        drawDemoBrawl(ctx, t, v === 'splash');
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

// Demonstração coreografada sem controles, áudio ou instâncias do motor de partida.
// Cada dupla alterna ataques, acertos e recuos. Os oito lutadores aparecem em quatro duplas.
function drawDemoBrawl(ctx: CanvasRenderingContext2D, t: number, splash: boolean) {
  const rotation = Math.floor(t / 560) % CHAR_IDS.length;
  const chars = CHAR_IDS.map((_, i) => CHAR_IDS[(i + rotation) % CHAR_IDS.length]);
  const groups = splash
    ? [{x:120,y:480,s:.9},{x:360,y:470,s:.9},{x:600,y:480,s:.9},{x:840,y:470,s:.9}]
    : [{x:430,y:354,s:.65},{x:610,y:478,s:.9},{x:770,y:350,s:.65},{x:860,y:480,s:.8}];
  groups.forEach((g,i)=>drawDemoPair(ctx,chars[i*2],chars[i*2+1],g.x,g.y,g.s,t+i*47,false));
}

function drawDemoPair(ctx: CanvasRenderingContext2D, left: CharId, right: CharId, x: number, y: number, scale: number, t: number, extraHit: boolean) {
  const phase = t % 196;
  const moves = ['pM', 's1', 'kH', 's2'];
  const leftMove = CHARS[left].moves[moves[Math.floor(t / 196) % moves.length]] || CHARS[left].moves.pM;
  const rightMove = CHARS[right].moves[moves[(Math.floor(t / 196) + 1) % moves.length]] || CHARS[right].moves.pM;
  const leftAttack = phase >= 24 && phase < 67;
  const rightAttack = phase >= 118 && phase < 161;
  const rightHit = (phase >= 44 && phase < 76) || extraHit;
  const leftHit = phase >= 138 && phase < 170;
  const pulse = (v: number) => Math.sin(Math.max(0, Math.min(1, v)) * Math.PI);
  const leftLunge = leftAttack ? pulse((phase - 24) / 43) * 28 : 0;
  const rightLunge = rightAttack ? pulse((phase - 118) / 43) * 28 : 0;
  const lx = x - 51 * scale + (leftLunge - (leftHit ? pulse((phase - 138) / 32) * 31 : 0)) * scale;
  const rx = x + 51 * scale - (rightLunge - (rightHit ? 24 : 0)) * scale;
  const leftPose = leftHit ? 'hit' : leftAttack ? leftMove.poses[phase < 37 ? 0 : 1] : 'idle';
  const rightPose = rightHit ? 'hit' : rightAttack ? rightMove.poses[phase < 131 ? 0 : 1] : 'idle';
  ctx.save();
  ctx.globalAlpha = .22;
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(lx, y + 2, 34 * scale, 8 * scale, 0, 0, Math.PI * 2); ctx.ellipse(rx, y + 2, 34 * scale, 8 * scale, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  drawFullBody(ctx, left, lx, y - (leftAttack && leftMove.id.startsWith('k') ? leftLunge * .35 : 0), scale, t, leftPose);
  drawFullBody(ctx, right, rx, y - (rightAttack && rightMove.id.startsWith('k') ? rightLunge * .35 : 0), scale, t + 20, rightPose, true);
  const strike = (ch: CharId, from: number, to: number, p: number, special: boolean, dir: number) => {
    const level = y - 102 * scale;
    if (p >= 34 && p < 44) {
      const u = (p - 34) / 10;
      if (special) drawDemoProjectile(ctx, ch, from + (to - from) * u, level, dir, t, scale);
      else {
        ctx.save(); ctx.globalAlpha = .8; ctx.strokeStyle = CHARS[ch].glow; ctx.lineWidth = 4 * scale;
        ctx.shadowBlur = 10; ctx.shadowColor = CHARS[ch].color; ctx.beginPath(); ctx.moveTo(from, level - 22 * scale); ctx.quadraticCurveTo((from + to) / 2, level - 45 * scale, to, level + 14 * scale); ctx.stroke(); ctx.restore();
      }
    }
    if (p >= 44 && p < 65) drawDemoImpact(ctx, to, level, CHARS[ch].glow, p - 44, scale);
  };
  strike(left, lx + 24 * scale, rx - 17 * scale, phase, leftMove.kind === 'special', 1);
  strike(right, rx - 24 * scale, lx + 17 * scale, phase - 94, rightMove.kind === 'special', -1);
}

function drawDemoProjectile(ctx: CanvasRenderingContext2D, ch: CharId, x: number, y: number, dir: number, t: number, scale: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * scale, scale);
  ctx.shadowColor = CHARS[ch].color; ctx.shadowBlur = 14; ctx.fillStyle = CHARS[ch].glow; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  if (ch === 'rickzera') { ctx.rotate(Math.sin(t * .15) * .2); ctx.fillRect(-14, -8, 28, 16); ctx.strokeRect(-14, -8, 28, 16); ctx.fillStyle = '#075a37'; ctx.font = 'bold 9px sans-serif'; ctx.fillText('100', -9, 3); }
  else { ctx.beginPath(); ctx.ellipse(0, 0, 15, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ctx.globalAlpha = .5; ctx.strokeStyle = CHARS[ch].color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-18, -5); ctx.lineTo(-44, -5); ctx.moveTo(-16, 4); ctx.lineTo(-36, 4); ctx.stroke(); ctx.restore();
}

function drawDemoImpact(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, age: number, scale: number) {
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = Math.max(0, 1 - age / 21);
  ctx.strokeStyle = color; ctx.shadowBlur = 16; ctx.shadowColor = color; ctx.lineWidth = 2 * scale;
  ctx.beginPath(); ctx.arc(0, 0, (7 + age * 2) * scale, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + age * .03; const r = (10 + age * 1.8) * scale; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .4, Math.sin(a) * r * .4); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke(); }
  ctx.fillStyle = '#fff8cc'; ctx.beginPath(); ctx.arc(0, 0, Math.max(1, 7 - age * .3) * scale, 0, Math.PI * 2); ctx.fill(); ctx.restore();
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
