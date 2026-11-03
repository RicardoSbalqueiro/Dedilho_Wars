// Renderização: mundo, personagens, efeitos, HUD e cinemáticas dos supers.
import type { Game, Fighter, Particle } from './engine';
import { settings } from './engine';
import { Stage, W, H, FLOOR_Y } from './stage';
import { drawRig, drawPortrait, drawHead } from './rig';
import { keyLabel } from './input';

const FONT = "'Russo One','Impact','Arial Black','Segoe UI',sans-serif";

export function label(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, fill: string | CanvasGradient, stroke?: string, align: CanvasTextAlign = 'left', skew = -0.18, lw = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, skew, 1, 0, 0);
  ctx.font = `italic 900 ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (stroke) {
    ctx.lineWidth = lw || size * 0.14;
    ctx.strokeStyle = stroke;
    ctx.lineJoin = 'round';
    ctx.strokeText(s, 0, 0);
  }
  ctx.fillStyle = fill;
  ctx.fillText(s, 0, 0);
  ctx.restore();
}

const hs = (i: number, t: number) => Math.abs(Math.sin(i * 91.7 + t * 17.3));

function speedLines(ctx: CanvasRenderingContext2D, amt: number, color: string, tick: number, cx = W / 2, cy = H / 2) {
  const t = Math.floor(tick / 2);
  ctx.save();
  ctx.globalAlpha = Math.min(1, amt) * 0.6;
  ctx.strokeStyle = color;
  for (let i = 0; i < 50; i++) {
    const ang = (i / 50) * Math.PI * 2 + hs(i, t) * 0.05;
    const r0 = 220 + hs(i + 3, t) * 200;
    const r1 = r0 + 140 + hs(i + 9, t) * 260;
    ctx.lineWidth = 1 + hs(i + 5, t) * 3;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0 * 0.7);
    ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1 * 0.7);
    ctx.stroke();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ efeitos nos personagens
function spear(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, w: number, color: string) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, color + '55');
  g.addColorStop(0.7, color);
  g.addColorStop(1, '#ffffff');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x0, y0 - w / 2);
  ctx.lineTo(x1, y0);
  ctx.lineTo(x0, y0 + w / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(x0, y0 - w * 0.15);
  ctx.lineTo(x1, y0);
  ctx.lineTo(x0, y0 + w * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function orb(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.3, color);
  g.addColorStop(1, color + '00');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFx(ctx: CanvasRenderingContext2D, g: Game, f: Fighter, time: number) {
  const m = f.move;
  const p = f.rig.p;
  const col = f.def.color;
  const glow = f.def.glow;
  if (f.state === 'attack' && m) {
    const t = f.moveT;
    if (m.id === 's2' && f.ch === 'caetano' && t >= 2 && t < m.startup + m.active + 4) {
      spear(ctx, p.wF.x + 6, p.wF.y, Math.min(m.hb[1] + 20, p.wF.x + 150), 14, '#c084fc');
      orb(ctx, p.wF.x + 22, p.wF.y, 20 + Math.sin(time) * 3, '#e9d5ff');
    }
    if (m.id === 's1' && f.ch === 'orango') {
      if (t < m.startup) orb(ctx, p.wF.x + 28, p.wF.y, 8 + 36 * (t / m.startup), '#ff3b2f');
      else if (t < m.startup + m.active + 5) {
        spear(ctx, p.wF.x + 20, p.wF.y, m.hb[1] + 30, 40, '#ff2a2a');
        orb(ctx, p.wF.x + 40, p.wF.y, 50, '#ff7a5c');
      }
    }
    if (m.id === 's3' && f.ch === 'caetano') {
      if (t < m.startup) orb(ctx, p.wB.x, p.wB.y, 6 + 34 * (t / m.startup), '#c084fc', 0.6 + 0.4 * (t / m.startup));
      else if (t < m.startup + m.active + 6) orb(ctx, p.wB.x + 8, p.wB.y, 60, '#e9d5ff');
    }
    if (m.id === 's1' && f.ch === 'caetano' && t >= m.startup - 3 && t < m.startup + m.active + 4) {
      // arco de energia do chute giratório
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(p.hip.x, p.hip.y - 10, 100, -Math.PI * 0.7, Math.PI * 0.1);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(p.hip.x, p.hip.y - 10, 100, -Math.PI * 0.6, Math.PI * 0.05);
      ctx.stroke();
      ctx.restore();
    }
    if (f.ch === 'tubarao') {
      if (m.id === 's1' || m.id === 's2') {
        ctx.save();
        ctx.strokeStyle = '#a5f3fc';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        for (let i = 0; i < 5; i++) {
          const u = ((time * 0.04 + i * 0.23) % 1);
          ctx.beginPath();
          ctx.arc(p.head.x + 25 + u * 85, p.head.y - 8 + Math.sin(i * 2 + time * 0.1) * 28, 3 + u * 6, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
      if (m.id === 's3') {
        spear(ctx, p.head.x - 55, p.head.y + 15, p.head.x + 60, 55, '#67e8f9');
        orb(ctx, p.head.x, p.head.y + 15, 58, '#06b6d4', 0.4);
      }
    }
    if (f.ch === 'rickzera') {
      if (m.id === 's1' || m.id === 's2') orb(ctx, p.wF.x, p.wF.y, 22 + Math.sin(time * 0.3) * 5, glow, 0.7);
      if (m.id === 's3') {
        ctx.save();
        ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.ellipse(p.aF.x - 20, p.aF.y + 15, 48, 14, -0.2, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    }
    if (m.kind === 'super' && t % 2 === 0) orb(ctx, p.hip.x - 20, p.hip.y - 30, 70, glow, 0.5);
  }
  const s = g.seq;
  if (s && s.a === f) {
    const t = s.t;
    if (s.kind === 'puxao' && t < 30) {
      // tecido do kimono agarrado
      const hx = p.wF.x + 14;
      const hy = p.wF.y + 4;
      ctx.fillStyle = '#f6f3fd';
      ctx.strokeStyle = '#1a1024';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(hx, hy - 6 + i * 4);
        ctx.lineTo(hx + 22 + i * 4, hy - 16 + i * 9 + Math.sin(time * 0.8 + i) * 3);
        ctx.lineTo(hx + 8, hy + 8 + i * 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#7c5650';
      ctx.beginPath();
      ctx.arc(hx - 2, hy, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    if (s.kind === 'engole' && t > 20 && t < 65) {
      orb(ctx, p.hip.x + 12, p.hip.y - 26, 65, '#67e8f9', 0.3);
    }
    if (s.kind === 'superT') {
      const pulse = 1 + Math.sin(t * 0.13) * 0.15;
      heart(ctx, p.head.x + 48, p.head.y - 12, 18 * pulse, '#f472b6');
      if (t > 40) {
        heart(ctx, p.head.x + 75, p.head.y - 55, 11, '#fbcfe8');
        heart(ctx, p.head.x + 20, p.head.y - 75, 8, '#f9a8d4');
      }
    }
    if (s.kind === 'superR') {
      orb(ctx, p.wF.x, p.wF.y, 38, '#86efac', 0.65);
      if (t > 20 && t < 120) {
        spear(ctx, p.wF.x, p.wF.y, p.wF.x + 130, 18, '#4ade80');
      }
    }
    if (s.kind === 'superO') {
      if (t >= 104 && t < 150) orb(ctx, p.wF.x + 36, p.wF.y, 10 + (t - 104) * 1.8, '#ff2a2a', 0.9);
      if (t >= 150 && t < 176) {
        const k = Math.min(1, (t - 150) / 4);
        const fade = t > 168 ? 1 - (t - 168) / 8 : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, fade);
        spear(ctx, p.wF.x + 20, p.wF.y, 1100, 150 * k, '#ff2a2a');
        orb(ctx, p.wF.x + 40, p.wF.y, 110 * k, '#ff9a80');
        ctx.restore();
      }
    }
    if (s.kind === 'superC' && t >= 128 && t < 160) {
      const k = t < 139 ? (t - 128) / 11 : 1;
      const fade = t > 152 ? 1 - (t - 152) / 8 : 1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, fade) * Math.min(1, k + 0.2);
      ctx.globalCompositeOperation = 'lighter';
      const hx = p.hip.x;
      const hy = p.hip.y;
      const ang = Math.atan2(p.aF.y - hy, p.aF.x - hx);
      const len = 380;
      ctx.translate(hx, hy);
      ctx.rotate(ang);
      const gr = ctx.createLinearGradient(0, 0, len, 0);
      gr.addColorStop(0, '#7e22ce');
      gr.addColorStop(0.6, '#c084fc');
      gr.addColorStop(1, '#ffffff');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.quadraticCurveTo(len * 0.5, -60 * k, len, -34);
      ctx.quadraticCurveTo(len + 40, 0, len, 34);
      ctx.quadraticCurveTo(len * 0.5, 60 * k, 0, 26);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha *= 0.7;
      ctx.beginPath();
      ctx.ellipse(len * 0.55, 0, len * 0.45, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  void col;
}

function drawAura(ctx: CanvasRenderingContext2D, f: Fighter, time: number) {
  const a = f.aura;
  if (a <= 0.02) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const r = (110 + Math.sin(time * 0.4) * 10) * (0.7 + a * 0.5);
  const g = ctx.createRadialGradient(0, -85, 10, 0, -85, r);
  g.addColorStop(0, f.def.glow + 'aa');
  g.addColorStop(0.5, f.def.color + '66');
  g.addColorStop(1, f.def.color + '00');
  ctx.globalAlpha = Math.min(1, a);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, -85, r, 0, Math.PI * 2);
  ctx.fill();
  // chamas
  ctx.fillStyle = f.def.color;
  for (let i = 0; i < 9; i++) {
    const x = (i - 4) * 12;
    const h = 60 + hs(i, Math.floor(time / 2)) * 90;
    ctx.globalAlpha = a * 0.5;
    ctx.beginPath();
    ctx.moveTo(x - 9, 0);
    ctx.quadraticCurveTo(x - 4, -h * 0.6, x + hs(i + 2, Math.floor(time / 2)) * 14 - 7, -h);
    ctx.quadraticCurveTo(x + 4, -h * 0.5, x + 9, 0);
    ctx.fill();
  }
  ctx.restore();
}

function drawTrail(ctx: CanvasRenderingContext2D, f: Fighter) {
  const tr = f.trail;
  if (tr.length < 2) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i < tr.length; i++) {
      const u = i / tr.length;
      ctx.strokeStyle = pass ? '#ffffff' : f.def.color;
      ctx.globalAlpha = u * (pass ? 0.7 : 0.9);
      ctx.lineWidth = (pass ? 3 : 14) * u + 1;
      ctx.beginPath();
      ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
      ctx.lineTo(tr[i].x, tr[i].y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFighter(ctx: CanvasRenderingContext2D, g: Game, f: Fighter, time: number, reflect = false) {
  if (f.hidden) return;
  ctx.save();
  ctx.translate(f.x, FLOOR_Y + f.y);
  ctx.scale(f.facing * f.turn, 1);
  if (f.rotAdd) {
    ctx.translate(0, -70);
    ctx.rotate(f.rotAdd);
    ctx.translate(0, 70);
  }
  if (!reflect) drawAura(ctx, f, time);
  drawRig(ctx, f.ch, f.rig, f.pose, { time, expr: f.expr, glow: f.glow, glowColor: f.def.glow });
  if (!reflect) drawFx(ctx, g, f, time);
  ctx.restore();
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 20, size / 20);
  ctx.beginPath(); ctx.moveTo(0, 16);
  ctx.bezierCurveTo(-32, -2, -19, -28, 0, -10);
  ctx.bezierCurveTo(19, -28, 32, -2, 0, 16);
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 14; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
}

function drawProjectiles(ctx: CanvasRenderingContext2D, g: Game) {
  for (const shot of g.projectiles) {
    const facing = shot.vx >= 0 ? 1 : -1;
    ctx.save(); ctx.translate(shot.x, FLOOR_Y + shot.y); ctx.scale(facing, 1);
    const tail = ctx.createLinearGradient(-85, 0, 10, 0);
    tail.addColorStop(0, '#22c55e00'); tail.addColorStop(1, '#86efacbb');
    ctx.fillStyle = tail; ctx.fillRect(-85, -8, 85, 16);
    if (shot.kind === 'franco') {
      ctx.rotate(Math.sin(g.tick * 0.3) * 0.15);
      ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 15;
      ctx.fillStyle = '#dbeafe'; ctx.strokeStyle = '#15803d'; ctx.lineWidth = 2;
      ctx.fillRect(-22, -12, 44, 24); ctx.strokeRect(-22, -12, 44, 24);
      ctx.shadowBlur = 0; ctx.fillStyle = '#64748b';
      ctx.beginPath(); ctx.ellipse(-5, 0, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#dc2626'; ctx.fillRect(10, -9, 9, 9);
      ctx.fillStyle = '#fff'; ctx.fillRect(14, -8, 2, 7); ctx.fillRect(11, -5, 7, 2);
      ctx.fillStyle = '#0f172a'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('100', -20, 8);
    } else {
      ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 18;
      ctx.strokeStyle = '#86efac'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
      for (const dx of [-10, 10]) {
        ctx.beginPath(); ctx.moveTo(dx, -17); ctx.lineTo(dx + 17, 0);
        ctx.lineTo(dx, 17); ctx.lineTo(dx - 17, 0); ctx.closePath(); ctx.stroke();
      }
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-38, 0); ctx.lineTo(35, 0); ctx.stroke();
    }
    ctx.restore();
  }
}

// ------------------------------------------------------------------ partículas
function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const a = Math.max(0, p.life / p.max);
  ctx.save();
  switch (p.type) {
    case 'spark':
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, p.size);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 1.8, p.y - p.vy * 1.8);
      ctx.stroke();
      break;
    case 'dust':
      ctx.globalAlpha = a * 0.45;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'ring':
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, p.rot * a);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size, p.size * 0.8, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'streak':
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - Math.cos(p.rot) * p.size, p.y - Math.sin(p.rot) * p.size);
      ctx.stroke();
      break;
    case 'glow': {
      const r = p.size * (1 + (1 - a) * 0.4);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, p.color);
      g.addColorStop(1, p.color + '00');
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'leaf':
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot + p.y * 0.03);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'text': {
      const sc = 1 + (1 - a) * 0.3;
      ctx.globalAlpha = Math.min(1, a * 2);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(sc, sc);
      label(ctx, p.text || '', 0, 0, p.size, p.color, '#1a0a20', 'center');
      break;
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ HUD
function para(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, sk = 14) {
  ctx.beginPath();
  ctx.moveTo(x + sk, y);
  ctx.lineTo(x + w + sk, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

function drawBar(ctx: CanvasRenderingContext2D, g: Game, f: Fighter, side: 0 | 1) {
  const barW = 350;
  const y = 22;
  const h = 26;
  const x0 = side === 0 ? 62 : 548;
  const ratio = Math.max(0, f.hp / f.maxHp);
  const disp = Math.max(ratio, f.dispHp / f.maxHp);
  ctx.save();
  if (side === 1) {
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
  }
  const bx = side === 0 ? x0 : W - x0 - barW;
  // fundo
  para(ctx, bx, y, barW, h);
  ctx.fillStyle = 'rgba(10,6,16,0.85)';
  ctx.fill();
  ctx.save();
  para(ctx, bx, y, barW, h);
  ctx.clip();
  // dano recente (branco)
  ctx.fillStyle = '#fff3c4';
  ctx.fillRect(bx + barW - barW * disp, y, barW * disp + 20, h);
  // vida
  const gr = ctx.createLinearGradient(0, y, 0, y + h);
  const low = ratio < 0.25;
  if (f.ch === 'caetano') {
    gr.addColorStop(0, low ? '#ff9ab0' : '#e9b5ff');
    gr.addColorStop(0.5, low ? '#ef4444' : '#a855f7');
    gr.addColorStop(1, low ? '#7f1d1d' : '#5b21b6');
  } else if (f.ch === 'orango') {
    gr.addColorStop(0, low ? '#ffe28a' : '#ffb27a');
    gr.addColorStop(0.5, low ? '#ef4444' : '#ef4a2a');
    gr.addColorStop(1, '#7f1d1d');
  } else {
    gr.addColorStop(0, low ? '#fda4af' : f.def.glow);
    gr.addColorStop(0.5, low ? '#ef4444' : f.def.color);
    gr.addColorStop(1, low ? '#7f1d1d' : f.def.color2);
  }
  ctx.fillStyle = gr;
  ctx.globalAlpha = low ? 0.7 + 0.3 * Math.sin(g.tick * 0.3) : 1;
  ctx.fillRect(bx + barW - barW * ratio, y, barW * ratio + 20, h);
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#fff';
  ctx.fillRect(bx, y, barW + 20, h * 0.35);
  ctx.restore();
  para(ctx, bx, y, barW, h);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f5e6c8';
  ctx.stroke();
  ctx.restore();

  // retrato
  const px = side === 0 ? 34 : W - 34;
  ctx.save();
  ctx.beginPath();
  ctx.arc(px, 38, 30, 0, Math.PI * 2);
  ctx.fillStyle = f.def.color2;
  ctx.fill();
  ctx.clip();
  const gp = ctx.createRadialGradient(px, 30, 4, px, 38, 34);
  gp.addColorStop(0, f.def.glow + '88');
  gp.addColorStop(1, f.def.color + '22');
  ctx.fillStyle = gp;
  ctx.fillRect(px - 32, 6, 64, 64);
  const hurt = f.state === 'hit' || f.state === 'launched' || f.hp / f.maxHp < 0.2;
  drawPortrait(ctx, f.ch, px + (side === 0 ? -2 : 2), 42, f.ch === 'caetano' ? 22 : 20, { time: g.tick, expr: hurt ? 'hit' : 'n', glow: f.glow }, side === 1);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(px, 38, 30, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = f.def.color;
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#fff';
  ctx.stroke();

  // nome
  const nx = side === 0 ? 76 : W - 76;
  label(ctx, f.def.name, nx, 64, 15, '#fff', f.def.color2, side === 0 ? 'left' : 'right', side === 0 ? -0.18 : 0.18, 4);

  // pips de rounds
  if (!g.training) {
    for (let i = 0; i < g.winsNeeded; i++) {
      const cx = side === 0 ? 422 - i * 20 : W - 422 + i * 20;
      ctx.beginPath();
      ctx.arc(cx, 62, 7, 0, Math.PI * 2);
      ctx.fillStyle = i < f.wins ? '#fde047' : 'rgba(0,0,0,0.5)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f5e6c8';
      ctx.stroke();
    }
  }
}

function drawMeter(ctx: CanvasRenderingContext2D, g: Game, f: Fighter, side: 0 | 1) {
  const w = 330;
  const y = 504;
  const h = 16;
  const x = side === 0 ? 40 : W - 40 - w;
  const r = Math.min(1, f.meter / 100);
  const full = f.meter >= 100;
  ctx.save();
  if (side === 1) {
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
  }
  const bx = side === 0 ? x : W - x - w;
  para(ctx, bx, y, w, h, 10);
  ctx.fillStyle = 'rgba(10,6,16,0.85)';
  ctx.fill();
  ctx.save();
  para(ctx, bx, y, w, h, 10);
  ctx.clip();
  const gr = ctx.createLinearGradient(bx, 0, bx + w, 0);
  if (f.ch === 'caetano') {
    gr.addColorStop(0, '#6d28d9');
    gr.addColorStop(1, full ? '#f5d0fe' : '#c084fc');
  } else if (f.ch === 'orango') {
    gr.addColorStop(0, '#991b1b');
    gr.addColorStop(1, full ? '#fecaca' : '#fb923c');
  } else {
    gr.addColorStop(0, f.def.color2);
    gr.addColorStop(1, full ? f.def.glow : f.def.color);
  }
  ctx.fillStyle = gr;
  ctx.fillRect(bx, y, w * r, h);
  if (full) {
    ctx.globalAlpha = 0.4 + 0.4 * Math.sin(g.tick * 0.3);
    ctx.fillStyle = '#fff';
    ctx.fillRect(bx, y, w, h);
  }
  ctx.restore();
  para(ctx, bx, y, w, h, 10);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = full ? '#fde047' : '#f5e6c8';
  ctx.stroke();
  ctx.restore();
  const tx = side === 0 ? x + 6 : x + w - 6;
  const al: CanvasTextAlign = side === 0 ? 'left' : 'right';
  if (full) {
    const k = g.cfg.bindings[f.idx].super[0];
    label(ctx, `SUPER PRONTO! [${keyLabel(k)}]`, tx, y - 12, 15 + Math.sin(g.tick * 0.3) * 1.5, '#fde047', '#3a0a00', al, side === 0 ? -0.18 : 0.18, 4);
  } else label(ctx, 'SUPER', tx, y - 10, 12, '#e5e7eb', '#150a1e', al, side === 0 ? -0.18 : 0.18, 3);
}

function drawHUD(ctx: CanvasRenderingContext2D, g: Game) {
  const [a, b] = g.f;
  drawBar(ctx, g, a, 0);
  drawBar(ctx, g, b, 1);
  // timer
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(435, 8, 90, 58, 10);
  const tg = ctx.createLinearGradient(0, 8, 0, 66);
  tg.addColorStop(0, '#2a1a3a');
  tg.addColorStop(1, '#0f0818');
  ctx.fillStyle = tg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#e8c872';
  ctx.stroke();
  ctx.restore();
  const low = !g.training && g.timeLeft <= 10 && g.phase === 'fight';
  label(ctx, g.training ? '∞' : String(Math.max(0, g.timeLeft)).padStart(2, '0'), 480, 38, low ? 44 + Math.sin(g.tick * 0.4) * 3 : 42, low ? '#ff5a4a' : '#fff', '#000', 'center', 0, 6);
  drawMeter(ctx, g, a, 0);
  drawMeter(ctx, g, b, 1);

  // combos
  for (let att = 0; att < 2; att++) {
    const vic = g.f[1 - att];
    let hits = 0;
    let dmg = 0;
    let alpha = 0;
    if (vic.comboHits >= 2) {
      hits = vic.comboHits;
      dmg = vic.comboDmg;
      alpha = 1;
    } else if (g.comboShow[att].t > 0) {
      hits = g.comboShow[att].hits;
      dmg = g.comboShow[att].dmg;
      alpha = Math.min(1, g.comboShow[att].t / 30);
    }
    if (alpha > 0 && hits >= 2) {
      const x = att === 0 ? 40 : W - 40;
      const al: CanvasTextAlign = att === 0 ? 'left' : 'right';
      const col = g.f[att].def.glow;
      ctx.save();
      ctx.globalAlpha = alpha;
      label(ctx, String(hits), x, 170, 70, '#fff', g.f[att].def.color, al, att === 0 ? -0.2 : 0.2, 10);
      label(ctx, hits > 1 ? 'HITS' : 'HIT', x, 222, 28, col, '#150a1e', al, att === 0 ? -0.2 : 0.2, 6);
      label(ctx, `DANO ${Math.round(dmg)}`, x, 252, 16, '#fde68a', '#150a1e', al, att === 0 ? -0.2 : 0.2, 4);
      ctx.restore();
    }
  }

  // banner de golpe
  const mb = g.cine ? null : g.moveBanner;
  if (mb) {
    const k = Math.min(1, mb.t / 7);
    const fade = mb.t > mb.dur - 15 ? (mb.dur - mb.t) / 15 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, fade);
    const w = 460 * k;
    ctx.translate(W / 2, 118);
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 16, -20);
    ctx.lineTo(w / 2 + 16, -20);
    ctx.lineTo(w / 2 - 16, 20);
    ctx.lineTo(-w / 2 - 16, 20);
    ctx.closePath();
    const bg = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    bg.addColorStop(0, 'rgba(10,4,20,0.9)');
    bg.addColorStop(0.5, mb.color + 'cc');
    bg.addColorStop(1, 'rgba(10,4,20,0.9)');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (k > 0.8) label(ctx, mb.text, 0, 1, 24, '#fff', '#150a1e', 'center', -0.18, 5);
    ctx.restore();
  }

  // treino
  if (g.training && !g.cine && !g.seq) {
    const names = ['PARADO', 'IA', 'DEFENDENDO', 'JOGADOR 2'];
    ctx.save();
    ctx.fillStyle = 'rgba(8,4,16,0.7)';
    ctx.beginPath();
    ctx.roundRect(14, 290, 270, 138, 8);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    label(ctx, 'TREINAMENTO', 26, 308, 17, '#fbbf24', '#000', 'left', -0.1, 4);
    const lines = [`Dummy [T]: ${names[g.train.dummy]}`, `Último dano: ${g.train.lastDmg}`, `Combo: ${g.train.combo} hits  |  ${Math.round(g.train.total)} dano`, `Maior combo: ${g.train.maxCombo} hits`, 'Reiniciar posições [R]'];
    ctx.font = `600 14px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, 26, 332 + i * 18));
  }
}

