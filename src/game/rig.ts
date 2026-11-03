// Esqueleto articulado + desenho vetorial dos dois lutadores.
import type { CharId, Pose } from './data';
import { CHARS } from './data';

export interface P2 {
  x: number;
  y: number;
}
export interface Rig {
  p: Record<string, P2>;
}
export interface DrawOpts {
  time: number;
  expr?: 'n' | 'hit' | 'shout';
  glow?: number; // 0..1 olhos brilhando
  glowColor?: string;
}

const G = {
  caetano: { T: 58, th: 44, sh: 44, ua: 32, fo: 30, headR: 17, foot: 14, hOff: 1.15, hFwd: 2 },
  orango: { T: 62, th: 34, sh: 30, ua: 52, fo: 50, headR: 21, foot: 17, hOff: 0.85, hFwd: 6 },
};

const rad = (d: number) => (d * Math.PI) / 180;
const pol = (o: P2, ang: number, len: number): P2 => ({ x: o.x + Math.cos(rad(ang)) * len, y: o.y + Math.sin(rad(ang)) * len });

export function lerpPose(a: Pose, b: Pose, k: number): Pose {
  const o: any = {};
  for (const key in a) o[key] = (a as any)[key] + ((b as any)[key] - (a as any)[key]) * k;
  return o as Pose;
}

export function computeRig(ch: CharId, pose: Pose): Rig {
  const g = G[ch];
  const lr = rad(pose.lean);
  const dir = { x: Math.sin(lr), y: -Math.cos(lr) };
  const hip = { x: 0, y: 0 };
  const neck = { x: dir.x * g.T, y: dir.y * g.T };
  const sh = { x: dir.x * g.T * 0.88, y: dir.y * g.T * 0.88 };
  const hd = rad(pose.lean + pose.head);
  const head = { x: neck.x + Math.sin(hd) * g.headR * g.hOff + g.hFwd, y: neck.y - Math.cos(hd) * g.headR * g.hOff };
  const eF = pol(sh, pose.fa1, g.ua);
  const wF = pol(eF, pose.fa2, g.fo);
  const eB = pol(sh, pose.ba1, g.ua);
  const wB = pol(eB, pose.ba2, g.fo);
  const kF = pol(hip, pose.fl1, g.th);
  const aF = pol(kF, pose.fl2, g.sh);
  const tF = pol(aF, pose.fl2 - 75, g.foot);
  const kB = pol(hip, pose.bl1, g.th);
  const aB = pol(kB, pose.bl2, g.sh);
  const tB = pol(aB, pose.bl2 - 75, g.foot);
  const p: Record<string, P2> = { hip, neck, sh, head, eF, wF, eB, wB, kF, aF, tF, kB, aB, tB };
  // rotação em torno do quadril
  if (pose.rot) {
    const c = Math.cos(pose.rot);
    const s = Math.sin(pose.rot);
    for (const k in p) {
      const q = p[k];
      p[k] = { x: q.x * c - q.y * s, y: q.x * s + q.y * c };
    }
  }
  // encosta o ponto mais baixo no chão (y = 0)
  const penalty = (1 - Math.min(1, Math.abs(pose.rot) * 2)) * 600;
  let low = Math.max(p.aF.y + 5, p.aB.y + 5, p.tF.y + 3, p.tB.y + 3);
  low = Math.max(low, p.head.y + g.headR - penalty, p.sh.y + 12 - penalty, p.hip.y + 14 - penalty, p.wF.y + 8 - penalty, p.wB.y + 8 - penalty);
  for (const k in p) p[k] = { x: p[k].x, y: p[k].y - low };
  return { p };
}

// ------------------------------------------------------------ helpers de desenho
const OUT = '#1a1024';

