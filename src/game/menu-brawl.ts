import {CHAR_IDS,CHARS,movePhase} from './data';
import type {CharId,Move} from './data';
import type {DrawOpts} from './rig';
import {FORMS} from './resources';
import {FLOOR_Y} from './stage';

export interface CrowdFighter {
 ch:CharId;x:number;y:number;facing:1|-1;target:CharId;
 state:'walk'|'guard'|'attack'|'hit';move:Move;moveFrame:number;
 form:boolean;formAge:number;contact:boolean;options:DrawOpts;
}
const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
const normals=['pL','pM','pH','kL','kM','kH','cP','cK'] as const;
/** A presentation-only free-for-all. Every roster member shares one ground
 * plane; changing neighbours replace fixed pairs. No match engine or inputs. */
export function menuBrawlFrame(time:number,rally=false):CrowdFighter[]{
 const t=Number.isFinite(time)?Math.max(0,time):0;
 const xs=CHAR_IDS.map((_,i)=>clamp(43+i*(874/17)+Math.sin(t*.014+i*2.4)*38+Math.sin(t*.006+i*.7)*22,34,926));
 const fighters:CrowdFighter[]=CHAR_IDS.map((ch,i):CrowdFighter=>{
  const cycle=48+i%3*5,local=t*(rally?1.3:1)+i*31,beat=Math.floor(local/cycle),phase=local%cycle;
  const move=CHARS[ch].moves[normals[(beat+i*3)%normals.length]];
  const neighbours=CHAR_IDS.map((id,j)=>({id,j,d:Math.abs(xs[j]-xs[i])})).filter(n=>n.j!==i).sort((a,b)=>a.d-b.d||a.j-b.j);
  const rival=neighbours[(beat+i)%Math.min(4,neighbours.length)];
  // Menu timing gives simultaneous clashes a readable contact hold. It samples
  // the normal's own phases without modifying any move or match timing.
  const attacking=phase<32;
  const moveFrame=phase<8?phase/8*move.startup:phase<22?move.startup+(phase-8)/14*move.active:move.startup+move.active+clamp((phase-22)/10,0,1)*(move.recovery+move.whiff),p=movePhase(move,moveFrame,false);
  const formAge=(t+i*71)%960,form=formAge<FORMS[ch].duration;
  const state:CrowdFighter['state']=attacking?'attack':phase>cycle-6?'guard':'walk';
  return {ch,x:xs[i],y:FLOOR_Y,facing:(rival.j===i||xs[rival.j]>=xs[i]?1:-1) as 1|-1,target:rival.id,state,move,moveFrame,form,formAge,
   contact:attacking&&p.phase==='active',options:{time:t+i*11,actionClip:'menu',spriteState:state,spriteMove:move.id,spritePhase:p.phase,spriteProgress:p.progress,spriteKind:/^(k|cK)/.test(move.id)?'kick':'punch',spriteRank:move.rank,spriteAir:false,normalAccessory:ch==='ulisses'&&form?undefined:move.accessory,poseName:move.poses[moveFrame<move.startup?0:1],transformation:form}};
 });
 for(const f of fighters)if(f.state==='attack')f.x+=f.facing*Math.sin(Math.min(1,f.moveFrame/(f.move.startup+f.move.active+f.move.recovery+f.move.whiff))*Math.PI)*12;
 // Multiple attackers can hit the same rival. The attacker/target graph is not
 // divided into duels and a reaction never launches someone into the air.
 for(const f of fighters)if(f.state!=='attack'&&fighters.some(a=>a.target===f.ch&&a.contact&&Math.abs(a.x-f.x)<145)){
  f.state='hit';f.options.spriteState='hit';
 }
 return fighters;
}
