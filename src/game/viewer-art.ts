// Cenas e efeitos dos Viewers. Somente desenho; não alteram o combate.
import type { CharId } from './data';
import { drawFullBody, drawPortrait } from './rig';

type ViewerId = 'santox' | 'jao';
type P = { x: number; y: number };
const W = 960, H = 540, FLOOR = 452;
const FONT = "'Russo One', Impact, sans-serif";
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => 1 - (1 - clamp(n)) ** 3;
const seed = (n: number) => { const v = Math.sin(n * 113.1 + 63.7) * 43758.5453; return v - Math.floor(v); };
const norm = (t: number, dur: number) => clamp(t / Math.max(1, dur));

function line(ctx: CanvasRenderingContext2D, points: P[], color: string, width = 3) {
  ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
}
function poly(ctx: CanvasRenderingContext2D, points: P[], fill: string, stroke = '#1d1029', width = 2) {
  ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  if (width) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string, width = 2, rotation = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rotation, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
function ring(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, width = 3, oval = 1) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, radius), Math.max(.1, radius * oval), 0, 0, Math.PI * 2); ctx.strokeStyle = color; ctx.lineWidth = Math.max(.1, width); ctx.stroke();
}
function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color = '#fff', maxWidth = 860) {
  ctx.save(); ctx.font = `italic 900 ${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#100d1c'; ctx.lineWidth = Math.max(3, size * .12); ctx.strokeText(value, x, y, maxWidth); ctx.fillStyle = color; ctx.fillText(value, x, y, maxWidth); ctx.restore();
}
function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= clamp(alpha);
  const g = ctx.createRadialGradient(x, y, 1, x, y, Math.max(2, r)); g.addColorStop(0, '#fff'); g.addColorStop(.18, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function burst(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, angle = 0) {
  const pts: P[] = [];
  for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12 + angle, d = r * (i % 2 ? .37 : 1); pts.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d }); }
  poly(ctx, pts, color, '#fff5d8', 2);
}
function actor(ctx: CanvasRenderingContext2D, ch: CharId, x: number, y: number, t: number, pose = 'idle', scale = 1.5, flip = false, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= clamp(alpha); drawFullBody(ctx, ch, x, y, scale, t, pose, flip); ctx.restore();
}
function header(ctx: CanvasRenderingContext2D, title: string, subtitle: string, color: string) {
  ctx.fillStyle = '#080811e8'; ctx.fillRect(0, 0, W, 81); ctx.fillRect(0, 477, W, 63);
  line(ctx, [{ x: 10, y: 83 }, { x: 950, y: 83 }], color, 2); line(ctx, [{ x: 10, y: 475 }, { x: 950, y: 475 }], color, 2);
  text(ctx, title, 480, 42, 30, color, 870); text(ctx, subtitle, 480, 506, 20, '#fff0d6', 885);
}
function night(ctx: CanvasRenderingContext2D, color: string) {
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#100c20'); g.addColorStop(.6, color); g.addColorStop(1, '#080d19'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// A peça tem a mesma silhueta nos projéteis, no tabuleiro e nas cenas.
function chessPiece(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, kind: 'king' | 'pawn' | 'rook', dark = false, alpha = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size); ctx.globalAlpha *= alpha;
  const fill = dark ? '#2b2342' : '#e7e2ff', edge = dark ? '#b7a1e8' : '#67529a';
  ellipse(ctx, 0, 25, 21, 6, fill, edge, 1.5);
  poly(ctx, [{ x: -18, y: 23 }, { x: -16, y: 17 }, { x: -9, y: 12 }, { x: -6, y: -7 }, { x: 6, y: -7 }, { x: 9, y: 12 }, { x: 16, y: 17 }, { x: 18, y: 23 }], fill, edge, 1.5);
  ellipse(ctx, 0, 13, 10, 3.5, fill, edge, 1.2);
  if (kind === 'pawn') ellipse(ctx, 0, -12, 9, 9, fill, edge, 1.5);
  else if (kind === 'rook') {
    poly(ctx, [{ x: -11, y: -5 }, { x: -14, y: -23 }, { x: -8, y: -23 }, { x: -8, y: -17 }, { x: -3, y: -17 }, { x: -3, y: -23 }, { x: 3, y: -23 }, { x: 3, y: -17 }, { x: 8, y: -17 }, { x: 8, y: -23 }, { x: 14, y: -23 }, { x: 11, y: -5 }], fill, edge, 1.5);
  } else {
    ellipse(ctx, 0, -8, 10, 4, fill, edge, 1.2);
    poly(ctx, [{ x: -7, y: -9 }, { x: -10, y: -23 }, { x: -3, y: -26 }, { x: 3, y: -26 }, { x: 10, y: -23 }, { x: 7, y: -9 }], fill, edge, 1.4);
    line(ctx, [{ x: 0, y: -24 }, { x: 0, y: -38 }], edge, 7); line(ctx, [{ x: -7, y: -32 }, { x: 7, y: -32 }], edge, 6);
    line(ctx, [{ x: 0, y: -24 }, { x: 0, y: -37 }], fill, 4); line(ctx, [{ x: -6, y: -32 }, { x: 6, y: -32 }], fill, 3.5);
  }
  line(ctx, [{ x: -13, y: 21 }, { x: 10, y: 21 }], dark ? '#5e4a80' : '#fff', 2);
  ctx.restore();
}
function basketball(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rotation = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
  ellipse(ctx, 0, 0, r, r, '#ed852f', '#482234', Math.max(1.5, r * .09));
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
  ellipse(ctx, -r * .37, -r * .3, r * .7, r * .7, '#f6ae51');
  line(ctx, [{ x: -r, y: -r * .12 }, { x: r, y: r * .12 }], '#5b2933', Math.max(1.2, r * .07));
  line(ctx, [{ x: r * .12, y: -r }, { x: -r * .12, y: r }], '#5b2933', Math.max(1.2, r * .07));
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * r * .55, -r); ctx.bezierCurveTo(-side * r * .4, -r * .3, -side * r * .4, r * .3, side * r * .55, r); ctx.strokeStyle = '#5b2933'; ctx.lineWidth = Math.max(1.2, r * .07); ctx.stroke(); }
  ctx.restore(); ctx.restore();
}

/** Desenho em coordenadas locais; o motor escolhe posição, colisão e duração. */
export function drawViewerProjectile(ctx: CanvasRenderingContext2D, kind: 'formula' | 'basketball' | 'chess', time: number): void {
  ctx.save();
  if (kind === 'basketball') { glow(ctx, 0, 0, 40, '#fb923c', .4); basketball(ctx, 0, 0, 19, time * .14); }
  else if (kind === 'chess') { glow(ctx, 0, 0, 46, '#c4b5fd', .45); chessPiece(ctx, 0, 4, .85, 'rook', false); }
  else {
    const a = time * .07; ring(ctx, 0, 0, 25, '#aaa1ff80', 2); ring(ctx, 0, 0, 17, '#f2e8ff70', 1);
    text(ctx, ['Σ', 'π', '∞'][Math.floor(time / 9) % 3], 0, 0, 34, '#e4ddff', 45);
    for (let i = 0; i < 3; i++) ellipse(ctx, Math.cos(a + i * 2.1) * 28, Math.sin(a + i * 2.1) * 20, 2, 2, '#fff');
  }
  ctx.restore();
}

/** Tabuleiro limitado, centrado na zona de controle junto ao chão. */
export function drawChessFloor(ctx: CanvasRenderingContext2D, width: number, time: number): void {
  ctx.save(); const half = width / 2, rows = 3, cols = 6;
  ctx.globalAlpha *= .68;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const x0 = -half + width * x / cols, x1 = -half + width * (x + 1) / cols, y0 = -13 + y * 9;
    poly(ctx, [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1 + 8, y: y0 + 9 }, { x: x0 + 8, y: y0 + 9 }], (x + y) % 2 ? '#1e1939' : '#bcb1f9', '#c9b5ff', .7);
  }
  ctx.globalAlpha *= .8 + Math.sin(time * .15) * .18;
  line(ctx, [{ x: -half, y: -16 }, { x: half, y: -16 }], '#e9d5ff', 2);
  chessPiece(ctx, -half + 13, -14, .4, 'rook', true); chessPiece(ctx, half - 13, -14, .4, 'rook');
  ctx.restore();
}

function portal(ctx: CanvasRenderingContext2D, t: number, strength = 1) {
  ctx.save(); ctx.translate(682, 273);
  for (let i = 10; i >= 0; i--) {
    const p = ((i / 10 + t * .002) % 1), r = 18 + p * 250;
    ctx.save(); ctx.rotate(t * .006 + i * .17); ctx.globalAlpha *= (1 - p) * .6 * strength;
    ctx.strokeStyle = i % 2 ? '#ff4fd8' : '#e5b4ff'; ctx.lineWidth = 2 + p * 4; ctx.strokeRect(-r, -r * .7, r * 2, r * 1.4); ctx.restore();
  }
  glow(ctx, 0, 0, 125, '#d946ef', .5 * strength); ctx.restore();
}
function eye(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, t: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * .03 + x) * .3);
  const blink = Math.sin(t * .055 + x * .1) > .97 ? .14 : 1;
  ellipse(ctx, 0, 0, size, size * .46 * blink, '#f6de68', '#d946ef', 2); ellipse(ctx, Math.sin(t * .03) * size * .25, 0, size * .17, size * .39 * blink, '#10071e'); ctx.restore();
}
function abstraction(ctx: CanvasRenderingContext2D, t: number, strength: number) {
  ctx.save(); ctx.translate(290, 418); ctx.scale(strength, strength);
  // Uma massa de desenho impossível, ainda com as duas orelhas reconhecíveis.
  ctx.fillStyle = '#0b0715'; ctx.strokeStyle = '#e879f9'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-73, 0); ctx.bezierCurveTo(-101, -53, -40, -80, -66, -132); ctx.bezierCurveTo(-119, -208, -113, -285, -84, -292);
  ctx.bezierCurveTo(-49, -294, -78, -214, -20, -190); ctx.bezierCurveTo(1, -231, 15, -309, 46, -301); ctx.bezierCurveTo(80, -289, 18, -212, 65, -176);
  ctx.bezierCurveTo(126, -152, 85, -66, 118, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const y = -45 - i * 35, reach = 170 + Math.sin(t * .04 + i * 1.2) * 32;
    ctx.beginPath(); ctx.moveTo(35, y); ctx.bezierCurveTo(100, y - 95, reach, y + 50, reach + 45, y - 18);
    ctx.strokeStyle = '#e879f9'; ctx.lineWidth = 29; ctx.stroke(); ctx.strokeStyle = '#10071e'; ctx.lineWidth = 25; ctx.stroke();
    eye(ctx, reach - 10, y - 3, 14, t + i * 9);
  }
  for (let i = 0; i < 7; i++) eye(ctx, -42 + (i % 3) * 45, -65 - Math.floor(i / 3) * 59, 15 + i % 2 * 3, t + i * 4);
  ctx.restore();
}
function comicNoise(ctx: CanvasRenderingContext2D, t: number) {
  for (let i = 0; i < 18; i++) {
    const y = 90 + seed(i + Math.floor(t / 7)) * 380, x = seed(i * 3 + Math.floor(t / 8)) * W;
    ctx.fillStyle = i % 2 ? '#ed4add25' : '#8be8ff25'; ctx.fillRect(x, y, 20 + seed(i + 3) * 160, 2 + i % 3 * 2);
  }
}
function chessBoard(ctx: CanvasRenderingContext2D, t: number) {
  const horizon = 228, bottom = 472, vanishX = 515;
  const rows = [horizon, 236, 249, 269, 300, 345, 405, bottom];
  for (let row = 0; row < rows.length - 1; row++) {
    const y0 = rows[row], y1 = rows[row + 1], s0 = (y0 - horizon + 16) / 260, s1 = (y1 - horizon + 16) / 260;
    for (let col = -5; col < 6; col++) {
      const a = col * 180, b = (col + 1) * 180;
      poly(ctx, [{ x: vanishX + a * s0, y: y0 }, { x: vanishX + b * s0, y: y0 }, { x: vanishX + b * s1, y: y1 }, { x: vanishX + a * s1, y: y1 }], (col + row) % 2 ? '#342b52' : '#b4afcb', '#cab5ff35', .6);
    }
  }
  for (let i = 0; i < 9; i++) {
    const x = 50 + i * 108, y = 159 + Math.sin(t * .025 + i) * 15;
    chessPiece(ctx, x, y + 40, .5 + (i % 3) * .12, i % 3 === 0 ? 'king' : i % 3 === 1 ? 'rook' : 'pawn', i % 2 === 0, .22);
  }
  glow(ctx, 515, horizon, 180, '#c4b5fd', .24);
}
function formulaOrbit(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, radius: number, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha;
  const symbols = ['Σ', 'π', '∞', '√', 'Δ', '∫'];
  for (let i = 0; i < symbols.length; i++) { const a = i * Math.PI / 3 + t * .018; text(ctx, symbols[i], x + Math.cos(a) * radius, y + Math.sin(a) * radius * .63, 25 + i % 2 * 6, '#e2d7ff', 65); }
  ctx.restore();
}

function santoxSuper(ctx: CanvasRenderingContext2D, loser: CharId, t: number, u: number) {
  night(ctx, '#491260'); portal(ctx, t); comicNoise(ctx, t);
  if (u < .25) {
    actor(ctx, 'santox', 280 + ease(u / .2) * 50, FLOOR, t, u < .12 ? 'fourth_s' : 'abstract_s', 1.48);
    actor(ctx, loser, 720, FLOOR, t, 'block', 1.42, true);
    if (u > .12) { const a = ease((u - .12) / .13); glow(ctx, 330, 278, 65 + a * 110, '#e879f9', a); }
  } else {
    const growth = .7 + ease((u - .25) / .15) * .39; abstraction(ctx, t, growth);
    const pull = ease((u - .36) / .22), fling = ease((u - .69) / .22);
    const x = 720 - pull * 85 + fling * 155, y = FLOOR - pull * 110 + fling * 45;
    ctx.save(); ctx.translate(x, y); ctx.rotate(fling * .7); actor(ctx, loser, 0, 0, t, u < .36 ? 'hit' : 'air', 1.42 - fling * .6, true); ctx.restore();
    if (u > .37 && u < .75) { ring(ctx, x, y - 100, 55 + Math.sin(t * .2) * 7, '#f5b1ff', 3, 1.6); eye(ctx, x, y - 100, 18, t); }
    if (u > .68) { const hit = clamp((u - .68) / .12); glow(ctx, 702, 285, 50 + hit * 155, '#e879f9', Math.sin(hit * Math.PI) * .9); burst(ctx, 715, 290, 60 + hit * 65, '#d946ef80', t * .01); }
    if (u > .89) actor(ctx, 'santox', 295, FLOOR, t, 'fourth_a', 1.5);
  }
  header(ctx, 'ABSTRAÇÃO', u < .25 ? 'O sorriso saiu do enquadramento.' : u < .7 ? 'A realidade perdeu a hitbox!' : 'De volta à arena. Talvez.', '#efa5ff');
}
function jaoSuper(ctx: CanvasRenderingContext2D, loser: CharId, t: number, u: number) {
  night(ctx, '#302a54'); chessBoard(ctx, t);
  const launch = ease((u - .53) / .19), impact = clamp((u - .72) / .12);
  actor(ctx, 'jao', 280, FLOOR, t, u < .24 ? 'chess_a' : u < .53 ? 'calculation_a' : 'ball_a', 1.53);
  actor(ctx, loser, 720 + impact * 43, FLOOR - Math.sin(impact * Math.PI) * 100, t, u < .31 ? 'block' : impact > .94 ? 'down' : 'hit', 1.43, true);
  if (u > .17) {
    const appear = ease((u - .17) / .12);
    ring(ctx, 715, 445, 80 * appear, '#f0d5ff', 3, .22);
    chessPiece(ctx, 622, 429, .96 * appear, 'rook'); chessPiece(ctx, 816, 429, .96 * appear, 'rook', true);
    for (let i = 0; i < 5; i++) { const y = 345 - i * 28; line(ctx, [{ x: 633, y }, { x: 798, y }], '#c4b5fd50', 1.8); }
  }
  if (u > .25 && u < .74) formulaOrbit(ctx, 450, 282, t, 105, clamp((u - .25) / .1));
  if (u > .45 && u < .77) {
    const x = 400 + launch * 310, y = 315 - Math.sin(launch * Math.PI) * 112;
    for (let i = 5; i >= 1; i--) { ctx.save(); ctx.globalAlpha = (6 - i) * .09; basketball(ctx, x - i * 16, y + i * 5, 20 + i, t * .16); ctx.restore(); }
    glow(ctx, x, y, 65, '#fb923c', .6); basketball(ctx, x, y, 29, t * .16);
  }
  if (u > .72) {
    glow(ctx, 715, 310, 60 + impact * 150, '#e9d5ff', (1 - impact) * .8);
    if (impact < .9) { burst(ctx, 715, 310, 35 + impact * 95, '#fbba68', t * .01); text(ctx, 'XEQUE!', 697, 147, 35, '#fff3a4', 370); }
    chessPiece(ctx, 523, 380, 2.4, 'king', false, .3 + impact * .4);
  }
  header(ctx, 'CHESS IS LIFE', u < .26 ? 'Cada passo entra no cálculo.' : u < .7 ? 'Xadrez, matemática e uma bola de basquete.' : 'A resposta estava na última jogada.', '#e8ddff');
}

/** Cena completa de Ultimate, sem fazer qualquer alteração nas entidades. */
export function drawViewerSuper(ctx: CanvasRenderingContext2D, ch: ViewerId, loser: CharId, t: number, dur: number): void {
  ctx.save(); const u = norm(t, dur); if (ch === 'santox') santoxSuper(ctx, loser, t, u); else jaoSuper(ctx, loser, t, u); ctx.restore();
}

function filmFrame(ctx: CanvasRenderingContext2D, t: number) {
  for (const x of [15, 927]) for (let i = 0; i < 13; i++) { ctx.fillStyle = '#eed9ff80'; ctx.fillRect(x, 86 + ((i * 31 + t * .5) % 390), 15, 11); }
  line(ctx, [{ x: 43, y: 86 }, { x: 43, y: 472 }], '#e879f950', 1); line(ctx, [{ x: 917, y: 86 }, { x: 917, y: 472 }], '#e879f950', 1);
}
function santoxFinisher(ctx: CanvasRenderingContext2D, loser: CharId, t: number, u: number) {
  night(ctx, '#4d185b'); filmFrame(ctx, t); portal(ctx, t, .8); comicNoise(ctx, t);
  if (u < .27) {
    actor(ctx, 'santox', 285, FLOOR, t, 'fourth_a', 1.48); actor(ctx, loser, 713, FLOOR, t, 'idle', 1.45, true);
    ctx.save(); ctx.globalAlpha = .35; drawPortrait(ctx, 'santox', 492, 205, 92, { time: t, poseName: 'fourth_a' }); ctx.restore();
    text(ctx, 'CORTA!', 703, 168, 38, '#fff2a3', 285);
  } else if (u < .73) {
    const p = clamp((u - .27) / .46), stretch = ease(p / .28), yank = ease((p - .6) / .3);
    actor(ctx, 'santox', 260, FLOOR, t, 'elastic_a', 1.5);
    const handX = 390 + stretch * 330 - yank * 130, handY = 315 - Math.sin(p * Math.PI) * 70;
    ctx.beginPath(); ctx.moveTo(325, 303); ctx.bezierCurveTo(415, 360 + Math.sin(t * .2) * 28, handX - 80, handY - 30, handX, handY); ctx.strokeStyle = '#241038'; ctx.lineWidth = 28; ctx.stroke(); ctx.strokeStyle = '#a651db'; ctx.lineWidth = 20; ctx.stroke();
    ellipse(ctx, handX, handY, 25, 19, '#f8d963', '#42203c', 3, -.2);
    actor(ctx, loser, 718 - yank * 150, FLOOR - stretch * 45 - yank * 100, t, p < .3 ? 'hit' : 'grabbed', 1.4, true);
    if (p > .25) { burst(ctx, handX + 23, handY, 32 + Math.sin(t * .16) * 5, '#f9e99390'); text(ctx, 'A QUARTA PAREDE PEDIU DEMISSÃO', 522, 131, 22, '#f6b5ff', 800); }
  } else {
    const out = ease((u - .73) / .16); abstraction(ctx, t, .78);
    if (out < .98) actor(ctx, loser, 565 + out * 197, 313 + out * 105, t, 'air', 1.4 - out * .9, true);
    else actor(ctx, loser, 755, FLOOR, t, 'down', 1.28, true);
    actor(ctx, 'santox', 294, FLOOR, t, 'fourth_a', 1.5);
    if (u > .86) text(ctx, 'FIM DO EPISÓDIO', 665, 184, 30, '#fff1ad', 465);
  }
  header(ctx, 'FORA DO ROTEIRO', u < .27 ? 'Ele acabou de olhar para você.' : u < .73 ? 'Este golpe não estava no roteiro!' : 'Até a câmera pediu revanche.', '#f5b7ff');
}
function jaoFinisher(ctx: CanvasRenderingContext2D, loser: CharId, t: number, u: number) {
  night(ctx, '#282b4c'); chessBoard(ctx, t);
  const setup = ease(u / .2), fire = ease((u - .4) / .23), hit = ease((u - .65) / .16);
  actor(ctx, 'jao', 265, FLOOR, t, u < .27 ? 'calculation_s' : u < .43 ? 'math_a' : u < .75 ? 'ball_a' : 'win', 1.5);
  actor(ctx, loser, 707 + hit * 65, FLOOR - Math.sin(hit * Math.PI) * 95, t, hit > .97 ? 'down' : u < .3 ? 'block' : 'hit', 1.42, true);
  for (let i = 0; i < 4; i++) {
    const x = 590 + (i % 2) * 225, y = 412 - Math.floor(i / 2) * 47;
    chessPiece(ctx, x, y, setup * .92, i < 2 ? 'rook' : 'pawn', i % 2 === 1);
    if (u > .24 && u < .65) { line(ctx, [{ x, y: y - 30 }, { x: 707, y: 290 }], '#d7b5ff55', 2); ring(ctx, 707, 444, 85, '#d9b6ff', 2, .25); }
  }
  if (u > .18 && u < .7) formulaOrbit(ctx, 440, 290, t, 115, .8);
  if (u > .35 && u < .69) {
    const x = 376 + fire * 330, y = 303 - Math.sin(fire * Math.PI) * 149;
    line(ctx, [{ x: 386, y: 303 }, { x: x - 15, y: y + 5 }], '#fb923c35', 30);
    glow(ctx, x, y, 70, '#fb923c', .55); basketball(ctx, x, y, 34, t * .17);
  }
  if (u > .65 && u < .84) { burst(ctx, 710, 297, 35 + hit * 125, '#e8d4ff', t * .01); glow(ctx, 710, 297, 120, '#c4b5fd', 1 - hit); }
  if (u > .78) {
    const end = ease((u - .78) / .13); chessPiece(ctx, 496, 398, end * 2.35, 'king', false, .87);
    text(ctx, 'XEQUE-MATE', 663, 163, 36, '#f6df9b', 465); text(ctx, '1 — 0', 495, 441, 20, '#d5c9ff', 140);
  } else text(ctx, u < .27 ? 'LER O TABULEIRO' : u < .43 ? 'CALCULAR O IMPACTO' : 'EXECUTAR A JOGADA', 504, 132, 23, '#e6d8ff', 780);
  header(ctx, 'XEQUE-MATE ABSOLUTO', u < .27 ? 'Já estava calculado três rounds atrás.' : u < .68 ? 'Uma combinação com precisão de campeão.' : 'Última jogada. Sorriso de quem sabia.', '#e4ddff');
}

/** Finalizações com entrada, golpe e pose de vitória próprias. */
export function drawViewerFinisher(ctx: CanvasRenderingContext2D, ch: ViewerId, loser: CharId, t: number, dur: number): void {
  ctx.save(); const u = norm(t, dur); if (ch === 'santox') santoxFinisher(ctx, loser, t, u); else jaoFinisher(ctx, loser, t, u); ctx.restore();
}

/** Close na câmera em um quadro translúcido; a arena segue visível e ativa. */
export function drawFourthWall(ctx: CanvasRenderingContext2D, t: number, dur: number): void {
  const u = norm(t, dur), alpha = Math.min(1, u * 7, (1 - u) * 7); if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  const x = 329, y = 105, width = 302, height = 157;
  ctx.fillStyle = '#230c36b8'; ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = '#f0abfc'; ctx.lineWidth = 2; ctx.strokeRect(x, y, width, height);
  ctx.save(); ctx.beginPath(); ctx.rect(x + 2, y + 2, width - 4, height - 4); ctx.clip();
  const zoom = ease(u / .45); drawPortrait(ctx, 'santox', 479, 176 + zoom * 5, 50 + zoom * 36, { time: t, poseName: 'fourth_a' });
  for (let i = 0; i < 4; i++) { const yy = y + 10 + ((t * 2 + i * 41) % height); ctx.fillStyle = '#e879f91a'; ctx.fillRect(x, yy, width, 3); }
  ctx.restore();
  for (const a of [-1, 1]) for (const b of [-1, 1]) { const xx = 480 + a * 139, yy = 183 + b * 67; line(ctx, [{ x: xx, y: yy - b * 12 }, { x: xx, y: yy }, { x: xx - a * 15, y: yy }], '#ffe699', 2); }
  text(ctx, 'QUEBRANDO A QUARTA PAREDE', 480, 277, 15, '#f7d5ff', 380);
  text(ctx, 'VOCÊ VIU ISSO?', 480, 117, 11, '#fff3a3', 255); ctx.restore();
}
