/** Fixed-step arena rules. Positions are metres; the floor never depends on a pose. */
export const FLOOR_Y = .19;
export const STEP = 1 / 60;
export type Action = 'punch' | 'kick' | 'special' | 'dash' | 'jump' | 'prime';
export type Mode = 'ai' | 'idle' | 'guard';
export type State = 'ready' | 'attack' | 'dash' | 'hit' | 'broken' | 'transform' | 'down';
export type Move = 'punch1' | 'punch2' | 'punch3' | 'kick' | 'special';
export type Input = {x:number; z:number; guard:boolean; pressed:Set<Action>};
export type EventKind = 'hit' | 'block' | 'break' | 'dash' | 'jump' | 'land' | 'prime' | 'shot' | 'swing' | 'immune' | 'ko';
export type ArenaEvent = {id:number; t:number; kind:EventKind; x:number; y:number; z:number; nx:number; nz:number; power:number; actor:number};
export type Fighter = {
 id:number; x:number; z:number; y:number; px:number; pz:number; py:number; yaw:number; vy:number;
 hp:number; guard:number; energy:number; prime:number; state:State; elapsed:number; duration:number;
 guarding:boolean; move:Move; connected:boolean; serial:number; queued:Move|null; comboStep:number;
 comboWindow:number; combo:number; comboTime:number; stunChain:number; guardDelay:number; dashDelay:number;
 dx:number; dz:number; moving:number; travel:number; hurt:number; aiWait:number;
};
export type Shot = {id:number; owner:number; x:number; z:number; y:number; nx:number; nz:number; life:number; prime:boolean};
type MoveData = {duration:number; contact:number; damage:number; guard:number; reach:number; advance:number};
export const MOVES:Record<Move,MoveData> = {
 punch1:{duration:.43,contact:.15,damage:56,guard:19,reach:2.15,advance:.48},
 punch2:{duration:.47,contact:.18,damage:68,guard:23,reach:2.25,advance:.5},
 punch3:{duration:.65,contact:.28,damage:92,guard:34,reach:2.4,advance:.66},
 kick:{duration:.72,contact:.3,damage:106,guard:39,reach:2.65,advance:.5},
 special:{duration:.75,contact:.29,damage:122,guard:47,reach:14,advance:.25},
};
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const empty=():Input=>({x:0,z:0,guard:false,pressed:new Set()});
function actor(id:number):Fighter {
 return {id,x:0,z:id?-2.8:2.8,y:FLOOR_Y,px:0,pz:id?-2.8:2.8,py:FLOOR_Y,yaw:id?0:Math.PI,vy:0,
 hp:1000,guard:100,energy:100,prime:0,state:'ready',elapsed:0,duration:0,guarding:false,move:'punch1',connected:false,
 serial:0,queued:null,comboStep:0,comboWindow:0,combo:0,comboTime:0,stunChain:0,guardDelay:0,dashDelay:0,dx:0,dz:0,moving:0,travel:0,hurt:0,aiWait:.8};
}
export class SenbukanSim {
 fighters:[Fighter,Fighter]=[actor(0),actor(1)]; shots:Shot[]=[]; events:ArenaEvent[]=[];
 running=false; winner:number|null=null; mode:Mode='ai'; time=0; ticks=0; lock=true;
 private eventId=0; private shotId=0; private seed=81731;
 reset(){this.fighters=[actor(0),actor(1)];this.shots=[];this.events=[];this.winner=null;this.time=0;this.ticks=0;this.seed=81731;}
 private random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 private emit(kind:EventKind,a:Fighter,power=1,x=a.x,y=a.y+.95,z=a.z,nx=Math.sin(a.yaw),nz=Math.cos(a.yaw)){
  this.events.push({id:++this.eventId,t:this.time,kind,x,y,z,nx,nz,power,actor:a.id});
  if(this.events.length>100)this.events.splice(0,this.events.length-100);
 }
 private enter(a:Fighter,state:State,duration:number){a.state=state;a.duration=duration;a.elapsed=0;a.serial++;a.guarding=false;}
 private attack(a:Fighter,move:Move){
  if(move==='special'){if(a.energy<28)return;a.energy-=28;}
  const b=this.fighters[1-a.id];a.yaw=Math.atan2(b.x-a.x,b.z-a.z);a.move=move;a.connected=false;a.queued=null;
  a.comboStep=move==='punch1'?1:move==='punch2'?2:move==='punch3'?3:0;a.comboWindow=.9;
  this.enter(a,'attack',MOVES[move].duration);this.emit('swing',a,move==='kick'?1.3:1);
 }
 private ai():Input {
  const a=this.fighters[1],b=this.fighters[0],out=empty();
  if(this.mode==='guard'){out.guard=true;return out;}if(this.mode==='idle')return out;
  const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),nx=dx/(d||1),nz=dz/(d||1);
  if(a.state==='ready'){
   if(d>1.9){out.x=nx;out.z=nz;}else if(d<1.25){out.x=-nx*.5;out.z=-nz*.5;}
   else {const strafe=Math.sin(this.time*1.5)*.3;out.x=nz*strafe;out.z=-nx*strafe;}
   out.guard=d<3&&b.state==='attack'&&Math.sin(this.time*2.7)>.1;
   if(a.aiWait<=0){
    if(d<2.65&&!out.guard){out.pressed.add(this.random()>.7?'kick':'punch');a.aiWait=.18+this.random()*.28;}
    else if(d>5&&a.energy>45&&this.random()>.65){out.pressed.add('special');a.aiWait=1.2;}
    else a.aiWait=.15;
    if(a.energy>66&&a.hp<530&&a.prime<=0&&this.random()>.62)out.pressed.add('prime');
   }
  }else if(a.state==='attack'&&a.elapsed>a.duration*.55&&d<2.8&&this.random()>.955)out.pressed.add('punch');
  return out;
 }
 step(input:Input,dt=STEP){
  if(!this.running||this.winner!==null)return;
  this.time+=dt;this.ticks++;
  for(const a of this.fighters){a.px=a.x;a.pz=a.z;a.py=a.y;}
  const ai=this.ai();this.update(this.fighters[0],input,dt);this.update(this.fighters[1],ai,dt);
  // Keep feet inside the hall and separate the two physical bodies.
  const [a,b]=this.fighters,dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
  if(d<.7&&Math.abs(a.y-b.y)<1.2){const nx=d>.001?dx/d:1,nz=d>.001?dz/d:0,push=(.7-d)*.5;a.x-=nx*push;a.z-=nz*push;b.x+=nx*push;b.z+=nz*push;}
  for(const f of this.fighters){f.x=clamp(f.x,-8.25,8.25);f.z=clamp(f.z,-8.25,8.25);}
  for(let i=this.shots.length-1;i>=0;i--){
   const s=this.shots[i],x=s.x,z=s.z;s.x+=s.nx*24*dt;s.z+=s.nz*24*dt;s.life-=dt;
   const target=this.fighters[1-s.owner],vx=s.x-x,vz=s.z-z,len=vx*vx+vz*vz;
   const t=clamp(((target.x-x)*vx+(target.z-z)*vz)/(len||1),0,1);
   if(Math.hypot(target.x-(x+vx*t),target.z-(z+vz*t))<.65&&Math.abs(target.y+.95-s.y)<1.2){
    this.receive(target,this.fighters[s.owner],MOVES.special,s.prime,s.nx,s.nz);s.life=0;
   }
   if(s.life<=0||Math.abs(s.x)>12||Math.abs(s.z)>12)this.shots.splice(i,1);
  }
 }
 private update(a:Fighter,input:Input,dt:number){
  const b=this.fighters[1-a.id];a.elapsed+=dt;a.aiWait-=dt;
  a.prime=Math.max(0,a.prime-dt);a.dashDelay=Math.max(0,a.dashDelay-dt);a.guardDelay=Math.max(0,a.guardDelay-dt);
  a.comboWindow=Math.max(0,a.comboWindow-dt);a.comboTime=Math.max(0,a.comboTime-dt);a.hurt=Math.max(0,a.hurt-dt);
  if(a.comboTime===0){a.combo=0;a.stunChain=0;}
  a.energy=Math.min(100,a.energy+dt*3.8);
  if(!a.guarding&&a.guardDelay===0&&a.state!=='broken')a.guard=Math.min(100,a.guard+dt*18);
  const ground=a.y<=FLOOR_Y+.001;
  if(!ground||a.vy>0){a.vy-=24*dt;a.y+=a.vy*dt;if(a.y<=FLOOR_Y){a.y=FLOOR_Y;a.vy=0;this.emit('land',a,.7,a.x,FLOOR_Y,a.z);}}
  a.moving=0;
  if(a.state==='down')return;
  if(a.state==='attack'){
   const m=MOVES[a.move];
   if(input.pressed.has('punch'))a.queued=a.comboStep===1?'punch2':a.comboStep===2?'punch3':'punch1';
   if(input.pressed.has('kick'))a.queued='kick';
   const lunge=a.elapsed<m.contact+.1?m.advance/(m.contact+.1)*dt:0;
   if(Math.hypot(b.x-a.x,b.z-a.z)>1.15){a.x+=Math.sin(a.yaw)*lunge;a.z+=Math.cos(a.yaw)*lunge;}
   if(!a.connected&&a.elapsed>=m.contact){
    a.connected=true;const nx=Math.sin(a.yaw),nz=Math.cos(a.yaw);
    if(a.move==='special'){
     this.shots.push({id:++this.shotId,owner:a.id,x:a.x+nx*.7,z:a.z+nz*.7,y:a.y+.95,nx,nz,life:.65,prime:a.prime>0});this.emit('shot',a,1.3);
    }else{
     const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
     if(d<=m.reach&&Math.abs(b.y-a.y)<1.55&&(dx*nx+dz*nz)/(d||1)>.45)this.receive(b,a,m,a.prime>0,nx,nz);
    }
   }
   if(a.queued&&a.elapsed>=m.duration*.76){this.attack(a,a.queued);return;}
   if(a.elapsed>=a.duration){const queued=a.queued;a.state='ready';if(queued){this.attack(a,queued);return;}}
  }else if(a.state==='dash'){
   a.x+=a.dx*15*dt;a.z+=a.dz*15*dt;
   if(a.elapsed>=a.duration)a.state='ready';
  }else if(a.state!=='ready'){
   if(a.elapsed>=a.duration){if(a.state==='broken')a.guard=45;a.state='ready';}
  }
  if(a.state!=='ready')return;
  if(this.lock||a.id===1)a.yaw=Math.atan2(b.x-a.x,b.z-a.z);
  a.guarding=input.guard&&ground;
  if(input.pressed.has('prime')&&a.prime===0&&a.energy>=60){
   a.energy-=60;a.prime=10;this.enter(a,'transform',.65);this.emit('prime',a,2);return;
  }
  if(input.pressed.has('dash')&&a.energy>=14&&a.dashDelay===0){
   const len=Math.hypot(input.x,input.z);a.dx=len>.1?input.x/len:Math.sin(a.yaw);a.dz=len>.1?input.z/len:Math.cos(a.yaw);
   a.energy-=14;a.dashDelay=.65;this.enter(a,'dash',.22);this.emit('dash',a,1,a.x,a.y+.5,a.z,a.dx,a.dz);return;
  }
  if(input.pressed.has('jump')&&ground&&a.energy>=8){a.energy-=8;a.vy=8.8;this.emit('jump',a,.8,a.x,FLOOR_Y,a.z);}
  if(!a.guarding){
   if(input.pressed.has('punch')){this.attack(a,a.comboWindow>0&&a.comboStep===1?'punch2':a.comboWindow>0&&a.comboStep===2?'punch3':'punch1');return;}
   if(input.pressed.has('kick')){this.attack(a,'kick');return;}
   if(input.pressed.has('special')){this.attack(a,'special');return;}
  }
  const len=Math.hypot(input.x,input.z),amount=Math.min(1,len),speed=(a.prime>0?7.3:5.4)*(a.guarding?.28:1);
  if(len>.08){a.x+=input.x/len*amount*speed*dt;a.z+=input.z/len*amount*speed*dt;a.moving=amount;a.travel+=dt*speed*amount;
   if(!this.lock&&a.id===0)a.yaw=Math.atan2(input.x,input.z);
  }
 }
 private receive(target:Fighter,attacker:Fighter,m:MoveData,prime:boolean,nx:number,nz:number){
  if(target.state==='down')return;
  if(target.prime>0||(target.state==='dash'&&target.elapsed<.13)){
   this.emit('immune',target,1,target.x,target.y+1,target.z,nx,nz);return;
  }
  target.guardDelay=1.6;
  if(target.guarding&&!prime){
   target.guard=Math.max(0,target.guard-m.guard);this.emit('block',target,1,target.x-nx*.3,target.y+1,target.z-nz*.3,nx,nz);
   if(target.guard===0){this.enter(target,'broken',.85);target.queued=null;this.emit('break',target,1.5);}
   return;
  }
  if(target.guarding&&prime){target.guard=0;this.emit('break',target,1.5);}
  const damage=Math.round(m.damage*(prime?1.75:1));target.hp=Math.max(0,target.hp-damage);
  target.hurt=.22;target.queued=null;target.stunChain++;attacker.energy=Math.min(100,attacker.energy+7);
  attacker.combo++;attacker.comboTime=1.4;target.comboTime=1.4;
  target.x+=nx*.1;target.z+=nz*.1;
  this.enter(target,target.hp===0?'down':'hit',Math.max(.19,.41-target.stunChain*.018));
  this.emit('hit',target,damage/65,target.x-nx*.2,target.y+1,target.z-nz*.2,nx,nz);
  if(target.hp===0){this.winner=attacker.id;this.emit('ko',target,2);}
 }
}
