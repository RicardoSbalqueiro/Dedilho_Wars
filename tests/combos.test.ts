import assert from 'node:assert/strict';
import {Game,CANCEL_CONFIRM_FRAMES} from '../src/game/engine';
import {CHAR_IDS,CHARS} from '../src/game/data';
import type {CharId} from '../src/game/data';
import {COMBO_ROUTES,comboRoutes,newComboCoach,advanceComboCoach} from '../src/game/combos';
import type {ComboRoute} from '../src/game/combos';
import {ACTIONS,DEFAULT_BINDINGS,keyboard,Pad} from '../src/game/input';
import type {Action} from '../src/game/input';
import {touchInput} from '../src/game/touch';
import {captureState,applyState} from '../src/game/net-state';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
let cases=0;
const bit=(a:Action)=>1<<ACTIONS.indexOf(a);
const step=(g:Game,n=1)=>{for(let i=0;i<n;i++)g.step()};
function make(ch:CharId='caetano',target:CharId='cristyan',training=false){
 keyboard.down.clear();keyboard.pressed.clear();touchInput.clear();
 const g=new Game({mode:training?'training':'versus',p1:ch,p2:target,difficulty:'normal',bindings:DEFAULT_BINDINGS},()=>{});
 g.phase='fight';g.f[0].x=600;g.f[1].x=600+g.f[0].def.pushW+g.f[1].def.pushW+5;return g;
}
function check(name:string,fn:()=>void){try{fn();cases++}catch(e){throw new Error(name,{cause:e})}}
function game(name:string,fn:(g:Game)=>void,ch:CharId='caetano',target:CharId='cristyan',training=false){check(name,()=>{const g=make(ch,target,training);try{fn(g)}finally{g.destroy();keyboard.down.clear();keyboard.pressed.clear();touchInput.clear()}})}
function tap(g:Game,actions:Action[],mode:'keyboard'|'touch'|'online',side:0|1=0){
 if(mode==='online'){
  g.onlineInputs[side]=actions.filter(a=>a==='down'||a==='left'||a==='right').reduce((m,a)=>m|bit(a),0);
  g.onlinePressed[side]=actions.reduce((m,a)=>m|bit(a),0);
 }else if(mode==='touch'){
  touchInput.set(901,actions.filter(a=>a==='down'));touchInput.set(902,actions.filter(a=>a!=='down'));touchInput.set(902,[]);
 }else{
  keyboard.down.clear();for(const a of actions){const key=g.cfg.bindings[side][a][0];if(['down','left','right'].includes(a))keyboard.down.add(key);else keyboard.pressed.add(key)}
 }
}
function runRoute(g:Game,route:ComboRoute,mode:'keyboard'|'touch'|'online',mirror=false,side:0|1=0){
 const a=g.f[side],d=g.f[1-side];a.x=600;d.x=600+a.def.pushW+d.def.pushW+5;a.facing=1;d.facing=-1;
 if(mirror){a.x=900;d.x=900-a.def.pushW-d.def.pushW-5;a.facing=-1;d.facing=1;}
 let stage=0,fed=-1,lastSerial=-1,hits=0,free=false,max=0;
 for(let t=0;t<700;t++){
  const next=route.steps[stage];
  if(next&&fed!==stage&&(stage===0||route.steps[stage-1].move==='jump'?stage===0||a.state==='jump':a.contact==='hit'&&a.serial!==lastSerial)){
   tap(g,next.input,mode,side);lastSerial=a.serial;fed=stage;
  }
  if(mode==='online')g.onlineInputs[d.idx]=hits?bit('block'):0;
  else {if(hits)keyboard.down.add(g.cfg.bindings[d.idx].block[0]);}
  const old=g.trainingLog.length,oldHp=d.hp;
  g.step();max=Math.max(max,d.comboHits);
  if(d.hp<oldHp){hits++;if(next&&next.move!=='jump'&&a.contact==='hit'&&(a.move?.id===next.move||d.comboMoves.includes(next.move)))stage++;}
  if(next?.move==='jump'&&a.state==='jump'&&!a.move)stage++;
  if(stage===route.steps.length&&d.state==='ground'&&d.landLag===0){free=true;break;}
  if(g.coach?.status==='failed')throw Error(JSON.stringify({coach:g.coach,stage,moves:d.comboMoves,old,events:g.trainingLog.slice(-8)}));
 }
 return {stage,hits,max,free,damage:d.maxHp-d.hp};
}

