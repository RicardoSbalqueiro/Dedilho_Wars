import type {Game,Fighter} from '../engine';
import type {Action} from '../input';
import {ACTIONS} from '../input';
import {RANGED_MOVES} from '../data';
import {COMBO_ROUTES} from '../combos';
import {canTransform} from '../resources';
import type {AIStyle,TrainingTier} from './types';
export const TRAINING_AI_PROFILES=[
 {reaction:30,jitter:8,observe:8,think:18,mistake:.30,block:.22,special:.12,combo:2,ultimate:.08,adapt:0},
 {reaction:21,jitter:7,observe:6,think:14,mistake:.20,block:.42,special:.26,combo:3,ultimate:.20,adapt:.05},
 {reaction:17,jitter:6,observe:6,think:12,mistake:.14,block:.55,special:.42,combo:3,ultimate:.35,adapt:.15},
 {reaction:14,jitter:5,observe:4,think:10,mistake:.10,block:.66,special:.56,combo:4,ultimate:.48,adapt:.30},
 {reaction:12,jitter:4,observe:4,think:8,mistake:.07,block:.75,special:.66,combo:5,ultimate:.60,adapt:.45},
 {reaction:11,jitter:3,observe:3,think:7,mistake:.045,block:.81,special:.74,combo:6,ultimate:.69,adapt:.58},
 {reaction:10,jitter:2,observe:2,think:6,mistake:.025,block:.86,special:.82,combo:6,ultimate:.77,adapt:.70},
] as const;
interface Visible {tick:number;x:number;y:number;state:string;serial:number;guard:boolean;form:boolean;staminaLow:boolean;move:{id:string;startup:number;active:number;recovery:number;whiff:number;t:number;low:boolean;reach:number}|null;projectiles:{x:number;y:number;vx:number;radius:number;low:boolean}[]}
interface Observation {tick:number;kind:'projectile'|'jump'|'guard'|'special'|'exhaust';key:string}
export class CombatMemory {
 events:Observation[]=[];tendencies={projectile:0,jump:0,guard:0,special:0,exhaust:0};private seen=new Set<string>();
 observe(s:Visible,now:number,adapt:number){
  const kinds:Observation['kind'][]=[];if(s.move?.id.startsWith('s'))kinds.push('special');if(s.projectiles.length)kinds.push('projectile');if(s.y< -30)kinds.push('jump');if(s.guard)kinds.push('guard');if(s.staminaLow)kinds.push('exhaust');
  for(const kind of kinds){const key=`${kind}:${kind==='special'?s.serial:Math.floor(s.tick/45)}`;if(this.seen.has(key))continue;this.seen.add(key);this.events.push({tick:now,kind,key});}
  this.events=this.events.filter(e=>e.tick>now-600).slice(-96);this.seen=new Set(this.events.map(e=>e.key));
  if(now%30===0)for(const kind of Object.keys(this.tendencies) as Observation['kind'][]){const desired=Math.min(1,this.events.filter(e=>e.kind===kind).length/6)*adapt;this.tendencies[kind]+=Math.max(-.04,Math.min(.04,desired-this.tendencies[kind]));}
 }
}
export class TrainingBrain {
 readonly memory=new CombatMemory();perception:Visible[]=[];lastObservation:Visible|null=null;
 private nextThink=0;private guardUntil=0;private low=false;private walk=0;private plan:Action[]=[];private continued=-1;private taps:Partial<Record<Action,number>>={};private guardSerial=-1;private bikeRelease=0;private currentStyle:AIStyle;private dash:{at:number;dir:1|-1}|null=null;
 constructor(readonly tier:TrainingTier,readonly style:AIStyle){this.currentStyle=style;}
 private tap(g:Game,f:Fighter,a:Action){f.pad.set(a,true,g.tick);if(f.pad.pressedAt[a]!==g.tick)f.pad.tap(a,g.tick);this.taps[a]=g.tick+2;}
 act(g:Game,f:Fighter){
  const P=TRAINING_AI_PROFILES[this.tier],o=g.opp(f),now=g.tick;
  for(const a of ACTIONS)if((this.taps[a]??Infinity)<=now){f.pad.set(a,false,now);delete this.taps[a];}
  if(f.ch==='jane'&&f.move?.id==='s2')f.pad.set('s2',now<this.bikeRelease,now);
  if(now%P.observe===0||!this.perception.length){
   this.perception.push({tick:now,x:o.x,y:o.y,state:o.state,serial:o.serial,guard:o.guard,form:o.formT>0,staminaLow:o.exhaustT>0,move:o.move?{id:o.move.id,startup:o.move.startup,active:o.move.active,recovery:o.move.recovery,whiff:o.move.whiff,t:o.moveT,low:o.move.level==='low',reach:o.move.hb[1]}:null,projectiles:g.projectiles.filter(p=>p.owner!==f.idx&&p.life>0&&p.move.dmg>0).map(p=>({x:p.x,y:p.y,vx:p.vx,radius:p.radius??18,low:p.move.level==='low'}))});
   this.perception=this.perception.filter(s=>s.tick>now-64).slice(-34);
  }
  const latency=P.reaction+Math.floor(g.random()*(P.jitter+1)),seen=[...this.perception].reverse().find(s=>s.tick<=now-latency);
  if(!seen){for(const a of ['left','right','block','down'] as const)f.pad.set(a,false,now);return;}
  this.lastObservation=seen;this.memory.observe(seen,now,P.adapt*(this.style==='adaptive'?1:.65));
  const distance=Math.abs(seen.x-f.x),dir=seen.x>=f.x?1:-1;
  const free=f.y===0&&f.landLag===0&&(f.state==='ground'||f.state==='dash'&&f.stateT>=4)&&!f.ko;
  const canGuard=['ground','block','hit','getup','dash'].includes(f.state)&&!f.ko;
  const rnd=()=>g.random();
  if(this.style==='unpredictable'&&now%210===0)this.currentStyle=(['aggressive','defensive','technical'] as AIStyle[])[Math.floor(rnd()*3)];
  const aggressive=this.currentStyle==='aggressive',defensive=this.currentStyle==='defensive',technical=this.currentStyle==='technical';
  const tendency=this.memory.tendencies;
  if(f.state==='attack'){
   // Confirmed own contacts may use the same legal cancel window as a human.
   if(f.connected&&this.plan.length&&f.serial!==this.continued){this.continued=f.serial;this.tap(g,f,this.plan.shift()!);}
   if(f.move&&f.moveT>f.move.startup+f.move.active&&!f.connected)this.plan=[];
  }else if(!free)this.plan=[];
  if(canGuard&&seen.move&&seen.state==='attack'&&seen.serial!==this.guardSerial){
   this.guardSerial=seen.serial;
   const remaining=seen.move.startup+seen.move.active-seen.move.t-(now-seen.tick);
   if(remaining>0&&distance<seen.move.reach+f.def.pushW+25&&rnd()<Math.min(.93,P.block*(defensive?1.1:.95))){this.guardUntil=now+Math.max(6,remaining+8);this.low=seen.move.low;}
  }
  const threat=seen.projectiles.find(p=>{const x=p.x+p.vx*(now-seen.tick),dx=f.x-x;return Math.abs(dx)<240&&(p.vx===0||dx*p.vx>0);});
  if(threat&&canGuard&&now>=this.nextThink&&rnd()<P.block+tendency.projectile*.15){this.guardUntil=now+18;this.low=threat.low;}
  const conserve=f.stamina<28||f.guardMeter<24||f.exhaustT>0;
  if(f.guardMeter<18)this.guardUntil=0;
  let block=canGuard&&now<this.guardUntil;
  if(f.state==='block'&&f.blockstun>0)block=true;
  if(free&&now>=this.nextThink&&!block){
   this.nextThink=now+P.think+Math.floor(rnd()*P.think*.8);this.plan=[];
   const r=rnd();
   if(r<P.mistake){this.walk=rnd()<.55?0:rnd()<.5?1:-1;}
   else if(conserve||seen.form){this.walk=-1;if(!seen.form&&rnd()<P.block*.5)this.guardUntil=now+P.think;}
   else if(f.manualFacing&&f.facing!==dir)this.tap(g,f,'turn');
   else if(!f.npc&&canTransform(f)&&distance>180&&rnd()<P.special*.18){this.tap(g,f,'transform');this.walk=0;}
   else if(f.ch==='rickzera'&&f.formT===0&&f.formStartup===0&&f.energy<25&&distance>260){f.pad.set('charge',true,now);this.walk=0;}
   else {
    f.pad.set('charge',false,now);
    const punish=seen.move&&seen.state==='attack'&&seen.move.t>=seen.move.startup+seen.move.active&&seen.move.startup+seen.move.active+seen.move.recovery+seen.move.whiff-seen.move.t-(now-seen.tick)>f.def.moves.headbutt.startup+3;
    const melee=Math.max(75,Math.min(140,f.def.moves.pL.hb[1]+o.def.pushW-8));
    if(punish&&distance<f.def.moves.headbutt.hb[1]+o.def.pushW-4&&rnd()<.4+P.special*.6){this.tap(g,f,'headbutt');this.walk=0;}
    else if(seen.guard&&distance<76&&rnd()<.2+tendency.guard*.65){this.tap(g,f,'grab');this.walk=0;}
    else if(seen.y< -35&&distance<150&&rnd()<P.special+tendency.jump*.2){this.tap(g,f,seen.y> -125?'headbutt':'up');this.walk=0;}
    else if(!f.npc&&f.meter>=100&&distance<300&&(seen.state==='hit'||seen.state==='down'||seen.state==='cine'||punish)&&rnd()<P.ultimate){this.tap(g,f,'super');this.walk=0;}
    else if(distance<melee&&rnd()<(aggressive?.9:defensive?.5:.7)){
     const route=COMBO_ROUTES.find(r=>r.ch===f.ch&&r.id.endsWith(P.combo>=5?'-signature':'-three'))!;
     this.plan=route.steps.map(s=>s.input[0]).slice(0,P.combo);this.continued=-1;this.tap(g,f,this.plan.shift()!);this.walk=0;
    }else if(distance<165&&rnd()<P.special*.5){const choices:Action[]=f.ch==='jane'?['s3','s2']:['s1','s2','s3'];const a=choices[Math.floor(rnd()*choices.length)];if(a==='s2'&&f.ch==='jane')this.bikeRelease=now+40+Math.floor(rnd()*85);this.tap(g,f,a);this.walk=0;}
    else if(distance>180&&f.rangedCooldown===0&&!f.npc&&RANGED_MOVES[f.ch].length&&rnd()<P.special*(defensive?1:.7)){const a=RANGED_MOVES[f.ch][Math.floor(rnd()*RANGED_MOVES[f.ch].length)] as Action;this.tap(g,f,a);this.walk=0;}
    else{const preferred=melee*(defensive?1.7:technical?1.2:.9);this.walk=distance>preferred?1:distance<preferred-30?-1:0;
     if(distance>360&&this.walk===1&&this.tier>=2&&f.stamina>55&&rnd()<.14){this.dash={at:now,dir};}
     if(threat&&this.tier>=3&&rnd()<.16+tendency.projectile*.15)this.tap(g,f,'up');
    }
   }
  }
  if(f.state==='jump'&&!f.airAttacked&&Math.abs(seen.y-f.y)<120&&distance<140&&rnd()<.05+this.tier*.01)this.tap(g,f,'k');
  let direction=free&&!block?this.walk*dir:0;
  if(this.dash){const age=now-this.dash.at;if(age>6||!free)this.dash=null;else direction=age===0||age===3||age===4||age===5?0:this.dash.dir;}
  f.pad.set('left',direction<0,now);f.pad.set('right',direction>0,now);f.pad.set('block',block,now);f.pad.set('down',block&&this.low,now);
 }
}
