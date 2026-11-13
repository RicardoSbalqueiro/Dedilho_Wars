import assert from 'node:assert/strict';
import {Game} from '../src/game/engine';
import {CHARS,CHAR_IDS} from '../src/game/data';
import type {CharId} from '../src/game/data';
import {DEFAULT_BINDINGS,ACTIONS} from '../src/game/input';
import {GUARD_RULES,SIGNATURES,STANDING_COMBO_LIMIT} from '../src/game/combat-evolution';
import {captureState,applyState,ONLINE_PROTOCOL} from '../src/game/net-state';
import {effectDetail,recordDrawCost,resetVisualBudget} from '../src/game/visual-budget';
import {settings} from '../src/game/visual-settings';
import {matchupLine,victoryLine} from '../src/game/presentation';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
let count=0;function test(name:string,fn:()=>void){try{fn();count++}catch(cause){throw Error(name,{cause})}}
function game(ch:CharId='caetano',other:CharId='rickzera'){const g=new Game({mode:'versus',online:true,p1:ch,p2:other,difficulty:'normal',bindings:DEFAULT_BINDINGS},()=>{});g.phase='fight';g.f[0].x=700;g.f[1].x=780;return g;}
function hit(g:Game,id='pH'){const[a,d]=g.f;a.move=a.def.moves[id];a.serial++;(g as any).applyHit(a,d,a.move,{x:d.x,y:350,dir:a.facing,serial:a.serial});}
for(const ch of CHAR_IDS)for(const low of [false,true])test(`${ch}: sustained guard breaks visibly, stays upright and recovers`,()=>{
 const g=game('rickzera',ch),[a,d]=g.f;try{d.crouch=low;d.pad.edgeAt.block=-999;const hp=d.hp;for(let i=0;i<5;i++){d.guard=true;d.state='ground';d.landLag=0;hit(g);if(d.guardBreakT)break;}
  assert.equal(d.guardMeter,0);assert.equal(d.guardBreakT,42);assert.equal(d.state,'hit');assert.equal(d.y,0);assert.equal(d.hp,hp,'breaking contact is still a blocked normal');assert.equal(d.guard,false);assert.equal(d.impact?.kind,'guardBreak');assert(g.arena.damage.some(n=>n>0));
  g.onlineInputs[1]=1<<ACTIONS.indexOf('block');for(let i=0;i<8;i++)g.step();assert(!d.guard);assert.equal(d.state,'hit');
  for(let i=0;i<80;i++)g.step();assert.equal(d.guardBreakT,0);assert(d.guardMeter>=GUARD_RULES.restore);assert(d.guard,'held guard returns after actual recovery');
  g.onlineInputs[1]=0;const before=d.guardMeter;for(let i=0;i<300;i++)g.step();assert(d.guardMeter>before&&d.guardMeter<=100);
 }finally{g.destroy()}
});
for(const ch of CHAR_IDS)test(`${ch}: timed defense preserves guard and active forms remain immune`,()=>{
 const g=game('rickzera',ch),[a,d]=g.f;try{d.guardMeter=2;d.guard=true;d.pad.edgeAt.block=g.tick;hit(g);assert(d.guardMeter>2);assert.equal(d.guardBreakT,0);
  d.formT=600;d.guard=true;const before={hp:d.hp,meter:d.guardMeter};a.formT=600;hit(g);assert.equal(d.hp,before.hp);assert.equal(d.guardMeter,before.meter);
  d.formT=0;d.guard=true;d.state='ground';hit(g);assert(d.hp<before.hp);assert.equal(d.guardMeter,0);assert(d.guardBreakT>0);
 }finally{g.destroy()}
});
for(const ch of CHAR_IDS)test(`${ch}: heavy normals sustain standing combos; deliberate sweep still launches`,()=>{
 const g=game(ch),d=g.f[1];try{for(let i=0;i<6;i++){hit(g,i%2?'kH':'pH');assert.equal(d.state,'hit');assert.equal(d.y,0);assert.equal(d.comboHits,i+1);}
  for(let i=6;i<STANDING_COMBO_LIMIT;i++)hit(g);assert.equal(d.state,'launched','finite extension limit');g.resetRound();g.phase='fight';hit(g,'cK');assert.equal(d.state,'launched','sweep retains its purpose');
 }finally{g.destroy()}
});
test('Felipence builds three resonance contacts, releases them on a real riff and loses them when hit',()=>{
 const g=game('felipence'),[a,d]=g.f;try{for(let i=0;i<3;i++)hit(g,'pL');assert.equal(a.resonance,3);const before=d.hp;hit(g,'s1');assert.equal(a.resonance,0);assert(before-d.hp>0);hit(g,'pL');assert.equal(a.resonance,1);(g as any).applyHit(d,a,d.def.moves.pL,{x:a.x,y:350,dir:d.facing,serial:d.serial});assert.equal(a.resonance,0);}finally{g.destroy()}
});
test('all eighteen signatures have distinct finite command orders and existing artwork',()=>{
 assert.equal(new Set(Object.values(SIGNATURES).map(s=>s.buttons)).size,18);for(const ch of CHAR_IDS){const s=SIGNATURES[ch];assert.equal(s.buttons.length,6);assert(/^[pk]+$/.test(s.buttons));assert(CHARS[ch].moves[s.art]);}
});
test('online 13 preserves guard, resonance and broken arena and rejects incompatible/corrupt snapshots atomically',()=>{
 const h=game('felipence'),g=game('felipence');try{h.f[0].guardMeter=12;h.f[0].resonance=3;h.arena={damage:[1,3,2],slot:1,tick:80,serial:4};const state=structuredClone(captureState(h));assert.equal(ONLINE_PROTOCOL,'dw-online-13');assert(applyState(g,state));assert.deepEqual(g.arena,h.arena);assert.equal(g.f[0].resonance,3);assert.equal(g.f[0].guardMeter,12);const before=JSON.stringify(captureState(g));assert(!applyState(g,{...state,v:'dw-online-12'}));state.g.arena={...h.arena,damage:[0,99,0]};assert(!applyState(g,state));assert.equal(JSON.stringify(captureState(g)),before);}finally{h.destroy();g.destroy()}
});
test('adaptive detail responds to measured paint cost; explicit preferences remain local',()=>{
 resetVisualBudget();settings.effects='auto';const first=effectDetail().rays;for(let i=0;i<80;i++)recordDrawCost(20);assert(effectDetail().rays<first);for(let i=0;i<500;i++)recordDrawCost(2);assert.equal(effectDetail().rays,first);settings.effects='light';assert.equal(effectDetail().particles,180);settings.effects='full';assert.equal(effectDetail().rays,42);settings.effects='auto';resetVisualBudget();
});
test('new rival pairs have answers and victory retorts in both directions',()=>{
 for(const [a,b]of [['rickzera','hdsh'],['jane','felipence'],['caetano','ulisses'],['orango','patrick']] as [CharId,CharId][]){assert.notEqual(matchupLine(a,b),matchupLine(a,'nomad'));assert.notEqual(victoryLine(a,b),victoryLine(b,a));}
});
test('real strong contacts progress arena damage through three stages and reset for a new round',()=>{
 const g=game();try{for(let i=0;i<3;i++){g.tick+=30;hit(g);assert.equal(g.arena.damage[1],i+1);}g.tick+=30;hit(g);assert.equal(g.arena.damage[1],3);g.resetRound();assert.deepEqual(g.arena.damage,[0,0,0]);}finally{g.destroy()}
});
test('the opening exchange is readable and an attack input skips to combat without forcing an attack',()=>{
 const g=game();try{g.phase='intro';g.phaseT=0;for(let i=0;i<100;i++)g.step();assert.equal(g.phase,'intro');g.onlinePressed[0]=1<<ACTIONS.indexOf('p');g.step();assert.equal(g.phase,'fight');assert.equal(g.f[0].move,null);}finally{g.destroy()}
});
test('the full first-round exchange enters combat after both rival responses',()=>{
 const g=game();try{g.phase='intro';g.phaseT=0;for(let i=0;i<284;i++)g.step();assert.equal(g.phase,'intro');g.step();assert.equal(g.phase,'fight');}finally{g.destroy()}
});
console.log(`${count} guard break, grounded combo, signature, resonance, arena, rivalry and adaptive detail checks passed.`);