function cap(ctx: CanvasRenderingContext2D, a: P2, b: P2, w1: number, w2: number, fill: string, stroke = OUT, lw = 2.2) {
  const th = Math.atan2(b.y - a.y, b.x - a.x);
  ctx.beginPath();
  ctx.arc(a.x, a.y, w1 / 2, th + Math.PI / 2, th + (3 * Math.PI) / 2);
  ctx.arc(b.x, b.y, w2 / 2, th - Math.PI / 2, th + Math.PI / 2);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (lw > 0) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function poly(ctx: CanvasRenderingContext2D, pts: P2[], fill: string, stroke = OUT, lw = 2.2) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (lw > 0) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

function circ(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke = OUT, lw = 2) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (lw > 0) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function ell(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string, lw = 2, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function tufts(ctx: CanvasRenderingContext2D, a: P2, b: P2, w: number, n: number, color: string, len: number, side = 1) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L = Math.hypot(dx, dy) || 1;
  let nx = -dy / L;
  let ny = dx / L;
  if (side * (ny * 1.0 - nx * 0.3) < 0) {
    nx = -nx;
    ny = -ny;
  }
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const cx = a.x + dx * t + nx * w * 0.42;
    const cy = a.y + dy * t + ny * w * 0.42;
    ctx.beginPath();
    ctx.moveTo(cx - (dx / L) * 5, cy - (dy / L) * 5);
    ctx.lineTo(cx + nx * len + (dx / L) * 1, cy + ny * len + (dy / L) * 1 + 1);
    ctx.lineTo(cx + (dx / L) * 5, cy + (dy / L) * 5);
    ctx.closePath();
    ctx.fill();
  }
}

// ------------------------------------------------------------ CABEÇAS
export function drawHead(ctx: CanvasRenderingContext2D, ch: CharId, r: number, o: DrawOpts) {
  if (ch === 'caetano') headCaetano(ctx, r, o);
  else headOrango(ctx, r, o);
}

function eyeGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, amt: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 0.3);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.35, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = amt;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function headCaetano(ctx: CanvasRenderingContext2D, r: number, o: DrawOpts) {
  const HAIR = '#140c1c';
  const HAIR2 = '#43305e';
  const SKIN = '#c98d5c';
  const SKIN2 = '#a06a42';
  const expr = o.expr || 'n';
  const curl = (x: number, y: number, cr: number) => {
    circ(ctx, x, y, cr, HAIR, '#05030a', 1.4);
    ctx.beginPath();
    ctx.arc(x - cr * 0.15, y - cr * 0.15, cr * 0.6, Math.PI * 1.1, Math.PI * 1.85);
    ctx.strokeStyle = HAIR2;
    ctx.lineWidth = Math.max(1, cr * 0.18);
    ctx.stroke();
  };
  // cabelo de trás
  for (let i = 0; i < 13; i++) {
    const a = rad(100 + i * 20);
    curl(Math.cos(a) * r * 0.92 - r * 0.02, Math.sin(a) * r * 0.9 - r * 0.05, r * 0.36);
  }
  // orelha
  ell(ctx, -r * 0.5, r * 0.2, r * 0.14, r * 0.21, SKIN2, OUT, 1.5);
  // rosto
  ctx.beginPath();
  ctx.moveTo(-r * 0.62, -r * 0.35);
  ctx.bezierCurveTo(-r * 0.7, r * 0.5, -r * 0.2, r * 1.0, r * 0.4, r * 1.0);
  ctx.bezierCurveTo(r * 0.8, r * 0.98, r * 0.95, r * 0.6, r * 0.93, r * 0.35);
  ctx.lineTo(r * 0.95, r * 0.2);
  ctx.lineTo(r * 0.88, -r * 0.4);
  ctx.closePath();
  ctx.fillStyle = SKIN;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.07);
  ctx.strokeStyle = OUT;
  ctx.stroke();
  // sombra do rosto
  ctx.fillStyle = 'rgba(120,70,40,0.25)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.2, r * 0.45, r * 0.4, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  // nariz
  ctx.beginPath();
  ctx.moveTo(r * 0.82, -r * 0.02);
  ctx.quadraticCurveTo(r * 1.0, r * 0.22, r * 0.84, r * 0.3);
  ctx.strokeStyle = SKIN2;
  ctx.lineWidth = r * 0.07;
  ctx.stroke();
  // olhos
  const eye = (x: number, s: number) => {
    if (expr === 'hit') {
      ctx.strokeStyle = OUT;
      ctx.lineWidth = r * 0.07;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.12 * s, -r * 0.1);
      ctx.lineTo(x + r * 0.1 * s, 0);
      ctx.lineTo(x - r * 0.12 * s, r * 0.08);
      ctx.stroke();
      return;
    }
    ell(ctx, x, 0, r * 0.15 * s, r * 0.1 * s, '#fff', OUT, 1.2);
    circ(ctx, x + r * 0.04 * s, 0, r * 0.085 * s, '#4a2a18', OUT, 1);
    circ(ctx, x + r * 0.05 * s, 0, r * 0.045 * s, '#0a0508', undefined, 0);
    circ(ctx, x + r * 0.02 * s, -r * 0.03 * s, r * 0.025 * s, '#fff', undefined, 0);
    // pálpebra semicerrada (olhar debochado)
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.ellipse(x, -r * 0.03 * s, r * 0.17 * s, r * 0.06 * s, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = OUT;
    ctx.lineWidth = r * 0.055;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.16 * s, -r * 0.03 * s);
    ctx.lineTo(x + r * 0.16 * s, -r * 0.045 * s);
    ctx.stroke();
  };
  eye(r * 0.3, 1);
  eye(r * 0.7, 0.8);
  if ((o.glow || 0) > 0) {
    const c = o.glowColor || '#c084fc';
    eyeGlow(ctx, r * 0.3, 0, r * 1.2, c, o.glow!);
    eyeGlow(ctx, r * 0.7, 0, r * 1.0, c, o.glow!);
  }
  // sobrancelhas
  ctx.strokeStyle = HAIR;
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 0.09;
  ctx.beginPath();
  ctx.moveTo(r * 0.1, -r * 0.2);
  ctx.quadraticCurveTo(r * 0.3, -r * (expr === 'hit' ? 0.2 : 0.34), r * 0.48, -r * (expr === 'hit' ? 0.3 : 0.28));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r * 0.58, -r * 0.2);
  ctx.lineTo(r * 0.88, -r * (expr === 'hit' ? 0.3 : 0.14));
  ctx.stroke();
  // bigode + boca
  ctx.lineWidth = r * 0.045;
  ctx.beginPath();
  ctx.moveTo(r * 0.45, r * 0.5);
  ctx.quadraticCurveTo(r * 0.65, r * 0.42, r * 0.88, r * 0.46);
  ctx.stroke();
  if (expr === 'n') {
    ctx.strokeStyle = '#3a1410';
    ctx.lineWidth = r * 0.05;
    ctx.beginPath();
    ctx.moveTo(r * 0.4, r * 0.6);
    ctx.quadraticCurveTo(r * 0.62, r * 0.7, r * 0.84, r * 0.52);
    ctx.stroke();
  } else {
    const open = expr === 'shout' ? 0.24 : 0.15;
    ell(ctx, r * 0.62, r * 0.66, r * 0.2, r * open, '#4a0d14', OUT, 1.5);
    ell(ctx, r * 0.62, r * (0.66 - open * 0.6), r * 0.17, r * 0.05, '#fff');
  }
  ctx.lineCap = 'butt';
  // franja de cachos
  for (let i = 0; i < 7; i++) {
    const a = rad(205 + i * 22);
    curl(Math.cos(a) * r * 0.72 + r * 0.12, Math.sin(a) * r * 0.62 - r * 0.28, r * 0.33);
  }
  curl(r * 0.78, -r * 0.55, r * 0.26);
}