check('all eighteen fighters have four routes, including real low kicks, normals/specials and launch follow-ups',()=>{
 assert.equal(COMBO_ROUTES.length,72);assert.equal(new Set(COMBO_ROUTES.map(r=>r.id)).size,72);
 for(const ch of CHAR_IDS){const routes=comboRoutes(ch);assert.equal(routes.length,4);assert(routes.some(r=>r.level==='Intermediário'&&r.steps.some(s=>/^s[123]$/.test(s.move))));assert(routes.some(r=>r.level==='Aéreo'&&r.steps[0].move==='cK'));}
});
for(const route of COMBO_ROUTES)for(const mode of ['keyboard','touch','online'] as const)for(const mirror of [false,true])game(`${route.id} via ${mode}, mirror=${mirror}: true chain and predictable recovery`,g=>{
 g.cfg.online=mode==='online';
 const result=runRoute(g,route,mode,mirror);
 assert.equal(result.stage,route.steps.length,'all route commands must connect');assert(result.free,'opponent recovers');assert(result.damage>0&&result.damage<CHARS.jane.hp*.4);assert(g.f[1].juggle===0);
 assert(g.f[1].comboResult?.freeAt!==null);assert(Math.abs(g.f[1].comboResult!.damage-result.damage)<.001);assert(g.f[1].guard,'held defense is ready on the first free frame');
 const copy=make(route.ch);try{assert(applyState(copy,JSON.parse(JSON.stringify(captureState(g)))));assert.deepEqual(copy.f[1].comboResult,g.f[1].comboResult);assert.equal(copy.f[1].hp,g.f[1].hp)}finally{copy.destroy()}
},route.ch);

for(const route of COMBO_ROUTES)for(const mode of ['keyboard','online'] as const)for(const mirror of [false,true])check(`P2 ${route.id}, ${mode}, mirror=${mirror}`,()=>{
 keyboard.down.clear();keyboard.pressed.clear();touchInput.clear();
 const g=new Game({mode:'versus',p1:'cristyan',p2:route.ch,difficulty:'normal',bindings:DEFAULT_BINDINGS,online:mode==='online'},()=>{});g.phase='fight';
 try{const r=runRoute(g,route,mode,mirror,1);assert.equal(r.stage,route.steps.length);assert(r.free);assert(g.f[0].guard);assert(g.f[0].comboResult?.freeAt!==null)}finally{g.destroy();keyboard.down.clear();keyboard.pressed.clear();touchInput.clear()}
});

for(const route of COMBO_ROUTES)game(`${route.id}: trainer confirms actual inputs/hits, then the real free frame`,g=>{
 assert(g.startComboLesson(route.id));
 let fed=-1;
 for(let t=0;t<700&&g.coach?.freeAt===null;t++){
  const c=g.coach!,next=route.steps[c.progress];
  if(next&&fed!==c.progress&&(c.progress===0||route.steps[c.progress-1].move==='jump'?c.progress===0||g.f[0].state==='jump':g.f[0].contact==='hit')){tap(g,next.input,'keyboard');fed=c.progress;}
  g.step();
  assert.notEqual(g.coach?.status,'failed',JSON.stringify(g.coach));
 }
 assert.equal(g.coach?.status,'success');assert.equal(g.coach?.progress,route.steps.length);assert(g.coach!.freeAt!==null);assert(g.coach!.hits>=route.steps.filter(s=>s.move!=='jump').length);
 assert(g.f[0].pad.history.length>0);assert.equal(g.f[1].state,'ground');assert.equal(g.f[1].landLag,0);
 assert(Math.abs(g.coach!.damage-g.f[1].comboResult!.damage)<.001);
},route.ch,'cristyan',true);

for(const ch of CHAR_IDS)for(const side of [0,1] as const)for(const source of ['keyboard','online','touch'] as const)for(const defended of [false,true]){
 if(source==='touch'&&side===1)continue;
 game(`${ch} P${side+1}: crouch + kick is a low sweep through ${source}, defended=${defended}`,g=>{
  if(side===1){g.f[1].ch=ch;g.f[1].def=CHARS[ch];g.f[0].ch='cristyan';g.f[0].def=CHARS.cristyan;g.f[0].x=600;g.f[1].x=600+g.f[0].def.pushW+g.f[1].def.pushW+5;}
  g.cfg.online=source==='online';const a=g.f[side],d=g.f[1-side],hp=d.hp;
  if(defended){if(g.cfg.online)g.onlineInputs[d.idx]=bit('down')|bit('block');else{keyboard.down.add(g.cfg.bindings[d.idx].down[0]);keyboard.down.add(g.cfg.bindings[d.idx].block[0]);}}
  tap(g,['down','k'],source,side);if(defended&&!g.cfg.online){keyboard.down.add(g.cfg.bindings[d.idx].down[0]);keyboard.down.add(g.cfg.bindings[d.idx].block[0]);}
  g.step();assert.equal(a.move?.id,'cK');assert.equal(a.move?.level,'low');
  for(let i=0;i<100&&a.contact==='pending';i++)g.step();assert.equal(a.contact,defended?'block':'hit');assert.equal(d.hp<hp,!defended);
 },ch);
}

