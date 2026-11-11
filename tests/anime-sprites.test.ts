import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Game} from '../src/game/engine';
import {CHAR_IDS,CHARS} from '../src/game/data';
import type {CharId} from '../src/game/data';
import {ACTIONS,DEFAULT_BINDINGS} from '../src/game/input';
import {captureState,applyState} from '../src/game/net-state';
import {animeMotion} from '../src/game/anime-motion';
import {selectAnimeSpriteFrame} from '../src/game/anime-sprite';
import manifest from '../src/assets/sprites/manifest.json';
import baseline from './fixtures/weapon-normals.json';

(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
let cases=0;
const check=(name:string,fn:()=>void)=>{try{fn();cases++}catch(cause){throw new Error(name,{cause})}};
const weaponChars=['ulisses','felipence','bieu','aneninha'] as const;
function make(ch:CharId,side:0|1=0){const g=new Game({mode:'versus',p1:side===0?ch:'caetano',p2:side===1?ch:'caetano',online:true,difficulty:'normal',bindings:DEFAULT_BINDINGS},()=>{});g.phase='fight';g.f[0].x=600;g.f[1].x=675;return g;}
function step(g:Game,n:number){for(let i=0;i<n;i++)g.step();}

check('every fighter and form ships 12 intact, hashed illustrated poses',()=>{
 assert.equal(Object.keys(manifest.atlases).length,36);assert.equal(manifest.poses.length,12);
 for(const ch of CHAR_IDS)for(const suffix of ['','-form']){
  const a=(manifest.atlases as any)[ch+suffix];assert(a,ch+suffix);assert.equal(a.frameRects.length,12);assert.equal(a.bounds.length,12);
  assert.equal(a.geometryVersion,3);assert(a.idleHeight>100);assert(a.portraitOpaquePixels>500);
  assert.equal(a.packing.sourceVisiblePixels,a.packing.packedVisiblePixels);assert.equal(a.packing.sourceOpaquePixels,a.packing.packedOpaquePixels);
  const bytes=readFileSync('src/assets/sprites/'+a.src);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.encodedSha256);
  for(let i=0;i<12;i++){
   const [x,y,w,h]=a.frameRects[i],[bx,by,bw,bh]=a.bounds[i];
   assert(x>=0&&y>=0&&x+w<=a.width&&y+h<=a.height,ch+'/'+i+' atlas');
   assert(bx>=0&&by>=0&&bw>20&&bh>20&&bx+bw<=w&&by+bh<=h,ch+'/'+i+' figure');
  }
 }
});
for(const ch of weaponChars)check(`${ch}: accessory normals preserve all published combat properties`,()=>{
 const current=Object.fromEntries(Object.entries(CHARS[ch].moves).filter(([,m])=>m.kind==='normal').map(([id,m])=>[id,Object.fromEntries(Object.entries(m).filter(([key])=>!['label','accessory'].includes(key)))]));
 assert.deepEqual(current,baseline[ch]);assert.equal(CHARS[ch].moves.headbutt.accessory,undefined);
 assert(Object.values(CHARS[ch].moves).filter(m=>m.kind!=='normal'||m.grab).every(m=>!m.accessory));
});
for(const ch of weaponChars)for(const side of [0,1] as const)for(const block of [false,true])check(`${ch} P${side+1}: normal ${block?'block':'hit'} uses weapon and synchronizes without extra attack`,()=>{
 const g=make(ch,side),guest=make(ch,side);try{
  const a=g.f[side],d=g.f[1-side];if(block){g.onlineInputs[1-side]=1<<ACTIONS.indexOf('block');step(g,6);}
  const m=a.def.moves.pL;assert(g.startMove(a,m));
  assert.equal(animeMotion(a).normalAccessory,m.accessory);assert(m.accessory);
  const state=JSON.parse(JSON.stringify(captureState(g)));assert(applyState(guest,state));assert.equal(guest.f[side].move?.accessory,m.accessory);
  let maxHits=0,maxProjectiles=0;
  for(let i=0;i<Math.max(60,m.startup+m.active+m.recovery+m.whiff+6);i++){step(g,1);maxHits=Math.max(maxHits,d.comboHits);maxProjectiles=Math.max(maxProjectiles,g.projectiles.length);}
  assert.equal(d.maxHp-d.hp,block?0:m.dmg);assert.equal(a.contact,block?'block':'hit');
  assert.equal(maxHits,block?0:1);assert.equal(maxProjectiles,0);assert.equal(a.rangedUses,0);
 }finally{g.destroy();guest.destroy();}
});
for(const ch of weaponChars)check(`${ch}: all accessory normals visibly strike in their active phase`,()=>{
 const g=make(ch);try{const f=g.f[0];for(const m of Object.values(f.def.moves).filter(m=>m.accessory)){
  f.state='attack';f.move=m;f.moveT=m.startup+1;f.crouch=/^c/.test(m.id);
  const o={time:14,poseName:m.poses[1],...animeMotion(f)};
  const selected=selectAnimeSpriteFrame(f.def.poses.idle,o);
  assert([5,6,8].includes(selected),ch+'/'+m.id+' active pose '+selected);
  f.moveT=1;assert.equal(animeMotion(f).spritePhase,'startup');
  f.moveT=m.startup+m.active+2;assert.equal(animeMotion(f).spritePhase,'recovery');
 }}finally{g.destroy();}
});
check('hit, launched and down reactions override held crouch/guard; air and landing remain distinct',()=>{
 const g=make('ulisses');try{const f=g.f[0];f.guard=f.crouch=true;
  for(const state of ['hit','launched','down','dizzy'] as const){f.state=state;assert.equal(selectAnimeSpriteFrame(f.pose,{time:0,...animeMotion(f)}),10);}
  f.state='jump';assert.equal(animeMotion(f).spriteState,'jump');f.state='ground';f.landLag=5;assert.equal(animeMotion(f).spriteState,'crouch');
 }finally{g.destroy();}
});
console.log(`Anime sprites: ${cases} regressions passed (36 atlases, 432 poses, preserved weapon frame data, mirrored hits/blocks, snapshots and reactions).`);
