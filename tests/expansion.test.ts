import assert from 'node:assert/strict';
import { Game } from '../src/game/engine';
import { CHARS,CHAR_IDS } from '../src/game/data';
import { STAGE_IDS,STAGES } from '../src/game/stage';
import { DEFAULT_BINDINGS,keyboard,loadBindings } from '../src/game/input';
import { touchInput } from '../src/game/touch';
import { captureState,applyState } from '../src/game/net-state';
import { levelFor } from '../src/game/progression';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
{
 const legacy=JSON.parse(JSON.stringify(DEFAULT_BINDINGS));delete legacy[0].grab;delete legacy[1].grab;
 legacy[0].p=['KeyG',''];legacy[0].k=['KeyF',''];legacy[1].p=['Numpad7',''];legacy[1].k=['KeyB',''];
 (globalThis as any).localStorage={getItem:()=>JSON.stringify(legacy)};
 const migrated=loadBindings();assert.equal(migrated[0].grab[0],'KeyV');assert.equal(migrated[1].grab[0],'Numpad8');assert.deepEqual(migrated[0].p,legacy[0].p,'preserve existing custom controls');
 legacy[0].grab=['KeyQ',''];assert.equal(loadBindings()[0].grab[0],'KeyQ','preserve configured grab');delete (globalThis as any).localStorage;
}
const make=(a:any='caetano',b:any='caetano',mode:any='training',event:()=>void=()=>{})=>{keyboard.down.clear();touchInput.clear();const g=new Game({mode,p1:a,p2:b,difficulty:'normal',bindings:DEFAULT_BINDINGS},event);g.f[0].x=650;g.f[1].x=730;if(mode!=='training')g.phase='fight';else g.train.dummy=3;return g};
const step=(g:Game,n:number)=>{for(let i=0;i<n;i++)g.step()};
for(const reverse of [false,true]){
 const g=make();if(reverse){g.f[0].x=730;g.f[1].x=650;g.f[0].facing=-1;g.f[1].facing=1;}for(const f of g.f)g.startMove(f,f.def.moves.pL);step(g,20);assert(g.f.every(f=>f.hp<f.maxHp),'clean simultaneous trade');g.destroy();
}
{
 const g=make('caetano','caetano','versus');for(const f of g.f){f.hp=20;g.startMove(f,f.def.moves.pL)}step(g,500);assert.equal(g.f[0].wins,0);assert.equal(g.f[1].wins,0);g.destroy();
}
for(const input of ['keyboard','touch','online']){
 const g=make();g.cfg.online=input==='online';g.startMove(g.f[0],CHARS.caetano.moves.pL);for(let i=0;i<15&&!g.hitstop;i++)g.step();assert(g.hitstop>0);const serial=g.f[0].serial;
 if(input==='keyboard')keyboard.down.add('KeyK');if(input==='touch'){touchInput.set(10,['k']);touchInput.set(10,[])}if(input==='online')g.onlinePressed[0]=1<<5;
 g.step();keyboard.down.clear();step(g,18);assert(g.f[0].serial>serial,'hitstop combo '+input);assert.equal(g.f[0].move?.id,'kM');g.destroy();
}
{
 const g=make();g.f[0].y=-100;g.f[0].vy=0;g.startMove(g.f[0],CHARS.caetano.moves.jP);g.f[0].connected=true;assert.equal(g.startMove(g.f[0],CHARS.caetano.moves.s2),false);step(g,5);assert.notEqual(g.f[0].y,-100,'air gravity continues');g.destroy();
}
{
 const g=make('caetano','nomad');g.f[1].state='hit';g.f[1].hitstun=1;keyboard.down.add('Numpad3');g.startMove(g.f[0],CHARS.caetano.moves.pL);g.f[0].moveT=CHARS.caetano.moves.pL.startup;g.step();assert.equal(g.f[1].state,'block','guard on first recovered frame');assert(g.f[1].maxHp-g.f[1].hp<3);g.destroy();
}
{
 const g=make('nomad','caetano');keyboard.down.add('Numpad3');g.startMove(g.f[0],CHARS.nomad.moves.pL);g.f[0].moveT=CHARS.nomad.moves.pL.startup;g.step();assert.equal(g.f[1].hp,g.f[1].maxHp,'perfect guard has no chip');assert(g.f[1].precision>0);g.f[1].y=0;g.startMove(g.f[1],CHARS.caetano.moves.s2);assert.equal(g.f[1].move?.dmg,73);g.destroy();
}
{
 const g=make('orango','nomad');for(let i=0;i<3;i++){g.f[1].x=g.f[0].x+100;g.f[1].state='ground';g.f[1].guard=false;g.startMove(g.f[0],CHARS.orango.moves.pL);step(g,40)}assert.equal(g.f[0].momentum,3);assert(g.f[0].momentumT>0);g.destroy();
}
{
 const g=make('renngotti');g.f[0].x=100;g.f[1].x=1500;g.startMove(g.f[0],CHARS.renngotti.moves.s2);step(g,70);assert(g.projectiles.some(p=>p.anchored&&p.move.level==='low'));g.startMove(g.f[0],CHARS.renngotti.moves.s3);step(g,22);assert(g.projectiles.some(p=>p.resonating&&p.radius===90));g.destroy();
}
{
 const g=make('aneninha');g.f[0].pad.held.down=true;g.startMove(g.f[0],CHARS.aneninha.moves.s1);assert.equal(g.f[0].move?.level,'low');g.resetPositions();g.f[0].x=650;g.f[1].x=780;g.f[0].pad.held.right=true;g.startMove(g.f[0],CHARS.aneninha.moves.s2);step(g,22);assert(g.projectiles.some(p=>p.kind==='osasco'&&p.x>g.f[1].x));g.destroy();
}
{
 const g=make();keyboard.down.add('KeyG');g.step();keyboard.down.clear();assert.equal(g.f[0].move?.id,'throw');step(g,90);assert.equal(g.train.total,70);assert.equal(g.seq,null);g.destroy();
}
{
 const g=make('caetano','caetano','versus');keyboard.down.add('KeyG');keyboard.down.add('Numpad7');g.step();keyboard.down.clear();step(g,30);assert.equal(g.seq,null,'simultaneous throw is teched');assert(g.f.every(f=>f.hp===f.maxHp));g.destroy();
}
{
 const g=make();g.f[1].state='attack';g.f[1].move=CHARS.caetano.moves.s3;g.f[1].moveT=40;g.startMove(g.f[0],{...CHARS.caetano.moves.pH,id:'throw',grab:'throw'});assert((g as any).canHit(g.f[0],g.f[1]),'punish vulnerable recovery');g.f[1].state='block';g.f[1].blockstun=4;assert.equal((g as any).canHit(g.f[0],g.f[1]),false,'no grabs during blockstun');g.destroy();
}
{
 const g=make('caetano','tubarao');g.f[1].armor=true;g.f[1].state='attack';g.f[1].move=CHARS.tubarao.moves.s3;g.f[1].moveT=12;g.startMove(g.f[0],CHARS.caetano.moves.pL);g.f[0].moveT=4;g.step();assert(g.f[1].hp<g.f[1].maxHp,'armor still takes damage');assert.equal(g.f[1].state,'attack','armor absorbs interruption');g.destroy();
}
{
 const g=make('nomad','caetano');g.f[0].x=400;g.f[1].x=950;keyboard.down.add('ArrowDown');g.startMove(g.f[0],CHARS.nomad.moves.s2);step(g,100);assert.equal(g.f[1].hp,g.f[1].maxHp,'crouch evades high shots');g.destroy();
}
for(const ch of CHAR_IDS){let ends=0;const g=make(ch,'caetano','versus',()=>{ends++});g.f[0].wins=2;g.f[1].ko=true;g.f[1].state='down';g.phase='roundEnd';g.phaseT=210;g.step();assert.equal(g.phase,'finishWindow');assert.equal(g.requestFinisher(1),false);assert(g.requestFinisher(0));step(g,100);const mirror=make(ch);assert(applyState(mirror,JSON.parse(JSON.stringify(captureState(g)))));assert.equal(mirror.finisher?.winner,0);assert.equal(mirror.phase,'finisher');step(g,120);assert.equal(g.phase,'matchEnd');assert.equal(g.finishedBy,0);assert.equal(ends,1);g.destroy();mirror.destroy()}
{
 const g=make('caetano','orango','versus');g.f[0].wins=2;g.f[1].ko=true;g.phase='roundEnd';g.phaseT=210;g.step();step(g,241);assert.equal(g.phase,'matchEnd');assert.equal(g.finishedBy,null);g.destroy();
}
assert.equal(STAGE_IDS.length,17);assert.equal(STAGES.casabranca.credit,'Jalam');assert.equal(STAGES.letsgay.credit,'Jalam e Diegão');assert.equal(levelFor(100).level,2);
console.log('Expansion combat: trades/double KO, buffered keyboard/touch/network combos, air physics, guard recovery,4 styles, throws/tech/recovery, armor, crouch hitboxes, all13 finishers/snapshots and17 stages passed.');
