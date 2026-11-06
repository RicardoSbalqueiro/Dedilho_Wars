import { Game } from '../src/game/engine';
import { CHARS } from '../src/game/data';
import { COMBO_ROUTES } from '../src/game/combos';
import { ACTIONS,DEFAULT_BINDINGS } from '../src/game/input';
import { readFileSync,writeFileSync } from 'node:fs';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
const bit=(a:string)=>1<<ACTIONS.indexOf(a as any);
const labels:Record<string,string>={p:'J',k:'K',s1:'U',s2:'I',s3:'O',down:'↓',up:'↑',right:'→',left:'←'};
const results=COMBO_ROUTES.map(route=>{
 const g=new Game({mode:'versus',p1:route.ch,p2:'cristyan',difficulty:'normal',bindings:DEFAULT_BINDINGS,online:true},()=>{}),[a,d]=g.f;
 g.phase='fight';a.x=600;d.x=600+a.def.pushW+d.def.pushW+5;
 let stage=0,fed=-1,serial=-1,hit=false;
 for(let t=0;t<700;t++){
  const next=route.steps[stage];
  const ready=stage===0||route.steps[stage-1].move==='jump'?stage===0||a.state==='jump':a.contact==='hit'&&a.serial!==serial;
  if(next&&fed!==stage&&ready){
   g.onlineInputs[0]=next.input.filter(i=>['down','left','right'].includes(i)).reduce((m,i)=>m|bit(i),0);
   g.onlinePressed[0]=next.input.reduce((m,i)=>m|bit(i),0);fed=stage;serial=a.serial;
  }
  if(hit)g.onlineInputs[1]=bit('block');const hp=d.hp;g.step();
  if(d.hp<hp){hit=true;if(next&&next.move!=='jump'&&(a.move?.id===next.move||d.comboMoves.includes(next.move)))stage++;}
  if(next?.move==='jump'&&a.state==='jump'&&!a.move)stage++;
  if(stage===route.steps.length&&d.comboResult?.freeAt!==null&&d.comboResult&&d.state==='ground')break;
 }
 if(stage!==route.steps.length||!d.comboResult?.freeAt)throw Error('Route failed: '+route.id);
 const result={id:route.id,character:route.ch,name:route.name,level:route.level,commands:route.steps.map(s=>s.input.map(i=>labels[i]||i).join('+')).join(' → '),moves:route.steps.map(s=>s.move),hits:d.comboResult.hits,damage:Number(d.comboResult.damage.toFixed(2)),recoveredAt:d.comboResult.freeAt};
 g.destroy();return result;
});
const report={method:{fps:60,target:'cristyan',spacing:'sum of push widths + 5',routes:results.length,guard:'held after first hit',limitations:'Validated reference routes, not a global damage maximum or human balance evaluation. Timing/spacing can vary with the opponent silhouette.'},results};
writeFileSync('docs/combo-routes.json',JSON.stringify(report,null,2)+'\n');
const rows=['| Lutador | Nível / rota | Comandos padrão | Acertos | Dano |','| --- | --- | --- | ---: | ---: |',...results.map(r=>`| ${CHARS[r.character].name} | ${r.level} · ${r.name} | ${r.commands} | ${r.hits} | ${r.damage.toLocaleString('pt-BR')} |`)];
const doc=readFileSync('docs/combos.md','utf8').replace(/<!-- ROUTES_START -->[\s\S]*<!-- ROUTES_END -->/,'<!-- ROUTES_START -->\n'+rows.join('\n')+'\n<!-- ROUTES_END -->');
writeFileSync('docs/combos.md',doc);console.log(`Validated ${results.length} routes against held defense; exported commands, actual hits/damage and recovery ticks.`);
