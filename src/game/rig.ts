// Esqueletos articulados e desenho vetorial de todos os lutadores.
import type { CharId, Pose } from './data';
import { CHARS } from './data';
import { menuAnimation } from './animation';
import {animeHead,animeRig} from './anime-art';

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
  transformation?:boolean;
  formVariant?:number;
  formTime?:number;
  kiss?: boolean; // pose de finalização do Tubarão Fiscal
  stretch?: number; // alcance visual da luva elástica, em unidades do mundo
}

const G = {
  jane: { T: 28, th: 21, sh: 20, ua: 17, fo: 15, headR: 10.8, foot: 10, hOff: 1.02, hFwd: 1.5 },
  cristyan: { T: 60, th: 45, sh: 44, ua: 34, fo: 31, headR: 12.8, foot: 16, hOff: 1.12, hFwd: 2 },
  eneas: { T: 61, th: 42, sh: 40, ua: 35, fo: 32, headR: 14, foot: 17, hOff: 1.0, hFwd: 2 },
  santox: { T: 60, th: 46, sh: 43, ua: 35, fo: 32, headR: 13, foot: 18, hOff: 1.1, hFwd: 1 },
  jao: { T: 58, th: 43, sh: 42, ua: 32, fo: 30, headR: 12.5, foot: 16, hOff: 1.1, hFwd: 2 },
  aneninha: { T: 54, th: 40, sh: 39, ua: 29, fo: 27, headR: 12.8, foot: 14, hOff: 1.1, hFwd: 2 },
  caetano: { T: 58, th: 44, sh: 44, ua: 32, fo: 30, headR: 12.7, foot: 14, hOff: 1.15, hFwd: 2 },
  orango: { T: 62, th: 34, sh: 30, ua: 52, fo: 50, headR: 21, foot: 17, hOff: 0.85, hFwd: 6 },
  tubarao: { T: 66, th: 46, sh: 42, ua: 38, fo: 35, headR: 23, foot: 17, hOff: 0.9, hFwd: 4 },
  rickzera: { T: 57, th: 44, sh: 43, ua: 32, fo: 30, headR: 12.7, foot: 16, hOff: 1.15, hFwd: 2 },
  bieu: { T: 58, th: 44, sh: 43, ua: 34, fo: 31, headR: 12.7, foot: 15, hOff: 1.15, hFwd: 2 },
  nomad: { T: 55, th: 37, sh: 35, ua: 34, fo: 31, headR: 13.8, foot: 17, hOff: 1.0, hFwd: 3 },
  renngotti: { T: 58, th: 40, sh: 38, ua: 35, fo: 32, headR: 13.5, foot: 17, hOff: 1.05, hFwd: 3 },
  patrick:{T:62,th:47,sh:44,ua:35,fo:32,headR:12.8,foot:17,hOff:1.12,hFwd:2},
  gabrielzin:{T:50,th:38,sh:37,ua:28,fo:25,headR:12.3,foot:14,hOff:1.12,hFwd:2},
  ulisses:{T:61,th:46,sh:43,ua:35,fo:32,headR:13,foot:17,hOff:1.1,hFwd:2},
  felipence:{T:58,th:44,sh:43,ua:33,fo:31,headR:13,foot:16,hOff:1.12,hFwd:2},
  hdsh:{T:57,th:43,sh:42,ua:33,fo:30,headR:13,foot:16,hOff:1.12,hFwd:2},
};

const rad = (d: number) => (d * Math.PI) / 180;
const pol = (o: P2, ang: number, len: number): P2 => ({ x: o.x + Math.cos(rad(ang)) * len, y: o.y + Math.sin(rad(ang)) * len });

export function lerpPose(a: Pose, b: Pose, k: number): Pose {
  if(k<=0)return {...a};
  if(k>=1)return {...b};
  const o={...a};
  for (const key of Object.keys(a) as (keyof Pose)[]) {
    let delta=b[key]-a[key];
    if(/^(fa|ba|fl|bl)[12]$/.test(key))delta=((delta+180)%360+360)%360-180;
    o[key]=a[key]+delta*k;
  }
  return o;
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

// Public painting boundaries share the same War of Champions artwork in gameplay,
// portraits, the animation library and cinematic actors. Poses remain simulation-owned.
export function drawHead(ctx:CanvasRenderingContext2D,ch:CharId,r:number,o:DrawOpts){animeHead(ctx,ch,r,o)}
export function drawRig(ctx:CanvasRenderingContext2D,ch:CharId,rig:Rig,pose:Pose,o:DrawOpts){animeRig(ctx,ch,rig,pose,o)}
export function drawBolivianDancer(ctx:CanvasRenderingContext2D,x:number,y:number,scale:number,time:number,flip=false,costume=0){
  const pose={...CHARS.aneninha.poses.idle,lean:Math.sin(time*.15)*8,fa1:-40+Math.sin(time*.19)*25,fa2:-80,ba1:160,ba2:100,fl1:60+Math.sin(time*.16)*22,bl1:115-Math.sin(time*.16)*20};
  const rig=computeRig('aneninha',pose);ctx.save();ctx.translate(x,y);ctx.scale(flip?-scale:scale,scale);drawRig(ctx,'aneninha',rig,pose,{time,costume});ctx.restore();
}

// ------------------------------------------------------------ retratos
export function drawPortrait(ctx: CanvasRenderingContext2D, ch: CharId, x: number, y: number, size: number, o: DrawOpts, flip = false) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  drawHead(ctx, ch, size, o);
  ctx.restore();
}

export function drawFullBody(ctx: CanvasRenderingContext2D, ch: CharId, x: number, y: number, scale: number, time: number, poseName = 'idle', flip = false, animatedPose?: Pose,options?:Partial<DrawOpts>) {
  const pose = animatedPose || menuAnimation(ch,poseName,time);
  const rig = computeRig(ch, pose);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -scale : scale, scale);
  drawRig(ctx,ch,rig,pose,{time,poseName,...options});
  ctx.restore();
}
