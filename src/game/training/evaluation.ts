import type {Activity,Grade,TrainingMetrics,TrainingResult} from './types';
export const GRADE_VALUE:Record<Grade,number>={D:0,C:1,B:2,A:3,S:4};
export function freshMetrics():TrainingMetrics{return {walk:0,jump:0,dash:0,turn:0,crouch:0,hits:0,normalHits:0,specialHits:0,uniqueSpecials:0,lowHits:0,airHits:0,headHits:0,grabs:0,damage:0,blocks:0,perfects:0,lowBlocks:0,antiAir:0,punishes:0,guardBreaks:0,bestCombo:0,comboUlt:0,superHits:0,forms:0,formHits:0,staminaRecovered:0,energyCharged:0,resourceRecovered:0,cooldowns:0,route:0,wins:0,activeTicks:0,attempts:0,connected:0,whiffs:0,damageTaken:0,staminaUsed:0,exhausts:0,specialStarts:0,formStarts:0,minHp:1,enemyStarts:0,winStreak:0};}
const clamp=(v:number)=>Math.max(0,Math.min(100,v));
export function evaluate(a:Activity,m:TrainingMetrics,success:boolean):Pick<TrainingResult,'grade'|'score'|'breakdown'|'recommendations'>{
 const precision=clamp(m.attempts?100*m.connected/m.attempts:100),health=clamp(100-m.damageTaken/12),speed=clamp(110-m.activeTicks/(a.evaluation==='survival'?90:45)),defense=clamp(100*(m.blocks+m.perfects*.5)/(Math.max(1,m.blocks+m.enemyStarts*.1))),resources=clamp(100-m.exhausts*22-m.staminaUsed/45),combo=clamp(40+m.bestCombo*10);
 const values:Record<Activity['evaluation'],{label:string;value:number;help:string}[]>={
 mobility:[{label:'Execução',value:success?100:45,help:'Movimentos reais concluídos.'},{label:'Ritmo',value:speed,help:'Tempo ativo até completar.'}],
 precision:[{label:'Precisão',value:precision,help:'Ataques que conectaram / ataques iniciados.'},{label:'Ritmo',value:speed,help:'Tempo ativo até o objetivo.'},{label:'Controle',value:health,help:'Dano recebido durante o exercício.'}],
 defense:[{label:'Defesa',value:defense,help:'Bloqueios reais, com bônus por precisão.'},{label:'Preservação',value:health,help:'Vida preservada.'},{label:'Ritmo',value:speed,help:'Tentativas dentro do tempo ativo.'}],
 resource:[{label:'Eficiência',value:resources,help:'Esgotamentos e gasto de stamina.'},{label:'Execução',value:success?100:40,help:'Uso real do recurso pedido.'},{label:'Precisão',value:precision,help:'Acertos em relação aos ataques.'}],
 combo:[{label:'Confirmação',value:precision,help:'Ataques que conectaram.'},{label:'Sequência',value:combo,help:'Melhor combo real do motor.'},{label:'Ritmo',value:speed,help:'Tempo para confirmar a sequência.'}],
 combat:[{label:'Controle',value:health,help:'Dano recebido.'},{label:'Precisão',value:precision,help:'Acertos em relação aos ataques.'},{label:'Recursos',value:resources,help:'Stamina usada com segurança.'},{label:'Pressão',value:combo,help:'Melhor cadeia confirmada.'}],
 survival:[{label:'Resistência',value:clamp(m.activeTicks/Math.max(1,a.goals[0].target)*100),help:'Tempo sobrevivido em combate.'},{label:'Preservação',value:health,help:'Vida preservada.'},{label:'Recursos',value:resources,help:'Fôlego disponível durante a pressão.'}],
 };
 const breakdown=values[a.evaluation].map(v=>({...v,value:Math.round(v.value)}));
 const score=Math.round(breakdown.reduce((n,v)=>n+v.value,0)/breakdown.length),grade:Grade=!success?'D':score>=90?'S':score>=75?'A':score>=60?'B':score>=45?'C':'D';
 const recommendations:string[]=[];
 if(m.exhausts>0)recommendations.push(`Você esgotou a stamina ${m.exhausts} vez(es). Pratique Gerenciamento de fôlego.`);
 if(m.attempts>3&&precision<65)recommendations.push('Muitos ataques ficaram sem contato. Aproxime-se e confirme antes de continuar a sequência.');
 if(m.damageTaken>250)recommendations.push('Você recebeu muita pressão. Treine Guarda e No último instante.');
 if(m.bestCombo<3&&a.evaluation==='combat')recommendations.push('Pratique a rota Três tempos da Academia para converter aberturas em combos.');
 if(!success&&a.constraints?.noSpecial&&m.specialStarts)recommendations.push('Este exercício permite apenas golpes normais e mobilidade. Os especiais iniciados invalidaram a tentativa.');
 if(!recommendations.length)recommendations.push(success?'Boa execução. Experimente uma rota mais exigente ou avance nos exames.':'Observe a orientação do treinador e repita com mais calma.');
 return {grade,score,breakdown,recommendations:recommendations.slice(0,3)};
}
