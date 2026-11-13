import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FLOOR_Y,STEP,SenbukanSim} from '../src/game/senbukan3d/sim';
import type {Action,Input} from '../src/game/senbukan3d/sim';
const input=(...pressed:Action[]):Input=>({x:0,z:0,guard:false,pressed:new Set(pressed)});
const tick=(s:SenbukanSim,n:number,frame=input())=>{for(let i=0;i<n;i++)s.step({...frame,pressed:i===0?frame.pressed:new Set()});};
const arena=()=>{const s=new SenbukanSim();s.running=true;s.mode='idle';s.fighters[0].z=-.8;s.fighters[1].z=.8;return s;};
{
 const s=arena();tick(s,60,{...input(),x:1});assert(s.fighters[0].x>5);assert.equal(s.fighters[0].y,FLOOR_Y);
 tick(s,240,{...input(),x:1});assert(s.fighters[0].x<=8.25);assert.equal(s.fighters[0].hp,1000);
 s.running=false;const t=s.time,x=s.fighters[0].x;tick(s,60,{...input(),x:-1});assert.equal(s.time,t);assert.equal(s.fighters[0].x,x);
}
{
 const s=arena();tick(s,15,input('jump'));assert(s.fighters[0].y>FLOOR_Y+1);tick(s,80);assert.equal(s.fighters[0].y,FLOOR_Y);
 const z=s.fighters[0].z;tick(s,15,input('dash'));assert(s.fighters[0].z>z+2);assert(s.fighters[0].energy<90);
}
{
 const s=arena();tick(s,13,input('punch'));assert.equal(s.fighters[1].hp,944);tick(s,8,input('punch'));tick(s,35);assert(s.fighters[1].hp<900);assert(s.fighters[0].combo>=2);assert.notEqual(s.fighters[1].state,'down');
}
{
 const s=arena();s.mode='guard';
 for(let i=0;i<3;i++){tick(s,1);tick(s,48,input('kick'));}
 assert(s.events.some(e=>e.kind==='break'),'repeated blocked kicks break standing guard');tick(s,40,input('punch'));assert(s.fighters[1].hp<1000,'an opening after guard break accepts damage');
}
{
 const s=arena();s.mode='guard';tick(s,1);s.step(input('prime'));assert.equal(s.fighters[0].prime,10);tick(s,40);tick(s,28,input('punch'));assert(s.fighters[1].hp<1000);assert.equal(s.fighters[1].guard,0);
 // Direct the real AI fighter into an attack against transformed Caetano.
 s.mode='ai';s.fighters[1].aiWait=0;s.fighters[1].state='ready';s.fighters[1].guarding=false;s.fighters[1].z=s.fighters[0].z+1.5;
 tick(s,55);assert.equal(s.fighters[0].hp,1000);assert(s.events.some(e=>e.kind==='immune'));
 tick(s,600);assert.equal(s.fighters[0].prime,0);
}
{
 const s=arena();s.fighters[0].z=-5;s.fighters[1].z=5;tick(s,51,input('special'));assert(s.fighters[1].hp<1000,'travelling projectile hits beyond melee range');assert(s.events.some(e=>e.kind==='shot'));
}
{
 const s=arena();s.fighters[1].hp=10;tick(s,15,input('punch'));assert.equal(s.winner,0);assert.equal(s.fighters[1].state,'down');const hp=s.fighters[1].hp;tick(s,60);assert.equal(s.fighters[1].hp,hp);
 s.reset();assert.equal(s.winner,null);assert.equal(s.fighters[1].hp,1000);assert.equal(s.shots.length,0);
}
{
 const s=arena();s.mode='ai';s.fighters[0].z=-4;s.fighters[1].z=4;tick(s,600);assert(s.fighters[0].hp<1000,'active opponent approaches and deals damage');assert(s.events.some(e=>e.actor===1&&e.kind==='swing'));
}
for(const name of ['caetano','dojo-student','dojo']){
 const data=readFileSync('src/assets/senbukan/3d/'+name+'.glb');assert.equal(data.subarray(0,4).toString(),'glTF');const size=data.readUInt32LE(12);const gltf=JSON.parse(data.subarray(20,20+size).toString());
 if(name!=='dojo'){
  assert.equal(gltf.skins.length,1);assert.equal(gltf.skins[0].joints.length,20);
  for(const name of ['idle','walk','run','punch1','punch2','punch3','kick','guard','hit','jump','dash','transform','down'])assert(gltf.animations.some((a:{name:string})=>a.name===name),name);
 }
}
assert.equal(STEP,1/60);
console.log('Senbukan WebGL: movement, arena bounds, pause, jump, dash, chains, guard break, 10s Prime, invulnerability, projectiles, AI, KO/reset and real animated GLB assets passed.');
