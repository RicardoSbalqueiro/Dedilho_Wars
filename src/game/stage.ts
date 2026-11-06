import {layerCanvas,stageDensity,canvasFontRevision} from './canvas';
// Arenas em camadas com parallax; a geometria do combate é igual em todos os mapas.
import { buildOutdoorScene } from './stage-scenes';
import { buildExtraScene, drawExtraStageDetails } from './extra-stage-scenes';
export const STAGE_IDS = ['neto', 'dojo', 'liberdade', 'curitiba', 'piaui', 'planalto', 'casebre', 'praca', 'osasco', 'bolivia', 'morro', 'campo', 'casabranca', 'letsgay', 'ngb', 'zoologico', 'termodinamica'] as const;
export type StageId = (typeof STAGE_IDS)[number];
export const STAGES: Record<StageId, { id: StageId; name: string; subtitle: string; accent: string; credit?: string }> = {
  neto: { id: 'neto', name: 'Neto Supermercados', subtitle: 'OFERTAS E COMBATE NA CALÇADA', accent: '#3b82f6' },
  dojo: { id: 'dojo', name: 'Dojo Senbukan', subtitle: 'O DOJO CLÁSSICO DO DEDILHO', accent: '#a855f7' },
  liberdade: { id: 'liberdade', name: 'Liberdade SP', subtitle: 'LANTERNAS NO CORAÇÃO DE SÃO PAULO', accent: '#ef4444' },
  curitiba: { id: 'curitiba', name: 'Curitiba', subtitle: 'JARDIM BOTÂNICO E ARAUCÁRIAS', accent: '#4ade80' },
  piaui: { id: 'piaui', name: 'Piauí', subtitle: 'SERRA, CAATINGA E SOL', accent: '#fb923c' },
  planalto: { id: 'planalto', name: 'Palácio do Planalto', subtitle: 'A ARENA MODERNISTA DE BRASÍLIA', accent: '#38bdf8' },
  casebre: { id: 'casebre', name: 'Casebre', subtitle: 'QUINTAL PEQUENO, BRIGA GRANDE', accent: '#d9a86c' },
  praca: { id: 'praca', name: 'Praça do Dedilhador', subtitle: 'O MONUMENTO DA COMUNIDADE', accent: '#c084fc' },
  osasco: { id: 'osasco', name: 'Osasco', subtitle: 'A CIDADE NÃO PARA', accent: '#fbbf24' },
  bolivia: { id: 'bolivia', name: 'Bolívia', subtitle: 'COMBATE NAS ALTURAS DOS ANDES', accent: '#f87171' },
  morro: { id: 'morro', name: 'Morro do Bieu', subtitle: 'RESPEITA A COMUNIDADE', accent: '#fb7185' },
  campo: { id: 'campo', name: 'Campo do futebol dos campeões', subtitle: 'O CLÁSSICO DO DEDILHO', accent: '#4ade80' },
  casabranca: { id: 'casabranca', name: 'Casa Branca com Ovnis', subtitle: 'VISITANTES DE OUTRA GALÁXIA', accent: '#a3e635', credit: 'Jalam' },
  letsgay: { id: 'letsgay', name: 'Praia do Lets Gay', subtitle: 'SOL, MAR E TODAS AS CORES', accent: '#f472b6', credit: 'Jalam e Diegão' },
  ngb: { id: 'ngb', name: 'Lugar do NGB News', subtitle: 'A NOTÍCIA AO VIVO NA ARENA', accent: '#22d3ee' },
  zoologico: { id: 'zoologico', name: 'Zoológico do Orangotango', subtitle: 'BEM-VINDOS AO REINO DA SELVA', accent: '#86efac' },
  termodinamica: { id: 'termodinamica', name: 'Praia da Termodinâmica', subtitle: 'CALOR, ONDAS E ENTROPIA', accent: '#fb923c' },
};

export const W = 960;
export const H = 540;
export const FLOOR_Y = 470; // y do chão onde os lutadores pisam
export const STAGE_W = 1600;
const BASE = 440;

const mk=layerCanvas;

let seed = 7;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const KANJI_FONT = "'Noto Serif CJK JP','Yu Mincho','Hiragino Mincho ProN','MS Mincho','SimSun',serif";

