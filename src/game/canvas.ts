// Presentation resolution only. World coordinates and simulation stay unchanged.
import {mobileGraphics} from './mobile-settings';
export type CanvasKind='scene'|'detail';
export const MAX_SCENE_PIXELS=3840*2160;
export const MAX_DETAIL_PIXELS=2048*2048;
const positive=(n:number,fallback:number)=>Number.isFinite(n)&&n>0?n:fallback;
export function canvasSize(width:number,height:number,cssWidth:number,cssHeight:number,dpr:number,kind:CanvasKind='detail',mobileQuality?:'auto'|'sharp'){
  const w=positive(width,1),h=positive(height,1),pixelRatio=positive(dpr,1);
  const requested=Math.max(positive(cssWidth,w)/w,positive(cssHeight,h)/h)*pixelRatio;
  const scene=kind==='scene',auto=scene&&mobileQuality==='auto';
  const minimum=scene?(auto?1:2):.25,maximum=scene?(auto?2:mobileQuality==='sharp'?3:4):8,budget=scene?(auto?1920*1080:MAX_SCENE_PIXELS):MAX_DETAIL_PIXELS;
  const density=Math.min(maximum,Math.sqrt(budget/(w*h)),Math.max(minimum,requested));
  const pixelWidth=Math.max(1,Math.floor(w*density+1e-7)),pixelHeight=Math.max(1,Math.floor(h*density+1e-7));
  return {width:pixelWidth,height:pixelHeight,scaleX:pixelWidth/w,scaleY:pixelHeight/h};
}
export function stageDensity(scale:number){return Math.max(.5,Math.min(4,Math.ceil(positive(scale,1)*2-1e-6)/2));}

let fontEpoch=0,observedFonts:FontFaceSet|undefined;
export function canvasFontRevision(){
  const fonts=typeof document!=='undefined'?document.fonts:undefined;
  if(fonts&&fonts!==observedFonts){observedFonts=fonts;fonts.addEventListener('loadingdone',()=>{fontEpoch++});}
  return fontEpoch;
}

export class CanvasSurface {
  readonly ctx:CanvasRenderingContext2D;
  scale=1;
  constructor(readonly canvas:HTMLCanvasElement,readonly width:number,readonly height:number,readonly kind:CanvasKind='detail'){
    // Base-layer CSS keeps intrinsic backing pixels out of layout. Utilities and
    // responsive styles can still choose the displayed dimensions of previews.
    canvas.style.setProperty('--canvas-width',`${width}px`);canvas.style.setProperty('--canvas-height',`${height}px`);
    canvas.dataset.surface=kind;
    // Full scenes repaint an opaque background. Avoid blending that entire
    // high-resolution surface with the page; portraits still need transparency.
    const ctx=canvas.getContext('2d',{alpha:kind!=='scene'});if(!ctx)throw new Error('Canvas 2D indisponível');this.ctx=ctx;
  }
  prepare(){
    const rect=this.canvas.getBoundingClientRect();
    const size=canvasSize(this.width,this.height,rect.width,rect.height,typeof window==='undefined'?1:window.devicePixelRatio,this.kind,mobileGraphics());
    const changed=this.canvas.width!==size.width||this.canvas.height!==size.height;
    if(changed){this.canvas.width=size.width;this.canvas.height=size.height;this.canvas.dataset.resolution=`${size.width}x${size.height}`;}
    this.scale=Math.max(size.scaleX,size.scaleY);
    this.ctx.setTransform(size.scaleX,0,0,size.scaleY,0,0);
    // Cached scenery already carries the required pixels. Fast bilinear camera
    // sampling avoids expensive cubic resampling at QHD/4K; vector edges/text
    // still rasterize directly at the native backing resolution.
    this.ctx.imageSmoothingEnabled=true;this.ctx.imageSmoothingQuality=this.kind==='scene'?'low':'high';
    return changed;
  }
  /** Static previews redraw on layout, monitor/DPR and font changes; no extra animation loop. */
  observe(redraw:()=>void){
    let active=true,raf=0,media:MediaQueryList|undefined;
    const schedule=()=>{if(active&&!raf)raf=requestAnimationFrame(()=>{raf=0;if(active)redraw()})};
    const dprChanged=()=>{watchDpr();schedule()};
    const watchDpr=()=>{media?.removeEventListener('change',dprChanged);media=window.matchMedia(`(resolution: ${window.devicePixelRatio||1}dppx)`);media.addEventListener('change',dprChanged)};
    const observer=new ResizeObserver(schedule);observer.observe(this.canvas);
    // CSS zoom changes may keep a logical content box unchanged. Frame announces
    // its completed layout; window/viewport events also cover standalone mobile UI.
    window.addEventListener('resize',schedule);window.addEventListener('dedilho-display-change',schedule);window.visualViewport?.addEventListener('resize',schedule);watchDpr();
    canvasFontRevision();document.fonts?.ready.then(schedule);document.fonts?.addEventListener('loadingdone',schedule);
    return ()=>{active=false;cancelAnimationFrame(raf);observer.disconnect();media?.removeEventListener('change',dprChanged);window.removeEventListener('resize',schedule);window.removeEventListener('dedilho-display-change',schedule);window.visualViewport?.removeEventListener('resize',schedule);document.fonts?.removeEventListener('loadingdone',schedule)};
  }
}

export function layerCanvas(width:number,height:number,density=1){
  const c=document.createElement('canvas'),scale=stageDensity(density);
  c.width=Math.ceil(width*scale);c.height=Math.ceil(height*scale);
  const ctx=c.getContext('2d')!;ctx.setTransform(c.width/width,0,0,c.height/height,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  return c;
}
