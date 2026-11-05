import assert from 'node:assert/strict';
import { Game } from '../src/game/engine';
import { CHARS,CHAR_CATEGORIES,CHAR_IDS } from '../src/game/data';
import type { CharId } from '../src/game/data';
import { DEFAULT_BINDINGS,keyboard } from '../src/game/input';
import { touchInput } from '../src/game/touch';
import { captureState,applyState } from '../src/game/net-state';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
const make=(a:CharId='jane',b:CharId='caetano',mode:'training'|'versus'='training')=>{keyboard.down.clear();touchInput.clear();const g=new Game({mode,p1:a,p2:b,difficulty:'normal',bindings:DEFAULT_BINDINGS},()=>{});g.train.dummy=3;g.phase='fight';g.f[0].x=500;g.f[1].x=850;return g};
const step=(g:Game,n:number)=>{for(let i=0;i<n;i++)g.step()};
const activeBike=(g:Game)=>{keyboard.down.add('KeyI');for(let i=0;i<25&&g.f[0].bikeTicks<1;i++)g.step();assert.equal(g.f[0].move?.id,'s2');assert(g.f[0].bikeTicks>0)};
assert.equal(CHAR_IDS.length,13);assert(CHAR_CATEGORIES.Viewers.includes('jane'));assert(CHAR_CATEGORIES.Viewers.includes('cristyan'));assert(CHAR_CATEGORIES.Especiais.includes('eneas'));
assert(CHARS.jane.hurtH<CHARS.caetano.hurtH*.7);assert(CHARS.jane.hp<900,'small hurtbox trades off health');
{
 const g=make();g.startMove(g.f[0],CHARS.jane.moves.s1);let shots=0;for(let i=0;i<90;i++){g.step();shots=Math.max(shots,g.projectiles.length)}assert.equal(shots,2);assert.equal(g.f[0].rangedUses,1,'one use per Java pair');assert(Math.abs(g.f[1].maxHp-g.f[1].hp-34.2)<.001,'second Java contact receives 90% combo damage');g.destroy();
}
{
 const g=make();g.f[1].x=1500;activeBike(g);step(g,40);const active=g.f[0].bikeTicks;g.paused=true;step(g,200);assert.equal(g.f[0].bikeTicks,active,'pause does not consume bike time');g.paused=false;
 while(g.f[0].bikeTicks<300)g.step();assert.equal(g.f[0].state,'attack','five seconds is allowed');g.step();assert.equal(g.f[0].state,'dizzy','holding longer crashes');assert.equal(g.f[0].bikeDizzy,60);assert.equal(g.f[0].bikeCooldown,180);assert.equal(g.f[0].invuln,0);assert.equal(g.f[0].move,null);
 keyboard.down.clear();keyboard.down.add('KeyJ');const serial=g.f[0].serial;step(g,59);assert.equal(g.f[0].state,'dizzy');assert.equal(g.f[0].serial,serial,'cannot attack while dizzy');g.step();assert.equal(g.f[0].state,'ground');assert.equal(g.f[0].bikeDizzy,0);assert.equal(g.f[0].bikeCooldown,120);assert.equal(g.startMove(g.f[0],CHARS.jane.moves.s2),false);keyboard.down.clear();step(g,120);assert(g.startMove(g.f[0],CHARS.jane.moves.s2));g.resetPositions();assert.equal(g.f[0].bikeCooldown,0);assert.equal(g.f[0].bikeTicks,0);g.destroy();
}
{
 const g=make();g.f[1].x=1500;activeBike(g);step(g,40);keyboard.down.clear();step(g,28);assert.equal(g.f[0].state,'ground');assert.equal(g.f[0].bikeDizzy,0,'release avoids fall');assert(g.f[0].bikeCooldown>0);g.destroy();
}
for(const block of [false,true]){
 const g=make('jane','caetano','versus');if(block)keyboard.down.add('Numpad3');activeBike(g);
 for(let i=0;i<330;i++){g.f[1].x=g.f[0].x+80;g.step()}
 assert.equal(g.f[0].bikeHits,6,'bounded contacts, including block');const damage=g.f[1].maxHp-g.f[1].hp;assert(damage>0&&damage<=(block?9:90),'bounded bike damage');assert(g.f[0].bikeDizzy>0);g.destroy();
}
{
 const g=make('jane','cristyan');g.f[1].x=1500;activeBike(g);g.f[1].x=g.f[0].x+150;g.f[1].facing=-1;g.startMove(g.f[1],CHARS.cristyan.moves.s1);g.f[1].moveT=CHARS.cristyan.moves.s1.startup;g.step();assert(g.f[0].hp<g.f[0].maxHp,'bike can be interrupted');assert.equal(g.f[0].move,null);assert.equal(g.f[0].bikeCooldown,180);g.destroy();
}
{
 const g=make();g.f[1].x=1500;activeBike(g);while(g.f[0].bikeTicks<301)g.step();g.f[1].x=g.f[0].x+80;g.f[1].facing=-1;g.startMove(g.f[1],CHARS.caetano.moves.pL);g.f[1].moveT=4;g.step();assert(g.f[0].hp<g.f[0].maxHp,'dizziness is punishable');assert.equal(g.f[0].state,'hit');g.destroy();
}
for(const dir of [1,-1] as const){
 const g=make();g.f[0].x=800;g.f[1].x=800+dir*90;g.f[0].facing=dir;g.f[1].facing=dir===1?-1:1;g.startMove(g.f[0],CHARS.jane.moves.s3);step(g,70);assert.equal(g.f[1].maxHp-g.f[1].hp,58);assert.equal(g.f[0].facing,dir===1?-1:1);assert((g.f[0].x-g.f[1].x)*dir>0,'passes under and turns to kick');g.destroy();
}
{
 const g=make();g.f[1].x=570;g.f[1].facing=-1;g.startMove(g.f[0],CHARS.jane.moves.s3);g.startMove(g.f[1],CHARS.caetano.moves.cK);g.f[1].moveT=8;g.step();assert(g.f[0].hp<g.f[0].maxHp,'low attack interrupts slide');assert.equal(g.f[0].move,null);g.destroy();
}
for(const [move,dmg] of [['s1',62],['s2',90],['s3',74]] as const){
 const g=make('cristyan');g.f[1].x=620;const x=g.f[1].x;g.startMove(g.f[0],CHARS.cristyan.moves[move]);step(g,95);assert.equal(g.f[1].maxHp-g.f[1].hp,dmg,'single Muay Thai hit '+move);assert(g.f[1].x>x,'knockback '+move);g.destroy();
}
{
 const g=make('cristyan');g.f[1].x=1500;g.startMove(g.f[0],CHARS.cristyan.moves.s2);step(g,28);g.f[1].x=g.f[0].x+80;g.f[1].facing=-1;g.startMove(g.f[1],CHARS.caetano.moves.pL);g.f[1].moveT=4;g.step();assert(g.f[0].hp<g.f[0].maxHp,'power punch whiff can be punished');g.destroy();
}
{
 const g=make('eneas');g.startMove(g.f[0],CHARS.eneas.moves.s2);for(let i=0;i<100&&g.f[1].hp===g.f[1].maxHp;i++)g.step();assert.equal(g.f[1].maxHp-g.f[1].hp,46);assert(g.parts.some(p=>p.text==='CASO GRAVE!'));g.destroy();
}
for(const block of [false,true]){
 const g=make('eneas');if(block)keyboard.down.add('Numpad3');g.startMove(g.f[0],CHARS.eneas.moves.s3);let lift=false,slam=false,shots=0;
 for(let i=0;i<110;i++){g.step();shots=Math.max(shots,g.projectiles.length);if(g.f[1].vy<0&&g.f[1].hp<g.f[1].maxHp)lift=true;if(g.f[1].vy>=9&&g.f[1].hp<g.f[1].maxHp-40)slam=true}
 assert.equal(shots,2);assert.equal(g.f[0].rangedUses,1);assert(Math.abs(g.f[1].maxHp-g.f[1].hp-(block?1.55:58.6))<.01,'finite 56 damage, scaled second hit and reduced individual chip');if(!block){assert(lift,'5 launches');assert(slam,'6 spikes toward floor')}g.destroy();
}
for(const [ch,dmg] of [['jane',250],['cristyan',260],['eneas',275]] as const){
 const g=make(ch);g.f[1].x=580;(g as any).startSuper(g.f[0]);step(g,420);assert.equal(g.train.total,dmg,'bounded Ultimate '+ch);g.destroy();
 const far=make(ch);far.f[1].x=1500;(far as any).startSuper(far.f[0]);step(far,250);assert.equal(far.f[1].hp,far.f[1].maxHp,'Ultimate has finite capture range '+ch);far.destroy();
}
{
 const g=make('cristyan','jane'),copy=make('cristyan','jane');g.cfg.online=true;g.onlineInputs=[0,1<<8];for(let i=0;i<340&&g.f[1].bikeDizzy===0;i++)g.step();assert.equal(g.f[1].state,'dizzy','guest hold crashes too');assert(applyState(copy,JSON.parse(JSON.stringify(captureState(g)))));assert.equal(copy.f[1].bikeDizzy,60);assert.equal(copy.f[1].bikeCooldown,180);assert.equal(copy.f[1].bikeHits,g.f[1].bikeHits);g.destroy();copy.destroy();
}
for(const ch of ['jane','cristyan','eneas'] as const){
 const g=make(ch);g.startChallenge('special');g.train.dummy=3;
 for(const move of ['s1','s2','s3']){
  g.f[0].x=500;g.f[0].facing=1;g.f[1].x=590;g.f[1].y=0;g.f[1].state='ground';g.f[1].invuln=0;
  if(ch==='jane'&&move==='s2'){activeBike(g);step(g,25);keyboard.down.clear();step(g,70)}
  else {g.startMove(g.f[0],CHARS[ch].moves[move]);step(g,95)}
 }
 assert(g.challenge?.done,'Arsenal works with '+ch);g.destroy();
}
console.log('Trio: Java volley, five-second hold/early release/crash, exactly one-second vulnerable dizziness, three-second cooldown, six-hit cap, slide/counterplay, Muay Thai hits/recovery, ECG/56 launch-spike, bounded Ultimates, guest snapshots and all three Arsenal challenges passed.');