function banner(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, accent: string, text: string) {
  ctx.fillStyle = '#3a2216';
  ctx.fillRect(x - 6, y - 8, w + 12, 8);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#f3e9d2');
  g.addColorStop(1, '#d9ccae');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // pinceladas coloridas
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.78);
  ctx.lineTo(x + w, y + h * 0.6);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1b1020';
  ctx.font = `bold ${w * 0.62}px ${KANJI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text[0], x + w / 2, y + h * 0.28);
  ctx.fillText(text[1], x + w / 2, y + h * 0.58);
  ctx.strokeStyle = '#3a2216';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function buildSky(density:number) {
  const c = mk(W, H,density);
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 440);
  g.addColorStop(0, '#120a2b');
  g.addColorStop(0.35, '#3a1a5e');
  g.addColorStop(0.6, '#a2386a');
  g.addColorStop(0.82, '#f27a45');
  g.addColorStop(1, '#ffc25e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.6})`;
    ctx.fillRect(rnd() * W, rnd() * 200, 1.5, 1.5);
  }
  const sg = ctx.createRadialGradient(W / 2, 330, 10, W / 2, 330, 280);
  sg.addColorStop(0, 'rgba(255,240,170,0.95)');
  sg.addColorStop(0.2, 'rgba(255,190,100,0.6)');
  sg.addColorStop(1, 'rgba(255,120,60,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(W / 2, 335, 62, 0, Math.PI * 2);
  ctx.fill();
  // nuvens
  for (let i = 0; i < 9; i++) {
    const x = rnd() * W;
    const y = 120 + rnd() * 170;
    ctx.fillStyle = `rgba(${200 + rnd() * 50},${90 + rnd() * 60},${120 + rnd() * 60},0.35)`;
    ctx.beginPath();
    ctx.ellipse(x, y, 120 + rnd() * 80, 8 + rnd() * 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

function buildMountains(density:number) {
  const c = mk(STAGE_W,H,density);
  const ctx = c.getContext('2d')!;
  const ridge = (base: number, amp: number, col: string, step: number, snow = false) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, base);
    let x = 0;
    const pts: [number, number][] = [];
    while (x <= STAGE_W) {
      const y = base - amp * (0.3 + rnd() * 0.7);
      pts.push([x, y]);
      ctx.lineTo(x, y);
      x += step * (0.6 + rnd() * 0.8);
    }
    ctx.lineTo(STAGE_W, base);
    ctx.lineTo(STAGE_W, H);
    ctx.closePath();
    ctx.fill();
    if (snow) {
      ctx.fillStyle = 'rgba(255,230,230,0.5)';
      for (const [px, py] of pts) {
        if (py < base - amp * 0.8) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - 28, py + 26);
          ctx.lineTo(px + 28, py + 26);
          ctx.fill();
        }
      }
    }
  };
  ridge(380, 200, '#5b2a6e', 150, true);
  ridge(410, 150, '#3b1a52', 110);
  ridge(430, 90, '#241038', 80);
  // neblina
  const g = ctx.createLinearGradient(0, 360, 0, 450);
  g.addColorStop(0, 'rgba(255,150,110,0)');
  g.addColorStop(1, 'rgba(255,160,120,0.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 360, STAGE_W, 100);
  return c;
}

