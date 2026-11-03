// Esqueletos articulados e desenho vetorial dos quatro lutadores.
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
  kiss?: boolean; // pose de finalização do Tubarão Fiscal
}

const G = {
  caetano: { T: 58, th: 44, sh: 44, ua: 32, fo: 30, headR: 17, foot: 14, hOff: 1.15, hFwd: 2 },
  orango: { T: 62, th: 34, sh: 30, ua: 52, fo: 50, headR: 21, foot: 17, hOff: 0.85, hFwd: 6 },
  tubarao: { T: 66, th: 46, sh: 42, ua: 38, fo: 35, headR: 23, foot: 17, hOff: 0.9, hFwd: 4 },
  rickzera: { T: 57, th: 44, sh: 43, ua: 32, fo: 30, headR: 17, foot: 16, hOff: 1.15, hFwd: 2 },
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
  else if (ch === 'orango') headOrango(ctx, r, o);
  else if (ch === 'tubarao') headTubarao(ctx, r, o);
  else headRickzera(ctx, r, o);
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
  else if (ch === 'orango') drawOrango(ctx, rig, pose, o);
  else if (ch === 'tubarao') drawTubarao(ctx, rig, pose, o);
  else drawRickzera(ctx, rig, pose, o);
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

// ------------------------------------------------------------ NOVOS LUTADORES
// Ambos usam os mesmos pontos articulados; a silhueta e o acabamento são próprios.
function bodyAxes(p: Record<string, P2>) {
  const up = unit(p.hip, p.sh);
  const side = { x: -up.y, y: up.x };
  return {
    up, side,
    at: (t: number, width = 0): P2 => ({ x: p.hip.x + (p.sh.x - p.hip.x) * t + side.x * width, y: p.hip.y + (p.sh.y - p.hip.y) * t + side.y * width }),
  };
}

function strokePath(ctx: CanvasRenderingContext2D, points: P2[], color: string, width: number) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function headTubarao(ctx: CanvasRenderingContext2D, r: number, o: DrawOpts) {
  const edge = '#142832';
  const skin = ctx.createLinearGradient(-r, -r, r, r);
  skin.addColorStop(0, '#a4bbc6');
  skin.addColorStop(0.5, '#6f8c9c');
  skin.addColorStop(1, '#415d70');
  ctx.beginPath();
  ctx.moveTo(-r * 0.75, -r * 0.35);
  ctx.bezierCurveTo(-r * 0.82, -r * 1.12, r * 0.05, -r * 1.22, r * 0.58, -r * 0.78);
  ctx.quadraticCurveTo(r * 0.85, -r * 0.63, r * 1.36, -r * 0.38);
  ctx.quadraticCurveTo(r * 1.58, -r * 0.22, r * 1.25, -r * 0.02);
  ctx.lineTo(r * 1.15, r * 0.28);
  ctx.quadraticCurveTo(r * 1.3, r * 0.79, r * 0.44, r * 0.86);
  ctx.quadraticCurveTo(-r * 0.62, r * 0.97, -r * 0.75, -r * 0.35);
  ctx.fillStyle = skin;
  ctx.fill();
  ctx.lineWidth = Math.max(1.8, r * 0.065);
  ctx.strokeStyle = edge;
  ctx.stroke();
  // Máscara ventral clara e focinho achatado.
  ctx.beginPath();
  ctx.moveTo(r * 1.23, -r * 0.02);
  ctx.quadraticCurveTo(r * 0.56, r * 0.16, -r * 0.3, r * 0.2);
  ctx.quadraticCurveTo(-r * 0.22, r * 0.83, r * 0.45, r * 0.8);
  ctx.quadraticCurveTo(r * 1.25, r * 0.7, r * 1.15, r * 0.28);
  ctx.closePath();
  ctx.fillStyle = '#bccbd0';
  ctx.fill();
  // A sobrancelha continua a linha do nariz, com olhar de fiscal.
  strokePath(ctx, [{ x: r * 0.03, y: -r * 0.4 }, { x: r * 0.43, y: -r * 0.48 }, { x: r * 0.8, y: -r * 0.32 }], '#233e4d', r * 0.11);
  if (o.expr === 'hit') {
    strokePath(ctx, [{ x: r * 0.17, y: -r * 0.26 }, { x: r * 0.47, y: -r * 0.15 }, { x: r * 0.2, y: -r * 0.04 }], edge, r * 0.065);
  } else {
    ell(ctx, r * 0.4, -r * 0.24, r * 0.17, r * 0.085, '#0c1b24', edge, r * 0.03, 0.12);
    circ(ctx, r * 0.48, -r * 0.25, r * 0.035, '#d1faff', undefined, 0);
  }
  ell(ctx, r * 1.02, -r * 0.2, r * 0.06, r * 0.035, '#203542');
  // Três guelras na lateral, inclusive nos retratos pequenos.
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-r * (0.48 - i * 0.15), -r * 0.05);
    ctx.quadraticCurveTo(-r * (0.57 - i * 0.15), r * 0.15, -r * (0.36 - i * 0.15), r * 0.34);
    ctx.lineWidth = Math.max(1, r * 0.04);
    ctx.strokeStyle = '#3c596a';
    ctx.stroke();
  }
  if (o.kiss) {
    // A boca em biquinho é usada apenas no Beijo do Fiscalizador.
    ell(ctx, r * 1.18, r * 0.38, r * 0.2, r * 0.13, '#dd6b91', edge, r * 0.04);
    strokePath(ctx, [{ x: r * 1.08, y: r * 0.38 }, { x: r * 1.37, y: r * 0.38 }], '#842c58', r * 0.04);
  } else {
    const open = o.expr === 'shout' ? 0.42 : o.expr === 'hit' ? 0.24 : 0.11;
    ctx.beginPath();
    ctx.moveTo(r * 0.13, r * 0.33);
    ctx.quadraticCurveTo(r * 0.75, r * (0.39 - open * 0.65), r * 1.15, r * 0.17);
    ctx.quadraticCurveTo(r * 0.98, r * (0.47 + open), r * 0.48, r * (0.46 + open));
    ctx.quadraticCurveTo(r * 0.24, r * (0.46 + open * 0.6), r * 0.13, r * 0.33);
    ctx.closePath();
    ctx.fillStyle = '#102634';
    ctx.fill();
    ctx.lineWidth = r * 0.04;
    ctx.strokeStyle = edge;
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const x = r * (0.23 + i * 0.125);
      const y = r * (0.34 - i * 0.018);
      const h = r * (0.12 + open * 0.28);
      poly(ctx, [{ x, y }, { x: x + r * 0.09, y: y - r * 0.005 }, { x: x + r * 0.05, y: y + h }], '#f3f5e9', edge, r * 0.018);
    }
    if (open > 0.2) for (let i = 0; i < 5; i++) {
      const x = r * (0.43 + i * 0.12);
      const y = r * (0.45 + open - i * 0.027);
      poly(ctx, [{ x, y }, { x: x + r * 0.08, y: y - r * 0.01 }, { x: x + r * 0.035, y: y - r * 0.13 }], '#f3f5e9', undefined, 0);
    }
  }
  // Marcas e reflexo azulado da pele, sem texturas externas.
  strokePath(ctx, [{ x: -r * 0.48, y: -r * 0.69 }, { x: -r * 0.18, y: -r * 0.88 }, { x: r * 0.2, y: -r * 0.83 }], '#c3d5db', r * 0.045);
  if ((o.glow || 0) > 0) eyeGlow(ctx, r * 0.42, -r * 0.24, r * 1.5, o.glowColor || '#67e8f9', o.glow!);
}