game('trainer rejects whiffs, wrong moves and a recovered opponent; free play and online stay separate',g=>{
 g.startComboLesson('caetano-two');g.f[1].x=1400;tap(g,['p'],'keyboard');step(g,50);assert.equal(g.coach?.status,'failed');assert.equal(g.coach?.progress,0);
 g.startComboLesson('caetano-two');tap(g,['k'],'keyboard');g.step();assert.equal(g.coach?.status,'failed');
 g.startComboLesson('caetano-three');tap(g,['p'],'keyboard');step(g,60);assert.equal(g.coach?.status,'failed');assert(g.coach?.freeAt!==null);
 assert(g.startComboLesson(null));assert.equal(g.coach,null);g.cfg.online=true;assert(!g.startComboLesson('caetano-two'));
},'caetano','cristyan',true);
for(const ch of CHAR_IDS)game(`${ch}: repeated crouch kick never becomes a standing heavy; recovery buffer still starts a sweep`,g=>{
 g.cfg.online=true;g.onlineInputs[0]=bit('down');g.onlinePressed[0]=bit('k');g.step();
 const a=g.f[0];for(let i=0;i<80&&a.contact!=='hit';i++)g.step();assert.equal(a.contact,'hit');const serial=a.serial;
 a.pad.tap('k',g.tick);step(g,g.hitstop+2);assert.equal(a.serial,serial,'cannot repeat-cancel the same sweep');assert.equal(a.move?.id,'cK');
 const m=a.move!;a.moveT=m.startup+m.active+m.recovery-1;a.pad.tap('k',g.tick);g.step();assert.equal(a.serial,serial+1);assert.equal(a.move?.id,'cK');assert.equal(a.move?.level,'low');
},ch);

game('confirmed launch only: no jump cancel on whiff/block and no aerial loop or air ULT',g=>{
 const [a,d]=g.f;g.startMove(a,a.def.moves.cK);a.moveT=9;a.contact='block';a.connected=true;a.contactFrame=9;a.pad.tap('up',g.tick);assert(!(g as any).tryCancel(a));
 a.contact='hit';a.contactFrame=a.moveT;d.state='ground';assert(!(g as any).tryCancel(a));d.state='launched';d.juggle=4;assert(!(g as any).tryCancel(a));d.juggle=1;assert((g as any).tryCancel(a));assert.equal(a.state,'jump');
 g.startMove(a,a.def.moves.jK);a.connected=true;a.contact='hit';a.contactFrame=a.moveT;a.pad.tap('p',g.tick);a.pad.tap('super',g.tick);a.meter=100;assert(!(g as any).tryCancel(a));
});
for(const [ch,s] of [['orango','s1'],['jao','s2'],['eneas','s2']] as const)game(`${ch}: dedicated link keeps standalone/blocked/expired preparation and cooldown`,g=>{
 const [a,d]=g.f;const original=a.def.moves[s];g.startMove(a,original);assert.equal(a.move!.startup,original.startup);
 g.startMove(a,a.def.moves.kM);a.connected=true;a.contact='block';a.contactFrame=a.moveT;a.pad.tap(s,g.tick);assert(!(g as any).tryCancel(a));
 a.contact='hit';a.contactFrame=a.moveT-CANCEL_CONFIRM_FRAMES-1;assert(!(g as any).tryCancel(a));
 a.contactFrame=a.moveT;d.state='hit';d.comboHits=2;a.rangedCooldown=20;assert(!(g as any).tryCancel(a));a.rangedCooldown=0;assert((g as any).tryCancel(a));assert.equal(a.move!.startup,original.startup-8);assert.equal(a.move!.recovery,original.recovery);assert.equal(a.move!.dmg,original.dmg);assert.equal(a.rangedUses,2);
},ch);

