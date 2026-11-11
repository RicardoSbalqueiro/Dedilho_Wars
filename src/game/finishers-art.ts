import {NEW_FIGHTERS} from './woc-data';
import type {NewFighter} from './woc-data';
import {drawWocUltimate} from './woc-art';
// Finalizações em quadrinhos: apenas apresentação, sem alterar o estado do combate.
import { CHARS } from './data';
import type { CharId } from './data';
import { drawBolivianDancer, drawFullBody, drawPortrait } from './rig';
import { drawViewerFinisher } from './viewer-art';
import { drawTrioFinisher } from './trio-art';
import { settings } from './visual-settings';
import { cinematicAnimation } from './animation';

export const FINISHER_NAMES: Record<CharId, string> = {
  patrick:'COROA DO REI TATU',gabrielzin:'KAWAI SEM LIMITES',ulisses:'NOITE DE RAKUYO',felipence:'ÚLTIMO ACORDE',hdsh:'BOX FINAL 200',
  caetano: 'MIL DEDILHOS DO DESTINO',
  orango: 'IMPACTO DO REI DA SELVA',
  tubarao: 'MARÉ DA MALHA FINA',
  rickzera: 'TRANSFERÊNCIA FINAL',
  bieu:'APOTEOSE DO CAPÃO',
  nomad: 'LOBBY FECHADO',
  renngotti: 'RESSONÂNCIA LUNAR',
  aneninha:'APOTEOSE DE OSASCO',
  santox:'FORA DO ROTEIRO',
  jao:'XEQUE-MATE ABSOLUTO',
  jane:'DEPLOY DO AREIAZORD',cristyan:'SENTENÇA DA REDE',eneas:'56 NO PLACAR',
};

type ClassicChar = Exclude<CharId, NewFighter | 'santox' | 'jao' | 'jane' | 'cristyan' | 'eneas'>;
const CAPTIONS: Record<ClassicChar, [string, string, string]> = {
  caetano: ['Um dedo. Precisão absoluta.', 'Uma rajada de pontos de pressão!', 'Cada dedilho encontrou seu destino.'],
  orango: ['A arena sente o chamado da selva.', 'Força primal! O chão vira um tambor.', 'O rei da selva fez a arena tremer.'],
  tubarao: ['A fiscalização chegou por mar.', 'Na malha fina de uma maré gigante!', 'Fiscalizado, carimbado e devolvido à praia.'],
  rickzera: ['Conectando à rede de transferências…', 'Seis portais. Uma transferência inevitável.', 'Transferência concluída. Saldo de estilo: infinito.'],
  bieu: ['Licença. O prestígio está passando.', 'Uma arrancada, uma assinatura na parede!', 'O prestígio passou e deixou sua marca.'],
  nomad: ['Última chamada para entrar na arena.', 'A entrega especial do dono do lobby!', 'Partida encerrada. O lobby tem dono.'],
  renngotti: ['O microfone está ligado. Olha a lua!', 'A voz atravessou a arena e chegou à órbita!', 'Ressonância máxima. O show continua.'],
  aneninha: ['Osasco no coração. Bolívia no ritmo.', 'Toda a avenida entra nessa coreografia!', 'Uma finalização com direito a apoteose!'],
};

const W = 960;
const H = 540;
const FLOOR = 454;
const FONT = "'Russo One', Impact, sans-serif";
const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const ease = (n: number) => 1 - (1 - clamp(n)) ** 3;
const smooth = (n: number) => { const v = clamp(n); return v * v * (3 - 2 * v); };
const seed = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
type Point = { x: number; y: number };