function headRickzera(ctx: CanvasRenderingContext2D, r: number, o: DrawOpts) {
  const skin = '#e3ae83';
  const shade = '#bc805d';
  const hair = '#573a26';
  const edge = '#271d22';
  // Corte baixo na nuca e orelha.
  ell(ctx, -r * 0.23, -r * 0.2, r * 0.77, r * 0.88, '#705239', edge, r * 0.06);
  ell(ctx, -r * 0.51, r * 0.17, r * 0.19, r * 0.26, shade, edge, r * 0.045);
  ctx.beginPath();
  ctx.moveTo(-r * 0.49, -r * 0.5);
  ctx.quadraticCurveTo(r * 0.24, -r * 0.9, r * 0.79, -r * 0.45);
  ctx.lineTo(r * 0.91, -r * 0.03);
  ctx.lineTo(r * 1.05, r * 0.19);
  ctx.lineTo(r * 0.87, r * 0.3);
  ctx.quadraticCurveTo(r * 0.94, r * 0.84, r * 0.41, r * 0.98);
  ctx.quadraticCurveTo(-r * 0.16, r * 1.04, -r * 0.42, r * 0.5);
  ctx.closePath();
  ctx.fillStyle = skin;
  ctx.fill();
  ctx.lineWidth = r * 0.065;
  ctx.strokeStyle = edge;
  ctx.stroke();
  poly(ctx, [{ x: -r * 0.42, y: -r * 0.4 }, { x: -r * 0.2, y: -r * 0.38 }, { x: -r * 0.1, y: r * 0.58 }, { x: r * 0.22, y: r * 0.92 }, { x: -r * 0.24, y: r * 0.65 }], '#d19872', undefined, 0);
  // Olhar de canto e sobrancelha levantada.
  if (o.expr === 'hit') {
    strokePath(ctx, [{ x: r * 0.18, y: -r * 0.08 }, { x: r * 0.41, y: r * 0.02 }, { x: r * 0.18, y: r * 0.11 }], edge, r * 0.055);
  } else {
    ell(ctx, r * 0.36, -r * 0.015, r * 0.18, r * 0.095, '#fdf5e9', edge, r * 0.04);
    circ(ctx, r * 0.43, -r * 0.004, r * 0.078, '#647d5e', edge, r * 0.025);
    circ(ctx, r * 0.45, -r * 0.004, r * 0.036, '#10190e', undefined, 0);
    circ(ctx, r * 0.41, -r * 0.037, r * 0.025, '#fff', undefined, 0);
    strokePath(ctx, [{ x: r * 0.18, y: -r * 0.07 }, { x: r * 0.55, y: -r * 0.04 }], edge, r * 0.04);
  }
  strokePath(ctx, [{ x: r * 0.13, y: -r * 0.2 }, { x: r * 0.33, y: -r * 0.28 }, { x: r * 0.57, y: -r * 0.18 }], hair, r * 0.085);
  strokePath(ctx, [{ x: r * 0.67, y: -r * 0.19 }, { x: r * 0.84, y: -r * 0.13 }], hair, r * 0.07);
  strokePath(ctx, [{ x: r * 0.72, y: r * 0.1 }, { x: r * 0.8, y: r * 0.29 }, { x: r * 0.64, y: r * 0.32 }], shade, r * 0.04);
  // Bigode discreto e cavanhaque.
  strokePath(ctx, [{ x: r * 0.43, y: r * 0.47 }, { x: r * 0.61, y: r * 0.45 }, { x: r * 0.82, y: r * 0.46 }], '#75523b', r * 0.04);
  poly(ctx, [{ x: r * 0.29, y: r * 0.73 }, { x: r * 0.38, y: r * 0.91 }, { x: r * 0.59, y: r * 0.91 }, { x: r * 0.7, y: r * 0.73 }, { x: r * 0.52, y: r * 0.82 }], '#65432c', undefined, 0);
  if (o.expr === 'shout') {
    ell(ctx, r * 0.62, r * 0.63, r * 0.2, r * 0.16, '#5e2025', edge, r * 0.04);
    ell(ctx, r * 0.62, r * 0.54, r * 0.16, r * 0.04, '#fff3df');
  } else {
    strokePath(ctx, [{ x: r * 0.36, y: r * 0.63 }, { x: r * 0.6, y: r * 0.65 }, { x: r * 0.86, y: r * 0.52 }], '#63342d', r * 0.055);
  }
  // Franja castanha em mechas; laterais raspadas aparecem sob o topo.
  poly(ctx, [
    { x: -r * 0.69, y: -r * 0.25 }, { x: -r * 0.73, y: -r * 0.82 },
    { x: -r * 0.5, y: -r * 1.08 }, { x: -r * 0.28, y: -r * 0.96 },
    { x: -r * 0.07, y: -r * 1.18 }, { x: r * 0.16, y: -r * 1.04 },
    { x: r * 0.44, y: -r * 1.13 }, { x: r * 0.56, y: -r * 0.93 },
    { x: r * 0.8, y: -r * 0.94 }, { x: r * 0.92, y: -r * 0.68 },
    { x: r * 0.77, y: -r * 0.32 }, { x: r * 0.64, y: -r * 0.58 },
    { x: r * 0.5, y: -r * 0.35 }, { x: r * 0.36, y: -r * 0.63 },
    { x: r * 0.18, y: -r * 0.42 }, { x: r * 0.01, y: -r * 0.68 },
    { x: -r * 0.2, y: -r * 0.53 }, { x: -r * 0.4, y: -r * 0.62 },
  ], hair, edge, r * 0.05);
  for (let i = 0; i < 5; i++) strokePath(ctx, [{ x: r * (-0.47 + i * 0.24), y: -r * (0.91 + (i % 2) * 0.08) }, { x: r * (-0.35 + i * 0.24), y: -r * 0.66 }], '#9c7044', r * 0.035);
  if ((o.glow || 0) > 0) eyeGlow(ctx, r * 0.41, 0, r * 1.4, o.glowColor || '#a3ff36', o.glow!);
}

