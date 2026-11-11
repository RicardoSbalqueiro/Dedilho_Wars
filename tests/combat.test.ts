import assert from 'node:assert/strict';
import { Game, METER_GAIN_SCALE } from '../src/game/engine';
import { CHAR_IDS, CHARS, RANGED_MOVES } from '../src/game/data';
import { DEFAULT_BINDINGS, keyboard } from '../src/game/input';
import { captureState,applyState } from '../src/game/net-state';
import { touchInput } from '../src/game/touch';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
const make=(a:any='nomad',b:any='caetano')=>new Game({mode:'training',p1:a,p2:b,difficulty:'normal',bindings:DEFAULT_BINDINGS},()=>{});
for(const ch of CHAR_IDS) {
 const g=make(ch),f=g.f[0],ranged=RANGED_MOVES[ch];f.energy=100;
 if(ranged.length){for(let n=0;n<3;n++)assert.equal(g.startMove(f,f.def.moves[ranged[n%ranged.length]]),true);assert.equal(f.rangedUses,3);assert.equal(f.rangedCooldown,300);const serial=f.serial;assert.equal(g.startMove(f,f.def.moves[ranged[0]]),false);assert.equal(f.serial,serial);
 assert.equal(g.startMove(f,f.def.moves.pL),true,'melee must still work');g.paused=true;for(let i=0;i<400;i++)g.step();assert.equal(f.rangedCooldown,300);g.paused=false;for(let i=0;i<299;i++)g.step();assert.equal(f.rangedCooldown,1);g.step();assert.equal(f.rangedUses,0);assert.equal(g.startMove(f,f.def.moves[ranged[0]]),true);
 g.resetPositions();assert.equal(f.rangedUses,0);assert.equal(f.rangedCooldown,0);
 } else {for(let i=0;i<5;i++)g.startMove(f,f.def.moves.s1);assert.equal(f.rangedCooldown,0)}g.destroy();
}
{
 const g=make('nomad');g.f[0].x=100;g.f[1].x=1500;g.startMove(g.f[0],CHARS.nomad.moves.s1);let maxShots=0;for(let i=0;i<34;i++){g.step();maxShots=Math.max(maxShots,g.projectiles.length)}assert.equal(maxShots,1);assert.equal(g.f[0].rangedUses,1,'burst counts once');g.destroy();
}
for(const ch of CHAR_IDS) {
 const g=make(ch),copy=make(ch);g.f[0].x=650;g.f[1].x=750;(g as any).startSuper(g.f[0]);let sawSeq=false;
 for(let i=0;i<450;i++){g.step();if(i%5===0){const state=JSON.parse(JSON.stringify(captureState(g)));assert(JSON.stringify(state).length<64000);assert(applyState(copy,state));assert.equal(copy.f[1].hp,g.f[1].hp);assert.equal(copy.f[0].rangedCooldown,g.f[0].rangedCooldown);if(copy.seq){sawSeq=true;assert.equal(copy.seq.a,copy.f[0]);assert.equal(copy.seq.d,copy.f[1]);}}}
 assert(sawSeq,ch+' online super sequence');if(ch==='bieu')assert.equal(g.train.total,270);if(ch==='nomad')assert.equal(g.train.total,285);g.destroy();copy.destroy();
}
assert.equal(METER_GAIN_SCALE,.5);assert.equal(CHARS.bieu.moves.s1.dmg,80);assert.equal(CHARS.nomad.moves.s2.dmg,72);
{
 const g=make();touchInput.set(10,['left','down']);g.step();assert.equal(g.f[0].pad.held.left,true);assert.equal(g.f[0].pad.held.down,true);assert.equal(g.f[1].pad.held.left,false);touchInput.set(11,['block']);g.step();assert.equal(g.f[0].pad.held.block,true);touchInput.set(10,[]);g.step();assert.equal(g.f[0].pad.held.left,false);assert.equal(g.f[0].pad.held.block,true);keyboard.down.add('KeyA');touchInput.clear();g.step();assert.equal(g.f[0].pad.held.left,true);keyboard.down.clear();g.destroy();
}
{
 const g=make();touchInput.set(50,['s1']);touchInput.set(50,[]);g.step();assert.equal(g.f[0].serial,1,'quick touch is buffered');g.destroy();touchInput.clear();
}
for(const a of CHAR_IDS)for(const b of CHAR_IDS){const g=make(a,b);g.train.dummy=1;for(let i=0;i<1100;i++)g.step();assert(g.f.every(f=>Number.isFinite(f.x)&&Number.isFinite(f.hp)));assert(g.f[1].serial>0);g.destroy()}
console.log('Combat: all18 fighters cooldown/reset/pause/melee, one charge per burst, modest nerfs, all18 online ULT snapshots and simultaneous touch/keyboard passed.');
