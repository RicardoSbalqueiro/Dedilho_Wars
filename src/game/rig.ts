// Esqueletos articulados e desenho vetorial de todos os lutadores.
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
  poseName?: string; // nome da pose para acessórios articulados
  costume?: number;
  kiss?: boolean; // pose de finalização do Tubarão Fiscal
  stretch?: number; // alcance visual da luva elástica, em unidades do mundo
}

const G = {
  santox: { T: 60, th: 46, sh: 43, ua: 35, fo: 32, headR: 20, foot: 18, hOff: 1.1, hFwd: 1 },
  jao: { T: 58, th: 43, sh: 42, ua: 32, fo: 30, headR: 18, foot: 16, hOff: 1.1, hFwd: 2 },
  aneninha: { T: 54, th: 40, sh: 39, ua: 29, fo: 27, headR: 17, foot: 14, hOff: 1.1, hFwd: 2 },
  caetano: { T: 58, th: 44, sh: 44, ua: 32, fo: 30, headR: 17, foot: 14, hOff: 1.15, hFwd: 2 },
  orango: { T: 62, th: 34, sh: 30, ua: 52, fo: 50, headR: 21, foot: 17, hOff: 0.85, hFwd: 6 },
  tubarao: { T: 66, th: 46, sh: 42, ua: 38, fo: 35, headR: 23, foot: 17, hOff: 0.9, hFwd: 4 },
  rickzera: { T: 57, th: 44, sh: 43, ua: 32, fo: 30, headR: 17, foot: 16, hOff: 1.15, hFwd: 2 },
  bieu: { T: 58, th: 44, sh: 43, ua: 34, fo: 31, headR: 17, foot: 15, hOff: 1.15, hFwd: 2 },
  nomad: { T: 55, th: 37, sh: 35, ua: 34, fo: 31, headR: 20, foot: 17, hOff: 1.0, hFwd: 3 },
  renngotti: { T: 58, th: 40, sh: 38, ua: 35, fo: 32, headR: 19, foot: 17, hOff: 1.05, hFwd: 3 },
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

function ell(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string | CanvasGradient, stroke?: string, lw = 2, rot = 0) {
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
  if (ch === 'santox') headSantox(ctx, r, o);
  else if (ch === 'jao') headJao(ctx, r, o);
  else if (ch === 'caetano') headCaetano(ctx, r, o);
  else if (ch === 'orango') headOrango(ctx, r, o);
  else if (ch === 'tubarao') headTubarao(ctx, r, o);
  else if (ch === 'rickzera') headRickzera(ctx, r, o);
  else if (ch === 'bieu') headBieu(ctx, r, o);
  else if (ch === 'nomad') headNomad(ctx, r, o);
  else if(ch === 'aneninha') headAneninha(ctx,r,o);
  else headRenngotti(ctx, r, o);
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
  // Afro arredondado: volume acima das têmporas, sem mechas longas na nuca.
  ell(ctx, -r * 0.15, -r * 0.68, r * 1.14, r * 1.0, HAIR, '#05030a', r * 0.06);
  for (let i = 0; i <= 15; i++) {
    const a = rad(145 + i * 13.3);
    curl(Math.cos(a) * r * 1.03 - r * 0.14, Math.sin(a) * r * 0.93 - r * 0.64, r * 0.32);
  }
  // Cachos internos dão densidade, sem criar uma cauda atrás da cabeça.
  for (let row = 0; row < 3; row++) for (let i = 0; i < 5; i++) {
    const x = (-0.83 + i * 0.35 + (row % 2) * 0.1) * r;
    const y = (-1.2 + row * 0.31) * r;
    if (x * x / (r * r) + (y / r + 0.65) ** 2 < 1.05) curl(x, y, r * 0.27);
  }
  // orelha
  ell(ctx, -r * 0.5, r * 0.2, r * 0.14, r * 0.21, SKIN2, OUT, 1.5);
  // rosto
  ctx.beginPath();
  ctx.moveTo(-r * 0.62, -r * 0.35);
  ctx.bezierCurveTo(-r * 0.64, r * 0.5, -r * 0.22, r * 0.9, r * 0.4, r * 0.96);
  ctx.bezierCurveTo(r * 0.8, r * 0.91, r * 0.96, r * 0.56, r * 0.93, r * 0.35);
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
  if (ch === 'santox') drawSantox(ctx, rig, pose, o);
  else if (ch === 'jao') drawJao(ctx, rig, pose, o);
  else if (ch === 'caetano') drawCaetano(ctx, rig, pose, o);
  else if (ch === 'orango') drawOrango(ctx, rig, pose, o);
  else if (ch === 'tubarao') drawTubarao(ctx, rig, pose, o);
  else if (ch === 'rickzera') drawRickzera(ctx, rig, pose, o);
  else if (ch === 'bieu') drawBieu(ctx, rig, pose, o);
  else if (ch === 'nomad') drawNomad(ctx, rig, pose, o);
  else if(ch === 'aneninha') drawAneninha(ctx,rig,pose,o);
  else drawRenngotti(ctx, rig, pose, o);
}

function unit(a: P2, b: P2): P2 {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
}

function drawCaetano(ctx: CanvasRenderingContext2D, r: Rig, pose: Pose, o: DrawOpts) {
  const p = r.p;
  const SKIN = '#c98d5c';
  const SKIN2 = '#a8714a';
  const LIGHT = '#e0aa76';
  const ORANGE = '#ee792e';
  const ORANGE2 = '#bb4e1f';
  const { at, up, side } = bodyAxes(p);
  const hand = (w: P2, e: P2, front: boolean) => {
    const u = unit(e, w);
    const h = { x: w.x + u.x * 4, y: w.y + u.y * 4 };
    circ(ctx, h.x, h.y, 7.3, SKIN, OUT, 2);
    if (front && pose.finger > 0.5) {
      cap(ctx, h, { x: h.x + u.x * 21, y: h.y + u.y * 21 }, 5.5, 4, SKIN, OUT, 1.6);
      circ(ctx, h.x - u.y * 5, h.y + u.x * 5, 3.2, SKIN, OUT, 1.2);
    } else strokePath(ctx, [{ x: h.x + u.x * 4 - u.y * 4, y: h.y + u.y * 4 + u.x * 4 }, { x: h.x + u.x * 4 + u.y * 4, y: h.y + u.y * 4 - u.x * 4 }], SKIN2, 1.2);
  };
  const arm = (e: P2, w: P2, front: boolean) => {
    cap(ctx, p.sh, e, 21, 17, front ? SKIN : SKIN2, OUT, 2.2);
    cap(ctx, e, w, 16.5, 10, front ? SKIN : SKIN2, OUT, 2);
    const u = unit(p.sh, e);
    strokePath(ctx, [{ x: p.sh.x + u.x * 8 - u.y * 4, y: p.sh.y + u.y * 8 + u.x * 4 }, { x: e.x - u.x * 7 - u.y * 4, y: e.y - u.y * 7 + u.x * 4 }], front ? LIGHT : '#ba8059', 1.7);
    strokePath(ctx, [{ x: e.x - 4, y: e.y - 3 }, { x: e.x + 2, y: e.y + 2 }], '#9e6244', 1.1);
    hand(w, e, front);
  };
  const leg = (k: P2, a: P2, t: P2, back: boolean) => {
    const cuff = { x: k.x + (a.x - k.x) * 0.82, y: k.y + (a.y - k.y) * 0.82 };
    cap(ctx, cuff, a, 11, 9, SKIN, OUT, 1.8);
    cap(ctx, a, t, 10.5, 8, SKIN, OUT, 2);
    cap(ctx, p.hip, k, 25, 21, back ? ORANGE2 : ORANGE, OUT, 2.2);
    cap(ctx, k, cuff, 22, 17, back ? ORANGE2 : ORANGE, OUT, 2.2);
    strokePath(ctx, [{ x: p.hip.x + (k.x - p.hip.x) * 0.45 - 4, y: p.hip.y + (k.y - p.hip.y) * 0.45 }, { x: k.x - 5, y: k.y - 3 }, { x: cuff.x - 4, y: cuff.y - 3 }], back ? '#873d22' : '#c15825', 1.8);
    strokePath(ctx, [{ x: k.x + 4, y: k.y + 2 }, { x: k.x + 8, y: k.y - 4 }], '#ffac59', 1.4);
    const u = unit(a, t); const n = { x: -u.y, y: u.x };
    for (let i = -1; i <= 1; i++) strokePath(ctx, [{ x: t.x + n.x * i * 2.6, y: t.y + n.y * i * 2.6 }, { x: t.x - u.x * 3.5 + n.x * i * 2.6, y: t.y - u.y * 3.5 + n.y * i * 2.6 }], SKIN2, 0.8);
  };
  const belt = at(0.12, 0);
  const knot = at(0.12, 11);
  const wave = Math.sin(o.time * 0.28) * 7;
  // Duas pontas da faixa roxa; o afro acima da cabeça não tem cauda.
  for (let i = 0; i < 2; i++) {
    const length = 34 + i * 12;
    const path = () => {
      ctx.beginPath(); ctx.moveTo(knot.x, knot.y);
      ctx.bezierCurveTo(knot.x - length * 0.3, knot.y + 4 + wave * 0.5 + i * 6, knot.x - length * 0.7, knot.y - 3 + wave + i * 4, knot.x - length, knot.y + 8 + wave * 1.4 + i * 10);
    };
    ctx.lineCap = 'round'; path(); ctx.strokeStyle = OUT; ctx.lineWidth = 9; ctx.stroke();
    path(); ctx.strokeStyle = i ? '#6d28d9' : '#8b3fe0'; ctx.lineWidth = 5.5; ctx.stroke(); ctx.lineCap = 'butt';
  }
  arm(p.eB, p.wB, false); leg(p.kB, p.aB, p.tB, true);
  cap(ctx, p.sh, p.head, 13, 12, SKIN2, OUT, 2);
  // Peito exposto e ombros definidos: não há mais kimono nem mangas.
  poly(ctx, [at(0, -16), at(0, 16), at(0.42, 20), at(0.88, 24), at(1.08, 19), at(1.12, 1), at(1.08, -19), at(0.85, -23), at(0.38, -18)], SKIN, OUT, 2.4);
  poly(ctx, [at(0, -16), at(0.8, -22), at(1.06, -18), at(1.0, -9), at(0.54, -7), at(0.08, -9)], SKIN2, undefined, 0);
  // Clavícula, peitorais e abdômen seguem o eixo do corpo nas animações.
  strokePath(ctx, [at(1.02, -13), at(0.94, -3), at(1.04, 6), at(0.96, 18)], '#995a3e', 1.5);
  strokePath(ctx, [at(0.96, 3), at(0.7, 3), at(0.63, 10), at(0.68, 21)], '#9f6042', 1.5);
  strokePath(ctx, [at(0.77, -15), at(0.64, -6), at(0.69, 2)], '#9f6042', 1.4);
  strokePath(ctx, [at(0.55, 4), at(0.23, 4)], '#b2734c', 1.2);
  for (let i = 0; i < 2; i++) strokePath(ctx, [at(0.3 + i * 0.12, 5), at(0.29 + i * 0.12, 13)], '#b2734c', 1.1);
  const pec = at(0.77, 15); circ(ctx, pec.x, pec.y, 1.3, '#9f6349', undefined, 0);
  strokePath(ctx, [at(0.89, -17), at(0.7, -15)], LIGHT, 1.7);
  leg(p.kF, p.aF, p.tF, false);
  // Cós laranja e faixa roxa na cintura, por cima das calças.
  poly(ctx, [at(-0.06, -17), at(-0.06, 18), at(0.15, 18), at(0.15, -17)], ORANGE, OUT, 1.8);
  poly(ctx, [{ x: belt.x - side.x * 18 - up.x * 4, y: belt.y - side.y * 18 - up.y * 4 }, { x: belt.x + side.x * 18 - up.x * 4, y: belt.y + side.y * 18 - up.y * 4 }, { x: belt.x + side.x * 18 + up.x * 4, y: belt.y + side.y * 18 + up.y * 4 }, { x: belt.x - side.x * 18 + up.x * 4, y: belt.y - side.y * 18 + up.y * 4 }], '#7e22ce', OUT, 2);
  circ(ctx, knot.x, knot.y, 5.2, '#a24ae5', OUT, 1.8);
  ctx.save(); ctx.translate(p.head.x, p.head.y); ctx.rotate(rad(pose.lean + pose.head) * 0.6 + pose.rot);
  headCaetano(ctx, 17, { ...o, expr: o.expr || (pose.mouth > 0.5 ? 'shout' : 'n') }); ctx.restore();
  arm(p.eF, p.wF, true);
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

function headBieu(ctx: CanvasRenderingContext2D, r: number, o: DrawOpts) {
  const skin = '#c78d60';
  const shade = '#9c6448';
  const hair = '#241b22';
  const edge = '#211823';
  // Afro curto e compacto. Caetano tem um volume muito maior no mesmo raio.
  ell(ctx, -r * 0.13, -r * 0.48, r * 0.78, r * 0.73, hair, edge, r * 0.05);
  for (let i = 0; i < 11; i++) {
    const a = rad(160 + i * 18);
    const x = Math.cos(a) * r * 0.68 - r * 0.1;
    const y = Math.sin(a) * r * 0.68 - r * 0.45;
    circ(ctx, x, y, r * 0.22, hair, '#100b11', r * 0.035);
    ctx.beginPath(); ctx.arc(x, y, r * 0.12, 3.3, 5.5); ctx.strokeStyle = '#59424a'; ctx.lineWidth = r * 0.03; ctx.stroke();
  }
  ell(ctx, -r * 0.46, r * 0.16, r * 0.17, r * 0.24, shade, edge, r * 0.04);
  ctx.beginPath();
  ctx.moveTo(-r * 0.46, -r * 0.42);
  ctx.quadraticCurveTo(r * 0.18, -r * 0.75, r * 0.77, -r * 0.42);
  ctx.lineTo(r * 0.9, -r * 0.05); ctx.lineTo(r * 1.04, r * 0.2); ctx.lineTo(r * 0.88, r * 0.31);
  ctx.quadraticCurveTo(r * 0.92, r * 0.88, r * 0.32, r * 0.96);
  ctx.quadraticCurveTo(-r * 0.34, r * 0.82, -r * 0.46, r * 0.28);
  ctx.closePath(); ctx.fillStyle = skin; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = r * 0.065; ctx.stroke();
  poly(ctx, [{ x: -r * 0.4, y: -r * 0.2 }, { x: -r * 0.11, y: -r * 0.3 }, { x: -r * 0.04, y: r * 0.54 }, { x: r * 0.26, y: r * 0.88 }, { x: -r * 0.27, y: r * 0.6 }], '#b37b56', undefined, 0);
  if (o.expr === 'hit') {
    strokePath(ctx, [{ x: r * 0.13, y: -r * 0.05 }, { x: r * 0.42, y: r * 0.04 }, { x: r * 0.14, y: r * 0.13 }], edge, r * 0.06);
  } else {
    ell(ctx, r * 0.34, r * 0.02, r * 0.17, r * 0.1, '#fff3dd', edge, r * 0.04);
    circ(ctx, r * 0.39, r * 0.02, r * 0.085, '#533622', edge, r * 0.02);
    circ(ctx, r * 0.41, r * 0.02, r * 0.04, '#08090d', undefined, 0);
    circ(ctx, r * 0.36, -r * 0.01, r * 0.025, '#fff', undefined, 0);
  }
  strokePath(ctx, [{ x: r * 0.1, y: -r * 0.16 }, { x: r * 0.31, y: -r * 0.23 }, { x: r * 0.55, y: -r * 0.14 }], hair, r * 0.09);
  strokePath(ctx, [{ x: r * 0.63, y: -r * 0.15 }, { x: r * 0.82, y: -r * 0.1 }], hair, r * 0.07);
  strokePath(ctx, [{ x: r * 0.73, y: r * 0.1 }, { x: r * 0.78, y: r * 0.28 }, { x: r * 0.64, y: r * 0.3 }], shade, r * 0.04);
  // Bigode preenchido e cavanhaque baixo.
  poly(ctx, [{ x: r * 0.28, y: r * 0.44 }, { x: r * 0.49, y: r * 0.39 }, { x: r * 0.58, y: r * 0.44 }, { x: r * 0.71, y: r * 0.4 }, { x: r * 0.87, y: r * 0.48 }, { x: r * 0.66, y: r * 0.53 }, { x: r * 0.5, y: r * 0.49 }, { x: r * 0.28, y: r * 0.54 }], hair, undefined, 0);
  poly(ctx, [{ x: r * 0.24, y: r * 0.73 }, { x: r * 0.35, y: r * 0.92 }, { x: r * 0.57, y: r * 0.94 }, { x: r * 0.74, y: r * 0.73 }, { x: r * 0.57, y: r * 0.78 }, { x: r * 0.4, y: r * 0.76 }], hair, undefined, 0);
  if (o.expr === 'shout') {
    ell(ctx, r * 0.58, r * 0.64, r * 0.2, r * 0.14, '#592328', edge, r * 0.04);
    ell(ctx, r * 0.58, r * 0.55, r * 0.16, r * 0.035, '#fff6e5');
  } else strokePath(ctx, [{ x: r * 0.31, y: r * 0.62 }, { x: r * 0.57, y: r * 0.66 }, { x: r * 0.81, y: r * 0.57 }], '#693a2f', r * 0.05);
  // Cachos da linha frontal sem cauda na nuca.
  for (let i = 0; i < 5; i++) circ(ctx, r * (-0.4 + i * 0.26), -r * (0.46 + (i % 2) * 0.1), r * 0.2, hair, '#100b11', r * 0.035);
  if ((o.glow || 0) > 0) eyeGlow(ctx, r * 0.4, 0, r * 1.4, o.glowColor || '#e9b5ff', o.glow!);
}

function headNomad(ctx: CanvasRenderingContext2D, r: number, o: DrawOpts) {
  const skin = '#e7b48b';
  const shade = '#bf835f';
  const edge = '#32202a';
  const beard = '#60402c';
  // Cabeça robusta, nuca loira e barba cheia escura.
  ell(ctx, -r * 0.31, -r * 0.19, r * 0.61, r * 0.59, '#b98b3e', edge, r * 0.05);
  ell(ctx, -r * 0.55, r * 0.18, r * 0.19, r * 0.26, shade, edge, r * 0.04);
  ctx.beginPath(); ctx.moveTo(-r * 0.58, -r * 0.4);
  ctx.quadraticCurveTo(r * 0.16, -r * 0.87, r * 0.77, -r * 0.48);
  ctx.quadraticCurveTo(r * 1.03, r * 0.2, r * 0.88, r * 0.64);
  ctx.quadraticCurveTo(r * 0.52, r * 1.04, -r * 0.14, r * 0.86);
  ctx.quadraticCurveTo(-r * 0.68, r * 0.56, -r * 0.58, -r * 0.4);
  ctx.closePath(); ctx.fillStyle = skin; ctx.fill(); ctx.lineWidth = r * 0.06; ctx.strokeStyle = edge; ctx.stroke();
  // Barba alonga o queixo, sem cobrir nariz e bochecha.
  poly(ctx, [{ x: -r * 0.49, y: r * 0.15 }, { x: -r * 0.22, y: r * 0.38 }, { x: r * 0.1, y: r * 0.47 }, { x: r * 0.61, y: r * 0.44 }, { x: r * 0.86, y: r * 0.27 }, { x: r * 0.9, y: r * 0.64 }, { x: r * 0.55, y: r * 0.99 }, { x: r * 0.11, y: r * 0.95 }, { x: -r * 0.42, y: r * 0.62 }], beard, edge, r * 0.035);
  for (let i = 0; i < 4; i++) strokePath(ctx, [{ x: r * (-0.19 + i * 0.22), y: r * 0.73 }, { x: r * (-0.1 + i * 0.22), y: r * 0.87 }], '#82603b', r * 0.025);
  if (o.expr === 'hit') strokePath(ctx, [{ x: r * 0.1, y: -r * 0.13 }, { x: r * 0.36, y: -r * 0.03 }, { x: r * 0.1, y: r * 0.06 }], edge, r * 0.06);
  else {
    ell(ctx, r * 0.28, -r * 0.06, r * 0.16, r * 0.11, '#fff8e8', edge, r * 0.04);
    circ(ctx, r * 0.34, -r * 0.05, r * 0.085, '#5d8f9d', edge, r * 0.025);
    circ(ctx, r * 0.36, -r * 0.05, r * 0.042, '#15232b', undefined, 0);
    circ(ctx, r * 0.32, -r * 0.09, r * 0.023, '#fff', undefined, 0);
  }
  strokePath(ctx, [{ x: r * 0.05, y: -r * 0.26 }, { x: r * 0.25, y: -r * 0.32 }, { x: r * 0.49, y: -r * 0.23 }], '#76502d', r * 0.1);
  ell(ctx, r * 0.78, r * 0.14, r * 0.28, r * 0.24, '#e9b38b', '#b47a5b', r * 0.035);
  // Bigode arqueado e boca para animações de dano/vitória.
  ell(ctx, r * 0.48, r * 0.39, r * 0.36, r * 0.12, '#513421', undefined, 0, -0.05);
  if (o.expr === 'shout') {
    ell(ctx, r * 0.5, r * 0.59, r * 0.23, r * 0.17, '#371c24', edge, r * 0.035);
    ell(ctx, r * 0.5, r * 0.49, r * 0.17, r * 0.035, '#fff0d5');
  } else strokePath(ctx, [{ x: r * 0.22, y: r * 0.57 }, { x: r * 0.47, y: r * 0.62 }, { x: r * 0.76, y: r * 0.53 }], '#e3b18a', r * 0.04);
  // Boné vermelho com círculo branco e M.
  ctx.beginPath(); ctx.moveTo(-r * 0.87, -r * 0.4);
  ctx.quadraticCurveTo(-r * 0.97, -r * 1.1, -r * 0.23, -r * 1.26);
  ctx.quadraticCurveTo(r * 0.68, -r * 1.37, r * 0.84, -r * 0.59);
  ctx.closePath(); ctx.fillStyle = '#df3c42'; ctx.fill(); ctx.strokeStyle = '#691c31'; ctx.lineWidth = r * 0.06; ctx.stroke();
  poly(ctx, [{ x: -r * 0.8, y: -r * 0.44 }, { x: r * 0.7, y: -r * 0.62 }, { x: r * 1.25, y: -r * 0.32 }, { x: r * 0.51, y: -r * 0.32 }], '#b92537', '#691c31', r * 0.045);
  ell(ctx, r * 0.16, -r * 0.9, r * 0.28, r * 0.26, '#fff3df', '#b62135', r * 0.03, -0.05);
  strokePath(ctx, [{ x: -r * 0.01, y: -r * 0.78 }, { x: r * 0.01, y: -r * 1.0 }, { x: r * 0.14, y: -r * 0.86 }, { x: r * 0.27, y: -r * 1.01 }, { x: r * 0.31, y: -r * 0.79 }], '#d7353f', r * 0.06);
  strokePath(ctx, [{ x: -r * 0.64, y: -r * 0.76 }, { x: -r * 0.4, y: -r * 1.08 }], '#f3766a', r * 0.045);
  if ((o.glow || 0) > 0) eyeGlow(ctx, r * 0.34, -r * 0.05, r * 1.4, o.glowColor || '#ffad55', o.glow!);
}

function drawBieu(ctx: CanvasRenderingContext2D, r: Rig, pose: Pose, o: DrawOpts) {
  const p = r.p;
  const { at } = bodyAxes(p);
  const skin = '#c78d60'; const shade = '#9c6448'; const edge = '#241b28';
  const arm = (e: P2, w: P2, front: boolean) => {
    cap(ctx, p.sh, e, 19, 16, front ? skin : shade, edge, 2.1);
    cap(ctx, e, w, 16, 10.5, front ? skin : shade, edge, 2);
    const u = unit(e, w);
    strokePath(ctx, [{ x: p.sh.x + 3, y: p.sh.y + 2 }, { x: e.x + 2, y: e.y - 4 }], '#e0ad7d', 1.7);
    const h = { x: w.x + u.x * 4, y: w.y + u.y * 4 };
    circ(ctx, h.x, h.y, 7.4, skin, edge, 1.8);
    if (front && pose.finger > 0.5) cap(ctx, h, { x: h.x + u.x * 18, y: h.y + u.y * 18 }, 5.3, 3.5, skin, edge, 1.2);
    else strokePath(ctx, [{ x: h.x + u.x * 5 - u.y * 4, y: h.y + u.y * 5 + u.x * 4 }, { x: h.x + u.x * 5 + u.y * 4, y: h.y + u.y * 5 - u.x * 4 }], shade, 1.2);
  };
  const leg = (k: P2, a: P2, t: P2, back: boolean) => {
    cap(ctx, p.hip, k, 24, 20, back ? '#15131e' : '#28232e', edge, 2.2);
    cap(ctx, k, a, 21, 15, back ? '#15131e' : '#28232e', edge, 2.1);
    strokePath(ctx, [{ x: k.x - 5, y: k.y - 2 }, { x: a.x - 4, y: a.y - 8 }], '#49414f', 1.8);
    const u = unit(a, t); const n = { x: -u.y, y: u.x };
    const shin = unit(k, a);
    cap(ctx, { x: a.x - shin.x * 10, y: a.y - shin.y * 10 }, a, 17, 17, '#e4e3e7', edge, 2);
    cap(ctx, a, t, 16, 13, '#f4f1ee', edge, 2);
    strokePath(ctx, [{ x: a.x + n.x * 6, y: a.y + n.y * 6 }, { x: t.x + n.x * 6, y: t.y + n.y * 6 }], '#a69cae', 3);
    strokePath(ctx, [{ x: a.x - n.x * 4 + u.x * 2, y: a.y - n.y * 4 + u.y * 2 }, { x: a.x + n.x * 3 + u.x * 5, y: a.y + n.y * 3 + u.y * 5 }], '#9b87af', 1.2);
    if (!back) strokePath(ctx, [{ x: a.x - 4, y: a.y - 5 }, { x: a.x + 4, y: a.y - 5 }], '#a268d6', 2);
  };
  arm(p.eB, p.wB, false); leg(p.kB, p.aB, p.tB, true);
  cap(ctx, p.sh, p.head, 12, 12, shade, edge, 1.8);
  // Regata branca com recortes dos ombros; os braços permanecem expostos.
  poly(ctx, [at(-0.08, -17), at(-0.08, 17), at(0.77, 23), at(1.07, 15), at(1.06, 8), at(0.85, 6), at(0.85, -6), at(1.06, -9), at(1.07, -15), at(0.77, -21)], '#f5f1f4', edge, 2.2);
  poly(ctx, [at(-0.08, -17), at(0.74, -21), at(0.95, -15), at(0.18, -11)], '#d0c7d6', undefined, 0);
  strokePath(ctx, [at(1.03, 8), at(0.8, 4), at(0.8, -4), at(1.03, -9)], '#b5a6bf', 2);
  strokePath(ctx, [at(0.05, -17), at(0.05, 17)], '#7b3caf', 4);
  strokePath(ctx, [at(0.03, 3), at(0.03, 14)], '#e5be47', 1.8);
  strokePath(ctx, [at(0.3, -8), at(0.38, 1), at(0.3, 10)], '#d4cdd7', 1.5);
  // Corrente prateada, desenhada em pequenos elos sobre o peito.
  const a = at(1.08, -6); const b = at(1.08, 9); const c = at(0.72, 3);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(c.x - 5, c.y + 7, b.x, b.y); ctx.strokeStyle = '#5a5367'; ctx.lineWidth = 3.8; ctx.stroke();
  ctx.strokeStyle = '#eef0f5'; ctx.lineWidth = 2; ctx.stroke();
  ell(ctx, c.x, c.y + 1, 2.6, 3.5, '#dce0ec', '#8c8496', 1);
  leg(p.kF, p.aF, p.tF, false);
  ctx.save(); ctx.translate(p.head.x, p.head.y); ctx.rotate(rad(pose.lean + pose.head) * 0.6 + pose.rot); headBieu(ctx, 17, { ...o, expr: o.expr || (pose.mouth > 0.5 ? 'shout' : 'n') }); ctx.restore();
  arm(p.eF, p.wF, true);
  drawHeldAccessory(ctx, 'bieu', p, o);
}

function drawNomad(ctx: CanvasRenderingContext2D, r: Rig, pose: Pose, o: DrawOpts) {
  const p = r.p; const { at } = bodyAxes(p);
  const edge = '#2c2130'; const blue = '#3576bb'; const shade = '#21518d'; const red = '#df4147';
  const arm = (e: P2, w: P2, front: boolean) => {
    cap(ctx, p.sh, e, 23, 20, front ? red : '#aa293d', edge, 2.2);
    cap(ctx, e, w, 20, 13, front ? red : '#aa293d', edge, 2.2);
    const u = unit(e, w); const n = { x: -u.y, y: u.x };
    cap(ctx, { x: w.x - u.x * 4, y: w.y - u.y * 4 }, w, 15, 15, '#cdd0df', edge, 1.6);
    const h = { x: w.x + u.x * 6, y: w.y + u.y * 6 };
    circ(ctx, h.x, h.y, 9, '#faf4ec', edge, 2);
    if (front && pose.finger > 0.5) cap(ctx, h, { x: h.x + u.x * 20, y: h.y + u.y * 20 }, 7, 5, '#faf4ec', edge, 1.6);
    else for (let i = -1; i <= 1; i++) strokePath(ctx, [{ x: h.x + u.x * 3 + n.x * i * 4, y: h.y + u.y * 3 + n.y * i * 4 }, { x: h.x + u.x * 7 + n.x * i * 4, y: h.y + u.y * 7 + n.y * i * 4 }], '#b8b2c3', 1.2);
  };
  const leg = (k: P2, a: P2, t: P2, back: boolean) => {
    cap(ctx, p.hip, k, 27, 23, back ? shade : blue, edge, 2.3);
    cap(ctx, k, a, 23, 17, back ? shade : blue, edge, 2.2);
    strokePath(ctx, [{ x: k.x - 5, y: k.y - 1 }, { x: a.x - 4, y: a.y - 7 }], '#578fc5', 1.7);
    cap(ctx, a, t, 19, 16, '#815338', edge, 2.2);
    const u = unit(a, t); const n = { x: -u.y, y: u.x };
    strokePath(ctx, [{ x: a.x + n.x * 7, y: a.y + n.y * 7 }, { x: t.x + n.x * 7, y: t.y + n.y * 7 }], '#422f2f', 4.4);
    strokePath(ctx, [{ x: a.x + u.x * 3 - n.x * 4, y: a.y + u.y * 3 - n.y * 4 }, { x: a.x + u.x * 7 + n.x * 3, y: a.y + u.y * 7 + n.y * 3 }], '#c19b67', 1.5);
  };
  arm(p.eB, p.wB, false); leg(p.kB, p.aB, p.tB, true);
  cap(ctx, p.sh, p.head, 15, 16, '#d49a72', edge, 2);
  // Camisa vermelha no torso atarracado, com jardineira azul por cima.
  poly(ctx, [at(-0.1, -24), at(-0.1, 25), at(0.47, 29), at(0.96, 24), at(1.1, 17), at(1.1, -17), at(0.96, -24), at(0.47, -27)], red, edge, 2.5);
  poly(ctx, [at(-0.12, -24), at(-0.12, 25), at(0.5, 29), at(0.7, 20), at(0.76, 14), at(0.76, -13), at(0.7, -20), at(0.5, -27)], blue, edge, 2.3);
  poly(ctx, [at(-0.12, -24), at(0.58, -25), at(0.67, -17), at(-0.12, -11)], shade, undefined, 0);
  strokePath(ctx, [at(1.09, -13), at(0.67, -12)], '#3e83c6', 8);
  strokePath(ctx, [at(1.09, 14), at(0.67, 13)], '#3e83c6', 8);
  const button1 = at(0.73, -12); const button2 = at(0.73, 13);
  circ(ctx, button1.x, button1.y, 3.4, '#f3cc55', '#86622f', 1.1);
  circ(ctx, button2.x, button2.y, 3.4, '#f3cc55', '#86622f', 1.1);
  poly(ctx, [at(0.56, -7), at(0.56, 10), at(0.31, 9), at(0.26, 2), at(0.31, -7)], '#2b66a9', '#5c9ed5', 1.2);
  leg(p.kF, p.aF, p.tF, false);
  ctx.save(); ctx.translate(p.head.x, p.head.y); ctx.rotate(rad(pose.lean + pose.head) * 0.5 + pose.rot); headNomad(ctx, 20, { ...o, expr: o.expr || (pose.mouth > 0.5 ? 'shout' : 'n') }); ctx.restore();
  arm(p.eF, p.wF, true);
  drawHeldAccessory(ctx, 'nomad', p, o);
}

function drawHeldAccessory(ctx: CanvasRenderingContext2D, ch: 'bieu' | 'nomad', p: Record<string, P2>, o: DrawOpts) {
  const name = o.poseName || '';
  const u = unit(p.eF, p.wF);
  ctx.save(); ctx.translate(p.wF.x + u.x * 7, p.wF.y + u.y * 7); ctx.rotate(Math.atan2(u.y, u.x));
  const edge = '#221a2d';
  if (ch === 'bieu' && name === 'driver_a') {
    // Chave de fenda: cabo amarelo/roxo e lâmina reta metálica.
    cap(ctx, { x: -8, y: 0 }, { x: 5, y: 0 }, 8, 7, '#edc642', edge, 1.5);
    strokePath(ctx, [{ x: -6, y: 0 }, { x: 2, y: 0 }], '#8e4eb1', 2);
    cap(ctx, { x: 5, y: 0 }, { x: 31, y: 0 }, 3.4, 2.5, '#d4dce7', edge, 1);
    poly(ctx, [{ x: 30, y: -2 }, { x: 37, y: -3 }, { x: 37, y: 3 }, { x: 30, y: 2 }], '#aeb8ca', edge, 1);
  } else if (ch === 'bieu' && name === 'rat_a') {
    // Rato cartunesco erguido antes do arremesso; o projétil é desenhado pelo combate.
    ctx.beginPath(); ctx.moveTo(-10, 1); ctx.bezierCurveTo(-27, -4, -30, 13, -16, 12); ctx.strokeStyle = '#d5919c'; ctx.lineWidth = 2.5; ctx.stroke();
    ell(ctx, 5, -2, 15, 8.5, '#85808d', edge, 1.6, -0.08);
    poly(ctx, [{ x: 13, y: -7 }, { x: 26, y: -1 }, { x: 13, y: 4 }], '#9b95a2', edge, 1.4);
    circ(ctx, 11, -9, 5, '#ada0ad', edge, 1.1); circ(ctx, 11, -9, 2.8, '#d2a3b8', undefined, 0);
    circ(ctx, 19, -3, 1.5, '#11111a', undefined, 0); circ(ctx, 26, -1, 1.8, '#dca4b5', undefined, 0);
    strokePath(ctx, [{ x: 21, y: 1 }, { x: 28, y: 5 }], '#e8e0eb', 0.8);
    strokePath(ctx, [{ x: 22, y: 0 }, { x: 30, y: 1 }], '#e8e0eb', 0.8);
  } else if (ch === 'bieu' && name === 'spray_a') {
    ctx.rotate(-Math.PI / 2);
    cap(ctx, { x: 0, y: -6 }, { x: 0, y: 11 }, 12, 12, '#8a4ca8', edge, 1.6);
    ctx.fillStyle = '#e9d344'; ctx.fillRect(-5, -2, 10, 8);
    ctx.fillStyle = '#cfd4e1'; ctx.fillRect(-5, -10, 10, 5);
    ctx.fillStyle = '#41364e'; ctx.fillRect(0, -13, 5, 4);
    strokePath(ctx, [{ x: -3, y: 1 }, { x: 3, y: 4 }], '#492953', 1.2);
  } else if (ch === 'bieu' && name === 'drive') {
    ctx.rotate(-Math.atan2(u.y, u.x));
    circ(ctx, 7, -2, 18, '#2b2534', '#e4c854', 3);
    circ(ctx, 7, -2, 13, 'rgba(0,0,0,0)', '#867c94', 2.5);
    strokePath(ctx, [{ x: -9, y: -3 }, { x: 7, y: -2 }, { x: 17, y: 11 }], '#867c94', 3);
    circ(ctx, 7, -2, 4.5, '#a561c7', edge, 1.1);
  } else if (ch === 'nomad' && name === 'burger_a') {
    ell(ctx, 10, -2, 16, 10, '#e8aa54', '#82512f', 1.5);
    cap(ctx, { x: -3, y: 1 }, { x: 23, y: 1 }, 5, 5, '#68402f', edge, 1);
    strokePath(ctx, [{ x: -3, y: -2 }, { x: 4, y: 0 }, { x: 11, y: -2 }, { x: 17, y: 0 }, { x: 23, y: -2 }], '#7caf41', 3);
    poly(ctx, [{ x: -2, y: 0 }, { x: 22, y: 0 }, { x: 12, y: 5 }], '#f2d151', undefined, 0);
    for (let i = 0; i < 5; i++) strokePath(ctx, [{ x: i * 4, y: -7 + (i % 2) }, { x: i * 4 + 1, y: -8 + (i % 2) }], '#fff1bd', 1.2);
  } else if (ch === 'nomad' && name === 'glock_a') {
    // Silhueta de pistola cartunesca, com cano destacado e empunhadura.
    poly(ctx, [{ x: -4, y: -8 }, { x: 29, y: -8 }, { x: 29, y: -2 }, { x: 9, y: -1 }, { x: 5, y: 10 }, { x: -3, y: 7 }], '#586171', edge, 1.7);
    strokePath(ctx, [{ x: -1, y: -6 }, { x: 25, y: -6 }], '#9aa4b7', 1.4);
    ctx.fillStyle = '#eb884f'; ctx.fillRect(27, -7, 3, 4);
    strokePath(ctx, [{ x: 7, y: -1 }, { x: 11, y: 3 }, { x: 5, y: 4 }], edge, 1.5);
  } else if (ch === 'nomad' && name === 'boomerang_a') {
    poly(ctx, [{ x: -3, y: 1 }, { x: 12, y: -20 }, { x: 17, y: -18 }, { x: 11, y: -2 }, { x: 30, y: 2 }, { x: 29, y: 8 }, { x: 6, y: 5 }], '#e9ca6b', '#825337', 1.8);
    strokePath(ctx, [{ x: 9, y: -7 }, { x: 15, y: -9 }], '#c1533d', 2.5);
    strokePath(ctx, [{ x: 17, y: 2 }, { x: 16, y: 7 }], '#c1533d', 2.5);
  } else if (ch === 'nomad' && name === 'bazooka') {
    // Tubo do lançador apoiado na mão; o disparo e a explosão ficam no render.
    cap(ctx, { x: -31, y: -8 }, { x: 39, y: -8 }, 19, 19, '#5b7444', edge, 2);
    cap(ctx, { x: 32, y: -8 }, { x: 40, y: -8 }, 23, 23, '#8f9c67', edge, 1.6);
    cap(ctx, { x: -32, y: -8 }, { x: -27, y: -8 }, 23, 23, '#424c3b', edge, 1.6);
    ell(ctx, 40, -8, 3, 9, '#252b30', '#c0c4a4', 1.5);
    poly(ctx, [{ x: -2, y: 0 }, { x: 8, y: 0 }, { x: 4, y: 13 }, { x: -4, y: 11 }], '#535849', edge, 1.4);
    strokePath(ctx, [{ x: 3, y: -18 }, { x: 3, y: -25 }, { x: 13, y: -25 }], '#b9bd9f', 2.5);
    strokePath(ctx, [{ x: -18, y: -12 }, { x: 24, y: -12 }], '#8da46a', 2);
  }
  ctx.restore();
}

function headRenngotti(ctx: CanvasRenderingContext2D, r: number, o: DrawOpts) {
  const skin = '#d9a479'; const shade = '#b77e5d'; const edge = '#21202a';
  // Cabeça sólida, cabelo preto curto e nuca limpa.
  ell(ctx, -r * 0.12, -r * 0.18, r * 0.82, r * 0.92, '#14151c', edge, r * 0.055);
  ell(ctx, -r * 0.51, r * 0.2, r * 0.18, r * 0.25, shade, edge, r * 0.04);
  ctx.beginPath(); ctx.moveTo(-r * 0.55, -r * 0.45);
  ctx.quadraticCurveTo(r * 0.06, -r * 0.81, r * 0.72, -r * 0.48);
  ctx.lineTo(r * 0.89, -r * 0.05); ctx.lineTo(r * 1.06, r * 0.19); ctx.lineTo(r * 0.89, r * 0.31);
  ctx.quadraticCurveTo(r * 0.95, r * 0.8, r * 0.5, r * 0.94);
  ctx.lineTo(r * 0.07, r * 0.93); ctx.quadraticCurveTo(-r * 0.54, r * 0.66, -r * 0.55, -r * 0.45);
  ctx.closePath(); ctx.fillStyle = skin; ctx.fill(); ctx.lineWidth = r * 0.065; ctx.strokeStyle = edge; ctx.stroke();
  poly(ctx, [{ x: -r * 0.48, y: -r * 0.25 }, { x: -r * 0.18, y: -r * 0.31 }, { x: -r * 0.07, y: r * 0.49 }, { x: r * 0.27, y: r * 0.88 }, { x: -r * 0.27, y: r * 0.69 }], '#c18b68', undefined, 0);
  // Franja curta, com uma mecha levantada central.
  poly(ctx, [{ x: -r * 0.62, y: -r * 0.3 }, { x: -r * 0.76, y: -r * 0.85 }, { x: -r * 0.38, y: -r * 1.02 }, { x: -r * 0.17, y: -r * 0.96 }, { x: r * 0.08, y: -r * 1.12 }, { x: r * 0.3, y: -r * 0.98 }, { x: r * 0.64, y: -r * 0.94 }, { x: r * 0.86, y: -r * 0.62 }, { x: r * 0.63, y: -r * 0.43 }, { x: r * 0.32, y: -r * 0.59 }, { x: -r * 0.04, y: -r * 0.49 }, { x: -r * 0.3, y: -r * 0.53 }], '#17171e', edge, r * 0.045);
  strokePath(ctx, [{ x: -r * 0.43, y: -r * 0.83 }, { x: -r * 0.08, y: -r * 0.9 }, { x: r * 0.28, y: -r * 0.82 }], '#3e3c49', r * 0.045);
  // Óculos retangulares grandes, armação preta e reflexo discreto.
  strokePath(ctx, [{ x: -r * 0.47, y: -r * 0.16 }, { x: r * 0.05, y: -r * 0.13 }], '#16181f', r * 0.11);
  poly(ctx, [{ x: r * 0.03, y: -r * 0.27 }, { x: r * 0.52, y: -r * 0.24 }, { x: r * 0.49, y: r * 0.1 }, { x: r * 0.07, y: r * 0.12 }], '#141f2a', '#0b0e15', r * 0.075);
  poly(ctx, [{ x: r * 0.58, y: -r * 0.22 }, { x: r * 0.95, y: -r * 0.15 }, { x: r * 0.93, y: r * 0.13 }, { x: r * 0.61, y: r * 0.1 }], '#141f2a', '#0b0e15', r * 0.07);
  strokePath(ctx, [{ x: r * 0.5, y: -r * 0.12 }, { x: r * 0.61, y: -r * 0.09 }], '#0b0e15', r * 0.07);
  strokePath(ctx, [{ x: r * 0.15, y: -r * 0.16 }, { x: r * 0.36, y: -r * 0.14 }], '#638a9f', r * 0.035);
  strokePath(ctx, [{ x: r * 0.68, y: -r * 0.12 }, { x: r * 0.81, y: -r * 0.09 }], '#638a9f', r * 0.03);
  strokePath(ctx, [{ x: r * 0.74, y: r * 0.1 }, { x: r * 0.78, y: r * 0.29 }, { x: r * 0.64, y: r * 0.32 }], shade, r * 0.045);
  // Bigode e cavanhaque preto curto.
  poly(ctx, [{ x: r * 0.3, y: r * 0.44 }, { x: r * 0.52, y: r * 0.38 }, { x: r * 0.64, y: r * 0.43 }, { x: r * 0.79, y: r * 0.43 }, { x: r * 0.91, y: r * 0.53 }, { x: r * 0.68, y: r * 0.55 }, { x: r * 0.53, y: r * 0.5 }, { x: r * 0.31, y: r * 0.53 }], '#24212a', undefined, 0);
  poly(ctx, [{ x: r * 0.3, y: r * 0.74 }, { x: r * 0.42, y: r * 0.92 }, { x: r * 0.65, y: r * 0.92 }, { x: r * 0.79, y: r * 0.72 }, { x: r * 0.59, y: r * 0.78 }, { x: r * 0.45, y: r * 0.75 }], '#24212a', undefined, 0);
  if (o.expr === 'shout') {
    ell(ctx, r * 0.59, r * 0.66, r * 0.22, r * 0.15, '#55202c', edge, r * 0.045);
    ell(ctx, r * 0.59, r * 0.57, r * 0.17, r * 0.035, '#fff7e8');
  } else if (o.expr === 'hit') strokePath(ctx, [{ x: r * 0.35, y: r * 0.64 }, { x: r * 0.59, y: r * 0.59 }, { x: r * 0.78, y: r * 0.66 }], '#784a3d', r * 0.05);
  else strokePath(ctx, [{ x: r * 0.36, y: r * 0.64 }, { x: r * 0.59, y: r * 0.68 }, { x: r * 0.83, y: r * 0.59 }], '#784a3d', r * 0.05);
  // Headset circumaural preto: arco sobre o cabelo e concha grande lateral.
  ctx.beginPath(); ctx.moveTo(-r * 0.9, r * 0.1);
  ctx.bezierCurveTo(-r * 1.08, -r * 0.95, -r * 0.57, -r * 1.36, r * 0.2, -r * 1.21);
  ctx.quadraticCurveTo(r * 0.64, -r * 1.12, r * 0.77, -r * 0.67);
  ctx.strokeStyle = '#0e111a'; ctx.lineWidth = r * 0.18; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r * 0.93, -r * 0.16); ctx.quadraticCurveTo(-r * 0.97, -r * 0.93, -r * 0.28, -r * 1.16);
  ctx.strokeStyle = '#575b6b'; ctx.lineWidth = r * 0.055; ctx.stroke();
  ell(ctx, -r * 0.64, r * 0.03, r * 0.3, r * 0.44, '#292d3a', '#0c1019', r * 0.07, -0.1);
  ell(ctx, -r * 0.67, r * 0.03, r * 0.19, r * 0.31, '#151c28', '#636a7a', r * 0.035, -0.1);
  strokePath(ctx, [{ x: -r * 0.75, y: -r * 0.07 }, { x: -r * 0.73, y: r * 0.14 }], '#6dd5e7', r * 0.05);
  if ((o.glow || 0) > 0) eyeGlow(ctx, r * 0.42, -r * 0.05, r * 1.5, o.glowColor || '#a5e8f4', o.glow!);
}

function drawRenngotti(ctx: CanvasRenderingContext2D, r: Rig, pose: Pose, o: DrawOpts) {
  const p = r.p; const { at } = bodyAxes(p);
  const edge = '#272534'; const white = '#f1f0f3'; const gray = '#c7c8d3'; const shadow = '#a5a7b6'; const skin = '#d9a479';
  const arm = (e: P2, w: P2, front: boolean) => {
    cap(ctx, p.sh, e, 25, 22, front ? white : gray, edge, 2.3);
    cap(ctx, e, w, 22, 13, front ? white : gray, edge, 2.2);
    strokePath(ctx, [{ x: e.x - 6, y: e.y - 4 }, { x: e.x + 3, y: e.y + 1 }], shadow, 1.7);
    const u = unit(e, w); cap(ctx, { x: w.x - u.x * 5, y: w.y - u.y * 5 }, w, 14, 12, '#d5d4de', edge, 1.4);
    const h = { x: w.x + u.x * 5, y: w.y + u.y * 5 };
    circ(ctx, h.x, h.y, 8.3, skin, edge, 1.8);
    if (front && pose.finger > 0.5) cap(ctx, h, { x: h.x + u.x * 18, y: h.y + u.y * 18 }, 6, 4.2, skin, edge, 1.3);
    else strokePath(ctx, [{ x: h.x + u.x * 5 - u.y * 5, y: h.y + u.y * 5 + u.x * 5 }, { x: h.x + u.x * 5 + u.y * 5, y: h.y + u.y * 5 - u.x * 5 }], '#af7557', 1.2);
  };
  const leg = (k: P2, a: P2, t: P2, back: boolean) => {
    cap(ctx, p.hip, k, 29, 25, back ? gray : white, edge, 2.3);
    cap(ctx, k, a, 25, 17, back ? gray : white, edge, 2.2);
    // Bolsos cargo grandes e pregas sem mudar a articulação das pernas.
    const mid = { x: p.hip.x * 0.36 + k.x * 0.64, y: p.hip.y * 0.36 + k.y * 0.64 };
    ctx.save(); ctx.translate(mid.x, mid.y); ctx.rotate(Math.atan2(k.y - p.hip.y, k.x - p.hip.x) - Math.PI / 2);
    poly(ctx, [{ x: -12, y: -5 }, { x: 2, y: -5 }, { x: 3, y: 10 }, { x: -11, y: 10 }], back ? '#b9bac6' : '#daddE5', '#8b8c9f', 1.1);
    strokePath(ctx, [{ x: -12, y: -2 }, { x: 2, y: -2 }], '#9b9daa', 1.2); ctx.restore();
    strokePath(ctx, [{ x: k.x - 5, y: k.y - 3 }, { x: a.x - 4, y: a.y - 8 }], shadow, 1.7);
    strokePath(ctx, [{ x: k.x + 3, y: k.y + 2 }, { x: k.x + 8, y: k.y - 3 }], '#fff', 1.5);
    const u = unit(a, t); const n = { x: -u.y, y: u.x }; const shin = unit(k, a);
    cap(ctx, { x: a.x - shin.x * 9, y: a.y - shin.y * 9 }, a, 20, 18, '#e7e9ef', edge, 2);
    cap(ctx, a, t, 18, 15, '#fffdf8', edge, 2);
    strokePath(ctx, [{ x: a.x + n.x * 7, y: a.y + n.y * 7 }, { x: t.x + n.x * 7, y: t.y + n.y * 7 }], '#9b9eac', 3.2);
    for (let i = 0; i < 3; i++) strokePath(ctx, [{ x: a.x - n.x * 4 + u.x * (i * 3 + 1), y: a.y - n.y * 4 + u.y * (i * 3 + 1) }, { x: a.x + n.x * 2 + u.x * (i * 3 + 3), y: a.y + n.y * 2 + u.y * (i * 3 + 3) }], '#a9aebe', 1.1);
  };
  arm(p.eB, p.wB, false); leg(p.kB, p.aB, p.tB, true);
  cap(ctx, p.sh, p.head, 15, 14, '#bc8564', edge, 1.9);
  poly(ctx, [at(-0.12, -22), at(-0.12, 23), at(0.36, 29), at(0.82, 28), at(1.1, 21), at(1.15, 0), at(1.1, -22), at(0.74, -27), at(0.3, -26)], white, edge, 2.4);
  poly(ctx, [at(-0.1, -22), at(0.72, -27), at(1.08, -21), at(0.88, -12), at(0.16, -12)], gray, undefined, 0);
  // Capuz branco dobrado em volta do pescoço, com dois cordões escuros.
  poly(ctx, [at(0.83, -20), at(1.28, -20), at(1.23, 14), at(0.9, 21), at(0.7, 10), at(0.96, 1)], '#d7d8e0', edge, 1.8);
  poly(ctx, [at(1.16, -5), at(1.16, 10), at(0.93, 5)], '#b77e5d', edge, 1.2);
  strokePath(ctx, [at(1.1, -1), at(0.63, -1)], '#676678', 1.6);
  strokePath(ctx, [at(1.09, 12), at(0.67, 13)], '#676678', 1.6);
  const tip1 = at(0.63, -1); const tip2 = at(0.67, 13);
  circ(ctx, tip1.x, tip1.y, 1.5, '#b7bacb', undefined, 0); circ(ctx, tip2.x, tip2.y, 1.5, '#b7bacb', undefined, 0);
  // Bolso canguru e dobras cinzentas deixam o moletom legível mesmo no chão claro.
  strokePath(ctx, [at(0.38, -8), at(0.22, -14), at(0.15, 11), at(0.35, 16)], '#b5b6c4', 1.6);
  strokePath(ctx, [at(0.08, -22), at(0.08, 22)], '#b9bac6', 4);
  strokePath(ctx, [at(0.5, -16), at(0.35, -11)], '#aeb0bf', 1.5);
  strokePath(ctx, [at(0.56, 23), at(0.44, 17)], '#b4b6c3', 1.5);
  leg(p.kF, p.aF, p.tF, false);
  ctx.save(); ctx.translate(p.head.x, p.head.y); ctx.rotate(rad(pose.lean + pose.head) * 0.5 + pose.rot); headRenngotti(ctx, 19, { ...o, expr: o.expr || (pose.mouth > 0.5 ? 'shout' : 'n') }); ctx.restore();
  arm(p.eF, p.wF, true);
  if (o.poseName === 'mic_s') {
    const u = unit(p.eF, p.wF); ctx.save(); ctx.translate(p.wF.x + u.x * 6, p.wF.y + u.y * 6); ctx.rotate(Math.atan2(u.y, u.x));
    cap(ctx, { x: -6, y: 0 }, { x: 14, y: 0 }, 6, 6, '#34394a', '#111622', 1.5);
    strokePath(ctx, [{ x: -2, y: -1 }, { x: 10, y: -1 }], '#747e92', 1.3);
    ell(ctx, 19, 0, 8, 9, '#b3bdcd', '#161d2b', 1.5);
    for (let i = -1; i <= 1; i++) strokePath(ctx, [{ x: 15, y: i * 3 }, { x: 23, y: i * 3 }], '#59677c', 0.8);
    ctx.restore();
  }
  if (o.poseName === 'desk' || o.poseName === 'tilt_s') {
    const x = p.head.x - 3; const y = Math.min(p.head.y - 43, p.wF.y - 5, p.wB.y - 5);
    // Mesa suspensa articulada; o impacto no chão é desenhado pelo motor de efeitos.
    poly(ctx, [{ x: x - 59, y: y - 8 }, { x: x + 45, y: y - 8 }, { x: x + 63, y: y + 3 }, { x: x - 43, y: y + 3 }], '#be8c56', '#49302d', 2);
    poly(ctx, [{ x: x - 43, y: y + 3 }, { x: x + 63, y: y + 3 }, { x: x + 63, y: y + 12 }, { x: x - 43, y: y + 12 }], '#8d5c39', '#49302d', 1.8);
    poly(ctx, [{ x: x - 59, y: y - 8 }, { x: x - 43, y: y + 3 }, { x: x - 43, y: y + 12 }, { x: x - 59, y: y + 1 }], '#9f6c42', '#49302d', 1.8);
    for (const dx of [-37, 48]) poly(ctx, [{ x: x + dx, y: y + 12 }, { x: x + dx + 7, y: y + 12 }, { x: x + dx + 4, y: y + 43 }, { x: x + dx - 2, y: y + 43 }], '#91613f', '#49302d', 1.5);
    strokePath(ctx, [{ x: x - 40, y: y - 3 }, { x: x + 36, y: y - 3 }], '#d5ab75', 1.4);
    strokePath(ctx, [{ x: x - 24, y: y + 7 }, { x: x + 39, y: y + 7 }], '#b8895e', 1.1);
  }
}

// ANENINHA: capuz amarelo bordado, cachos, saia em camadas e botas.
function headAneninha(ctx: CanvasRenderingContext2D, r: number, o: DrawOpts) {
  const edge = '#35202b', hair = '#59291f', skin = '#ce8b6d';
  const variant = o.costume ?? 0;
  const hood = ['#facc15', '#fbbf24', '#22c55e', '#f472b6'][variant % 4];
  const colors = ['#ec4899', '#06b6d4', '#ef4444', '#22c55e', '#facc15'];
  poly(ctx, [{x:-r*1.08,y:r*.9},{x:-r*1.1,y:-r*.6},{x:-r*.62,y:-r*2.0},{x:r*.18,y:-r*2.16},{x:r*.9,y:-r*.7},{x:r*1.2,y:r*.82}], hood, edge, r*.085);
  ell(ctx, 0, -r*.12, r*.89, r*1.02, hair, edge, r*.06);
  ell(ctx, r*.12, r*.12, r*.71, r*.85, skin, edge, r*.055);
  // Cachos ao redor do rosto com reflexos acobreados.
  for(let i=0;i<12;i++) {
    const ang=rad(130+i*23), x=Math.cos(ang)*r*.78-r*.04, y=Math.sin(ang)*r*.9-r*.14;
    if(x>r*.47 && y>0) continue;
    circ(ctx,x,y,r*.24,hair,edge,r*.045);
    ctx.beginPath();ctx.arc(x-r*.03,y-r*.02,r*.15,.2,4.8);ctx.strokeStyle='#a45a37';ctx.lineWidth=r*.04;ctx.stroke();
  }
  // Mecha longa ondulada lateral.
  strokePath(ctx,[{x:-r*.68,y:r*.1},{x:-r*.84,y:r*.46},{x:-r*.62,y:r*.69},{x:-r*.76,y:r*.96}],hair,r*.22);
  strokePath(ctx,[{x:-r*.7,y:r*.15},{x:-r*.8,y:r*.46},{x:-r*.65,y:r*.69}], '#ae623d',r*.045);
  // Olhos, delineado e expressão.
  for(const [x,w] of [[-.16,.12],[.52,.18]]) {
    if(o.expr==='hit') strokePath(ctx,[{x:r*(x-w),y:r*.02},{x:r*(x+w),y:r*.12}],edge,r*.065);
    else {
      ell(ctx,r*x,r*.02,r*w,r*.095,'#fff7e7',edge,r*.04);
      circ(ctx,r*(x+.035),r*.02,r*.068,'#4b2d25',edge,r*.02);
      circ(ctx,r*(x+.045),r*.02,r*.033,'#151119',undefined,0);
      circ(ctx,r*(x+.015),-r*.008,r*.02,'#fff',undefined,0);
      strokePath(ctx,[{x:r*(x-w-.035),y:-r*.065},{x:r*(x+w),y:-r*.055}],edge,r*.055);
    }
    strokePath(ctx,[{x:r*(x-w),y:-r*.2},{x:r*x,y:-r*.25},{x:r*(x+w),y:-r*.18}],hair,r*.075);
  }
  strokePath(ctx,[{x:r*.34,y:r*.12},{x:r*.42,y:r*.3},{x:r*.27,y:r*.34}],'#9e5b4e',r*.04);
  for(let i=0;i<6;i++)circ(ctx,r*(-.28+(i%3)*.13),r*(.29+Math.floor(i/3)*.08),r*.018,'#a45b4b',undefined,0);
  if(o.expr==='shout') {
    ell(ctx,r*.32,r*.65,r*.22,r*.24,'#5b2230',edge,r*.04);
    ell(ctx,r*.32,r*.48,r*.17,r*.035,'#fff6df');
    ell(ctx,r*.34,r*.8,r*.12,r*.065,'#e8788f');
  } else {
    strokePath(ctx,[{x:r*.04,y:r*.6},{x:r*.29,y:r*.65},{x:r*.59,y:r*.54}],'#8f3c51',r*.075);
    strokePath(ctx,[{x:r*.2,y:r*.71},{x:r*.44,y:r*.69}],'#f5b29d',r*.035);
  }
  // Borda do capuz como tecido multicolorido, sem esconder o rosto.
  ctx.beginPath();ctx.moveTo(-r*.95,r*.9);ctx.quadraticCurveTo(-r*1.25,-r*.82,-r*.22,-r*1.12);ctx.quadraticCurveTo(r*.7,-r*1.25,r*.94,r*.22);
  ctx.strokeStyle='#9d174d';ctx.lineWidth=r*.18;ctx.stroke();
  for(let i=0;i<15;i++) {
    const a=rad(160+i*12);const x=Math.cos(a)*r*1.04,y=Math.sin(a)*r*1.14-r*.05;
    circ(ctx,x,y,r*.06,colors[i%colors.length],edge,r*.014);
  }
  circ(ctx,-r*.91,r*.83,r*.16,'#facc15',edge,r*.035);
  if((o.glow||0)>0)eyeGlow(ctx,r*.5,0,r*1.4,o.glowColor||'#f9a8d4',o.glow!);
}

function drawAneninha(ctx: CanvasRenderingContext2D, r: Rig, pose: Pose, o: DrawOpts) {
  const p=r.p,{at}=bodyAxes(p),edge='#35202b',skin='#ce8b6d';
  const variant=o.costume??0;
  const yellow=['#facc15','#fbbf24','#22c55e','#f472b6'][variant%4];
  const pink=['#c21867','#db2777','#be185d','#9333ea'][variant%4];
  const dark=['#8e1553','#9d174d','#831843','#581c87'][variant%4];
  const trim=['#facc15','#22c55e','#06b6d4','#ec4899'];
  const arm=(e:P2,w:P2,front:boolean)=>{
    cap(ctx,p.sh,e,front?19:17,14,yellow,edge,2);
    cap(ctx,e,w,15,10,yellow,edge,1.8);
    const u=unit(e,w),n={x:-u.y,y:u.x};
    for(let i=0;i<3;i++) {
      const q={x:w.x-u.x*(5+i*3),y:w.y-u.y*(5+i*3)};
      strokePath(ctx,[{x:q.x+n.x*6,y:q.y+n.y*6},{x:q.x-n.x*6,y:q.y-n.y*6}],trim[i],2.4);
    }
    circ(ctx,w.x+u.x*4,w.y+u.y*4,6,skin,edge,1.6);
    if(front&&o.poseName==='paint_a') {
      ctx.save();ctx.translate(w.x+u.x*7,w.y+u.y*7);ctx.rotate(Math.atan2(u.y,u.x));
      ctx.fillStyle='#29252d';ctx.strokeStyle='#fbcfe8';ctx.lineWidth=1.5;ctx.fillRect(-4,-7,17,14);ctx.strokeRect(-4,-7,17,14);
      ctx.fillStyle='#ec4899';ctx.fillRect(8,-7,4,14);ctx.restore();
    }
  };
  const leg=(k:P2,a:P2,t:P2)=>{
    cap(ctx,p.hip,k,17,12,skin,edge,1.9);cap(ctx,k,a,12,10,skin,edge,1.8);
    const u=unit(k,a),n={x:-u.y,y:u.x},top={x:a.x-u.x*24,y:a.y-u.y*24};
    cap(ctx,top,a,15,13,'#28212e',edge,2);cap(ctx,a,t,14,14,'#28212e',edge,2);
    for(let i=0;i<5;i++) {
      const q={x:top.x+u.x*(4+i*4),y:top.y+u.y*(4+i*4)};
      strokePath(ctx,[{x:q.x+n.x*4,y:q.y+n.y*4},{x:q.x+u.x*3-n.x*4,y:q.y+u.y*3-n.y*4}],i%2?'#facc15':'#f472b6',1.4);
    }
    strokePath(ctx,[{x:a.x,y:a.y+5},{x:t.x,y:t.y+5}],'#8b6c86',3);
  };
  arm(p.eB,p.wB,false);leg(p.kB,p.aB,p.tB);leg(p.kF,p.aF,p.tF);
  cap(ctx,p.sh,p.head,10,11,skin,edge,1.6);
  poly(ctx,[at(-.03,-16),at(-.03,16),at(.65,20),at(1.08,17),at(1.1,-16),at(.55,-19)],yellow,edge,2.3);
  poly(ctx,[at(.1,-12),at(.75,-17),at(1.08,-16),at(.9,-5),at(.1,-4)],'#dc9919',undefined,0);
  strokePath(ctx,[at(1.05,-3),at(.14,-1)],'#c21867',5);
  strokePath(ctx,[at(1.05,3),at(.14,5)],'#06b6d4',3);
  // Saia rodada em três camadas, com bordado geométrico.
  const swing=Math.sin(o.time*.1)*2+(o.poseName?.startsWith('dance')?7:0);
  for(let layer=0;layer<3;layer++) {
    const topY=p.hip.y-4+layer*14,botY=topY+22,w0=18+layer*6,w1=28+layer*6+swing;
    ctx.beginPath();ctx.moveTo(p.hip.x-w0,topY);ctx.lineTo(p.hip.x+w0,topY);
    ctx.quadraticCurveTo(p.hip.x+w1,botY-8,p.hip.x+w1,botY);
    for(let i=0;i<8;i++)ctx.lineTo(p.hip.x+w1-(i+1)*w1/4,botY+(i%2?0:3));
    ctx.closePath();ctx.fillStyle=layer%2?dark:pink;ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=2;ctx.stroke();
    ctx.strokeStyle='#facc15';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(p.hip.x-w1+1,botY-3);ctx.lineTo(p.hip.x+w1-1,botY-3);ctx.stroke();
    for(let i=0;i<7;i++) {
      const x=p.hip.x-w1+5+i*(w1*2-10)/6;
      poly(ctx,[{x,y:botY-12},{x:x+4,y:botY-7},{x,y:botY-3},{x:x-4,y:botY-7}],trim[(i+layer)%4],undefined,0);
    }
  }
  for(let i=0;i<5;i++)circ(ctx,p.hip.x-18+i*9,p.hip.y-2,3.7,trim[i%4],edge,.7);
  ctx.save();ctx.translate(p.head.x,p.head.y);ctx.rotate(rad(pose.lean+pose.head)*.5+pose.rot);
  headAneninha(ctx,17,{...o,expr:o.expr==='hit'?'hit':pose.mouth>.5?'shout':o.expr});ctx.restore();
  arm(p.eF,p.wF,true);
}

/** Dançarinas do ataque coletivo, com figurinos e passos alternados. */
export function drawBolivianDancer(ctx:CanvasRenderingContext2D,x:number,y:number,scale:number,time:number,flip=false,costume=0) {
  const key=Math.floor(time/12)%2?'dance1':'dance2';
  const pose={...CHARS.aneninha.poses[key]};
  pose.lean+=Math.sin(time*.12)*4;
  const rig=computeRig('aneninha',pose);
  ctx.save();ctx.translate(x,y-Math.abs(Math.sin(time*Math.PI/12))*7*scale);ctx.scale(flip?-scale:scale,scale);
  drawRig(ctx,'aneninha',rig,pose,{time,poseName:key,costume});ctx.restore();
}

// ------------------------------------------------------------ VIEWERS
function headSantox(ctx: CanvasRenderingContext2D, r: number, o: DrawOpts) {
  const edge = '#21102e', purple = '#9454dc', shade = '#6836aa';
  const front = o.poseName === 'fourth_a' || o.poseName === 'fourth_s';
  const offset = front ? 0 : r * .14;
  const sway = Math.sin(o.time * .055) * r * .045;
  // As orelhas compridas conservam a silhueta mesmo nos retratos menores.
  const ear = (x: number, bend: number, back: boolean) => {
    ctx.beginPath();ctx.moveTo(x-r*.16,-r*.53);
    ctx.bezierCurveTo(x-r*.4+ bend*.2,-r*1.4,x-r*.43+bend,-r*2.54,x+bend,-r*2.63);
    ctx.bezierCurveTo(x+r*.48+bend,-r*2.73,x+r*.24+bend*.45,-r*1.33,x+r*.15,-r*.56);
    ctx.closePath();ctx.fillStyle=back?shade:purple;ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=r*.075;ctx.stroke();
    ctx.beginPath();ctx.moveTo(x-r*.02,-r*.86);ctx.bezierCurveTo(x-r*.15+bend*.3,-r*1.55,x-r*.12+bend,-r*2.34,x+r*.06+bend,-r*2.38);
    ctx.strokeStyle=back?'#a879e0':'#d29bf6';ctx.lineWidth=r*.12;ctx.lineCap='round';ctx.stroke();ctx.lineCap='butt';
  };
  ear(-r*.55,-r*.33+sway,true);ear(r*.5,r*.55-sway,false);
  const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#c085ef');g.addColorStop(.47,purple);g.addColorStop(1,'#7136b0');
  ell(ctx,offset,-r*.02,r*1.13,r*.9,g,edge,r*.08);
  ctx.beginPath();ctx.ellipse(offset,-r*.09,r*.96,r*.72,-.05,Math.PI*1.04,Math.PI*1.84);ctx.strokeStyle='#d09df5';ctx.lineWidth=r*.035;ctx.stroke();
  const eye=(x:number,tilt:number)=>{
    if(o.expr==='hit'){
      strokePath(ctx,[{x:x-r*.17,y:-r*.25},{x:x+r*.1,y:-r*.1},{x:x-r*.14,y:r*.03}],edge,r*.08);return;
    }
    ctx.save();ctx.translate(x,-r*.2);ctx.rotate(tilt);
    poly(ctx,[{x:-r*.37,y:-r*.03},{x:r*.35,y:-r*.07},{x:r*.32,y:r*.22},{x:-r*.33,y:r*.23}],'#fff0c9',edge,r*.045);
    ctx.fillStyle='#25152d';ctx.fillRect(-r*.03,-r*.04,r*.19,r*.26);
    ctx.fillStyle='#b477e6';ctx.fillRect(-r*.38,-r*.16,r*.77,r*.16);
    strokePath(ctx,[{x:-r*.38,y:-r*.02},{x:r*.37,y:-r*.07}],edge,r*.055);ctx.restore();
  };
  eye(offset-r*.48,-.08);eye(offset+r*.48,-.16);
  // Grande sorriso amarelo segmentado, marca central do personagem.
  ctx.beginPath();ctx.moveTo(offset-r*.91,r*.19);
  ctx.quadraticCurveTo(offset-r*.05,r*.51,offset+r*.95,r*.08);
  ctx.quadraticCurveTo(offset+r*.74,r*.84,offset-r*.03,r*.86);
  ctx.quadraticCurveTo(offset-r*.73,r*.79,offset-r*.91,r*.19);
  ctx.closePath();ctx.fillStyle=o.expr==='shout'?'#f4c65d':'#ffe397';ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=r*.065;ctx.stroke();
  ctx.save();ctx.clip();
  ctx.strokeStyle='#b98542';ctx.lineWidth=r*.025;
  for(let i=0;i<6;i++){const x=offset+(-.68+i*.28)*r;ctx.beginPath();ctx.moveTo(x,r*.25);ctx.lineTo(x+r*.05,r*.89);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(offset-r*.91,r*.46);ctx.quadraticCurveTo(offset,r*.7,offset+r*.94,r*.36);ctx.stroke();ctx.restore();
  if(o.expr==='shout')ell(ctx,offset+r*.05,r*.7,r*.19,r*.09,'#5b225c',undefined,0);
  if((o.glow||0)>0){eyeGlow(ctx,offset-r*.4,-r*.09,r*1.4,o.glowColor||'#f3b8ff',o.glow!);eyeGlow(ctx,offset+r*.55,-r*.14,r*1.4,o.glowColor||'#f3b8ff',o.glow!);}
}

function headJao(ctx: CanvasRenderingContext2D, r: number, o: DrawOpts) {
  const edge='#211a24',skin='#bd825e',shade='#955d44',hair='#231b20';
  ell(ctx,-r*.19,-r*.19,r*.82,r*.94,hair,edge,r*.055);
  ell(ctx,-r*.58,r*.14,r*.18,r*.26,shade,edge,r*.045);
  ctx.beginPath();ctx.moveTo(-r*.59,-r*.46);ctx.quadraticCurveTo(r*.07,-r*.94,r*.65,-r*.5);
  ctx.lineTo(r*.85,-r*.04);ctx.lineTo(r*1.04,r*.18);ctx.lineTo(r*.87,r*.3);
  ctx.quadraticCurveTo(r*.94,r*.69,r*.48,r*.95);ctx.quadraticCurveTo(-r*.11,r*1.02,-r*.49,r*.53);ctx.closePath();
  ctx.fillStyle=skin;ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=r*.06;ctx.stroke();
  poly(ctx,[{x:-r*.53,y:-r*.26},{x:-r*.22,y:-r*.3},{x:-r*.05,y:r*.51},{x:r*.27,y:r*.88},{x:-r*.24,y:r*.68}],shade,undefined,0);
  const eye=(x:number,y:number,scale:number)=>{
    if(o.expr==='hit'){strokePath(ctx,[{x:x-r*.14,y:y-r*.07},{x:x+r*.11,y},{x:x-r*.12,y:y+r*.08}],edge,r*.055);return;}
    ell(ctx,x,y,r*.17*scale,r*.1*scale,'#fff7ea',edge,r*.035,-.1);
    circ(ctx,x+r*.04,y-r*.005,r*.07*scale,'#4f3327',edge,r*.02);circ(ctx,x+r*.06,y-r*.005,r*.034*scale,'#151119',undefined,0);
    circ(ctx,x+r*.02,y-r*.035,r*.023*scale,'#fff',undefined,0);
  };
  eye(r*.22,-r*.065,1);eye(r*.7,-r*.08,.69);
  strokePath(ctx,[{x:r*.02,y:-r*.24},{x:r*.22,y:-r*.31},{x:r*.45,y:-r*.23}],hair,r*.085);
  strokePath(ctx,[{x:r*.58,y:-r*.26},{x:r*.77,y:-r*.27},{x:r*.9,y:-r*.2}],hair,r*.07);
  strokePath(ctx,[{x:r*.68,y:r*.02},{x:r*.76,y:r*.22},{x:r*.63,y:r*.29}],shade,r*.045);
  // Bigode fino e barba baixa deixam a expressão jovem e sorridente.
  strokePath(ctx,[{x:r*.32,y:r*.44},{x:r*.49,y:r*.4},{x:r*.63,y:r*.43},{x:r*.82,y:r*.42}],'#51352b',r*.05);
  poly(ctx,[{x:r*.1,y:r*.65},{x:r*.22,y:r*.86},{x:r*.48,y:r*.95},{x:r*.73,y:r*.78},{x:r*.81,y:r*.62},{x:r*.63,y:r*.79},{x:r*.34,y:r*.79}],hair,undefined,0);
  if(o.expr==='hit')strokePath(ctx,[{x:r*.34,y:r*.6},{x:r*.58,y:r*.55},{x:r*.76,y:r*.63}],'#61392e',r*.055);
  else {
    ctx.beginPath();ctx.moveTo(r*.25,r*.53);ctx.quadraticCurveTo(r*.59,r*.64,r*.88,r*.44);
    ctx.quadraticCurveTo(r*.77,r*(o.expr==='shout'?.83:.74),r*.48,r*.74);ctx.quadraticCurveTo(r*.29,r*.7,r*.25,r*.53);
    ctx.fillStyle='#50252b';ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=r*.035;ctx.stroke();
    poly(ctx,[{x:r*.3,y:r*.55},{x:r*.83,y:r*.48},{x:r*.72,y:r*.61},{x:r*.43,y:r*.65}],'#fff2d8',undefined,0);
  }
  // Cachos curtos, com a lateral aparente; o volume é menor que o afro do Caetano.
  for(let row=0;row<3;row++)for(let i=0;i<6;i++){
    const x=(-.64+i*.26+(row%2)*.07)*r,y=(-.88+row*.19)*r;
    if(row===0&&(i===0||i===5))continue;
    circ(ctx,x,y,r*(row===0?.23:.21),hair,edge,r*.025);
    ctx.beginPath();ctx.arc(x-r*.03,y-r*.03,r*.1,Math.PI,Math.PI*1.85);ctx.strokeStyle='#564038';ctx.lineWidth=r*.035;ctx.stroke();
  }
  if((o.glow||0)>0)eyeGlow(ctx,r*.28,-r*.07,r*1.5,o.glowColor||'#c4b5fd',o.glow!);
}

function drawSantox(ctx:CanvasRenderingContext2D,r:Rig,pose:Pose,o:DrawOpts){
  const p=r.p,{at}=bodyAxes(p),edge='#281035';
  const abstract=o.poseName==='abstract_a',purple=abstract?'#281531':'#9050cf',shadow=abstract?'#100d1b':'#603393';
  const pink=abstract?'#1b1027':'#e33ea1',pinkShadow=abstract?'#110e1d':'#ab287d';
  const stretch=Math.max(0,o.stretch||0);
  // O desenho do braço elástico não modifica os pontos do esqueleto do motor.
  const wF=stretch>0?{x:Math.max(p.sh.x+24,stretch-22.5),y:p.sh.y+4}:p.wF;
  const eF=stretch>0?{x:p.sh.x+(wF.x-p.sh.x)*.46,y:p.sh.y+2}:p.eF;
  const glove=(e:P2,w:P2,front:boolean)=>{
    const u=unit(e,w);ctx.save();ctx.translate(w.x+u.x*6,w.y+u.y*6);ctx.rotate(Math.atan2(u.y,u.x));
    cap(ctx,{x:-5,y:0},{x:7,y:0},16,19,front?'#f6cf58':'#c99d41',edge,1.8);
    ell(ctx,1,-7,6,4,front?'#ffe58f':'#e0bb60',edge,1.4,.28);
    for(let i=-1;i<=1;i++)strokePath(ctx,[{x:6,y:i*4},{x:10,y:i*4}],'#b98b3b',1);
    if(front&&pose.finger>.5&&stretch===0)cap(ctx,{x:7,y:-4},{x:24,y:-5},6,4,'#f6cf58',edge,1.3);
    ctx.restore();
  };
  const arm=(e:P2,w:P2,front:boolean)=>{
    cap(ctx,p.sh,e,13,11,front?purple:shadow,edge,2);cap(ctx,e,w,11,9,front?purple:shadow,edge,1.8);
    if(front)strokePath(ctx,[{x:p.sh.x,y:p.sh.y-3},{x:e.x,y:e.y-3},{x:w.x,y:w.y-3}],abstract?'#663176':'#bd82e8',1.5);
    glove(e,w,front);
  };
  const leg=(k:P2,a:P2,t:P2,back:boolean)=>{
    cap(ctx,p.hip,k,20,16,back?pinkShadow:pink,edge,2.2);cap(ctx,k,a,16,14,back?pinkShadow:pink,edge,2);
    strokePath(ctx,[{x:k.x-4,y:k.y},{x:a.x-4,y:a.y-4}],abstract?'#572263':back?'#cf3e9f':'#ff85ce',1.8);
    const u=unit(a,t);cap(ctx,a,{x:t.x+u.x*5,y:t.y+u.y*5},20,22,back?shadow:purple,edge,2);
    strokePath(ctx,[{x:a.x-u.y*8,y:a.y+u.x*8},{x:t.x-u.y*9,y:t.y+u.x*9}],abstract?'#8d489d':'#bd82e8',2.3);
  };
  circ(ctx,p.hip.x-19,p.hip.y-5,8,purple,edge,1.8);
  arm(p.eB,p.wB,false);leg(p.kB,p.aB,p.tB,true);
  cap(ctx,p.sh,p.head,10,10,purple,edge,1.8);
  poly(ctx,[at(-.05,-12),at(-.05,13),at(.64,16),at(1.08,12),at(1.08,-12),at(.64,-14)],purple,edge,2.1);
  poly(ctx,[at(-.08,-13),at(-.08,14),at(.5,17),at(.78,12),at(.8,-11),at(.5,-15)],pink,edge,2.1);
  strokePath(ctx,[at(1.07,-9),at(.72,-8)],pinkShadow,6.5);strokePath(ctx,[at(1.07,10),at(.72,10)],pink,6.5);
  const b1=at(.76,-8),b2=at(.76,10);circ(ctx,b1.x,b1.y,2.4,'#f6ce56',edge,.9);circ(ctx,b2.x,b2.y,2.4,'#f6ce56',edge,.9);
  poly(ctx,[at(.46,-7),at(.46,8),at(.2,7),at(.16,0),at(.2,-7)],pinkShadow,'#f37fc9',1.1);
  leg(p.kF,p.aF,p.tF,false);
  if(abstract){
    const eye=at(.63,0);ell(ctx,eye.x,eye.y,11,5,'#f5d466',edge,1.1);ell(ctx,eye.x,eye.y,2,5,'#25102d');
    for(const q of [p.kF,p.eB]){ell(ctx,q.x,q.y,6,3.5,'#f5d466',edge,1);ell(ctx,q.x,q.y,1.5,3.5,'#25102d');}
  }
  ctx.save();ctx.translate(p.head.x,p.head.y);ctx.rotate((o.poseName?.startsWith('fourth')?0:rad(pose.lean+pose.head)*.5)+pose.rot);
  headSantox(ctx,20,{...o,expr:o.expr||'n'});ctx.restore();arm(eF,wF,true);
}

function drawJao(ctx:CanvasRenderingContext2D,r:Rig,pose:Pose,o:DrawOpts){
  const p=r.p,{at}=bodyAxes(p),edge='#211b29',black='#252531',shade='#171722',light='#494753',skin='#bd825e';
  const arm=(e:P2,w:P2,front:boolean)=>{
    cap(ctx,p.sh,e,22,19,front?black:shade,edge,2.1);cap(ctx,e,w,19,12,front?black:shade,edge,2);
    strokePath(ctx,[{x:e.x-4,y:e.y-4},{x:w.x-3,y:w.y-6}],front?light:'#363440',1.7);
    const u=unit(e,w),h={x:w.x+u.x*5,y:w.y+u.y*5};
    cap(ctx,{x:w.x-u.x*4,y:w.y-u.y*4},w,13,12,'#e1dfe3',edge,1.4);circ(ctx,h.x,h.y,7.5,front?skin:'#a36e51',edge,1.7);
    if(front&&pose.finger>.5)cap(ctx,h,{x:h.x+u.x*17,y:h.y+u.y*17},5.2,3.5,skin,edge,1.3);
    else strokePath(ctx,[{x:h.x+u.x*4-u.y*4,y:h.y+u.y*4+u.x*4},{x:h.x+u.x*4+u.y*4,y:h.y+u.y*4-u.x*4}],'#8a543d',1.1);
  };
  const leg=(k:P2,a:P2,t:P2,back:boolean)=>{
    cap(ctx,p.hip,k,25,21,back?shade:black,edge,2.2);cap(ctx,k,a,21,15,back?shade:black,edge,2);
    strokePath(ctx,[{x:k.x-4,y:k.y},{x:a.x-3,y:a.y-9}],back?'#34313d':light,1.7);
    const u=unit(a,t),n={x:-u.y,y:u.x};cap(ctx,a,t,18,16,'#24232e',edge,2.1);
    strokePath(ctx,[{x:a.x+n.x*7,y:a.y+n.y*7},{x:t.x+n.x*7,y:t.y+n.y*7}],'#ede9e7',3.8);
    strokePath(ctx,[{x:a.x+u.x*2-n.x*3,y:a.y+u.y*2-n.y*3},{x:a.x+u.x*6+n.x*4,y:a.y+u.y*6+n.y*4}],'#fff7eb',1.3);
  };
  arm(p.eB,p.wB,false);leg(p.kB,p.aB,p.tB,true);cap(ctx,p.sh,p.head,12,12,skin,edge,1.8);
  // Gola alta e fileira de botões dourados do uniforme preto.
  poly(ctx,[at(-.15,-17),at(-.15,18),at(.55,22),at(1.08,17),at(1.13,11),at(1.13,-12),at(.74,-21)],black,edge,2.3);
  poly(ctx,[at(-.15,-17),at(.61,-21),at(1.08,-15),at(.99,-7),at(-.15,-8)],shade,undefined,0);
  poly(ctx,[at(1.03,-10),at(1.03,12),at(1.28,10),at(1.29,-9)],'#d8d4db',edge,1.5);
  poly(ctx,[at(1.06,-7),at(1.06,9),at(1.28,8),at(1.29,-6)],black,edge,1.3);
  strokePath(ctx,[at(1.03,3),at(-.13,3)],'#65606c',1.3);
  for(let i=0;i<5;i++){const q=at(.13+i*.185,5.5);circ(ctx,q.x,q.y,2,'#d6b85f','#77653c',.8);circ(ctx,q.x-.5,q.y-.5,.6,'#f8e6a3',undefined,0);}
  strokePath(ctx,[at(.15,-15),at(.45,-8),at(.66,-14)],light,1.3);
  leg(p.kF,p.aF,p.tF,false);
  ctx.save();ctx.translate(p.head.x,p.head.y);ctx.rotate(rad(pose.lean+pose.head)*.5+pose.rot);headJao(ctx,18,{...o,expr:o.expr|| (pose.mouth>.5?'shout':'n')});ctx.restore();
  arm(p.eF,p.wF,true);
  // A bola só aparece na preparação; o projétil do combate é independente.
  if(o.poseName==='ball_s'){
    const x=p.wF.x+9,y=p.wF.y-3;circ(ctx,x,y,15,'#d97a39',edge,1.6);
    ctx.save();ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.clip();
    strokePath(ctx,[{x:x-15,y},{x:x+15,y}],'#683b2d',1.2);strokePath(ctx,[{x,y:y-15},{x,y:y+15}],'#683b2d',1.2);
    ctx.beginPath();ctx.ellipse(x,y,8,17,.4,0,Math.PI*2);ctx.strokeStyle='#683b2d';ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  }
  if(o.poseName==='chess_s'||o.poseName==='calculation_s'){
    const x=p.wF.x+9,y=p.wF.y-18;ctx.save();ctx.shadowColor='#bca8f5';ctx.shadowBlur=10;
    ell(ctx,x,y+9,8,3,'#e3d5ff',edge,1);poly(ctx,[{x:x-6,y:y+8},{x:x-3,y:y-5},{x:x+3,y:y-5},{x:x+6,y:y+8}],'#bba9e5',edge,1.1);
    circ(ctx,x,y-8,4,'#f2eaff',edge,1);strokePath(ctx,[{x,y:y-18},{x,y:y-11}],'#f2eaff',2);strokePath(ctx,[{x:x-3,y:y-15},{x:x+3,y:y-15}],'#f2eaff',2);ctx.restore();
  }
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
  drawRig(ctx, ch, rig, pose, { time, poseName });
  ctx.restore();
}