function drawTubarao(ctx: CanvasRenderingContext2D, r: Rig, pose: Pose, o: DrawOpts) {
  const p = r.p;
  const { at, side, up } = bodyAxes(p);
  const edge = '#162b38';
  const skin = '#718d9f';
  const shade = '#4c687d';
  const light = '#a8c1ca';
  const arm = (e: P2, w: P2, front: boolean) => {
    const direction = unit(e, w);
    const finSide = { x: -direction.y, y: direction.x };
    cap(ctx, p.sh, e, 28, 22, front ? skin : shade, edge, 2.4);
    cap(ctx, e, w, 23, 15, front ? skin : shade, edge, 2.3);
    // Nadadeira rígida acompanha o antebraço durante os golpes.
    const mid = { x: e.x * 0.65 + w.x * 0.35, y: e.y * 0.65 + w.y * 0.35 };
    poly(ctx, [
      { x: mid.x + finSide.x * 10, y: mid.y + finSide.y * 10 },
      { x: mid.x + finSide.x * 25 - direction.x * 7, y: mid.y + finSide.y * 25 - direction.y * 7 },
      { x: w.x + finSide.x * 6, y: w.y + finSide.y * 6 },
    ], front ? '#587a90' : '#39596f', edge, 1.8);
    const hand = { x: w.x + direction.x * 6, y: w.y + direction.y * 6 };
    circ(ctx, hand.x, hand.y, 9.6, light, edge, 2);
    if (front && pose.finger > 0.5) cap(ctx, hand, { x: hand.x + direction.x * 22, y: hand.y + direction.y * 22 }, 6, 4, light, edge, 1.5);
    else strokePath(ctx, [{ x: hand.x - direction.y * 6 + direction.x * 5, y: hand.y + direction.x * 6 + direction.y * 5 }, { x: hand.x + direction.y * 6 + direction.x * 5, y: hand.y - direction.x * 6 + direction.y * 5 }], '#627f8f', 1.2);
    strokePath(ctx, [{ x: e.x - 4, y: e.y - 7 }, { x: w.x * 0.4 + e.x * 0.6 - 3, y: w.y * 0.4 + e.y * 0.6 - 5 }], light, 2.2);
  };
  const leg = (k: P2, a: P2, t: P2, back: boolean) => {
    cap(ctx, p.hip, k, 27, 23, back ? shade : skin, edge, 2.4);
    cap(ctx, k, a, 22, 14, back ? shade : skin, edge, 2.2);
    cap(ctx, a, t, 15, 12, light, edge, 2);
    const dir = unit(a, t);
    for (let i = -1; i <= 1; i++) strokePath(ctx, [{ x: t.x - dir.y * i * 4, y: t.y + dir.x * i * 4 }, { x: t.x - dir.x * 5 - dir.y * i * 4, y: t.y - dir.y * 5 + dir.x * i * 4 }], '#5f7d8d', 1);
    if (!back) strokePath(ctx, [{ x: k.x - 3, y: k.y - 5 }, { x: k.x * 0.35 + a.x * 0.65 - 2, y: k.y * 0.35 + a.y * 0.65 - 1 }], light, 2);
  };
  // Cauda e barbatana dorsal dão uma silhueta imediatamente reconhecível.
  const sway = Math.sin(o.time * 0.08) * 9;
  const tailBase = at(0.12, -13);
  const tailEnd = { x: tailBase.x - side.x * 64 + up.x * sway, y: tailBase.y - side.y * 64 + up.y * sway };
  ctx.beginPath();
  ctx.moveTo(tailBase.x, tailBase.y);
  ctx.quadraticCurveTo(tailBase.x - side.x * 26 - up.x * 18, tailBase.y - side.y * 26 - up.y * 18, tailEnd.x, tailEnd.y);
  ctx.quadraticCurveTo(tailBase.x - side.x * 35 - up.x * 2, tailBase.y - side.y * 35 - up.y * 2, tailBase.x + up.x * 15, tailBase.y + up.y * 15);
  ctx.closePath();
  ctx.fillStyle = shade;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.stroke();
  poly(ctx, [tailEnd, { x: tailEnd.x - side.x * 19 + up.x * 24, y: tailEnd.y - side.y * 19 + up.y * 24 }, { x: tailEnd.x - side.x * 15 + up.x * 2, y: tailEnd.y - side.y * 15 + up.y * 2 }, { x: tailEnd.x - side.x * 25 - up.x * 20, y: tailEnd.y - side.y * 25 - up.y * 20 }], '#48687e', edge, 2);
  poly(ctx, [at(0.4, -23), at(1.1, -67), at(1.05, -22)], '#587b90', edge, 2.4);
  poly(ctx, [at(0.57, -27), at(1.03, -59), at(0.94, -27)], '#789ba9', undefined, 0);
  arm(p.eB, p.wB, false);
  leg(p.kB, p.aB, p.tB, true);
  cap(ctx, p.sh, p.head, 22, 22, shade, edge, 2.2);
  poly(ctx, [at(-0.06, -16), at(-0.06, 17), at(0.4, 29), at(0.88, 36), at(1.07, 23), at(1.1, -22), at(0.86, -31), at(0.35, -25)], skin, edge, 2.6);
  poly(ctx, [at(0, -16), at(0.7, -29), at(1.05, -22), at(0.97, -11), at(0.2, -8)], shade, undefined, 0);
  // Plaque claire du ventre et pectoraux, plus six lignes d'abdominaux.
  poly(ctx, [at(0.08, 3), at(0.24, 17), at(0.7, 27), at(1.01, 19), at(1.0, 1), at(0.7, -1), at(0.3, -1)], '#b2c5cc', undefined, 0);
  strokePath(ctx, [at(0.94, 1), at(0.7, 1), at(0.62, 7), at(0.65, 27)], '#4c6b7b', 1.8);
  strokePath(ctx, [at(0.7, -16), at(0.62, -4), at(0.65, 1)], '#4c6b7b', 1.7);
  strokePath(ctx, [at(0.6, 4), at(0.18, 4)], '#688592', 1.4);
  for (let i = 0; i < 3; i++) strokePath(ctx, [at(0.23 + i * 0.12, 5), at(0.22 + i * 0.12, 16 - i)], '#76919d', 1.3);
  for (let i = 0; i < 3; i++) strokePath(ctx, [at(0.73 + i * 0.075, 29), at(0.68 + i * 0.075, 33)], '#3a596e', 1.4);
  leg(p.kF, p.aF, p.tF, false);
  ctx.save();
  ctx.translate(p.head.x, p.head.y);
  ctx.rotate(rad(pose.lean + pose.head) * 0.5 + pose.rot);
  headTubarao(ctx, 23, { ...o, expr: o.expr || (pose.mouth > 0.5 ? 'shout' : 'n'), kiss: pose.mouth > 1.5 });
  ctx.restore();
  arm(p.eF, p.wF, true);
}