function drawAnn(ctx: CanvasRenderingContext2D, g: Game) {
  const a = g.ann;
  if (!a || !a.text) return;
  const big = a.text === 'K.O.';
  const k = Math.min(1, a.t / 8);
  const sc = 1 + (1 - k) * 2.2;
  const fade = a.t > a.dur - 14 ? Math.max(0, (a.dur - a.t) / 14) : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(W / 2, big ? 230 : 210);
  ctx.scale(sc, sc);
  const size = big ? 170 : a.text.length > 9 ? 70 : 96;
  if (big) ctx.rotate(-0.06);
  const gr = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
  gr.addColorStop(0, '#ffffff');
  gr.addColorStop(0.5, a.color);
  gr.addColorStop(1, '#7f1d1d');
  ctx.shadowColor = a.color;
  ctx.shadowBlur = 30;
  label(ctx, a.text, 0, 0, size, gr, '#1a0408', 'center', -0.2, size * 0.16);
  ctx.shadowBlur = 0;
  if (a.sub) label(ctx, a.sub, 0, size * 0.6, 26, '#fff', '#150a1e', 'center', -0.18, 6);
  ctx.restore();
}

function drawClashUI(ctx: CanvasRenderingContext2D, g: Game) {
  const c = g.clash;
  if (!c) return;
  const w = 520;
  const x = W / 2 - w / 2;
  const y = 430;
  const tot = c.c[0] + c.c[1];
  const p = tot === 0 ? 0.5 : Math.max(0.05, Math.min(0.95, 0.5 + (c.c[0] - c.c[1]) / 24));
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(x - 6, y - 6, w + 12, 34);
  ctx.fillStyle = c.a.def.color;
  ctx.fillRect(x, y, w * p, 22);
  ctx.fillStyle = c.b.def.color;
  ctx.fillRect(x + w * p, y, w * (1 - p), 22);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + w * p - 3, y - 8, 6, 38);
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 6, y - 6, w + 12, 34);
  ctx.restore();
  const pulse = 1 + Math.sin(g.tick * 0.7) * 0.08;
  const k1 = keyLabel(g.cfg.bindings[0].p[0]);
  const k2 = keyLabel(g.cfg.bindings[1].p[0]) + (g.cfg.bindings[1].p[1] ? ' / ' + keyLabel(g.cfg.bindings[1].p[1]) : '');
  ctx.save();
  ctx.translate(W / 2, 400);
  ctx.scale(pulse, pulse);
  label(ctx, 'SOCO! SOCO! SOCO!', 0, 0, 34, '#fde047', '#3a0a00', 'center', -0.18, 8);
  ctx.restore();
  if (!c.a.cpu) label(ctx, `P1: ${k1}`, x, y + 50, 16, c.a.def.glow, '#000', 'left', -0.1, 4);
  if (!c.b.cpu) label(ctx, `P2: ${k2}`, x + w, y + 50, 16, c.b.def.glow, '#000', 'right', 0.1, 4);
}