function line(ctx: CanvasRenderingContext2D, pts: Point[], color: string, width = 3) {
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
function poly(ctx: CanvasRenderingContext2D, pts: Point[], color: string, outline = '#141321', width = 3) {
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  if (width) { ctx.strokeStyle = outline; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string, width = 3) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
function ring(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, width = 3, oval = 1) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, radius), Math.max(.1, radius * oval), 0, 0, Math.PI * 2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha*(settings.reducedFlash?.35:1);
  const g = ctx.createRadialGradient(x, y, 1, x, y, Math.max(2, radius)); g.addColorStop(0, settings.reducedFlash?color:'#fff'); g.addColorStop(.18, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2); ctx.restore();
}
function burst(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, spin = 0) {
  const points: Point[] = [];
  for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12 + spin; const r = radius * (i % 2 ? .38 : 1); points.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r }); }
  poly(ctx, points, color, '#fff6d9', 2);
}
function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color = '#fff', maxWidth = 850) {
  ctx.save(); ctx.font = `italic 900 ${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * .1); ctx.strokeStyle = '#10101c'; ctx.strokeText(value, x, y, maxWidth); ctx.fillStyle = color; ctx.fillText(value, x, y, maxWidth); ctx.restore();
}
function actor(ctx: CanvasRenderingContext2D, ch: CharId, x: number, y: number, time: number, pose = 'idle', scale = 1.55, flip = false, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; drawFullBody(ctx, ch, x, y, scale, time, pose, flip,cinematicAnimation(ctx,ch,pose,time,flip)); ctx.restore();
}
function stars(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, color: string) {
  for (let i = 0; i < 4; i++) { const a = time * .07 + i * Math.PI / 2; burst(ctx, x + Math.cos(a) * 42, y + Math.sin(a) * 12, 7, color, a); }
}
function confetti(ctx: CanvasRenderingContext2D, time: number, colors: string[], amount = 65) {
  for (let i = 0; i < amount; i++) {
    const x = seed(i + 8) * W + Math.sin(time * .025 + i) * 25; const y = ((seed(i + 90) * H + time * (1 + seed(i) * 2)) % (H + 60)) - 30;
    ctx.save(); ctx.translate(x, y); ctx.rotate(time * .06 + i); ctx.fillStyle = colors[i % colors.length]; ctx.fillRect(-2, -5, 4, 10); ctx.restore();
  }
}
function floor(ctx: CanvasRenderingContext2D, color: string) {
  const g = ctx.createLinearGradient(0, 402, 0, 476); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, '#121321'); ctx.fillStyle = g; ctx.fillRect(0, 400, W, 78);
  line(ctx, [{ x: 0, y: FLOOR + 2 }, { x: W, y: FLOOR + 2 }], color, 2);
  for (let i = 0; i < 7; i++) line(ctx, [{ x: W / 2, y: 398 }, { x: -250 + i * 250, y: 478 }], '#ffffff12', 1);
}
function background(ctx: CanvasRenderingContext2D, ch: CharId, t: number) {
  const c = CHARS[ch]; const g = ctx.createLinearGradient(0, 30, W, 480); g.addColorStop(0, '#131320'); g.addColorStop(.52, c.color2); g.addColorStop(1, '#0a1020'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = .12; drawPortrait(ctx, ch, 120, 240, 150, { time: t }); ctx.restore();
  poly(ctx, [{ x: 310, y: 0 }, { x: 780, y: 0 }, { x: 510, y: H }, { x: 40, y: H }], `${c.color}20`, '#ffffff20', 1);
  for (let i = 0; i < 32; i++) {
    const a = i * Math.PI * 2 / 32; const r = 310 + seed(i) * 90; const x = 660 + Math.cos(a) * r; const y = 285 + Math.sin(a) * r * .78;
    const length = 70 + seed(i + 30) * 160 + Math.sin(t * .14 + i) * 25;
    line(ctx, [{ x, y }, { x: x + Math.cos(a) * length, y: y + Math.sin(a) * length }], i % 4 ? `${c.glow}35` : '#ffffff90', i % 3 ? 2 : 4);
  }
  ctx.save(); ctx.globalAlpha = .12; ctx.fillStyle = '#fff';
  for (let y = 76; y < 460; y += 26) for (let x = 700 + (y % 52 ? 0 : 13); x < W; x += 26) ellipse(ctx, x, y, 1.5, 1.5, '#fff');
  ctx.restore(); floor(ctx, `${c.glow}90`);
}
function opponent(ctx: CanvasRenderingContext2D, loser: CharId, time: number, start = 126, x = 700, y = FLOOR) {
  const f = clamp((time - start) / 30);
  actor(ctx, loser, x + ease(f) * 35, y - Math.sin(f * Math.PI) * 145, time, f >= .96 ? 'down' : time < start ? 'hit' : 'air', f >= .96 ? 1.32 : 1.45, true);
}
function finger(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, alpha: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha *= alpha;
  line(ctx, [{ x: -56, y: 0 }, { x: 4, y: 0 }], color, 12); line(ctx, [{ x: -56, y: 0 }, { x: 4, y: 0 }], '#fff3d7', 4);
  ellipse(ctx, -63, 6, 10, 8, '#dfaa77', '#6f3c47', 2); ctx.restore();
}

function caetano(ctx: CanvasRenderingContext2D, loser: CharId, t: number) {
  const active = t >= 44; const x = active ? 310 + ease((t - 44) / 16) * 105 : -70 + ease(t / 39) * 340;
  actor(ctx, 'caetano', x, FLOOR, t, active ? 'dedo_a' : 'dedo_s');
  if (!active) { actor(ctx, loser, 715, FLOOR, t, 'idle', 1.45, true); glow(ctx, x + 105, 280, 45 + Math.sin(t * .1) * 8, '#eab3ff', .7); return; }
  const n = clamp((t - 45) / 82); const hits = Math.min(12, Math.floor(n * 12) + 1);
  if (t < 131) actor(ctx, loser, 715 + Math.sin(t * 2) * 5, FLOOR, t, 'hit', 1.45, true);
  for (let i = 0; i < 12; i++) {
    const local = (t - 47 - i * 6) / 12;
    if (local < 0 || local > 1) continue;
    const target = { x: 680 + Math.sin(i * 2.1) * 33, y: 250 + (i % 5) * 28 };
    const tip = { x: 470 + ease(local) * (target.x - 470), y: 280 + ease(local) * (target.y - 280) };
    const angle = Math.atan2(target.y - 280, target.x - 470);
    finger(ctx, tip.x, tip.y, angle, '#d487ff', Math.sin(local * Math.PI));
    if (local > .5) { ring(ctx, target.x, target.y, 4 + local * 23, '#f2d4ff', 2); burst(ctx, target.x, target.y, 15, '#e9b3ff', i); }
  }
  if (t < 131) text(ctx, `${hits} PONTOS DE PRESSÃO`, 686, 155, 22, '#edc6ff', 380);
  else { const p = clamp((t - 131) / 24); glow(ctx, 695, 300, 100 + p * 120, '#c084fc', 1 - p * .6); ring(ctx, 690, 305, 25 + p * 190, '#f0d3ff', 7 * (1 - p)); opponent(ctx, loser, t, 130); text(ctx, 'PRECISÃO ABSOLUTA', 650, 158, 28, '#f7d185', 480); }
}
function orango(ctx: CanvasRenderingContext2D, loser: CharId, t: number) {
  if (t < 45) { actor(ctx, 'orango', 260, FLOOR, t, 'roar', 1.38); actor(ctx, loser, 700, FLOOR, t, 'idle', 1.5, true); for (let i = 0; i < 3; i++) ring(ctx, 350, 270, 25 + ((t * 3 + i * 45) % 150), '#ffb86c55', 3, .7); return; }
  const lift = ease((t - 45) / 28); const slam = ease((t - 84) / 24);
  actor(ctx, 'orango', 410, FLOOR, t, t < 84 ? 'throwUp' : 'slam', 1.32);
  if (t < 84) actor(ctx, loser, 655 - lift * 100, FLOOR - lift * 160, t, 'grabbed', 1.13, true);
  else actor(ctx, loser, 555 + slam * 90, 294 + slam * 160, t, slam > .9 ? 'down' : 'air', 1.13 + slam * .27, true);
  if (t >= 101) {
    const p = clamp((t - 101) / 48); ring(ctx, 640, 449, 20 + p * 340, '#ffd09a', 9 * (1 - p) + 1, .18);
    for (let i = 0; i < 14; i++) { const a = Math.PI + i * Math.PI / 13; const distance = p * (90 + seed(i) * 180); ellipse(ctx, 635 + Math.cos(a) * distance, 446 + Math.sin(a) * distance * .5 + p * p * 70, 7 + seed(i + 4) * 10, 5, i % 2 ? '#9b6339' : '#edaa66', '#3c2630', 1.4); }
    for (let i = 0; i < 7; i++) { const dx = (i - 3) * 70; line(ctx, [{ x: 640, y: 450 }, { x: 640 + dx * .4, y: 457 }, { x: 640 + dx, y: 465 + Math.abs(dx) * .02 }], '#e7b885', 2); }
    text(ctx, 'BOOOOM!', 660, 184, 64, '#ffc980', 460);
  }
}
function heart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size); ctx.beginPath(); ctx.moveTo(0, .35); ctx.bezierCurveTo(-1, -.15, -.65, -.9, 0, -.45); ctx.bezierCurveTo(.65, -.9, 1, -.15, 0, .35); ctx.fillStyle = '#ff9cc8'; ctx.fill(); ctx.strokeStyle = '#ffe2f0'; ctx.lineWidth = .07; ctx.stroke(); ctx.restore();
}
function tubarao(ctx: CanvasRenderingContext2D, loser: CharId, t: number) {
  const p = clamp((t - 42) / 90); const waterY = 454 - Math.sin(p * Math.PI) * 150;
  for (let layer = 0; layer < 3; layer++) {
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, waterY + layer * 17 + Math.sin(x * .015 + t * .08 + layer) * (12 + p * 18));
    ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = ['#074963aa', '#10779cbb', '#3ab9dc99'][layer]; ctx.fill();
  }
  actor(ctx, 'tubarao', 265 + ease(p) * 110, FLOOR, t, t < 45 ? 'swallow_s' : t > 100 ? 'kiss' : 'bite_a', 1.55);
  if (t < 45) actor(ctx, loser, 715, FLOOR, t, 'idle', 1.4, true);
  else {
    const bob = Math.sin(p * Math.PI) * 120; actor(ctx, loser, 720 + Math.sin(p * 7) * 25, FLOOR - bob, t, p > .86 ? 'down' : 'air', 1.25, true);
    ring(ctx, 720, FLOOR - bob - 55, 107, '#c4f7ff', 3, 1.12); glow(ctx, 720, FLOOR - bob - 55, 125, '#25c8e5', .18);
    for (let i = 0; i < 16; i++) { const x = 470 + seed(i) * 430; const y = 460 - ((t * 3 + seed(i + 9) * 280) % 330); ring(ctx, x, y, 3 + seed(i + 30) * 11, '#c6f9ff88', 1.5); }
    if (t > 100) { ctx.save(); ctx.translate(690, 192); ctx.rotate(-.15); ctx.strokeStyle = '#a7f3ff'; ctx.lineWidth = 5; ctx.strokeRect(-160, -30, 320, 60); text(ctx, 'FISCALIZADO!', 0, 0, 37, '#c7f5ff', 300); ctx.restore(); }
    if (t > 112) for (let i = 0; i < 4; i++) heart(ctx, 490 + i * 48, 270 + Math.sin(t * .08 + i) * 30, 15 + i * 3);
  }
}
function banknote(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, label: string, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale); ctx.fillStyle = '#a6ffb5'; ctx.fillRect(-32, -17, 64, 34); ctx.strokeStyle = '#286945'; ctx.lineWidth = 3; ctx.strokeRect(-29, -14, 58, 28); ellipse(ctx, 0, 0, 12, 12, '#d7ffcc', '#317653', 1); text(ctx, label, 0, 1, 12, '#2b6543', 50); ctx.restore();
}
function rickzera(ctx: CanvasRenderingContext2D, loser: CharId, t: number) {
  actor(ctx, 'rickzera', 245 + ease(t / 45) * 65, FLOOR, t, t < 45 ? 'franco_s' : 'wise_a');
  actor(ctx, loser, 725, FLOOR - (t >= 70 ? Math.sin(clamp((t - 70) / 76) * Math.PI) * 60 : 0), t, t < 45 ? 'idle' : 'hit', 1.4, true);
  const count = Math.min(6, Math.max(0, Math.floor((t - 42) / 14) + 1));
  for (let i = 0; i < count; i++) {
    const a = i * Math.PI / 3 - Math.PI / 2; const x = 720 + Math.cos(a) * 155; const y = 280 + Math.sin(a) * 140;
    ring(ctx, x, y, 31 + Math.sin(t * .1 + i) * 3, '#9eff56', 4); ring(ctx, x, y, 37, '#bfff8d55', 2);
    banknote(ctx, x, y, a + t * .025, '6x', .85);
    const b = clamp((t - 45 - i * 14) / 12); if (b > 0 && b < 1) { line(ctx, [{ x, y }, { x: x + (720 - x) * b, y: y + (280 - y) * b }], '#cdffa3', 6); burst(ctx, 720, 280, 15 + b * 28, '#c4ff70', a); }
  }
  if (count) text(ctx, `${count}/6 TRANSFERÊNCIAS`, 690, 130, 26, '#b7ff7c', 420);
  if (t > 129) { const v = clamp((t - 129) / 25); glow(ctx, 720, 290, 100 + v * 150, '#9eff56', 1 - v * .5); text(ctx, 'CONCLUÍDO  ✓', 680, 230, 52, '#d5ffb8', 480); }
}
function car(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save(); ctx.translate(x, y);
  ellipse(ctx, 4, 11, 123, 16, '#00000066');
  poly(ctx, [{ x: -113, y: -25 }, { x: -70, y: -36 }, { x: -38, y: -79 }, { x: 36, y: -79 }, { x: 70, y: -35 }, { x: 117, y: -25 }, { x: 121, y: 4 }, { x: -116, y: 4 }], '#a853bd', '#231c32', 4);
  poly(ctx, [{ x: -57, y: -38 }, { x: -32, y: -68 }, { x: 28, y: -68 }, { x: 50, y: -38 }], '#bfe7e3', '#282638', 3);
  line(ctx, [{ x: -104, y: -18 }, { x: 110, y: -18 }], '#f2c54e', 5);
  for (const wheel of [-72, 76]) { ellipse(ctx, wheel, 5, 24, 24, '#1d1d2a', '#0b0d16', 3); ring(ctx, wheel, 5, 13, '#a8adbf', 4); line(ctx, [{ x: wheel - Math.cos(t * .2) * 10, y: 5 - Math.sin(t * .2) * 10 }, { x: wheel + Math.cos(t * .2) * 10, y: 5 + Math.sin(t * .2) * 10 }], '#d3d2df', 3); }
  ctx.fillStyle = '#fdf1b1'; ctx.fillRect(103, -21, 15, 10); text(ctx, 'PRESTÍGIO', 0, -15, 12, '#fff2b8', 125); ctx.restore();
}
function bieu(ctx: CanvasRenderingContext2D, loser: CharId, t: number) {
  if (t < 45) { actor(ctx, 'bieu', 240, FLOOR, t, 'spray_s'); actor(ctx, loser, 725, FLOOR, t, 'idle', 1.45, true); return; }
  const p = clamp((t - 45) / 91); const x = -150 + ease(p) * 805;
  ctx.save(); ctx.globalAlpha = clamp((t - 65) / 30); ctx.translate(510, 195); ctx.rotate(-.08); text(ctx, 'PRESTÍGIO', 0, 0, 77, '#d68bff', 740); ctx.restore();
  for (let i = 0; i < 7; i++) { const puff = (p + i * .13) % 1; ellipse(ctx, x - 130 - puff * 100, 435 - puff * 35, 12 + puff * 26, 8 + puff * 13, '#dac6e333'); }
  if (t < 112) actor(ctx, loser, 725, FLOOR, t, t < 96 ? 'idle' : 'hit', 1.45, true);
  else opponent(ctx, loser, t, 111, 700);
  actor(ctx, 'bieu', x - 4, 525, t, 'drive', 1.2); car(ctx, x, 447, t);
  if (t >= 103 && t < 126) { burst(ctx, 722, 365, 48 + Math.sin(t) * 8, '#f8d76c', t * .02); text(ctx, 'VROOOM!', 665, 264, 41, '#f7d889', 390); }
}
function rocket(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save(); ctx.translate(x, y); poly(ctx, [{ x: -36, y: -6 }, { x: -17, y: -13 }, { x: 16, y: -12 }, { x: 34, y: 0 }, { x: 16, y: 12 }, { x: -17, y: 13 }, { x: -36, y: 6 }], '#da9953', '#4e3540', 2);
  poly(ctx, [{ x: -24, y: -8 }, { x: -48 - Math.sin(t) * 8, y: 0 }, { x: -24, y: 8 }], '#ffe7a1', '#f39153', 2); ctx.restore();
}
function nomad(ctx: CanvasRenderingContext2D, loser: CharId, t: number) {
  actor(ctx, 'nomad', 270, FLOOR, t, t < 45 ? 'boomerang_s' : 'bazooka', 1.65);
  if (t < 106) actor(ctx, loser, 725, FLOOR, t, t < 45 ? 'idle' : 'block', 1.4, true); else opponent(ctx, loser, t, 106);
  if (t > 45 && t < 110) { const p = clamp((t - 45) / 61); rocket(ctx, 385 + p * 340, 295 - Math.sin(p * Math.PI) * 35, t); for (let i = 0; i < 6; i++) ellipse(ctx, 365 + p * 300 - i * 17, 295 + Math.sin(i + t * .1) * 9, 8 + i * 2, 6 + i * 2, '#edc79e44'); }
  if (t >= 104) {
    const p = clamp((t - 104) / 45); glow(ctx, 718, 304, 170 * (1 + p), '#ffbc56', 1 - p * .7); burst(ctx, 718, 304, 50 + p * 100, '#ffcf74', .1);
    text(ctx, 'GG!', 718, 302, 78, '#fff3c8', 300); confetti(ctx, t, ['#fca862', '#ffe994', '#f17165'], 42);
  }
}
function microphone(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); line(ctx, [{ x: -10, y: 0 }, { x: 25, y: 0 }], '#a1aab9', 11); ellipse(ctx, 34, 0, 16, 18, '#c5d6e0', '#3c4a5b', 3); for (let i = -2; i <= 2; i++) line(ctx, [{ x: 23, y: i * 5 }, { x: 43, y: i * 5 }], '#6a8297', 1); ctx.restore();
}
function renngotti(ctx: CanvasRenderingContext2D, loser: CharId, t: number) {
  // Lua e ondas de pressão transformam o lançamento em uma viagem orbital de quadrinhos.
  glow(ctx, 735, 153, 135, '#b9e5ef', .4); ellipse(ctx, 735, 153, 80, 80, '#dce3df', '#7798ad', 3);
  for (let i = 0; i < 9; i++) ellipse(ctx, 735 + Math.cos(i * 2.3) * (20 + i * 4), 153 + Math.sin(i * 2.3) * (20 + i * 4), 6 + seed(i) * 10, 5 + seed(i + 3) * 7, '#bccdcc', '#a4babc', 1);
  for (let i = 0; i < 17; i++) { const x = 470 + seed(i + 100) * 460; const y = 78 + seed(i + 50) * 160; ellipse(ctx, x, y, 1.7, 1.7, '#e5f4ff'); }
  actor(ctx, 'renngotti', 295, FLOOR, t, t < 45 ? 'moon_s' : t < 85 ? 'moon_a' : 'mic_s', 1.6);
  const launch = clamp((t - 44) / 40); const land = clamp((t - 107) / 46);
  if (t < 45) actor(ctx, loser, 710, FLOOR, t, 'idle', 1.4, true);
  else actor(ctx, loser, 710 + Math.sin(launch * Math.PI) * 65 + land * 65, FLOOR - Math.sin(launch * Math.PI / 2) * 245 * (1 - land), t, land > .96 ? 'down' : 'air', 1.4 - launch * .38 + land * .3, true);
  if (t > 78) {
    microphone(ctx, 450, 300, -.12);
    for (let i = 0; i < 6; i++) { const p = ((t - 78) * .017 + i / 6) % 1; ctx.save(); ctx.globalAlpha = 1 - p; ring(ctx, 490 + p * 215, 298 - p * 55, 30 + p * 180, '#c7f1ff', 3 + (1 - p) * 4, .8); ctx.restore(); }
    text(ctx, t < 113 ? 'ATÉ A LUA!' : 'VOLUME MÁXIMO', 608, 380, 37, '#e3f8ff', 470);
  }
}
function aneninha(ctx: CanvasRenderingContext2D, loser: CharId, t: number) {
  const dance = t >= 45; const n = Math.floor(t / 12) % 2;
  ctx.save(); ctx.globalAlpha = .2; text(ctx, 'BOLÍVIA', 480, 167, 100, '#f9d96e', 860); ctx.restore();
  if (dance) {
    for (let i = 0; i < 5; i++) {
      const x = 70 + i * 185 + Math.sin(t * .06 + i) * 20;
      drawBolivianDancer(ctx, x, 435, 1.04, t + i * 6, i % 2 === 1, i % 4);
    }
    confetti(ctx, t, ['#f45c65', '#fadd4f', '#5cdd8f', '#b68cff'], 80);
    for (let ribbon = 0; ribbon < 3; ribbon++) {
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) { const x = i * 12; const y = 250 + Math.sin(i * .12 + t * .06 + ribbon * 2) * (75 + ribbon * 12); if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.strokeStyle = ['#ef575a88', '#f9d95288', '#51c58c88'][ribbon]; ctx.lineWidth = 6; ctx.stroke();
    }
  }
  actor(ctx, 'aneninha', 310, FLOOR, t, dance ? n ? 'dance1' : 'dance2' : 'taunt', 1.65);
  actor(ctx, loser, 740 + (dance ? Math.sin(t * .1) * 30 : 0), FLOOR - (dance ? Math.abs(Math.sin(t * .13)) * 90 : 0), t, !dance ? 'idle' : t > 132 ? 'air' : n ? 'jump' : 'hit', 1.4, true);
  if (t > 95) text(ctx, 'YO SOY DE BOLIVIA!', 580, 126, 36, '#fff3a8', 650);
}

const SCENES: Record<ClassicChar, (ctx: CanvasRenderingContext2D, loser: CharId, time: number) => void> = { caetano, orango, tubarao, rickzera, bieu, nomad, renngotti, aneninha };

/** Cena em coordenadas de tela 960×540; t e duration são ticks do motor. */
export function drawFinisherArt(ctx:CanvasRenderingContext2D,winner:CharId,loser:CharId,t:number,duration:number):void {
  if(NEW_FIGHTERS.includes(winner as NewFighter)||winner==='bieu'||winner==='aneninha'){drawWocUltimate(ctx,winner,loser,t/duration*180,180,false,true);return;}
  if(winner==='jane'||winner==='cristyan'||winner==='eneas'){drawTrioFinisher(ctx,winner,loser,t,duration);return;}
  if(winner==='santox'||winner==='jao'){drawViewerFinisher(ctx,winner,loser,t,duration);return;}
  const time = clamp(t / Math.max(1, duration)) * 210;
  const phase = time < 44 ? 0 : time < 157 ? 1 : 2;
  const def = CHARS[winner];
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  background(ctx, winner, time);
  ctx.save();
  if (phase === 1) { const shake = Math.max(0, 1 - Math.abs(time - 113) / 24)*settings.shake; ctx.translate(Math.sin(time * 2.7) * shake * 4, Math.cos(time * 2.3) * shake * 3); }
  if (phase < 2) SCENES[winner as ClassicChar](ctx,loser,time);
  else {
    const p = smooth((time - 157) / 32);
    glow(ctx, 330, 315, 210, def.color, .28);
    actor(ctx, winner, 310 - p * 25, FLOOR, time, 'win', 1.75 + p * .1);
    actor(ctx, loser, 770, FLOOR + 1, time, 'down', 1.3, true); stars(ctx, 765, 376, time, '#ffdf8e');
    text(ctx, 'FINISH!', 660, 225, 78 + p * 8, def.glow, 470);
    text(ctx, `${def.short} VENCEU`, 660, 297, 27, '#fff5da', 465);
    confetti(ctx, time, [def.color, def.glow, '#ffe6a3'], 30);
  }
  ctx.restore();
  // Moldura de quadrinhos e legendas estáveis, separadas do movimento da câmera.
  ctx.fillStyle = '#080a12f2'; ctx.fillRect(0, 0, W, 78); ctx.fillRect(0, 474, W, 66);
  line(ctx, [{ x: 0, y: 77 }, { x: W, y: 77 }], def.glow, 2);
  line(ctx, [{ x: 0, y: 474 }, { x: W, y: 474 }], def.glow, 2);
  text(ctx, 'FINALIZAÇÃO', W / 2, 17, 12, '#f4d793', 650);
  text(ctx, FINISHER_NAMES[winner], W / 2, 49, 28, def.glow, 880);
  text(ctx, CAPTIONS[winner as ClassicChar][phase], W / 2, 499, 17, '#fff6e5', 880);
  text(ctx, phase === 0 ? 'PREPARE-SE' : phase === 1 ? 'GOLPE FINAL' : 'ESTILO ABSOLUTO', W / 2, 526, 10, '#9fa9be', 880);
  ctx.strokeStyle = '#080910'; ctx.lineWidth = 8; ctx.strokeRect(3, 3, W - 6, H - 6);
  ctx.restore();
}
