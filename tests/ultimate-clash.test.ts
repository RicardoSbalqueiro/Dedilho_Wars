import assert from 'node:assert/strict';
import { Game } from '../src/game/engine';
import { CHAR_IDS } from '../src/game/data';
import type { CharId, Move } from '../src/game/data';
import { DEFAULT_BINDINGS, ACTIONS, keyboard } from '../src/game/input';
import { touchInput } from '../src/game/touch';
import { captureState, applyState } from '../src/game/net-state';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
let cases=0;
const step=(g:Game,n=1)=>{for(let i=0;i<n;i++)g.step()};
function make(a:CharId='caetano',b:CharId='nomad'){
 keyboard.down.clear();keyboard.pressed.clear();touchInput.clear();
 const g=new Game({mode:'versus',p1:a,p2:b,difficulty:'normal',bindings:DEFAULT_BINDINGS},()=>{});
 g.phase='fight';g.f[0].x=650;g.f[1].x=770;for(const f of g.f){f.cpu=false;f.meter=100}return g;
}
function check(name:string,fn:()=>void){try{fn();cases++}catch(e){throw new Error(name+': '+(e instanceof Error?e.message.slice(0,600):String(e)))}}
function game(name:string,fn:(g:Game)=>void,a:CharId='caetano',b:CharId='nomad'){
 check(name,()=>{const g=make(a,b);try{fn(g)}finally{g.destroy();keyboard.down.clear();keyboard.pressed.clear();touchInput.clear()}});
}
function activateBoth(g:Game){for(const f of g.f)f.pad.tap('super',g.tick);g.step();assert.equal(g.cine?.f.idx,0);assert.equal(g.cine?.next,1);assert(g.f.every(f=>f.state==='cine'&&f.meter===0))}
function meet(g:Game){activateBoth(g);for(let i=0;i<400&&!g.clash;i++)g.step();assert.equal(g.clash?.kind,'super');assert.equal(g.seq,null);assert(g.f.every(f=>f.hp===f.maxHp));}
function mashWin(g:Game,side:0|1){for(let i=0;i<10;i++){g.f[side].pad.tap('super',g.tick);g.step()}for(let i=0;i<60&&g.clash;i++)g.step();assert.equal(g.clash,null);assert(g.seq?.kind.startsWith('super'));assert.equal(g.seq?.a.idx,side);}
function finish(g:Game){for(let i=0;i<600&&g.seq;i++)g.step();assert(!g.seq,'Ultimate sequence must finish, including its hitstop');}

for(const a of CHAR_IDS)for(const b of CHAR_IDS)game(`${a} vs ${b}: simultaneous Ultimates meet without skipping cinematics or damage`,g=>{
 meet(g);assert.deepEqual(g.clash!.c,[0,0]);assert(g.f.every(f=>f.meter===0&&!f.armor&&f.invuln===0));
 assert(g.clash!.m.every(m=>m.kind==='super'));
 const state=JSON.parse(JSON.stringify(captureState(g)));assert(JSON.stringify(state).length<64000);
 if(a===b){const copy=make(a,b);try{assert(applyState(copy,state));assert.equal(copy.clash?.kind,'super');assert.equal(copy.clash?.a,copy.f[0]);assert.equal(copy.clash?.b,copy.f[1]);assert.deepEqual(copy.clash?.c,[0,0])}finally{copy.destroy()}}
},a,b);

for(const ch of CHAR_IDS)for(const side of [0,1] as const)game(`${ch}, P${side+1}: winner gets exactly their own normal Ultimate`,g=>{
 meet(g);mashWin(g,side);const kind=g.seq!.kind;finish(g);const damage=g.f[1-side].maxHp-g.f[1-side].hp;
 assert(damage>0&&damage<500);assert.equal(g.seq,null);
 const solo=make(side===0?ch:'nomad',side===1?ch:'nomad');try{
  solo.f[side].pad.tap('super',solo.tick);for(let i=0;i<300&&!solo.seq;i++)solo.step();assert.equal(solo.seq?.kind,kind);
  assert(solo.seq);finish(solo);assert.equal(damage,solo.f[1-side].maxHp-solo.f[1-side].hp,'no free damage multiplier');
 }finally{solo.destroy()}
},side===0?ch:'nomad',side===1?ch:'nomad');