function drawCine(ctx: CanvasRenderingContext2D, g: Game) {
  const c = g.cine;
  if (!c) return;
  const f = c.f;
  const t = c.t;
  const isC = f.ch === 'caetano';
  const k = Math.min(1, t / 8);
  const out = t > c.dur - 8 ? Math.max(0, (c.dur - t) / 8) : 1;
  ctx.save();
  ctx.globalAlpha = k * out;
  ctx.fillStyle = f.def.color2 + 'dd';
  ctx.fillRect(0, 0, W, H);
  const wash = ctx.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, 600);
  wash.addColorStop(0, f.def.color + '77');
  wash.addColorStop(1, '#000000bb');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  speedLines(ctx, 1, f.def.glow, g.tick);
  // faixa diagonal com o rosto
  ctx.save();
  const slide = (1 - Math.min(1, t / 10)) * -W;
  ctx.translate(slide, 0);
  ctx.beginPath();
  ctx.moveTo(-40, 120);
  ctx.lineTo(W + 40, 70);
  ctx.lineTo(W + 40, 400);
  ctx.lineTo(-40, 450);
  ctx.closePath();
  const bg = ctx.createLinearGradient(0, 0, W, 0);
  bg.addColorStop(0, f.def.color2);
  bg.addColorStop(0.5, f.def.color);
  bg.addColorStop(1, f.def.color2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.clip();
  speedLines(ctx, 0.8, '#ffffff', g.tick + 3);
  const shakeX = isC ? 0 : (Math.random() - 0.5) * 8;
  const shakeY = isC ? 0 : (Math.random() - 0.5) * 8;
  ctx.translate(W * 0.5 + shakeX, 255 + shakeY);
  const sz = (isC ? 88 : 80) + t * (isC ? 0.45 : 0.3);
  ctx.scale(1, 1);
  ctx.save();
  ctx.translate(0, 0);
  drawHead(ctx, f.ch, sz, { time: t, expr: isC ? 'n' : 'shout', glow: Math.min(1, t / 14), glowColor: f.def.glow });
  ctx.restore();
  ctx.restore();
  // texto
  const nm = f.def.superName;
  ctx.save();
  ctx.translate(0, Math.sin(t * 0.5) * (isC ? 0 : 3));
  label(ctx, nm, W / 2, 470, 52, '#fff', f.def.color2, 'center', -0.2, 12);
  ctx.restore();
  if (isC && t > 22) {
    const s = 1 + Math.max(0, 1 - (t - 22) / 8) * 0.6;
    ctx.save();
    ctx.translate(W / 2, 128);
    ctx.scale(s, s);
    label(ctx, 'VOCÊ NÃO SABE DE NADA!', 0, 0, 44, '#f5d0fe', '#2a0a4a', 'center', -0.18, 10);
    ctx.restore();
  }
  if (!isC) {
    const s = 1 + Math.sin(t * 0.9) * 0.06;
    ctx.save();
    ctx.translate(W / 2, 128);
    ctx.scale(s, s);
    label(ctx, f.ch === 'orango' ? 'GRAAAAAAWRRR!!!' : f.ch === 'tubarao' ? 'FISCALIZAÇÃO TOTAL!' : 'TRANSFERÊNCIA EM 6X!', 0, 0, 46, f.def.glow, f.def.color2, 'center', -0.18, 12);
    ctx.restore();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ render principal
export function render(ctx: CanvasRenderingContext2D, g: Game, stage: Stage, time: number) {
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  const sh = g.shake * settings.shake;
  if (sh > 0) {
    ctx.translate(W / 2 + (Math.random() - 0.5) * sh * 1.6, H / 2 + (Math.random() - 0.5) * sh * 1.6);
    ctx.scale(1.03, 1.03);
    ctx.translate(-W / 2, -H / 2);
  }
  stage.hype = Math.max(stage.hype, g.hype);
  g.hype = 0;
  stage.drawBackground(ctx, g.cam.x, g.cam.zoom, time);

  // ---- mundo
  ctx.save();
  ctx.translate(W / 2, FLOOR_Y);
  ctx.scale(g.cam.zoom, g.cam.zoom);
  ctx.translate(-g.cam.x, -FLOOR_Y);
  stage.drawFloor(ctx);
  let tint: string | null = null;
  let tintAmt = 0;
  if (g.expl) {
    tint = g.expl.color;
    tintAmt = 1 - g.expl.t / g.expl.dur;
  } else if (g.cine) {
    tint = g.cine.f.def.color;
    tintAmt = 1;
  } else if (g.seq && g.seq.kind.startsWith('super')) {
    tint = g.seq.a.def.color;
    tintAmt = 0.8;
  }
  stage.drawLights(ctx, g.cam.x, tint, tintAmt);

  // reflexos
  for (const f of g.f) {
    ctx.save();
    ctx.translate(0, 2 * FLOOR_Y);
    ctx.scale(1, -1);
    ctx.globalAlpha = 0.14;
    drawFighter(ctx, g, f, time, true);
    ctx.restore();
  }
  // sombras
  for (const f of g.f) {
    if (f.hidden) continue;
    const s = Math.max(0.35, 1 + f.y / 320);
    ctx.fillStyle = `rgba(0,0,0,${0.38 * s})`;
    ctx.beginPath();
    ctx.ellipse(f.x, FLOOR_Y + 3, (f.def.pushW + 26) * s * (f.state === 'down' ? 1.8 : 1), 9 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const f of g.f) if (!f.hidden) drawTrail(ctx, f);
  const front = (f: Fighter) => (f.state === 'attack' || f.state === 'seq' || f.state === 'cine' || f.state === 'win' ? 1 : 0);
  const order = front(g.f[0]) > front(g.f[1]) ? [g.f[1], g.f[0]] : [g.f[0], g.f[1]];
  for (const f of order) drawFighter(ctx, g, f, time);

  if (settings.hitboxes) {
    ctx.lineWidth = 2;
    for (const f of g.f) {
      const hb = g.hurtBox(f);
      ctx.strokeStyle = '#4ade80';
      ctx.strokeRect(hb.x0, FLOOR_Y + hb.y0, hb.x1 - hb.x0, hb.y1 - hb.y0);
      if (f.move) {
        const b = g.boxOf(f);
        ctx.strokeStyle = f.hbActive ? '#f87171' : '#fbbf24';
        ctx.strokeRect(b.x0, FLOOR_Y + b.y0, b.x1 - b.x0, b.y1 - b.y0);
      }
    }
  }
  drawProjectiles(ctx, g);
  for (const p of g.parts) drawParticle(ctx, p);
  ctx.restore();

  // ---- sobreposições de tela
  const vg = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 620);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, `rgba(0,0,0,${g.slowmo > 0 ? 0.75 : 0.5})`);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const l1 = ctx.createRadialGradient(0, 120, 0, 0, 120, 380);
  l1.addColorStop(0, g.f[0].def.color + '38');
  l1.addColorStop(1, 'rgba(150,70,255,0)');
  ctx.fillStyle = l1;
  ctx.fillRect(0, 0, W, H);
  const l2 = ctx.createRadialGradient(W, 120, 0, W, 120, 380);
  l2.addColorStop(0, g.f[1].def.color + '38');
  l2.addColorStop(1, 'rgba(255,50,40,0)');
  ctx.fillStyle = l2;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // escurecimento durante supers
  if (g.seq && g.seq.kind.startsWith('super')) {
    const s = g.seq;
    const d = s.t < 12 ? s.t / 12 : s.t > s.dur - 20 ? Math.max(0, (s.dur - s.t) / 20) : 1;
    ctx.fillStyle = s.a.def.color2 + Math.floor(80 * d).toString(16).padStart(2, '0');
    ctx.fillRect(0, 0, W, H);
    // barras cinematográficas
    const bh = 44 * d;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, bh);
    ctx.fillRect(0, H - bh, W, bh);
  }
  if (g.expl) {
    const u = g.expl.t / g.expl.dur;
    const gr = ctx.createRadialGradient(W / 2, H * 0.62, 10, W / 2, H * 0.62, 200 + u * 800);
    gr.addColorStop(0, `rgba(255,255,255,${1 - u})`);
    gr.addColorStop(0.3, g.expl.color + Math.floor((1 - u) * 200).toString(16).padStart(2, '0'));
    gr.addColorStop(1, g.expl.color + '00');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
    if (g.expl.color === '#ff2a2a') {
      ctx.fillStyle = `rgba(255,20,10,${(1 - u) * 0.45})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
  if (g.speed > 0.05 && !g.cine) {
    const col = g.seq ? g.seq.a.def.glow : g.f.find((f) => f.state === 'attack')?.def.glow || '#fff';
    speedLines(ctx, g.speed * 0.6, col, g.tick);
  }
  if (g.flash.a > 0) {
    ctx.globalAlpha = g.flash.a;
    ctx.fillStyle = g.flash.c;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  drawCine(ctx, g);
  drawHUD(ctx, g);
  drawClashUI(ctx, g);
  drawAnn(ctx, g);
  ctx.restore();
}

// ------------------------------------------------------------------ utilitários para telas de menu
export { drawFullBody } from './rig';
