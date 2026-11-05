// Deterministic, bounded combat measurements. This is not an exhaustive combo solver.
import { Game } from '../src/game/engine';
import { CHARS, CHAR_IDS } from '../src/game/data';
import type { CharId } from '../src/game/data';
import { DEFAULT_BINDINGS, keyboard } from '../src/game/input';
import type { Action } from '../src/game/input';
import { touchInput } from '../src/game/touch';
import { writeFileSync } from 'node:fs';

(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
const roots=['pL','kL','cP','pM','pH','kH','cK'];
const endings:Action[]=['s1','s2','s3','super'];
const tails:Action[][]=[[],['p'],['k'],['p','p'],['p','k'],['k','p'],['k','k']];
const routes=roots.flatMap(first=>tails.flatMap(tail=>[tail,...endings.map(e=>[...tail,e])].map(next=>({first,next}))));
const targets:CharId[]=['jane','cristyan','orango'];
const make=(a:CharId,b:CharId,distance:number)=>{
 keyboard.down.clear();keyboard.pressed.clear();touchInput.clear();
 const g=new Game({mode:'versus',p1:a,p2:b,difficulty:'normal',bindings:DEFAULT_BINDINGS,online:true},()=>{});
 g.phase='fight';g.f[0].x=600;g.f[1].x=600+distance;g.f[0].meter=100;return g;
};
let simulations=0;
const measurements=CHAR_IDS.map(ch=>{
 let max={damage:0,target:'',distance:0,route:'',contacts:0};
 for(const target of targets)for(const spacing of [0,65])for(const route of routes){
  const distance=CHARS[ch].pushW+CHARS[target].pushW+5+spacing,g=make(ch,target,distance),[a,d]=g.f;
  let n=0,requestedSerial=-1,hit=false,contacts=0,comboDamage=0;
  g.startMove(a,a.def.moves[route.first]);
  // Once the first hit lands, the defender holds guard at the first legal frame.
  // Stop on recovery: later hits are a new opening, never added to this combo.
  for(let t=0;t<900;t++){
   if(a.contact==='hit'&&a.connected&&a.serial!==requestedSerial&&n<route.next.length){
    requestedSerial=a.serial;a.pad.tap(route.next[n++],g.tick);
   }
   if(hit)g.onlineInputs[1]=1<<6; // block, stable protocol bit
   g.step();contacts=Math.max(contacts,d.comboHits);
   if(['hit','launched','seq'].includes(d.state))comboDamage=d.maxHp-d.hp;
   if(d.hp<d.maxHp)hit=true;
   if(hit&&!g.seq&&!g.cine&&['ground','jump','dash','getup','block'].includes(d.state))break;
   if(!hit&&!g.seq&&!g.cine&&a.state==='ground'&&!g.projectiles.length)break;
  }
  const damage=Math.round(comboDamage*100)/100;
  if(damage>max.damage)max={damage,target,distance,route:[route.first,...route.next.slice(0,n)].join(' → '),contacts};
  g.destroy();simulations++;
 }
 const ult=make(ch,'cristyan',90);ult.f[0].pad.tap('super',ult.tick);
 let captured=false;
 for(let i=0;i<800;i++){ult.step();captured ||=!!ult.seq;if(captured&&!ult.seq)break;}
 const ultimateDamage=ult.f[1].maxHp-ult.f[1].hp;ult.destroy();
 return {character:ch,name:CHARS[ch].name,hp:CHARS[ch].hp,walk:CHARS[ch].walk,pushW:CHARS[ch].pushW,hurtH:CHARS[ch].hurtH,ultimateDamage,maxObservedCombo:max};
});
const report={method:{fps:60,targets,spacings:'sum of push widths + 5; and + 65',routesPerTargetSpacing:routes.length,maxSteps:900,simulations,limitations:'Bounded grounded route search; not a proof of the global maximum. No jumps, dash routes, preplaced projectiles, corner positioning, Precision or Momentum setup. Defender guards after first hit; stop at first recovered state. Visual hit counts in older builds may include phantom sequence contacts. No human playtests.'},measurements};
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
if(process.argv[3]){
 const skip=['poses','attrs','bio','quote','color','color2','glow'];
 const characters=Object.fromEntries(CHAR_IDS.map(id=>[id,Object.fromEntries(Object.entries(CHARS[id]).filter(([k])=>!skip.includes(k)))]));
 writeFileSync(process.argv[3],JSON.stringify({characters},null,2)+'\n');
}
console.log(JSON.stringify(report,null,2));