function buildHall(density:number) {
  const c = mk(STAGE_W,H,density);
  const ctx = c.getContext('2d')!;
  // telhado
  const rg = ctx.createLinearGradient(0, 20, 0, 130);
  rg.addColorStop(0, '#150c18');
  rg.addColorStop(1, '#3a2024');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.quadraticCurveTo(STAGE_W / 2, -30, STAGE_W, 40);
  ctx.lineTo(STAGE_W, 135);
  ctx.lineTo(0, 135);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 2;
  for (let x = 0; x < STAGE_W; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x - 6, 135);
    ctx.stroke();
  }
  // viga
  ctx.fillStyle = '#2d1a12';
  ctx.fillRect(0, 128, STAGE_W, 22);
  ctx.fillStyle = '#4b2c1c';
  ctx.fillRect(0, 128, STAGE_W, 5);
  // parede
  const wg = ctx.createLinearGradient(0, 150, 0, BASE);
  wg.addColorStop(0, '#2a1a22');
  wg.addColorStop(1, '#20121a');
  ctx.fillStyle = wg;
  ctx.fillRect(0, 150, STAGE_W, BASE - 150);
  // janelas iluminadas (shoji)
  for (let i = 0; i < 7; i++) {
    const x = 70 + i * 225;
    const y = 175;
    const w = 165;
    const h = 175;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#ffd887');
    g.addColorStop(0.6, '#ff9a4d');
    g.addColorStop(1, '#e8603a');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#1e100c';
    ctx.lineWidth = 3;
    for (let k = 0; k <= 4; k++) {
      ctx.beginPath();
      ctx.moveTo(x + (w / 4) * k, y);
      ctx.lineTo(x + (w / 4) * k, y + h);
      ctx.stroke();
    }
    for (let k = 0; k <= 5; k++) {
      ctx.beginPath();
      ctx.moveTo(x, y + (h / 5) * k);
      ctx.lineTo(x + w, y + (h / 5) * k);
      ctx.stroke();
    }
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#2d1a12';
    ctx.strokeRect(x, y, w, h);
    // silhueta de montanha vista pela janela
    ctx.fillStyle = 'rgba(90,30,80,0.35)';
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w * 0.3, y + h * 0.55);
    ctx.lineTo(x + w * 0.55, y + h * 0.8);
    ctx.lineTo(x + w * 0.8, y + h * 0.5);
    ctx.lineTo(x + w, y + h * 0.75);
    ctx.lineTo(x + w, y + h);
    ctx.fill();
  }
  // pilares
  for (let i = 0; i <= 7; i++) {
    const x = 20 + i * 225;
    const g = ctx.createLinearGradient(x, 0, x + 34, 0);
    g.addColorStop(0, '#4a2a1a');
    g.addColorStop(0.5, '#6a3e26');
    g.addColorStop(1, '#3a2014');
    ctx.fillStyle = g;
    ctx.fillRect(x, 128, 34, BASE - 128);
  }
  // rodapé de madeira
  ctx.fillStyle = '#35201a';
  ctx.fillRect(0, 350, STAGE_W, BASE - 350);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 2;
  for (let x = 0; x < STAGE_W; x += 55) {
    ctx.beginPath();
    ctx.moveTo(x, 350);
    ctx.lineTo(x, BASE);
    ctx.stroke();
  }
  ctx.fillStyle = '#5a3524';
  ctx.fillRect(0, 350, STAGE_W, 6);
  // bandeiras
  banner(ctx, 285, 160, 70, 210, '#a855f7', '空手');
  banner(ctx, 1245, 160, 70, 210, '#ef4444', '空手');
  banner(ctx, 765, 150, 70, 220, '#f59e0b', '道場');
  // detalhes laterais — roxo (esquerda) e vermelho (direita)
  const drape = (x: number, col: string) => {
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(x, 150);
    ctx.lineTo(x + 70, 150);
    ctx.lineTo(x + 62, 300);
    ctx.lineTo(x + 35, 280);
    ctx.lineTo(x + 8, 310);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 6, 158, 58, 3);
  };
  drape(120, '#6d28d9');
  drape(1410, '#b91c1c');
  return c;
}

