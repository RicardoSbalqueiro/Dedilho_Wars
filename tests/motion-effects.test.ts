import assert from 'node:assert/strict';
import {CHARS} from '../src/game/data';
import type {Fighter,Game} from '../src/game/engine';
import {drawForceRibbons,drawGuardMotion,drawMotionEnvironment,motionEffectBudget,sampleLandingEffect,sampleMotionDust} from '../src/game/motion-effects';
import {settings} from '../src/game/visual-settings';
import {resetVisualBudget} from '../src/game/visual-budget';

let count=0;
function test(name:string,fn:()=>void){try{fn();count++}catch(cause){throw Error(name,{cause})}}
function fighter(overrides:Partial<Fighter>={}):Fighter{
 return {idx:0,ch:'rickzera',def:CHARS.rickzera,x:700,y:0,vx:7,vy:0,facing:1,
  state:'dash',stateT:7,animT:17,hidden:false,walking:0,landLag:0,guard:false,
  guardMeter:100,guardBreakT:0,impact:null,crouch:false,formT:0,move:null,moveT:0,
  connected:false,...overrides} as Fighter;
}
function game(f=fighter()):Game{
 return {tick:10,phase:'fight',seq:null,cine:null,clash:null,f:[f,fighter({idx:1,x:950,vx:-7})]} as Game;
}
class Context{
 globalAlpha=1;strokeStyle:string|CanvasGradient|CanvasPattern='';fillStyle:string|CanvasGradient|CanvasPattern='';
 globalCompositeOperation:GlobalCompositeOperation='source-over';lineWidth=1;lineCap:CanvasLineCap='butt';lineJoin:CanvasLineJoin='miter';
 paths:{op:string;values:number[];alpha:number}[]=[];stack:number[]=[];
 save(){this.stack.push(this.globalAlpha)}restore(){this.globalAlpha=this.stack.pop()!}
 record(op:string,...values:number[]){assert(values.every(Number.isFinite),op);assert(this.globalAlpha>=0&&this.globalAlpha<=1,op+' alpha');this.paths.push({op,values,alpha:this.globalAlpha})}
 beginPath(){}ellipse(...args:number[]){this.record('ellipse',...args)}moveTo(...args:number[]){this.record('move',...args)}lineTo(...args:number[]){this.record('line',...args)}
 quadraticCurveTo(...args:number[]){this.record('quadratic',...args)}bezierCurveTo(...args:number[]){this.record('bezier',...args)}
 stroke(){this.record('stroke')}fill(){this.record('fill')}
 get ctx(){return this as unknown as CanvasRenderingContext2D}
}
const oldEffects=settings.effects,oldReduced=settings.reducedFlash;
try{
 settings.effects='full';settings.reducedFlash=false;resetVisualBudget();
 test('dash dust is behind signed motion and mirrors exactly in world space',()=>{
  const f=fighter(),a=sampleMotionDust(f),b=sampleMotionDust({...f,vx:-f.vx});assert.equal(a.length,b.length);assert.equal(a.length,motionEffectBudget().dust);
  for(let i=0;i<a.length;i++){assert(a[i].x<f.x);assert(b[i].x>f.x);assert(Math.abs(a[i].x+b[i].x-f.x*2)<.0001);assert.equal(a[i].y,b[i].y);assert(a[i].y>420);}
 });
 test('idle, hidden, airborne and stationary fighters emit no ground dust',()=>{
  for(const overrides of [{state:'ground',walking:0},{hidden:true},{y:-5},{vx:0}] as Partial<Fighter>[]){assert.equal(sampleMotionDust(fighter(overrides)).length,0);}
 });
 test('light detail and reduced flash visibly reduce bounded cosmetic work',()=>{
  const f=fighter(),full=sampleMotionDust(f);settings.effects='light';assert(sampleMotionDust(f).length<full.length);settings.reducedFlash=true;
  const reduced=sampleMotionDust(f);settings.reducedFlash=false;const ordinary=sampleMotionDust(f);for(let i=0;i<reduced.length;i++)assert(reduced[i].alpha<ordinary[i].alpha);
  assert(motionEffectBudget().guardShards<=10);settings.effects='full';
 });
 test('an observed landing anchors its rings and never mutates the match',()=>{
  const f=fighter({state:'jump',y:-8,vy:10}),g=game(f);assert.equal(sampleLandingEffect(g,f),undefined);
  g.tick++;f.state='ground';f.y=0;f.vy=0;f.landLag=3;f.stateT=0;
  const before=JSON.stringify(g),land=sampleLandingEffect(g,f);assert(land);assert.equal(land.age,0);assert.equal(land.x,700);assert.equal(JSON.stringify(g),before);
  g.tick+=2;f.x=710;f.stateT=2;f.landLag=1;assert.equal(sampleLandingEffect(g,f)?.x,700);assert.equal(sampleLandingEffect(g,f)?.age,2);
  g.tick=30;assert.equal(sampleLandingEffect(g,f),undefined);
 });
 test('backward seeks and long gaps discard local landing history',()=>{
  const f=fighter({state:'ground',landLag:3,stateT:0}),g=game(f);assert(sampleLandingEffect(g,f));g.tick=9;f.stateT=3;f.landLag=0;assert.equal(sampleLandingEffect(g,f),undefined);
  g.tick=400;assert.equal(sampleLandingEffect(g,f),undefined);
 });
 test('motion floor pass stays finite, bounded, repeatable and outside simulation',()=>{
  const g=game(),before=JSON.stringify(g),a=new Context(),b=new Context();drawMotionEnvironment(a.ctx,g);drawMotionEnvironment(b.ctx,g);
  assert.deepEqual(a.paths,b.paths);assert.equal(JSON.stringify(g),before);assert(a.paths.length<100);assert.equal(a.stack.length,0);assert(a.paths.some(p=>p.op==='fill'));
  g.phase='intro';const c=new Context();drawMotionEnvironment(c.ctx,g);assert.equal(c.paths.length,0);
 });
 test('held guard contours leave the face clear and react to a real block',()=>{
  const f=fighter({guard:true,state:'block'}),a=new Context();drawGuardMotion(a.ctx,f,10);
  for(const p of a.paths.filter(p=>p.op==='ellipse'))assert(p.values[1]-p.values[3]>-f.def.hurtH*.8);
  f.impact={kind:'perfect',serial:1,strength:1,tick:10};const b=new Context();drawGuardMotion(b.ctx,f,12);assert(b.paths.length>a.paths.length);assert.equal(b.stack.length,0);
 });
 test('guard break sheds a finite set of outer pieces and expires',()=>{
  const f=fighter({state:'hit',guardBreakT:40,impact:{kind:'guardBreak',serial:1,strength:2,tick:10}}),a=new Context();
  drawGuardMotion(a.ctx,f,12);assert.equal(a.paths.filter(p=>p.op==='stroke').length,motionEffectBudget().guardShards);
  const b=new Context();drawGuardMotion(b.ctx,f,40);assert.equal(b.paths.length,0);
 });
 test('narrow force bands follow real attack phases and skip supers and grabs',()=>{
  const f=fighter({state:'attack',move:CHARS.rickzera.moves.pH,moveT:CHARS.rickzera.moves.pH.startup+1}),before=JSON.stringify(f),a=new Context();
  drawForceRibbons(a.ctx,f,1,120,-80,40);assert.equal(a.paths.filter(p=>p.op==='fill').length,motionEffectBudget().ribbons);assert.equal(JSON.stringify(f),before);assert.equal(a.stack.length,0);
  f.move={...f.move!,kind:'super'};const b=new Context();drawForceRibbons(b.ctx,f,1,120,-80,40);assert.equal(b.paths.length,0);
  f.move={...f.move!,kind:'special',grab:true};drawForceRibbons(b.ctx,f,1,120,-80,40);assert.equal(b.paths.length,0);
 });
 console.log(`${count} motion effect checks passed: direction, landing, guard, reduced flash, budgets and untouched simulation.`);
}finally{settings.effects=oldEffects;settings.reducedFlash=oldReduced;resetVisualBudget();}
