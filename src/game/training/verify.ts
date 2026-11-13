import {Game} from '../engine';
import {CHAR_IDS} from '../data';
import {DEFAULT_BINDINGS,MAX_INPUT_MASK} from '../input';
import {activity,TRAINING_RULES,TRAINING_VERSION} from './catalog';
import type {GameEvent} from '../engine';
import type {InputSlice,TrainingResult,TrainingSpec} from './types';
export function createTrainingGame(spec:TrainingSpec,onEvent:(e:GameEvent)=>void=()=>{},headless=false,input?:((tick:number)=>{held:number;pressed:number})){
 const a=activity(spec.activityId);if(!CHAR_IDS.includes(spec.p1)||spec.version!==TRAINING_VERSION||!Number.isSafeInteger(spec.seed)||spec.seed<0||spec.seed>4294967295||spec.activityId!=='lab'&&!a||a?.character&&a.character!==spec.p1)throw new Error('Configuração do treinamento inválida.');
 return new Game({mode:'training',p1:spec.p1,p2:a?.opponent??spec.p2??'caetano',stage:a?.stage??spec.stage??'dojo',difficulty:'normal',bindings:DEFAULT_BINDINGS,reborn:spec,headless,trainingInput:input},onEvent);
}
export function parseTranscript(value:unknown):{trace:InputSlice[];ticks:number}{
 if(!Array.isArray(value)||!value.length||value.length>TRAINING_RULES.maxInputs)throw new Error('Sequência de comandos inválida.');let ticks=0;
 const trace:InputSlice[]=value.map(row=>{if(!Array.isArray(row)||row.length!==3||!row.every(Number.isSafeInteger)||row[0]<1||row[0]>TRAINING_RULES.maxTicks||row[1]<0||row[1]>MAX_INPUT_MASK||row[2]<0||row[2]>MAX_INPUT_MASK||row[2]!==0&&row[0]!==1)throw new Error('Comandos fora dos limites.');ticks+=row[0];return [row[0],row[1],row[2]];});
 if(ticks>TRAINING_RULES.maxTicks)throw new Error('A tentativa ultrapassou o tempo máximo.');return {trace,ticks};
}
export function replayTraining(spec:TrainingSpec,value:unknown):TrainingResult {
 if(spec.activityId==='lab'||spec.lab)throw new Error('O laboratório não concede recompensas de conta.');
 const {trace,ticks}=parseTranscript(value);let index=0,left=trace[0][0],fresh=true;
 const g=createTrainingGame(spec,()=>{},true,()=>{const row=trace[index],out={held:row[1],pressed:fresh?row[2]:0};fresh=false;if(--left===0){index++;if(index<trace.length){left=trace[index][0];fresh=true;}}return out;});
 try{
  for(let i=0;i<ticks;i++){if(g.reborn?.result)throw new Error('Há comandos após o resultado final.');g.step();}
  if(!g.reborn?.result)throw new Error('A sequência não comprova a conclusão de uma atividade.');
  return g.reborn.result;
 }finally{g.destroy();}
}