game('one queued cinematic survives JSON snapshot and resumes the second Ultimate',g=>{
 activateBoth(g);step(g,20);const copy=make('jane','eneas');try{
  assert(applyState(copy,JSON.parse(JSON.stringify(captureState(g)))));assert.equal(copy.cine?.next,1);
  for(let i=0;i<400&&!copy.clash;i++)copy.step();assert.equal(copy.clash?.kind,'super');assert(copy.f.every(f=>f.meter===0));
 }finally{copy.destroy()}
},'jane','eneas');
for(const side of [0,1] as const)for(const delay of [1,7,60,74])game(`P${side+1}: delayed ULT during rival cinematic (${delay} frames) queues fairly`,g=>{
 const first=g.f[1-side],reply=g.f[side];first.pad.tap('super',g.tick);g.step();step(g,delay);
 assert(g.cine);reply.pad.tap('super',g.tick);g.step();assert.equal(g.cine?.next,side);assert.equal(reply.meter,0);
 for(let i=0;i<400&&!g.clash;i++)g.step();assert.equal(g.clash?.kind,'super');assert(g.f.every(f=>f.hp===f.maxHp));
},'caetano','orango');
for(const locked of ['hit','block','attack','landing','empty-meter'] as const)game(`rival cinematic does not let ${locked} escape into an ULT`,g=>{
 g.f[0].pad.tap('super',g.tick);g.step();const f=g.f[1];
 if(locked==='landing')f.landLag=3;else if(locked==='empty-meter')f.meter=99;
 else{f.state=locked;if(locked==='attack')f.move=f.def.moves.pH;f.hitstun=f.blockstun=12}
 f.pad.tap('super',g.tick);g.step();assert.equal(g.cine?.next,undefined);assert.notEqual(f.state,'cine');
});
game('the initial activation press and presses made before collision never count as mashing',g=>{
 activateBoth(g);for(let i=0;i<400&&!g.clash;i++){for(const f of g.f)f.pad.tap('super',g.tick);g.step()}
 assert(g.clash);g.step();assert.deepEqual(g.clash!.c,[0,0]);
});
game('only fresh ULT presses count; punches, holding and OS repeat cannot mash',g=>{
 meet(g);keyboard.down.add('KeyJ');keyboard.down.add('Numpad1');step(g,4);assert.deepEqual(g.clash!.c,[0,0]);keyboard.down.clear();g.step();
 keyboard.down.add('KeyH');keyboard.down.add('Numpad0');g.step();assert.deepEqual(g.clash!.c,[1,1]);step(g,15);assert.deepEqual(g.clash!.c,[1,1]);
 (keyboard as any).kd({code:'KeyH',repeat:true,preventDefault(){}});g.step();assert.deepEqual(g.clash!.c,[1,1]);
 keyboard.down.clear();g.step();keyboard.down.add('KeyH');keyboard.down.add('Numpad0');g.step();assert.deepEqual(g.clash!.c,[2,2]);
});
game('quick touch and remote ULT presses use the same clash counters',g=>{
 meet(g);touchInput.set(60,['super']);touchInput.set(60,[]);g.step();assert.equal(g.clash!.c[0],1);
 g.cfg.online=true;g.onlinePressed[1]=1<<ACTIONS.indexOf('super');g.step();assert.deepEqual(g.clash!.c,[1,1]);
 g.onlinePressed[0]=1<<ACTIONS.indexOf('p');g.step();assert.deepEqual(g.clash!.c,[1,1]);
});
game('remote taps arriving in a batch count individually, with no extra held-mask point',g=>{
 meet(g);g.cfg.online=true;const stamp=g.clash!.startedAt,bit=1<<ACTIONS.indexOf('super');
 for(let i=0;i<4;i++)assert(g.queueClashInput(1,stamp,bit));g.onlineInputs[1]=bit;g.step();assert.deepEqual(g.clash!.c,[0,4]);
 step(g,8);assert.deepEqual(g.clash!.c,[0,4]);assert(!g.queueClashInput(1,stamp-1,bit));assert(!g.queueClashInput(1,stamp,1<<ACTIONS.indexOf('p')));
 g.step();assert.deepEqual(g.clash!.c,[0,4]);
});
game('online preparation cannot score; valid remote deadline taps arrive during settlement',g=>{
 g.cfg.online=true;meet(g);const stamp=g.clash!.startedAt,bit=1<<ACTIONS.indexOf('super');assert.equal(g.clash!.t,-60);
 g.f[0].pad.tap('super',g.tick);assert(!g.queueClashInput(1,stamp,bit,0));step(g,60);assert.equal(g.clash!.t,0);assert.deepEqual(g.clash!.c,[0,0]);
 g.f[0].pad.tap('super',g.tick);g.step();assert.equal(g.clash!.c[0],1);step(g,149);assert(g.clash);assert.equal(g.clash!.t,150);
 g.f[0].pad.tap('super',g.tick);assert(!g.queueClashInput(1,stamp,bit,150));assert(g.queueClashInput(1,stamp,bit,149));g.step();assert.deepEqual(g.clash!.c,[1,1]);
 step(g,89);assert(!g.clash);assert(!g.seq);assert(g.f.every(f=>f.hp===f.maxHp));
});
game('the last visible active frame still accepts its ULT press',g=>{
 meet(g);g.clash!.t=149;g.f[0].pad.tap('super',g.tick);g.step();assert.equal(g.seq?.a.idx,0);assert.equal(g.clash,null);
});
for(const crossed of [false,true])game(`tied Ultimates spend both meters and repel fairly, crossed=${crossed}`,g=>{
 if(crossed){g.f[0].x=770;g.f[1].x=650}meet(g);step(g,150);assert.equal(g.clash,null);assert.equal(g.seq,null);
 assert(g.f.every(f=>f.hp===f.maxHp&&f.meter===0&&!f.armor&&f.invuln===0&&f.landLag===14));
 for(const f of g.f)assert(f.vx*(f.x-g.opp(f).x)>0,'recoil points away from the opponent');
 step(g,14);assert(g.f.every(f=>f.state==='ground'&&f.landLag===0));
});
game('CPU participates at the existing difficulty mash rate',g=>{
 meet(g);g.f[1].cpu=true;const random=Math.random;Math.random=()=>0;
 try{step(g,4);assert.deepEqual(g.clash!.c,[0,4])}finally{Math.random=random}
});
const rush=(g:Game,idx:0|1):Move=>({...g.f[idx].def.moves.pL,id:'super',kind:'super',startup:0,active:10,recovery:20,dmg:0,grab:'super',hb:[0,100,-10,120],poses:['rush','rush']});
for(const situation of ['one','recovery','same-facing','distant'] as const)game(`no Ultimate clash for ${situation}`,g=>{
 g.startMove(g.f[0],rush(g,0));if(situation!=='one')g.startMove(g.f[1],rush(g,1));
 if(situation==='recovery')g.f[1].moveT=10;
 if(situation==='same-facing')g.f[1].facing=1;
 if(situation==='distant'){g.f[0].x=300;g.f[1].x=1200}
 g.step();assert.equal(g.clash,null);
});
game('two distant slow Ultimates can still whiff and return to neutral',g=>{
 g.f[0].x=360;g.f[1].x=1240;activateBoth(g);let collision=false;for(let i=0;i<400;i++){g.step();collision ||=!!g.clash||!!g.seq}
 assert(!collision);assert(g.f.every(f=>f.state==='ground'&&f.hp===f.maxHp&&f.meter===0));
},'jane','eneas');
game('existing special clash still uses punches, not the Ultimate key',g=>{
 g.startMove(g.f[0],g.f[0].def.moves.s2);g.startMove(g.f[1],g.f[1].def.moves.s1);g.step();assert.equal(g.clash?.kind,'dedilho');
 g.f[0].pad.tap('super',g.tick);g.step();assert.deepEqual(g.clash!.c,[0,0]);g.f[0].pad.tap('p',g.tick);g.step();assert.deepEqual(g.clash!.c,[1,0]);
},'caetano','orango');
game('winning an Ultimate battle can KO and still open the finisher window',g=>{
 meet(g);g.f[0].wins=1;g.f[1].hp=1;mashWin(g,0);for(let i=0;i<1100&&g.phase!=='finishWindow';i++)g.step();
 assert.equal(g.phase,'finishWindow');assert.equal(g.winner,0);assert(g.requestFinisher(0));step(g,220);assert.equal(g.phase,'matchEnd');assert.equal(g.finishedBy,0);
},'aneninha','eneas');
console.log(`Ultimate clash: ${cases} cases passed (all 169 matchups, both winners and normal ULT damage, queued cinematics/snapshots, keyboard/touch/online presses, anti-hold, ties, AI, whiffs, original Dedilho clash and finisher).`);