function headOrango(ctx: CanvasRenderingContext2D, r: number, o: DrawOpts) {
  const expr = o.expr || 'n';
  const mouthOpen = expr === 'shout' ? 1 : expr === 'hit' ? 0.5 : 0;
  // pelagem (cúpula espetada + barba)
  const N = 30;
  ctx.beginPath();
  for (let i = 0; i <= N * 2; i++) {
    const a = (i / (N * 2)) * Math.PI * 2;
    const down = Math.max(0, Math.sin(a));
    let rr = r * (1.0 + 0.12 * down + (i % 2 ? 0.17 : 0));
    if (down > 0.3) rr += r * 0.25 * down * (i % 2 ? 1 : 0.4);
    const x = -r * 0.05 + Math.cos(a) * rr;
    const y = -r * 0.1 + Math.sin(a) * rr * (a > 0 && a < Math.PI ? 0.95 : 1);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const gr = ctx.createRadialGradient(-r * 0.3, -r * 0.5, r * 0.1, 0, 0, r * 1.4);
  gr.addColorStop(0, '#f2792f');
  gr.addColorStop(0.6, '#d3521b');
  gr.addColorStop(1, '#a23510');
  ctx.fillStyle = gr;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.06);
  ctx.strokeStyle = '#4a1406';
  ctx.stroke();
  // mechas de pelo
  ctx.strokeStyle = 'rgba(255,170,90,0.55)';
  ctx.lineWidth = Math.max(1, r * 0.04);
  for (let i = 0; i < 9; i++) {
    const a = rad(190 + i * 18);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55 - r * 0.1);
    ctx.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95 - r * 0.1);
    ctx.stroke();
  }
  // máscara facial
  ell(ctx, r * 0.36, r * 0.1, r * 0.68, r * 0.78, '#6c463f', '#2a0e0a', Math.max(1.5, r * 0.05));
  // focinho
  ell(ctx, r * 0.66, r * 0.45, r * 0.44, r * 0.34, '#8c6056', '#2a0e0a', Math.max(1, r * 0.04));
  // testa/sobrancelha
  ctx.strokeStyle = '#2f1713';
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 0.17;
  ctx.beginPath();
  ctx.moveTo(r * 0.02, -r * 0.18);
  ctx.quadraticCurveTo(r * 0.5, -r * 0.34, r * 0.95, -r * 0.14);
  ctx.stroke();
  // olhos
  const eye = (x: number, y: number, s: number) => {
    if (expr === 'hit') {
      ctx.strokeStyle = '#150806';
      ctx.lineWidth = r * 0.06;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.1, y - r * 0.06);
      ctx.lineTo(x + r * 0.08, y);
      ctx.lineTo(x - r * 0.1, y + r * 0.06);
      ctx.stroke();
      return;
    }
    ell(ctx, x, y, r * 0.11 * s, r * 0.065 * s, '#f6b13a', '#150806', 1);
    ell(ctx, x + r * 0.02, y, r * 0.04 * s, r * 0.06 * s, '#0c0404');
    circ(ctx, x - r * 0.02, y - r * 0.02, r * 0.018, '#fff', undefined, 0);
  };
  eye(r * 0.3, -r * 0.06, 1);
  eye(r * 0.72, -r * 0.04, 0.85);
  if ((o.glow || 0) > 0) {
    const c = o.glowColor || '#ff3b2f';
    eyeGlow(ctx, r * 0.3, -r * 0.06, r * 1.2, c, o.glow!);
    eyeGlow(ctx, r * 0.72, -r * 0.04, r * 1.0, c, o.glow!);
  }
  // narinas
  ell(ctx, r * 0.82, r * 0.28, r * 0.035, r * 0.05, '#1a0806');
  ell(ctx, r * 0.95, r * 0.3, r * 0.03, r * 0.045, '#1a0806');
  // boca
  if (mouthOpen > 0) {
    const h = r * (0.1 + 0.3 * mouthOpen);
    ctx.beginPath();
    ctx.ellipse(r * 0.68, r * 0.62 + h * 0.3, r * 0.33, h, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#5a0f14';
    ctx.fill();
    ctx.lineWidth = r * 0.04;
    ctx.strokeStyle = '#150806';
    ctx.stroke();
    ell(ctx, r * 0.68, r * 0.62 + h * 0.7, r * 0.2, h * 0.45, '#d96a7c');
    ctx.fillStyle = '#fff6e0';
    for (const fx of [0.42, 0.9]) {
      ctx.beginPath();
      ctx.moveTo(r * fx - r * 0.06, r * 0.62 - h * 0.5);
      ctx.lineTo(r * fx, r * 0.62 + h * 0.5);
      ctx.lineTo(r * fx + r * 0.06, r * 0.62 - h * 0.5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(r * fx - r * 0.06, r * 0.62 + h * 1.5);
      ctx.lineTo(r * fx, r * 0.62 + h * 0.6);
      ctx.lineTo(r * fx + r * 0.06, r * 0.62 + h * 1.5);
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = '#1a0806';
    ctx.lineWidth = r * 0.05;
    ctx.beginPath();
    ctx.moveTo(r * 0.38, r * 0.6);
    ctx.quadraticCurveTo(r * 0.7, r * 0.66, r * 0.98, r * 0.55);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

// ------------------------------------------------------------ CORPOS
export function drawRig(ctx: CanvasRenderingContext2D, ch: CharId, rig: Rig, pose: Pose, o: DrawOpts) {
  if (ch === 'caetano') drawCaetano(ctx, rig, pose, o);
  else drawOrango(ctx, rig, pose, o);
}

function unit(a: P2, b: P2): P2 {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
}

function drawCaetano(ctx: CanvasRenderingContext2D, r: Rig, pose: Pose, o: DrawOpts) {
  const p = r.p;
  const SKIN = '#c98d5c';
  const SKIN2 = '#a8714a';
  const WHITE = '#f6f3fd';
  const SHADE = '#cdc5e6';
  const PUR = '#7e22ce';
  const exprs = o.expr || 'n';

  const hand = (w: P2, e: P2, front: boolean) => {
    const u = unit(e, w);
    if (front && pose.finger > 0.5) {
      // mão aberta com indicador esticado
      circ(ctx, w.x + u.x * 3, w.y + u.y * 3, 6, SKIN, OUT, 1.8);
      cap(ctx, { x: w.x + u.x * 4, y: w.y + u.y * 4 }, { x: w.x + u.x * 21, y: w.y + u.y * 21 }, 5, 4, SKIN, OUT, 1.6);
      circ(ctx, w.x + u.x * 2 - u.y * 5, w.y + u.y * 2 + u.x * 5, 3.2, SKIN, OUT, 1.2);
    } else {
      circ(ctx, w.x + u.x * 4, w.y + u.y * 4, 6.6, SKIN, OUT, 2);
      ctx.strokeStyle = SKIN2;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(w.x + u.x * 6 - u.y * 4, w.y + u.y * 6 + u.x * 4);
      ctx.lineTo(w.x + u.x * 6 + u.y * 4, w.y + u.y * 6 - u.x * 4);
      ctx.stroke();
    }
  };
  const arm = (s: P2, e: P2, w: P2, front: boolean) => {
    cap(ctx, e, w, 10.5, 9, SKIN, OUT, 2);
    cap(ctx, s, e, 16, 14, WHITE, OUT, 2.2);
    // dobra da manga
    ctx.strokeStyle = SHADE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e.x - 5, e.y - 4);
    ctx.lineTo(e.x + 5, e.y + 4);
    ctx.stroke();
    hand(w, e, front);
  };
  const leg = (k: P2, a: P2, t: P2) => {
    cap(ctx, a, t, 9.5, 7, SKIN, OUT, 2);
    cap(ctx, k, a, 12, 9, SKIN, OUT, 2);
    const m = { x: k.x + (a.x - k.x) * 0.62, y: k.y + (a.y - k.y) * 0.62 };
    cap(ctx, p.hip, k, 20, 17, WHITE, OUT, 2.2);
    cap(ctx, k, m, 18, 16, WHITE, OUT, 2.2);
    ctx.strokeStyle = SHADE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.hip.x + (k.x - p.hip.x) * 0.5 - 3, p.hip.y + (k.y - p.hip.y) * 0.5);
    ctx.lineTo(k.x - 2, k.y - 2);
    ctx.stroke();
  };

  const lr = rad(pose.lean);
  const dir = { x: Math.sin(lr), y: -Math.cos(lr) };
  const n = { x: Math.cos(lr), y: Math.sin(lr) };
  const along = (t: number, s: number): P2 => ({ x: p.hip.x + (p.sh.x - p.hip.x) * t + n.x * s, y: p.hip.y + (p.sh.y - p.hip.y) * t + n.y * s });
  if (pose.rot) {
    // com rotação, 'n' e 'dir' acompanham o corpo
    const c = Math.cos(pose.rot);
    const s = Math.sin(pose.rot);
    const rd = { x: dir.x * c - dir.y * s, y: dir.x * s + dir.y * c };
    dir.x = rd.x;
    dir.y = rd.y;
    const rn = { x: n.x * c - n.y * s, y: n.x * s + n.y * c };
    n.x = rn.x;
    n.y = rn.y;
  }
  const belt = along(0.2, 0);
  const knot = { x: belt.x + n.x * 9, y: belt.y + n.y * 9 };

  // pontas da faixa (atrás)
  const wave = Math.sin(o.time * 0.28) * 7;
  for (let i = 0; i < 2; i++) {
    const L = 34 + i * 12;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(knot.x, knot.y);
      ctx.bezierCurveTo(knot.x - L * 0.3, knot.y + 4 + wave * 0.5 + i * 6, knot.x - L * 0.7, knot.y - 3 + wave + i * 4, knot.x - L, knot.y + 8 + wave * 1.4 + i * 10);
    };
    ctx.lineCap = 'round';
    path();
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 9;
    ctx.stroke();
    path();
    ctx.strokeStyle = i ? '#6d28d9' : '#8b3fe0';
    ctx.lineWidth = 5.5;
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  // braço de trás + perna de trás
  arm(p.sh, p.eB, p.wB, false);
  leg(p.kB, p.aB, p.tB);

  // pescoço
  cap(ctx, p.sh, p.head, 11, 11, SKIN2, OUT, 2);

  // torso (kimono)
  const T1 = along(0, -15);
  const T2 = along(0, 15);
  const T3 = along(1.02, 17);
  const T4 = along(1.02, -17);
  poly(ctx, [T1, T2, T3, T4], WHITE, OUT, 2.4);
  poly(ctx, [T1, along(0, -3), along(1.02, -2), T4], SHADE, OUT, 0);
  // gola em V
  const vtop1 = along(1.02, -4);
  const vtop2 = along(1.02, 9);
  const vbot = along(0.42, 6);
  poly(ctx, [vtop1, vtop2, vbot], SKIN2, OUT, 1.6);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(vtop1.x, vtop1.y);
  ctx.lineTo(along(0.2, 4).x, along(0.2, 4).y);
  ctx.moveTo(vtop2.x, vtop2.y);
  ctx.lineTo(along(0.2, 4).x, along(0.2, 4).y);
  ctx.stroke();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 2.6;
  ctx.stroke();
  // patch do peito
  const pc = along(0.7, 10);
  ctx.fillStyle = '#1a1024';
  ctx.fillRect(pc.x - 3, pc.y - 3, 6, 6);
  // faixa roxa
  const b1 = along(0.2, -16);
  const b2 = along(0.2, 16);
  ctx.beginPath();
  ctx.moveTo(b1.x - dir.x * 5, b1.y - dir.y * 5);
  ctx.lineTo(b2.x - dir.x * 5, b2.y - dir.y * 5);
  ctx.lineTo(b2.x + dir.x * 5, b2.y + dir.y * 5);
  ctx.lineTo(b1.x + dir.x * 5, b1.y + dir.y * 5);
  ctx.closePath();
  ctx.fillStyle = PUR;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = OUT;
  ctx.stroke();
  circ(ctx, knot.x, knot.y, 5.5, '#9333ea', OUT, 2);

  // cabeça
  ctx.save();
  ctx.translate(p.head.x, p.head.y);
  ctx.rotate(rad(pose.lean + pose.head) * 0.6 + pose.rot);
  drawHead(ctx, 'caetano', 17, { ...o, expr: o.expr || (exprs === 'n' && pose.mouth > 0.5 ? 'hit' : 'n') });
  ctx.restore();

  // perna da frente + braço da frente
  leg(p.kF, p.aF, p.tF);
  arm(p.sh, p.eF, p.wF, true);
}

function drawOrango(ctx: CanvasRenderingContext2D, r: Rig, pose: Pose, o: DrawOpts) {
  const p = r.p;
  const FUR = '#d6561f';
  const FUR_D = '#a63a12';
  const FUR_L = '#f27a34';
  const HAND = '#7c5650';
  const OUTF = '#4a1406';

  const arm = (s: P2, e: P2, w: P2, front: boolean) => {
    cap(ctx, e, w, 24, 21, FUR, OUTF, 2.6);
    tufts(ctx, e, w, 22, 5, FUR_D, 9);
    cap(ctx, s, e, 29, 25, FUR, OUTF, 2.6);
    tufts(ctx, s, e, 26, 5, FUR_D, 11);
    // luz no pelo
    ctx.strokeStyle = FUR_L;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s.x + (e.x - s.x) * 0.2, s.y + (e.y - s.y) * 0.2 - 5);
    ctx.lineTo(s.x + (e.x - s.x) * 0.8, s.y + (e.y - s.y) * 0.8 - 5);
    ctx.stroke();
    ctx.lineCap = 'butt';
    // mão
    const u = unit(e, w);
    const hx = w.x + u.x * 8;
    const hy = w.y + u.y * 8;
    if (front && pose.finger > 0.5) {
      cap(ctx, { x: hx, y: hy }, { x: hx + u.x * 36, y: hy + u.y * 36 }, 10, 7, HAND, OUTF, 2);
      circ(ctx, hx, hy, 13, HAND, OUTF, 2.4);
      for (let i = 0; i < 3; i++) circ(ctx, hx + u.x * 3 - u.y * (6 - i * 6), hy + u.y * 3 + u.x * (6 - i * 6) + 5, 5, '#6a4741', OUTF, 1.4);
    } else {
      circ(ctx, hx, hy, 13.5, HAND, OUTF, 2.4);
      for (let i = 0; i < 4; i++) {
        const ax = hx + u.x * 9 - u.y * (i * 6 - 9);
        const ay = hy + u.y * 9 + u.x * (i * 6 - 9);
        circ(ctx, ax, ay, 4.6, '#6a4741', OUTF, 1.3);
      }
    }
  };
  const leg = (k: P2, a: P2, t: P2) => {
    cap(ctx, a, t, 14, 11, HAND, OUTF, 2.4);
    cap(ctx, k, a, 21, 17, FUR, OUTF, 2.6);
    tufts(ctx, k, a, 19, 3, FUR_D, 8);
    cap(ctx, p.hip, k, 26, 22, FUR, OUTF, 2.6);
    tufts(ctx, p.hip, k, 24, 3, FUR_D, 9);
  };

  const lr = rad(pose.lean);
  const dir = { x: Math.sin(lr), y: -Math.cos(lr) };
  const n = { x: Math.cos(lr), y: Math.sin(lr) };
  if (pose.rot) {
    const c = Math.cos(pose.rot);
    const s = Math.sin(pose.rot);
    const rd = { x: dir.x * c - dir.y * s, y: dir.x * s + dir.y * c };
    dir.x = rd.x;
    dir.y = rd.y;
    const rn = { x: n.x * c - n.y * s, y: n.x * s + n.y * c };
    n.x = rn.x;
    n.y = rn.y;
  }
  const along = (t: number, s: number): P2 => ({ x: p.hip.x + (p.sh.x - p.hip.x) * t + n.x * s, y: p.hip.y + (p.sh.y - p.hip.y) * t + n.y * s });

  arm(p.sh, p.eB, p.wB, false);
  leg(p.kB, p.aB, p.tB);

  // pescoço grosso
  cap(ctx, p.sh, p.head, 26, 22, FUR_D, OUTF, 2.4);

  // torso (barrigudo e musculoso)
  const pts = [along(0, -26), along(0.25, -30), along(0.7, -36), along(1.05, -30), along(1.12, 0), along(1.05, 32), along(0.7, 38), along(0.3, 33), along(0, 26)];
  poly(ctx, pts, FUR, OUTF, 2.8);
  // sombra nas costas
  poly(ctx, [along(0, -26), along(0.25, -30), along(0.7, -36), along(1.05, -30), along(1.0, -12), along(0.5, -10), along(0, -8)], FUR_D, OUTF, 0);
  // peito/barriga de pele
  ell(ctx, along(0.7, 16).x, along(0.7, 16).y, 17, 20, '#a9624c', undefined, 0, Math.atan2(dir.y, dir.x) + Math.PI / 2);
  ell(ctx, along(0.38, 16).x, along(0.38, 16).y, 14, 15, '#9c5642', undefined, 0, Math.atan2(dir.y, dir.x) + Math.PI / 2);
  // pelos espetados no dorso
  tufts(ctx, along(0, -26), along(1.05, -30), 60, 7, FUR_D, 6, -1);
  tufts(ctx, along(0.1, 28), along(1.0, 34), 60, 5, FUR_D, 5, 1);
  // linhas de músculo
  ctx.strokeStyle = 'rgba(80,20,5,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(along(0.8, 4).x, along(0.8, 4).y);
  ctx.lineTo(along(0.55, 4).x, along(0.55, 4).y);
  ctx.stroke();

  // cabeça
  ctx.save();
  ctx.translate(p.head.x, p.head.y);
  ctx.rotate(rad(pose.lean + pose.head) * 0.4 + pose.rot);
  drawHead(ctx, 'orango', 21, { ...o, expr: o.expr || (pose.mouth > 0.5 ? 'shout' : 'n') });
  ctx.restore();

  leg(p.kF, p.aF, p.tF);
  arm(p.sh, p.eF, p.wF, true);
}

// ------------------------------------------------------------ retratos
export function drawPortrait(ctx: CanvasRenderingContext2D, ch: CharId, x: number, y: number, size: number, o: DrawOpts, flip = false) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  drawHead(ctx, ch, size, o);
  ctx.restore();
}

export function drawFullBody(ctx: CanvasRenderingContext2D, ch: CharId, x: number, y: number, scale: number, time: number, poseName = 'idle', flip = false) {
  const def = CHARS[ch];
  const pose = { ...def.poses[poseName] };
  pose.lean += Math.sin(time * 0.06) * 1.2;
  const rig = computeRig(ch, pose);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -scale : scale, scale);
  drawRig(ctx, ch, rig, pose, { time });
  ctx.restore();
}
