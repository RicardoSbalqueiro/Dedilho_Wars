import assert from 'node:assert/strict';
import {Game} from '../src/game/engine';
import {CHAR_IDS,CHARS,RANGED_MOVES} from '../src/game/data';
import {DEFAULT_BINDINGS,keyboard} from '../src/game/input';
import {touchInput} from '../src/game/touch';
import {captureState,applyState} from '../src/game/net-state';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
let count=0;const test=(name:string,fn:()=>void)=>{try{fn();count++}catch(cause){throw new Error(name,{cause})}};
const make=(side:0|1=0)=>{keyboard.down.clear();touchInput.clear();const g=new Game({mode:'training',p1:'rickzera',p2:side===1?'rickzera':'caetano',difficulty:'normal',bindings:DEFAULT_BINDINGS},()=>{});g.train.dummy=3;g.f[side].x=side===0?300:1300;g.f[1-side].x=side===0?1300:300;g.f[side].energy=100;return g};
const step=(g:Game,n:number)=>{for(let i=0;i<n;i++)g.step()};
for(const side of [0,1] as const)for(const mirrored of [false,true])for(const method of ['keyboard','touch'] as const)test(`three energy orbs through ${method}, P${side+1}, mirrored=${mirrored}`,()=>{
 const g=make(side);try{const f=g.f[side];if(mirrored){f.facing=-f.facing as 1|-1;f.manualFacing=true;}
 const action='s1';if(method==='keyboard')keyboard.down.add(DEFAULT_BINDINGS[side][action][0]);else {touchInput.set(8,[action]);if(side===1){touchInput.clear();f.pad.tap(action,g.tick);}}
 let max=0;const serials=new Set<number>();for(let i=0;i<40;i++){g.step();const shots=g.projectiles.filter(p=>p.owner===side&&p.kind==='energy');max=Math.max(max,shots.length);for(const p of shots){serials.add(p.serial);assert.equal(Math.sign(p.vx),f.facing);assert.equal(p.launchFacing,f.facing);}}
 assert.equal(max,3);assert.equal(serials.size,1);assert.equal(f.rangedUses,1);assert.equal(f.energy,84);assert(f.stamina<120);
 }finally{g.destroy();keyboard.down.clear();touchInput.clear();}
});
for(const mirrored of [false,true])test(`Soco de Energia is a blockable traveling fist, mirrored=${mirrored}`,()=>{const g=make();try{const [f,d]=g.f;f.x=mirrored?900:500;d.x=f.x+(mirrored?-220:220);f.facing=mirrored?-1:1;f.manualFacing=true;g.startMove(f,f.def.moves.s2);let saw=false;for(let i=0;i<65;i++){g.step();saw||=g.projectiles.some(p=>p.kind==='energyFist');}assert(saw);assert.equal(d.maxHp-d.hp,72);assert.equal(f.energy,78);assert.equal(f.rangedUses,1);assert(!g.parts.some(p=>p.type==='crater'));assert(!f.armor);}finally{g.destroy();}});
test('standing guard blocks the projected fist, normal damage is not doubled with HP',()=>{const g=make();try{const[f,d]=g.f;f.x=500;d.x=720;keyboard.down.add('Numpad3');g.startMove(f,f.def.moves.s2);step(g,65);assert(Math.abs(d.maxHp-d.hp-1.08)<.001);assert.equal(d.maxHp,2000);}finally{g.destroy();keyboard.down.clear();}});
test('three ranged activations share a cooldown and cannot spend energy on rejected input',()=>{const g=make();try{const f=g.f[0];for(const id of ['s1','s2','s1'])assert(g.startMove(f,f.def.moves[id]));assert.equal(f.rangedCooldown,300);const energy=f.energy;assert(!g.startMove(f,f.def.moves.s2));assert.equal(f.energy,energy);assert(RANGED_MOVES.rickzera.includes('s2'));}finally{g.destroy();}});
test('already-fired energy retains launch direction after manual turn and online snapshots',()=>{const g=make(),copy=make();try{const f=g.f[0];g.startMove(f,f.def.moves.s2);step(g,22);const p=g.projectiles.find(p=>p.kind==='energyFist')!;assert(p);f.facing=-1;f.manualFacing=true;const s=JSON.parse(JSON.stringify(captureState(g)));assert(applyState(copy,s));assert.equal(copy.projectiles[0].vx,p.vx);assert.equal(copy.projectiles[0].launchFacing,1);assert.equal(copy.f[0].facing,-1);assert.equal(copy.f[0].energy,f.energy);}finally{g.destroy();copy.destroy();}});
for(const ch of CHAR_IDS)test(`energy kit has finite damage and valid state against ${ch}`,()=>{keyboard.down.clear();touchInput.clear();const g=new Game({mode:'training',p1:'rickzera',p2:ch,difficulty:'normal',bindings:DEFAULT_BINDINGS},()=>{});try{g.train.dummy=3;g.f[0].x=500;g.f[1].x=700;g.f[0].energy=100;g.startMove(g.f[0],CHARS.rickzera.moves.s1);step(g,75);assert(g.f[1].maxHp-g.f[1].hp<=72);assert(g.f.every(f=>Number.isFinite(f.hp)&&Number.isFinite(f.x)));}finally{g.destroy();}});
console.log(`Rickzera energy redesign: ${count} regressions passed (triple orbs, ranged green fist, keyboard/touch/P2/mirroring, energy costs, cooldown, guard, launch orientation, snapshots and all 18 targets).`);
