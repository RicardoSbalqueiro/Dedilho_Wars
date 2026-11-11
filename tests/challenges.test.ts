import assert from 'node:assert/strict';
import { Game } from '../src/game/engine';
import { DEFAULT_BINDINGS,keyboard } from '../src/game/input';
import { TRAINING_CHALLENGES,challengeAvailable } from '../src/game/challenges';
import type { ChallengeId } from '../src/game/challenges';
import type { CharId } from '../src/game/data';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
const make=(id:ChallengeId,ch:CharId='aneninha')=>{const g=new Game({mode:'training',p1:ch,p2:'caetano',difficulty:'normal',bindings:DEFAULT_BINDINGS},()=>{});g.startChallenge(id);return g};
const step=(g:Game,n:number)=>{for(let i=0;i<n;i++)g.step()};
const hit=(g:Game,id:string)=>{g.resetPositions();g.f[0].x=650;g.f[1].x=750;if(id.startsWith('j')){g.f[0].y=-30;g.f[0].vy=-5}g.startMove(g.f[0],g.f[0].def.moves[id]);step(g,160)};
for(const [id,move,count] of [['hits','pL',5],['low','cK',3],['air','jK',2],['damage','s1',6]] as const){const g=make(id);for(let i=0;i<count;i++)hit(g,move);assert(g.challenge?.done,id);g.destroy()}
{
 const g=make('special');for(const move of ['s1','s2','s3'])hit(g,move);assert(g.challenge?.done,'all3 unique specials');g.destroy();
}
{
 const g=make('combo','rickzera');hit(g,'s1');assert(g.challenge?.done,'3 Swiss notes complete the projectile combo');g.destroy();
}
{
 const g=make('jump');for(let i=0;i<5;i++){keyboard.down.add('KeyW');g.step();keyboard.down.clear();step(g,65)}assert(g.challenge?.done,'5 jumps');g.destroy();
}
{
 const g=make('dash');for(let i=0;i<3;i++){keyboard.down.add('KeyD');g.step();keyboard.down.clear();g.step();keyboard.down.add('KeyD');g.step();keyboard.down.clear();step(g,35)}assert(g.challenge?.done,'3 double-tap dashes');g.destroy();
}
{
 const g=make('crouch');keyboard.down.add('KeyS');step(g,180);keyboard.down.clear();assert(g.challenge?.done,'3 seconds crouch');g.destroy();
}
{
 const g=make('block');g.train.dummy=3;g.f[1].cpu=false;assert.equal(g.challenge?.current,0);keyboard.down.add('KeyE');step(g,60);assert.equal(g.challenge?.current,0,'holding block alone does not count');
 for(let i=0;i<3;i++){g.resetPositions();g.f[0].x=650;g.f[1].x=740;g.step();g.startMove(g.f[1],g.f[1].def.moves.pL);step(g,55)}keyboard.down.clear();assert(g.challenge?.done,'3 real blocked hits');g.destroy();
}
{
 const g=make('super');(g as any).startSuper(g.f[0]);step(g,450);assert(g.challenge?.done,'connected super');g.destroy();
}
{
 const g=make('range');for(let i=0;i<3;i++)g.startMove(g.f[0],g.f[0].def.moves.s3);assert(!g.challenge?.done,'wait is required');step(g,300);assert(g.challenge?.done,'cooldown completed');g.startChallenge(null);assert.equal(g.challenge,null);g.destroy();
}
{
 const g=make('turn');for(let i=0;i<3;i++){keyboard.down.add('KeyQ');g.step();keyboard.down.clear();g.step()}assert(g.challenge?.done,'3 legal manual turns');g.destroy();
}
for(const id of ['perfect','blockLow'] as const){
 const g=make(id);assert.equal(g.train.dummy,1,'defensive drills activate CPU');g.train.dummy=3;g.f[1].cpu=false;
 for(let i=0;i<3;i++){
  keyboard.down.clear();g.resetPositions();g.f[0].x=650;g.f[1].x=725;
  if(id==='blockLow')keyboard.down.add('KeyS');keyboard.down.add('KeyE');
  const f=g.f[1];g.startMove(f,f.def.moves[id==='blockLow'?'cK':'pL']);f.moveT=f.move!.startup;g.step();
  assert.equal(g.f[0].state,'block');
 }
 assert(g.challenge?.done,id+' requires three actual blocks');keyboard.down.clear();g.destroy();
}
assert.equal(TRAINING_CHALLENGES.length,18);assert.equal(challengeAvailable('range','caetano'),false);assert.equal(challengeAvailable('range','nomad'),true);
console.log('All15 training challenges completed by actual hits, blocks/perfect/low blocks, turns, movement, combo, super or cooldown. No false defense reward.');