function drawRickzera(ctx: CanvasRenderingContext2D, r: Rig, pose: Pose, o: DrawOpts) {
  const p = r.p;
  const { at, side } = bodyAxes(p);
  const black = '#20222b';
  const shade = '#10131c';
  const highlight = '#3c414b';
  const green = '#a3ff36';
  const skin = '#e3ae83';
  const edge = '#11151c';
  const arm = (e: P2, w: P2, front: boolean) => {
    cap(ctx, p.sh, e, 18, 15.5, front ? black : shade, edge, 2.1);
    cap(ctx, e, w, 16, 10, front ? black : shade, edge, 2.1);
    const u = unit(e, w);
    strokePath(ctx, [{ x: p.sh.x - 4, y: p.sh.y - 3 }, { x: e.x - 4, y: e.y - 4 }], highlight, 1.6);
    cap(ctx, { x: w.x - u.x * 5, y: w.y - u.y * 5 }, w, 11, 10, '#41464b', edge, 1.2);
    const h = { x: w.x + u.x * 4, y: w.y + u.y * 4 };
    circ(ctx, h.x, h.y, 6.5, skin, edge, 1.7);
    if (front && pose.finger > 0.5) {
      cap(ctx, h, { x: h.x + u.x * 19, y: h.y + u.y * 19 }, 4.7, 3.2, skin, edge, 1.2);
      cap(ctx, { x: h.x + u.y * 3, y: h.y - u.x * 3 }, { x: h.x + u.x * 12 + u.y * 9, y: h.y + u.y * 12 - u.x * 9 }, 4, 3, skin, edge, 1.2);
    } else strokePath(ctx, [{ x: h.x + u.x * 4 - u.y * 4, y: h.y + u.y * 4 + u.x * 4 }, { x: h.x + u.x * 4 + u.y * 4, y: h.y + u.y * 4 - u.x * 4 }], '#ab7254', 1);
    // Faixa fina fluorescente no punho direito.
    if (front) strokePath(ctx, [{ x: w.x - u.x * 4 - u.y * 4.5, y: w.y - u.y * 4 + u.x * 4.5 }, { x: w.x - u.x * 4 + u.y * 4.5, y: w.y - u.y * 4 - u.x * 4.5 }], green, 1.6);
  };
  const leg = (k: P2, a: P2, t: P2, back: boolean) => {
    cap(ctx, p.hip, k, 21, 16, back ? shade : black, edge, 2.2);
    cap(ctx, k, a, 17, 11, back ? shade : black, edge, 2);
    strokePath(ctx, [{ x: k.x - 4, y: k.y + 2 }, { x: a.x - 3, y: a.y - 6 }], highlight, 1.5);
    const u = unit(a, t);
    const n = { x: -u.y, y: u.x };
    // Tênis de cano baixo, biqueira escura e sola branca visível nos chutes.
    cap(ctx, a, t, 13, 12, '#16191f', edge, 2);
    strokePath(ctx, [{ x: a.x + n.x * 5, y: a.y + n.y * 5 }, { x: t.x + n.x * 5, y: t.y + n.y * 5 }], '#efefea', 4.2);
    strokePath(ctx, [{ x: a.x + n.x * 1.2 + u.x * 2, y: a.y + n.y * 1.2 + u.y * 2 }, { x: a.x - n.x * 4 + u.x * 6, y: a.y - n.y * 4 + u.y * 6 }], '#b7c0b9', 1.2);
    if (!back) strokePath(ctx, [{ x: p.hip.x - side.x * 7, y: p.hip.y - side.y * 7 }, { x: k.x - side.x * 6, y: k.y - side.y * 6 }], '#71c325', 1.2);
  };
  arm(p.eB, p.wB, false);
  leg(p.kB, p.aB, p.tB, true);
  cap(ctx, p.sh, p.head, 10, 11, skin, edge, 1.8);
  poly(ctx, [at(-0.1, -15), at(-0.1, 15), at(0.66, 19), at(1.06, 20), at(1.1, -16), at(0.58, -19)], black, edge, 2.4);
  poly(ctx, [at(-0.1, -15), at(0.66, -19), at(1.1, -16), at(0.9, -6), at(0.2, -7)], shade, undefined, 0);
  // Capuz acumulado no pescoço e gola em V, com cordões.
  poly(ctx, [at(0.84, -16), at(1.23, -18), at(1.24, 9), at(0.94, 17), at(0.73, 8)], '#30343e', edge, 1.8);
  poly(ctx, [at(1.17, -3), at(1.15, 8), at(0.94, 5)], '#a57759', edge, 1.2);
  strokePath(ctx, [at(1.1, 0), at(0.66, 0)], '#a2a7a7', 1.2);
  strokePath(ctx, [at(1.1, 9), at(0.7, 11)], '#a2a7a7', 1.2);
  // Bolso canguru, pregas do moletom e cós.
  strokePath(ctx, [at(0.35, -6), at(0.24, -10), at(0.18, 9), at(0.3, 13)], highlight, 1.6);
  strokePath(ctx, [at(0.06, -15), at(0.06, 15)], '#404550', 4);
  strokePath(ctx, [at(0.08, -12), at(0.09, 8)], '#66705c', 1);
  // Pequena coroa verde no peito, identificável até na seleção.
  poly(ctx, [at(0.67, 8), at(0.77, 5), at(0.72, 10), at(0.83, 12), at(0.72, 13), at(0.76, 17), at(0.65, 15)], green, undefined, 0);
  leg(p.kF, p.aF, p.tF, false);
  ctx.save();
  ctx.translate(p.head.x, p.head.y);
  ctx.rotate(rad(pose.lean + pose.head) * 0.6 + pose.rot);
  headRickzera(ctx, 17, { ...o, expr: o.expr || (pose.mouth > 0.5 ? 'shout' : 'n') });
  ctx.restore();
  arm(p.eF, p.wF, true);
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
  const pose = { ...(def.poses[poseName] || def.poses.idle) };
  pose.lean += Math.sin(time * 0.06) * 1.2;
  const rig = computeRig(ch, pose);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -scale : scale, scale);
  drawRig(ctx, ch, rig, pose, { time });
  ctx.restore();
}