function buildFloor(density:number) {
  const c = mk(STAGE_W,150,density);
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 150);
  g.addColorStop(0, '#6b4126');
  g.addColorStop(0.5, '#5a3520');
  g.addColorStop(1, '#3a2014');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, STAGE_W, 150);
  // tábuas com perspectiva
  const ys = [0, 8, 19, 33, 51, 74, 104, 150];
  for (let r = 0; r < ys.length - 1; r++) {
    const y0 = ys[r];
    const y1 = ys[r + 1];
    const cols = 26;
    const spread0 = 1 + y0 / 150;
    const spread1 = 1 + y1 / 150;
    for (let i = -6; i < cols + 6; i++) {
      const bx = (i / cols) * STAGE_W;
      const x0 = STAGE_W / 2 + (bx - STAGE_W / 2) * spread0;
      const x1 = STAGE_W / 2 + (bx - STAGE_W / 2) * spread1;
      const nx0 = STAGE_W / 2 + (bx + STAGE_W / cols - STAGE_W / 2) * spread0;
      const nx1 = STAGE_W / 2 + (bx + STAGE_W / cols - STAGE_W / 2) * spread1;
      const shade = rnd();
      ctx.fillStyle = `rgba(${shade > 0.5 ? '255,200,140' : '20,8,0'},${0.04 + rnd() * 0.07})`;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(nx0, y0);
      ctx.lineTo(nx1, y1);
      ctx.lineTo(x1, y1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(20,8,4,0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(15,6,2,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.lineTo(STAGE_W, y0);
    ctx.stroke();
  }
  // brilho verniz
  const sh = ctx.createLinearGradient(0, 0, 0, 150);
  sh.addColorStop(0, 'rgba(255,200,140,0.35)');
  sh.addColorStop(0.3, 'rgba(255,200,140,0.05)');
  sh.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = sh;
  ctx.fillRect(0, 0, STAGE_W, 150);
  // borda de tatame/linha de luta
  ctx.fillStyle = 'rgba(20,6,2,0.8)';
  ctx.fillRect(0, 0, STAGE_W, 3);
  return c;
}

interface Spectator {
  x: number;
  row: number;
  shirt: string;
  skin: string;
  hair: string;
  ph: number;
  s: number;
}

export class Stage {
  sky: HTMLCanvasElement;
  mountains: HTMLCanvasElement;
  hall: HTMLCanvasElement;
  floor: HTMLCanvasElement;
  crowd: Spectator[] = [];
  hype = 0;
  private lastBackgroundTime:number|null=null;

  readonly fontRevision=canvasFontRevision();
  get pixelCount(){return [this.sky,this.mountains,this.hall,this.floor].reduce((sum,c)=>sum+c.width*c.height,0)}

  constructor(public readonly id:StageId='dojo',public readonly density=1){
    this.density=stageDensity(density);
    seed=7+STAGE_IDS.indexOf(id)*997;
    if (id === 'dojo') {
      this.sky = buildSky(this.density); this.mountains = buildMountains(this.density); this.hall = buildHall(this.density); this.floor = buildFloor(this.density);
      const sign = this.hall.getContext('2d')!;
      sign.fillStyle = '#170d22dd'; sign.fillRect(617, 52, 366, 39);
      sign.font = "900 23px 'Russo One',Impact,sans-serif"; sign.textAlign = 'center'; sign.fillStyle = '#f7dca9'; sign.fillText('DOJO SENBUKAN', 800, 80);
    } else {
      const scene = buildExtraScene(id,STAGE_W,H,this.density)??buildOutdoorScene(id,STAGE_W,H,this.density);
      this.sky = scene.sky; this.mountains = scene.mountains; this.hall = scene.hall; this.floor = scene.floor;
    }
    const skins = ['#f1c8a0', '#c98d5c', '#8d5a3a', '#e8b58a', '#6b4430'];
    const hairs = ['#111', '#2a1a10', '#4a3020', '#999', '#222'];
    for (let i = 0; i < (id === 'dojo' ? 64 : 24); i++) {
      const x = 20 + (i / (id === 'dojo' ? 64 : 24)) * 1560 + rnd() * 14;
      const t = x / STAGE_W;
      const pal = t < 0.4 ? ['#7c3aed', '#a855f7', '#5b21b6', '#e9d5ff', '#4c1d95'] : t > 0.6 ? ['#dc2626', '#ef4444', '#991b1b', '#fecaca', '#7f1d1d'] : ['#f59e0b', '#e5e7eb', '#1f2937', '#fb923c', '#16a34a'];
      this.crowd.push({
        x,
        row: i % 2,
        shirt: pal[Math.floor(rnd() * pal.length)],
        skin: skins[Math.floor(rnd() * skins.length)],
        hair: hairs[Math.floor(rnd() * hairs.length)],
        ph: rnd() * 6,
        s: 0.9 + rnd() * 0.25,
      });
    }
  }

  private layer(ctx: CanvasRenderingContext2D, camX: number, zoom: number, f: number) {
    const zl = 1 + (zoom - 1) * (0.35 + 0.65 * f);
    ctx.translate(W / 2, FLOOR_Y);
    ctx.scale(zl, zl);
    ctx.translate(-(STAGE_W / 2 + (camX - STAGE_W / 2) * f), -FLOOR_Y);
  }

  drawBackground(ctx: CanvasRenderingContext2D, camX: number, zoom: number, time: number) {
    ctx.drawImage(this.sky,0,0,W,H);
    ctx.save();
    this.layer(ctx, camX, zoom, 0.1);
    ctx.drawImage(this.mountains,0,0,STAGE_W,H);
    ctx.restore();

    ctx.save();
    this.layer(ctx, camX, zoom, 0.35);
    ctx.drawImage(this.hall,0,0,STAGE_W,H);
    drawExtraStageDetails(ctx, this.id, time);
    // lanternas
    for (let i = 0; this.id === 'dojo' && i < 10; i++) {
      const x = 90 + i * 168;
      const t = x / STAGE_W;
      const col = t < 0.42 ? '#a855f7' : t > 0.58 ? '#ef4444' : '#f97316';
      const sway = Math.sin(time * 0.03 + i) * 4;
      const flick = 0.75 + Math.sin(time * 0.2 + i * 3) * 0.12 + Math.sin(time * 0.37 + i) * 0.08;
      const y = 150 + (i % 2) * 14;
      ctx.strokeStyle = '#1a0a08';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 150);
      ctx.lineTo(x + sway * 0.5, y + 28);
      ctx.stroke();
      const lx = x + sway;
      const gl = ctx.createRadialGradient(lx, y + 52, 2, lx, y + 52, 70);
      gl.addColorStop(0, col + 'aa');
      gl.addColorStop(1, col + '00');
      ctx.globalAlpha = flick;
      ctx.fillStyle = gl;
      ctx.fillRect(lx - 70, y - 20, 140, 140);
      ctx.globalAlpha = 1;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(lx, y + 52, 15, 21, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1.5;
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.ellipse(lx, y + 52, Math.abs(k) * 6.5 + 0.1, 21, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#1a0a08';
      ctx.fillRect(lx - 8, y + 28, 16, 5);
      ctx.fillRect(lx - 8, y + 71, 16, 5);
      ctx.fillStyle = '#ffe9b0';
      ctx.globalAlpha = 0.5 * flick;
      ctx.beginPath();
      ctx.ellipse(lx, y + 52, 6, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // público
    ctx.save();
    this.layer(ctx, camX, zoom, 0.75);
    for (const sp of this.crowd) {
      const baseY = BASE + 6 + sp.row * 9;
      const sc = sp.s * (sp.row ? 1.0 : 0.88);
      const jump = this.hype > 0.05 ? Math.abs(Math.sin(time * 0.25 + sp.ph)) * 14 * this.hype : Math.sin(time * 0.05 + sp.ph) * 1.5;
      const y = baseY - jump;
      const dark = sp.row ? 1 : 0.7;
      ctx.globalAlpha = dark;
      ctx.fillStyle = sp.shirt;
      ctx.beginPath();
      ctx.roundRect(sp.x - 9 * sc, y - 30 * sc, 18 * sc, 34 * sc, 6);
      ctx.fill();
      ctx.fillStyle = sp.skin;
      ctx.beginPath();
      ctx.arc(sp.x, y - 38 * sc, 8 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = sp.hair;
      ctx.beginPath();
      ctx.arc(sp.x, y - 41 * sc, 8 * sc, Math.PI, Math.PI * 2);
      ctx.fill();
      if (this.hype > 0.3) {
        ctx.strokeStyle = sp.skin;
        ctx.lineWidth = 4 * sc;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sp.x - 8 * sc, y - 24 * sc);
        ctx.lineTo(sp.x - 14 * sc, y - 48 * sc - Math.sin(time * 0.4 + sp.ph) * 4);
        ctx.moveTo(sp.x + 8 * sc, y - 24 * sc);
        ctx.lineTo(sp.x + 14 * sc, y - 48 * sc + Math.sin(time * 0.4 + sp.ph) * 4);
        ctx.stroke();
        ctx.lineCap = 'butt';
      }
      ctx.globalAlpha = 1;
    }
    // trave/corda separando o público
    ctx.fillStyle = '#2a1510';
    ctx.fillRect(0, BASE + 4, STAGE_W, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, BASE + 9, STAGE_W, 8);
    ctx.restore();
    const elapsed=this.lastBackgroundTime===null?0:Math.max(0,Math.min(15,time-this.lastBackgroundTime));
    this.lastBackgroundTime=time;
    this.hype = Math.max(0, this.hype - 0.004*elapsed);
  }

  /** Desenhado já dentro da transformação do mundo (câmera). */
  drawFloor(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(this.floor,0,BASE+8,STAGE_W,150);
  }

  drawLights(ctx: CanvasRenderingContext2D, camX: number, tint: string | null, tintAmt: number) {
    // poças de luz roxa (esq.) e vermelha (dir.) no piso, em coordenadas de mundo
    const pool = (x: number, col: string, a: number) => {
      const g = ctx.createRadialGradient(x, FLOOR_Y + 10, 10, x, FLOOR_Y + 10, 330);
      g.addColorStop(0, col + Math.floor(a * 255).toString(16).padStart(2, '0'));
      g.addColorStop(1, col + '00');
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(x, FLOOR_Y + 10);
      ctx.scale(1, 0.28);
      ctx.translate(-x, -(FLOOR_Y + 10));
      ctx.fillRect(x - 340, FLOOR_Y - 330, 680, 680);
      ctx.restore();
    };
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const accent = STAGES[this.id].accent;
    pool(480, this.id === 'dojo' ? '#8b3fe0' : accent, this.id === 'dojo' ? 0.45 : 0.16);
    pool(1120, this.id === 'dojo' ? '#e0302f' : accent, this.id === 'dojo' ? 0.45 : 0.16);
    pool(800, this.id === 'dojo' || this.id === 'piaui' ? '#ffb060' : '#d6f5ff', 0.15);
    if (tint) pool(camX, tint, 0.6 * tintAmt);
    ctx.restore();
  }
}
