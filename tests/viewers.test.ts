import assert from 'node:assert/strict';
import { Game } from '../src/game/engine';
import { CHAR_CATEGORIES, CHAR_IDS, CHARS } from '../src/game/data';
import type { CharId } from '../src/game/data';
import { DEFAULT_BINDINGS, keyboard } from '../src/game/input';
import { touchInput } from '../src/game/touch';
import { captureState, applyState } from '../src/game/net-state';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
const make=(a:CharId='santox',b:CharId='caetano')=>{keyboard.down.clear();touchInput.clear();const g=new Game({mode:'training',p1:a,p2:b,difficulty:'normal',bindings:DEFAULT_BINDINGS},()=>{});g.train.dummy=3;g.f[0].x=500;g.f[1].x=820;return g;};
const step=(g:Game,n:number)=>{for(let i=0;i<n;i++)g.step()};
assert.equal(CHAR_IDS.length,18);assert.deepEqual(CHAR_CATEGORIES.Viewers,['santox','jao','jane','cristyan','patrick','gabrielzin','ulisses','felipence','hdsh']);assert.equal(CHARS.santox.name,'1SANT0X');assert.equal(CHARS.jao.name,'JaoDoPikles');
for(const [distance,guard,expected] of [[320,false,52],[440,false,0],[320,true,1.82]] as const){
 const g=make();g.f[1].x=500+distance;if(guard)keyboard.down.add('Numpad3');g.startMove(g.f[0],CHARS.santox.moves.s1);step(g,80);assert(Math.abs(g.f[1].maxHp-g.f[1].hp-expected)<.01,'elastic range/block/damage');g.destroy();
}
{
 const g=make();g.f[1].x=1500;g.startMove(g.f[0],CHARS.santox.moves.s1);step(g,29);assert.equal(g.f[0].state,'attack');g.f[1].x=g.f[0].x+80;g.f[1].facing=-1;g.startMove(g.f[1],CHARS.caetano.moves.pL);step(g,8);assert(g.f[0].hp<g.f[0].maxHp,'elastic recovery can be punished');g.destroy();
}
{
 const g=make();g.f[1].x=600;assert(g.startMove(g.f[0],CHARS.santox.moves.s2));assert.equal(g.startMove(g.f[0],CHARS.santox.moves.s2),false,'no infinite air kicks');let landed=false;
 for(let i=0;i<65;i++){g.step();assert(Number.isFinite(g.f[0].y));if(g.f[0].y===0){assert(g.f[0].landLag>=12,'vulnerable landing');landed=true;break}}
 assert(landed);assert(g.f[1].hp<g.f[1].maxHp);g.destroy();
}
{
 const g=make();g.f[1].x=1500;g.startMove(g.f[0],CHARS.santox.moves.s3);let immune=0;for(let i=0;i<70;i++){g.step();if(g.f[0].invuln>0)immune++}assert.equal(immune,18,'only 0.3 seconds invulnerable');assert.equal(g.startMove(g.f[0],CHARS.santox.moves.s3),false,'no invulnerability spam');const cd=g.f[0].fourthCooldown;g.paused=true;step(g,30);assert.equal(g.f[0].fourthCooldown,cd);g.paused=false;step(g,cd);assert(g.startMove(g.f[0],CHARS.santox.moves.s3));g.resetPositions();assert.equal(g.f[0].fourthCooldown,0);g.destroy();
}
for(const when of ['startup','active','recovery'] as const){
 const g=make();g.f[1].x=580;g.startMove(g.f[0],CHARS.santox.moves.s3);step(g,when==='startup'?1:when==='active'?12:32);g.startMove(g.f[1],CHARS.caetano.moves.pL);g.f[1].moveT=CHARS.caetano.moves.pL.startup;g.step();assert.equal(g.f[0].hp<g.f[0].maxHp,when!=='active','fourth wall '+when);g.destroy();
}
{
 const g=make('santox','rickzera');g.startMove(g.f[0],CHARS.santox.moves.s3);step(g,12);g.projectiles.push({owner:1,kind:'franco',x:g.f[0].x,y:-104,vx:0,life:2,serial:1,move:CHARS.rickzera.moves.s1});g.step();assert.equal(g.f[0].hp,g.f[0].maxHp,'evades projectiles');g.destroy();
}
{
 const g=make('jao'),plain=make('jao');g.f[1].x=plain.f[1].x=730;g.startMove(g.f[0],CHARS.jao.moves.s1);step(g,25);assert.equal(g.projectiles.filter(p=>p.kind==='chess').length,1);const hp=g.f[1].hp;
 keyboard.down.add('ArrowRight');const before=g.f[1].x,baseline=plain.f[1].x;g.step();plain.step();assert(Math.abs((g.f[1].x-before)/(plain.f[1].x-baseline)-.65)<.001,'35% grounded slow');keyboard.down.clear();
 g.f[1].x=730;g.f[1].y=-20;g.f[1].state='jump';g.f[1].vx=4;const airX=g.f[1].x;g.step();assert.equal(g.f[1].x-airX,4,'jump escapes slow');
 g.startMove(g.f[0],CHARS.jao.moves.s1);step(g,25);assert.equal(g.projectiles.filter(p=>p.kind==='chess').length,1,'one board per player');step(g,181);assert(!g.projectiles.some(p=>p.kind==='chess'));assert.equal(g.f[1].hp,hp,'board causes no damage');g.destroy();plain.destroy();
}
{
 const g=make('jao','rickzera');g.startMove(g.f[0],CHARS.jao.moves.s1);step(g,60);g.f[1].x=590;g.f[1].facing=-1;g.startMove(g.f[1],CHARS.rickzera.moves.pL);step(g,12);assert(g.f[0].hp<g.f[0].maxHp);assert(!g.projectiles.some(p=>p.kind==='chess'&&p.life>0),'hitting caster breaks control');g.destroy();
}
for(const [move,damage] of [['s2',44],['s3',62]] as const){const g=make('jao');g.startMove(g.f[0],CHARS.jao.moves[move]);step(g,95);assert.equal(g.f[1].maxHp-g.f[1].hp,damage,'one projectile hit: '+move);g.destroy();}
{
 const g=make('jao');g.f[0].x=100;g.f[1].x=1550;g.startMove(g.f[0],CHARS.jao.moves.s3);let bounces=0;for(let i=0;i<130;i++){g.step();bounces=Math.max(bounces,...g.projectiles.map(p=>p.bounces??0))}assert.equal(bounces,1);assert.equal(g.projectiles.length,0,'ball expires');g.destroy();
}
for(const ch of ['santox','jao'] as const){
 const g=make(ch);g.f[1].x=1500;for(let i=0;i<3;i++)assert(g.startMove(g.f[0],CHARS[ch].moves[ch==='santox'?'s1':'s2']));assert.equal(g.f[0].rangedCooldown,300);assert.equal(g.startMove(g.f[0],CHARS[ch].moves[ch==='santox'?'s1':'s3']),false);assert(g.startMove(g.f[0],CHARS[ch].moves.pL));g.destroy();
 const close=make(ch);close.f[1].x=580;(close as any).startSuper(close.f[0]);step(close,400);assert.equal(close.train.total,ch==='santox'?240:260,'finite modest Ultimate damage');assert.equal(close.train.maxCombo,4,'four actual Ultimate impacts');close.destroy();
 const far=make(ch);far.f[1].x=1500;(far as any).startSuper(far.f[0]);step(far,250);assert.equal(far.f[1].hp,far.f[1].maxHp,'Ultimate whiffs at long distance');far.destroy();
}
{
 const g=make('santox','jao'),copy=make('santox','jao');g.startMove(g.f[0],CHARS.santox.moves.s3);g.startMove(g.f[1],CHARS.jao.moves.s1);step(g,25);const s=JSON.parse(JSON.stringify(captureState(g)));assert(applyState(copy,s));assert.equal(copy.f[0].fourthCooldown,g.f[0].fourthCooldown);assert.equal(copy.projectiles[0].kind,'chess');assert.equal(copy.projectiles[0].life,g.projectiles[0].life);g.destroy();copy.destroy();
}
{
 const g=make();g.startChallenge('special');g.train.dummy=3;g.startMove(g.f[0],CHARS.santox.moves.s3);step(g,12);assert.equal(g.challenge?.current,0,'casting evasion alone gives no reward');g.f[1].x=g.f[0].x+80;g.f[1].facing=-1;g.startMove(g.f[1],CHARS.caetano.moves.pL);g.f[1].moveT=4;g.step();assert.equal(g.challenge?.current,1,'actual dodge counts');step(g,70);
 g.f[0].x=500;g.f[1].x=820;g.startMove(g.f[0],CHARS.santox.moves.s1);step(g,80);g.f[1].x=610;g.startMove(g.f[0],CHARS.santox.moves.s2);step(g,70);assert(g.challenge?.done,'Santox can complete Arsenal');g.destroy();
}
{
 const g=make('jao');g.startChallenge('special');g.train.dummy=3;g.f[0].x=500;g.f[1].x=730;g.startMove(g.f[0],CHARS.jao.moves.s1);step(g,25);assert.equal(g.challenge?.current,0,'empty board gives no reward');keyboard.down.add('ArrowRight');g.step();keyboard.down.clear();assert.equal(g.challenge?.current,1,'actual board control counts');step(g,50);
 g.f[1].x=820;g.startMove(g.f[0],CHARS.jao.moves.s2);step(g,95);g.f[1].x=820;g.startMove(g.f[0],CHARS.jao.moves.s3);step(g,95);assert(g.challenge?.done,'Jao can complete Arsenal');g.destroy();
}
console.log('Viewers: real range/block/recovery, rabbit hop/landing, timed fourth-wall evasion/cooldown, limited chess control/escape/counterplay, formula/ball hits, shared ranged cooldown, balanced Ultimates, online snapshots and both Arsenal challenges passed.');
