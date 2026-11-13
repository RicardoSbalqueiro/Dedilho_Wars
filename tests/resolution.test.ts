import assert from 'node:assert/strict';
import {canvasSize,CanvasSurface,stageDensity,MAX_SCENE_PIXELS,MAX_DETAIL_PIXELS} from '../src/game/canvas';
import {Game} from '../src/game/engine';
import {DEFAULT_BINDINGS,ACTIONS} from '../src/game/input';
import {captureState,ONLINE_PROTOCOL} from '../src/game/net-state';
(globalThis as any).window={devicePixelRatio:1,addEventListener(){},removeEventListener(){},setInterval(){return 0}};
let cases=0;
function test(name:string,fn:()=>void){try{fn();cases++}catch(e){throw new Error(name,{cause:e})}}
const scene=(w:number,h:number,dpr=1)=>canvasSize(960,540,w,h,dpr,'scene');
for(const [w,h,dpr,pw,ph] of [[1920,1080,1,1920,1080],[2560,1440,1,2560,1440],[3840,2160,1,3840,2160],[1920,1080,2,3840,2160],[1280,720,2,2560,1440],[1536,864,1.25,1920,1080],[390,219.375,3,1920,1080],[1920,1080,1.5,2880,1620],[3840,2160,2,3840,2160]])test(`${w}×${h}, DPR ${dpr}: native pixels, Full HD floor and 4K budget`,()=>{
 const p=scene(w,h,dpr);assert.equal(p.width,pw);assert.equal(p.height,ph);assert.equal(p.width/p.height,16/9);assert(p.width*p.height<=MAX_SCENE_PIXELS);
});
for(const [w,h] of [[1280,720],[1920,1080],[2560,1440],[3840,2160],[5120,2880],[7680,4320]])for(const dpr of [1,1.25,1.5,2,3,4])test(`large viewport ${w}, DPR ${dpr} stays bounded`,()=>{
 const p=scene(w,h,dpr);assert(p.width>=1920&&p.height>=1080);assert(p.width<=3840&&p.height<=2160);assert(p.width*p.height<=MAX_SCENE_PIXELS);assert(p.scaleX>0&&p.scaleY>0);
});
test('small portraits and previews get their own physical pixels, without allocating a full scene',()=>{
 const portrait=canvasSize(56,60,224,240,2);assert.equal(portrait.width,448);assert.equal(portrait.height,480);
 const preview=canvasSize(960,540,320,180,2);assert.equal(preview.width,640);assert.equal(preview.height,360);
 const gallery=canvasSize(680,380,1180,1180*380/680,2);assert.equal(gallery.width,2360);assert(gallery.height>=1318);assert(gallery.width*gallery.height<=MAX_DETAIL_PIXELS);
});
for(const n of [NaN,Infinity,-Infinity,0,-1])test(`invalid/hidden sizing ${n} cannot poison or overallocate a canvas`,()=>{
 for(const p of [scene(n,n,n),canvasSize(0,n,n,0,n)]){assert(Number.isFinite(p.width)&&Number.isFinite(p.height));assert(p.width>=1&&p.height>=1);assert(p.width*p.height<=MAX_SCENE_PIXELS)}
});
test('stage density is quantized and bounded independently of combat coordinates',()=>{
 assert.equal(stageDensity(.2),.5);assert.equal(stageDensity(2),2);assert.equal(stageDensity(2560/960),3);assert.equal(stageDensity(4),4);assert.equal(stageDensity(99),4);assert.equal(stageDensity(NaN),1);
});
function fake(){
 let w=960,h=540,cssW=1920,cssH=1080,writes=0;let alpha:boolean|undefined;const transforms:number[][]=[],style:Record<string,string>={};
 const ctx={setTransform(...n:number[]){transforms.push(n)},imageSmoothingEnabled:false,imageSmoothingQuality:'low'};
 const canvas={get width(){return w},set width(n:number){writes++;w=n},get height(){return h},set height(n:number){writes++;h=n},dataset:{},style:{setProperty(k:string,v:string){style[k]=v}},getContext(_type:string,options?:{alpha?:boolean}){alpha=options?.alpha;return ctx},getBoundingClientRect(){return {width:cssW,height:cssH}}};
 return {canvas:canvas as unknown as HTMLCanvasElement,ctx,transforms,style,alpha:()=>alpha,writes:()=>writes,resize(x:number,y:number){cssW=x;cssH=y}};
}
test('surface resizes backing storage only on a real resolution change and restores the world transform',()=>{
 const f=fake(),s=new CanvasSurface(f.canvas,960,540,'scene');assert(s.prepare());assert.equal(f.writes(),2);assert.equal(f.canvas.dataset.resolution,'1920x1080');assert.equal(f.style['--canvas-width'],'960px');assert.equal(f.style['--canvas-height'],'540px');
 for(let i=0;i<120;i++)assert(!s.prepare());assert.equal(f.writes(),2,'normal frames preserve the existing drawing buffer');assert.deepEqual(f.transforms.at(-1),[2,0,0,2,0,0]);assert(f.ctx.imageSmoothingEnabled);assert.equal(f.ctx.imageSmoothingQuality,'low');assert.equal(f.alpha(),false);
 f.resize(3840,2160);assert(s.prepare());assert.equal(f.writes(),4);assert.deepEqual(f.transforms.at(-1),[4,0,0,4,0,0]);
 f.resize(1920,1080);(window as any).devicePixelRatio=2;assert(!s.prepare(),'same physical size after moving to Retina');(window as any).devicePixelRatio=1;assert(s.prepare());assert.equal(f.canvas.width,1920);
});
test('portraits and other details preserve alpha and high-quality downsampling',()=>{
 const f=fake(),surface=new CanvasSurface(f.canvas,56,60);surface.prepare();assert.equal(f.alpha(),true);assert.equal(f.ctx.imageSmoothingQuality,'high');
});
test('repeated resize/DPR changes do not spend inputs, reset a match or change online state',()=>{
 const cfg={mode:'versus' as const,p1:'caetano' as const,p2:'cristyan' as const,difficulty:'normal' as const,bindings:DEFAULT_BINDINGS,online:true};
 const a=new Game(cfg,()=>{}),b=new Game(cfg,()=>{});a.phase=b.phase='fight';const f=fake(),surface=new CanvasSurface(f.canvas,960,540,'scene');
 try{
  for(let i=0;i<120;i++){
   if(i===0)a.onlinePressed[0]=b.onlinePressed[0]=1<<ACTIONS.indexOf('p');
   const before=JSON.stringify(captureState(a));
   for(const [width,height,dpr] of [[1920,1080,1],[3840,2160,1],[1280,720,2],[390,219,3]]){f.resize(width,height);(window as any).devicePixelRatio=dpr;surface.prepare();}
   assert.equal(JSON.stringify(captureState(a)),before,'pixel changes are presentation-only');
   a.step();b.step();assert.equal(a.tick,b.tick);assert.deepEqual(a.f.map(f=>[f.x,f.y,f.vx,f.vy,f.hp,f.meter,f.state,f.moveT,f.serial]),b.f.map(f=>[f.x,f.y,f.vx,f.vy,f.hp,f.meter,f.state,f.moveT,f.serial]));
  }
  assert.equal(ONLINE_PROTOCOL,'dw-online-13','resolution does not need a network protocol change');
 }finally{a.destroy();b.destroy();(window as any).devicePixelRatio=1}
});
console.log(`Resolution: ${cases} regressions passed (1080p/1440p/4K, Retina and browser zoom, bounded scene/detail buffers, invalid metrics, resize without reallocating normal frames, logical geometry and unchanged inputs/online simulation).`);
