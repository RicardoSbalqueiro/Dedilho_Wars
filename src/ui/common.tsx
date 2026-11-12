import {CanvasSurface,stageDensity,canvasFontRevision} from '../game/canvas';
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { Stage, STAGE_IDS, W, H, FLOOR_Y } from '../game/stage';
import { drawFullBody, drawPortrait } from '../game/rig';
import { attackAnimation } from '../game/animation';
import {modelSheetPose} from '../game/model-sheet';
import {MenuBrawlArt} from '../game/menu-brawl-art';
import {PaintCadence} from '../game/mobile-settings';
import { FrameTimer } from '../game/timing';
import { CHARS, movePhase } from '../game/data';
import type { CharId } from '../game/data';
import type { StageId } from '../game/stage';
import { audio } from '../game/audio';

const stageCache = new Map<string, Stage>();
const STAGE_CACHE_PIXELS=48*1024*1024;
let cachedPixels=0,cachedFontRevision=-1;
export function getStage(id:StageId='dojo',scale=1){
  const density=stageDensity(scale),revision=canvasFontRevision();
  if(revision!==cachedFontRevision){stageCache.clear();cachedPixels=0;cachedFontRevision=revision;}
  const key=`${id}:${density}`;let stage=stageCache.get(key);
  if(!stage){stage=new Stage(id,density);stageCache.set(key,stage);cachedPixels+=stage.pixelCount;}
  stageCache.delete(key);stageCache.set(key,stage);
  while(stageCache.size>8||cachedPixels>STAGE_CACHE_PIXELS){const oldest=stageCache.keys().next().value!;const item=stageCache.get(oldest)!;stageCache.delete(oldest);cachedPixels-=item.pixelCount;}
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
  useEffect(()=>{
    const surface=new CanvasSurface(ref.current!,W,H),ctx=surface.ctx;
    let stage:Stage|undefined,raf=0;
    const clock=new FrameTimer(),rebase=()=>clock.rebase();
    const draw=(now:number)=>{
      surface.prepare();const density=stageDensity(surface.scale);
      if(!stage||stage.density!==density||stage.fontRevision!==canvasFontRevision())stage=getStage(stageId,density);
      clock.sample(now,!document.hidden);drawStageScene(ctx,stage,clock.frames);
      if(animated)raf=requestAnimationFrame(draw);
    };
    const stop=animated?()=>{}:surface.observe(()=>draw(performance.now()));
    document.addEventListener('visibilitychange',rebase);draw(performance.now());
    return()=>{stop();cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',rebase)};
  },[stageId,animated]);
  return <canvas ref={ref} width={W} height={H} className={className} aria-hidden="true" />;
}

export function MusicButton({ onClick }: { onClick: () => void }) {
  const radio = useSyncExternalStore(audio.subscribeRadio, audio.getRadioSnapshot);
  return <button type="button" aria-label="Música" onClick={onClick} className="music-mini flex items-center gap-2 border border-fuchsia-300/50 bg-[#160b26e8] px-3 py-2 text-[12px] text-fuchsia-100 cursor-pointer hover:bg-fuchsia-950 focus:outline-2 focus:outline-fuchsia-300">
    <span className={`music-eq ${radio.playing ? 'playing' : ''}`} aria-hidden="true">{[0, 1, 2, 3].map((i) => <span key={i} style={{ animationDelay: `${i * -.17}s` }} />)}</span>
    <span>Música</span>
  </button>;
}

/** Logical layout stays 960×540; CSS zoom paints text at the displayed size. */
export function Frame({ children, game = false }: { children: ReactNode; game?: boolean }) {
  const [s, setS] = useState(1);
  useLayoutEffect(() => {
    const f = () => {const vh=window.visualViewport?.height||window.innerHeight,vw=window.visualViewport?.width||window.innerWidth;const portrait=matchMedia('(pointer: coarse)').matches&&vh>vw,deck=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dw-controls-height'))||310;setS(Math.min(Math.max(1,vw)/W,Math.max(1,vh-(game&&portrait?deck+56:0))/H));};
    f();
    window.addEventListener('resize',f);window.addEventListener('dedilho-controls-change',f);window.visualViewport?.addEventListener('resize',f);
    return()=>{window.removeEventListener('resize',f);window.removeEventListener('dedilho-controls-change',f);window.visualViewport?.removeEventListener('resize',f)};
  }, [game]);
  useLayoutEffect(()=>{window.dispatchEvent(new Event('dedilho-display-change'))},[s]);
  return (
    <div data-game-frame={game ? '1' : '0'} className="game-frame fixed inset-0 bg-black flex items-center justify-center overflow-hidden select-none">
      <div style={{ width: W, height: H, zoom:s, position: 'relative', flexShrink: 0, overflow: 'hidden' }}>{children}</div>
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

export function ArtCanvas({ variant, selected,paused=false }: { variant: ArtVariant; selected?: CharId;paused?:boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ variant, selected,paused });
  propsRef.current = { variant, selected,paused };
  useEffect(() => {
    const canvas = ref.current!;
    const surface=new CanvasSurface(canvas,W,H,'scene'),ctx=surface.ctx;
    const stageId=STAGE_IDS[Math.floor(Math.random()*STAGE_IDS.length)];
    surface.prepare();let stage=getStage(stageId,surface.scale);
    let raf = 0;
    const clock=new FrameTimer(),rebase=()=>clock.rebase();
    const brawl=variant==='menu'||variant==='splash'?new MenuBrawlArt(matchMedia('(pointer:coarse)').matches):undefined;
    const cadence=matchMedia('(pointer:coarse)').matches?new PaintCadence(30):null;
    let inView=true,lastPaintFrame=0;const observer=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??true;clock.rebase()}):undefined;observer?.observe(canvas);
    const rally=(event:Event)=>brawl?.rally(clock.frames,(event as CustomEvent<{x?:number}>).detail?.x);
    window.addEventListener('dedilho-menu-rally',rally);
    const leaves: Leaf[] = Array.from({ length: 24 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: -1 - Math.random() * 1.5, vy: 0.5 + Math.random(), r: Math.random() * 6, s: 3 + Math.random() * 5 }));
    const loop = (now:number) => {
      if(document.hidden||!inView||propsRef.current.paused){clock.rebase();raf=requestAnimationFrame(loop);return;}
      clock.sample(now,true);const t=clock.frames;
      if(cadence&&!cadence.due(now)){raf=requestAnimationFrame(loop);return;}
      const dt=t-lastPaintFrame;lastPaintFrame=t;
      canvas.dataset.animationFrame=t.toFixed(4);
      surface.prepare();const density=stageDensity(surface.scale);
      if(stage.density!==density||stage.fontRevision!==canvasFontRevision())stage=getStage(stageId,density);
      const { variant: v, selected: sel } = propsRef.current;
      const camX = 800 + Math.sin(t * 0.006) * 40;
      stage.hype = 0.15;
      drawStageScene(ctx, stage, t, camX);
      if (v === 'menu' || v === 'splash') {
        brawl?.draw(ctx,t);canvas.dataset.brawlCount='18';canvas.dataset.brawlGround='470';canvas.dataset.brawlLoaded=String(brawl?.loaded??0);
      } else if (sel) {
        const ch = sel;
        glowBehind(ctx, 488, CHARS[ch].color, t, .95);
        // Preview full movements, not a held active frame for two seconds.
        const cycle=t%220,ids=['pM','kH','s1','s2','s3','cK'];
        const move=CHARS[ch].moves[ids[Math.floor(t/220)%ids.length]];
        const attacking=cycle>=90&&cycle<194;
        const frame=attacking?(cycle-90)/104*(move.startup+move.active+move.recovery):0;
        const name=attacking?move.poses[frame<move.startup?0:1]:'idle';
        const pose=attacking?attackAnimation(ch,move,frame,true):modelSheetPose(ch,t);
        ctx.save();ctx.translate(488,422);ctx.scale(1.48,1.48);
        if(attacking&&move.turn&&frame>=move.turn[0]&&frame<=move.turn[1]){
          const turn=Math.cos((frame-move.turn[0])/(move.turn[1]-move.turn[0])*Math.PI*2);
          ctx.scale(Math.sign(turn)*Math.max(.18,Math.abs(turn)),1);
        }
        const hop=ch==='jane'&&move.id==='s3'&&frame>18&&frame<38?-Math.sin((frame-18)/20*Math.PI)*35:0;
        drawFullBody(ctx,ch,0,hop,1,t,name,false,pose,{poseName:attacking?name:'model',spriteState:attacking?'attack':'idle',spritePhase:attacking?movePhase(move,frame,true).phase:undefined,spriteProgress:attacking?movePhase(move,frame,true).progress:0,spriteKind:move.kind==='normal'?/^(k|cK|jK)/.test(move.id)?'kick':'punch':move.kind==='super'?'super':'special',spriteRank:move.rank,spriteAir:move.air,normalAccessory:move.accessory});ctx.restore();
      }
      // folhas
      for (const l of leaves) {
        l.x += l.vx*dt;
        l.y += l.vy*dt;
        l.r += 0.05*dt;
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
    document.addEventListener('visibilitychange',rebase);raf = requestAnimationFrame(loop);
    return () => {cancelAnimationFrame(raf);observer?.disconnect();document.removeEventListener('visibilitychange',rebase);window.removeEventListener('dedilho-menu-rally',rally);brawl?.dispose()};
  }, []);
  return <canvas ref={ref} width={W} height={H} className="absolute inset-0 w-full h-full" aria-label={variant==='select'?'Prévia do lutador':'Pancadaria geral: 18 lutadores no chão, sem Ultimates'} onPointerDown={e=>{if(variant==='select')return;const r=e.currentTarget.getBoundingClientRect();window.dispatchEvent(new CustomEvent('dedilho-menu-rally',{detail:{x:(e.clientX-r.left)/r.width*W}}))}} />;
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
  useEffect(()=>{
    const width=(size+6)*2,height=(size+8)*2,surface=new CanvasSurface(ref.current!,width,height),ctx=surface.ctx;
    const draw=()=>{surface.prepare();ctx.clearRect(0,0,width,height);drawPortrait(ctx,ch,size+6,size+8,size,{time:0})};
    const stop=surface.observe(draw);draw();return stop;
  },[ch,size]);
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
      onFocus={onHover}
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