for(const direction of [-1,1] as const)game(`Jane slide hops before a telegraphed aerial spin, direction ${direction}`,g=>{
 const[a,d]=g.f;a.x=800;d.x=800+direction*90;a.facing=direction;d.facing=direction===1?-1:1;g.startMove(a,a.def.moves.s3);let airborne=false,hitAt=-1;
 for(let i=0;i<90;i++){
  if(a.moveT===25)keyboard.down.add('Numpad3');g.step();if(a.move?.id==='s3'&&a.y<0)airborne=true;
  if(a.contact==='block'&&hitAt<0){hitAt=a.moveT;assert(a.y<0);}
 }
 assert(airborne);assert(hitAt>=30);assert.equal(a.contact,'block');assert.equal(a.invuln,0);assert.equal(a.facing,direction===1?-1:1);
},'jane');
for(const direction of [-1,1] as const)game(`Jane timely bike release locks a fast ride direction with one strike and real recovery, ${direction}`,g=>{
 const[a,d]=g.f;a.x=800;d.x=direction>0?1450:150;a.facing=direction;keyboard.down.add('KeyI');
 while(a.bikeTicks<30)g.step();const start=a.x;keyboard.down.clear();g.step();assert.equal(a.move?.id,'bikeRush');assert(a.bikeCooldown>0);assert.equal(a.bikeDizzy,0);
 keyboard.down.add(direction>0?'KeyA':'KeyD');a.pad.tap('p',g.tick);step(g,8);assert.equal(a.move?.id,'bikeRush');assert((a.x-start)*direction>90);assert.equal(a.facing,direction);assert(!a.armor&&a.invuln===0);
 const copy=make('jane');try{assert(applyState(copy,JSON.parse(JSON.stringify(captureState(g)))));assert.equal(copy.f[0].move?.id,'bikeRush');assert.equal(copy.f[0].facing,direction)}finally{copy.destroy()}
 step(g,70);assert.equal(a.state,'ground');assert(a.bikeCooldown>0);assert(!g.startMove(a,a.def.moves.s2));assert(a.bikeHits<=6);
},'jane');
game('Jane cannot evade the overhold crash by releasing on tick 301, or exceed the shared six-contact budget',g=>{
 const[a,d]=g.f;d.x=1500;keyboard.down.add('KeyI');while(a.bikeTicks<300)g.step();keyboard.down.clear();g.step();assert.equal(a.state,'dizzy');assert.equal(a.bikeDizzy,60);assert.equal(a.move,null);
 g.resetPositions();a.x=600;d.x=690;keyboard.down.add('KeyI');while(a.bikeTicks<20)g.step();a.bikeHits=6;keyboard.down.clear();const hp=d.hp;step(g,50);assert.equal(d.hp,hp,'rush cannot add a seventh contact');assert.equal(a.bikeDizzy,0);
},'jane');
check('input display records fresh commands, directions and ticks without recording held repeats or consuming buffer',()=>{
 const p=new Pad();p.set('down',true,3);p.set('k',true,4);p.set('k',true,5);assert.equal(p.history.length,2);assert.deepEqual(p.history[1].directions,['down']);assert(p.buffered('k',6));p.freezeBuffers(7);assert.equal(p.history.length,2);p.reset();assert.equal(p.history.length,0);
});
check('coach never accepts button-only success or duplicate projectile contacts as extra steps',()=>{
 const c=newComboCoach('caetano-three');const base={actor:0 as const,serial:1,tick:2,hits:1,damage:22};advanceComboCoach(c,{...base,type:'start',move:'pL'});assert.equal(c.progress,0);advanceComboCoach(c,{...base,type:'hit',move:'pL'});assert.equal(c.progress,1);advanceComboCoach(c,{...base,type:'hit',move:'pL'});assert.equal(c.progress,1);
});
for(const phase of ['neutral','startup','last-active','recovery','dizzy'] as const)game(`feedback: ${phase} distinguishes a real recovery punishment without bonus damage`,g=>{
 const[a,d]=g.f;
 if(phase==='dizzy'){d.state='dizzy';d.bikeDizzy=60;}
 else if(phase!=='neutral'){g.startMove(d,d.def.moves.pH);d.moveT=phase==='startup'?0:d.move!.startup+d.move!.active-(phase==='last-active'?1:0);}
 g.startMove(a,a.def.moves.pL);a.moveT=a.move!.startup;g.step();
 assert.equal(d.comboKind,phase==='recovery'||phase==='dizzy'?'punish':'basic');assert.equal(d.maxHp-d.hp,a.def.moves.pL.dmg,'classification is presentation only');
});
game('feedback: special and aerial contacts are advanced and synchronize in snapshots',g=>{
 const[a,d]=g.f;g.startMove(a,a.def.moves.s2);a.moveT=a.move!.startup;g.step();assert.equal(d.comboKind,'advanced');
 g.resetPositions();g.phase='fight';a.x=600;d.x=660;a.y=-40;a.vy=0;d.y=-30;d.vy=-5;d.state='launched';d.juggle=1;g.startMove(a,a.def.moves.jP);a.moveT=a.move!.startup;g.step();assert(d.hp<d.maxHp,'real aerial contact');assert.equal(d.comboKind,'advanced');
 const copy=make();try{assert(applyState(copy,JSON.parse(JSON.stringify(captureState(g)))));assert.equal(copy.f[1].comboKind,'advanced')}finally{copy.destroy()}
});
console.log(`Combos/Jane: ${cases} cases passed (52 routes, keyboard/touch/online, mirrored sides, actual coaching, universal crouch sweep, bounded links/juggles, inputs and Jane hop/spin/runaway/crash).`);
