import {CHAR_IDS,CHARS} from '../data';
import {ACTIVITIES,activity,TRAINING_RULES,rotatingMissions} from './catalog';
import {GRADE_VALUE,freshMetrics} from './evaluation';
import type {CharId} from '../data';
import type {TrainingProgress,TrainingResult,RotationMission,Grade} from './types';
export function freshProgress():TrainingProgress{return {version:1,revision:0,xp:0,rank:0,exams:[],completions:{},mastery:{},uses:{},history:[],tower:0,streak:0,bestStreak:0,rivals:{},missions:{},rewards:[],repeatDay:'',repeatXp:0,repeatCount:{},activeSeconds:0,legacy:[]};}
const safe=(n:unknown,max=1e9)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;
export function readProgress(raw:unknown):TrainingProgress{
 const out=freshProgress();if(!raw||typeof raw!=='object'||(raw as TrainingProgress).version!==1)return out;
 const p=raw as TrainingProgress;
 for(const key of ['xp','revision','rank','tower','streak','bestStreak','activeSeconds','repeatXp'] as const)if(safe(p[key]))out[key]=p[key];
 out.rank=Math.min(5,Math.floor(out.rank));out.tower=Math.min(50,Math.floor(out.tower));
 out.exams=Array.isArray(p.exams)?p.exams.filter(x=>/^exam-[0-5]$/.test(x)).slice(0,6):[];
 out.rewards=Array.isArray(p.rewards)?p.rewards.filter(x=>typeof x==='string'&&x.length<150).slice(-1200):[];
 out.legacy=Array.isArray(p.legacy)?p.legacy.filter(x=>typeof x==='string').slice(0,100):[];
 out.repeatDay=typeof p.repeatDay==='string'?p.repeatDay.slice(0,10):'';
 for(const ch of CHAR_IDS){if(safe(p.mastery?.[ch],1e6))out.mastery[ch]=p.mastery[ch];if(safe(p.uses?.[ch]))out.uses[ch]=p.uses[ch];}
 for(const a of ACTIVITIES){const c=p.completions?.[a.id];if(c&&safe(c.count)&&safe(c.wins)&&['D','C','B','A','S'].includes(c.best)&&safe(c.score,100)&&safe(c.first,1e15)&&safe(c.last,1e15))out.completions[a.id]={...c};if(safe(p.repeatCount?.[a.id],100))out.repeatCount[a.id]=p.repeatCount[a.id];}
 out.history=Array.isArray(p.history)?p.history.filter(validResult).slice(0,TRAINING_RULES.historyLimit):[];if(!p.uses)for(const r of out.history)out.uses[r.character]=(out.uses[r.character]??0)+1;
 for(const ch of CHAR_IDS){const r=p.rivals?.[ch];if(r&&r.character===ch&&safe(r.tier,6)&&safe(r.wins)&&safe(r.losses)&&safe(r.streak)&&safe(r.best)&&Number.isInteger(r.tier)&&typeof r.last==='string'&&['aggressive','defensive','technical','unpredictable','adaptive'].includes(r.style))out.rivals[ch]={...r};}
 if(p.missions&&typeof p.missions==='object')for(const [id,m] of Object.entries(p.missions).slice(-24))if(/^(daily|weekly)-[0-9]+-[A-Za-z]+$/.test(id)&&m&&safe(m.value)&&Array.isArray(m.chars))out.missions[id]={value:m.value,chars:m.chars.filter(ch=>CHAR_IDS.includes(ch)).slice(0,18),claimed:m.claimed===true};
 return out;
}
export function validResult(r:unknown):r is TrainingResult {
 if(!r||typeof r!=='object')return false;const v=r as TrainingResult;
 return typeof v.id==='string'&&!!activity(v.activityId)&&CHAR_IDS.includes(v.character)&&CHAR_IDS.includes(v.opponent)&&typeof v.success==='boolean'&&['D','C','B','A','S'].includes(v.grade)&&safe(v.at,1e15)&&safe(v.activeSeconds,2000)&&safe(v.xp,100000)&&!!v.metrics&&Object.keys(freshMetrics()).every(k=>safe(v.metrics[k as keyof typeof v.metrics]))&&safe(v.score,100)&&safe(v.masteryGained,1000)&&typeof v.reason==='string'&&Array.isArray(v.recommendations)&&v.recommendations.every(s=>typeof s==='string'&&s.length<600)&&Array.isArray(v.breakdown)&&v.breakdown.every(b=>b&&typeof b.label==='string'&&typeof b.help==='string'&&safe(b.value,100));
}
export function masteryLevel(p:TrainingProgress,ch:CharId){return Math.min(10,1+Math.floor((p.mastery[ch]??0)/TRAINING_RULES.masteryPerLevel));}
export function applyResult(previous:TrainingProgress,result:TrainingResult,missions:RotationMission[],awardLocal=true):TrainingProgress{
 const p=readProgress(previous);if(p.history.some(r=>r.id===result.id))return p;
 const a=activity(result.activityId);if(!a)return p;
 const r={...result,metrics:{...result.metrics},xp:0,masteryGained:0,promoted:false};
 const nowSeconds=r.at/1000,day=new Date(r.at).toISOString().slice(0,10);if(p.repeatDay!==day){p.repeatDay=day;p.repeatCount={};p.repeatXp=0;}
 const old=p.completions[a.id];p.completions[a.id]={count:(old?.count??0)+1,wins:(old?.wins??0)+(r.success?1:0),best:old&&GRADE_VALUE[old.best]>GRADE_VALUE[r.grade]?old.best:r.grade,score:Math.max(old?.score??0,r.score),first:old?.first??r.at,last:r.at};
 if(a.finite)p.streak=r.success?p.streak+1:0;p.bestStreak=Math.max(p.bestStreak,p.streak);p.activeSeconds+=r.activeSeconds;p.uses[r.character]=(p.uses[r.character]??0)+1;
 if(r.success){
  if(awardLocal){
   const first=`first:${a.id}`;
   if(!p.rewards.includes(first)&&!old?.wins){r.xp=a.xp;p.rewards.push(first);}else if(!a.unique&&(p.repeatCount[a.id]??0)<TRAINING_RULES.repeatPerActivity){const repeat=Math.min(Math.floor(a.xp*TRAINING_RULES.repeatRate),TRAINING_RULES.repeatDailyXp-p.repeatXp);r.xp=Math.max(0,repeat);if(r.xp){p.repeatXp+=r.xp;p.repeatCount[a.id]=(p.repeatCount[a.id]??0)+1;}}
   if(r.grade==='S'&&['challenge','mastery','combo'].includes(a.kind)&&!p.rewards.includes(`gradeS:${a.id}`)&&old?.best!=='S'){r.xp+=TRAINING_RULES.gradeS;p.rewards.push(`gradeS:${a.id}`);}
  }
  r.masteryGained=Math.min(50,12+Math.floor(r.score/10)+(a.finite?10:0));p.mastery[r.character]=Math.min(1080,(p.mastery[r.character]??0)+r.masteryGained);
  if(a.exam!==undefined&&!p.exams.includes(a.id)){p.exams.push(a.id);r.promoted=a.exam>p.rank;p.rank=Math.max(p.rank,a.exam);}
  if(a.floor)p.tower=Math.max(p.tower,a.floor);
 }
 if(a.finite&&!a.npc){
  const oldR=p.rivals[r.opponent],streak=r.success?(oldR?.streak??0)+1:0;
  p.rivals[r.opponent]={character:r.opponent,tier:a.tier,style:a.style,wins:(oldR?.wins??0)+(r.success?1:0),losses:(oldR?.losses??0)+(r.success?0:1),streak,best:Math.max(oldR?.best??0,streak),last:CHARS[r.opponent].quote+(r.success?' · Sua vitória ficou registrada. Prepare-se para a revanche.':' · Treine a defesa e a recuperação na Academia antes da revanche.')};
 }
 for(const m of missions){
  if(nowSeconds<m.start||nowSeconds>=m.end)continue;
  const data=p.missions[m.id]??{value:0,chars:[],claimed:false};if(m.metric==='streak'&&a.finite&&!data.claimed)data.value=r.success?Math.min(m.target,data.value+1):0;if(r.success){
   if(m.metric==='characters'&&!data.chars.includes(r.character))data.chars.push(r.character);
   const add=m.metric==='veteranWins'?Number(a.finite&&a.tier>=2):m.metric==='defense'?Number(a.category==='Defensiva'):m.metric==='gradeA'?Number(GRADE_VALUE[r.grade]>=3):m.metric==='bosses'?Number(!!a.boss):0;
   data.value=m.metric==='characters'?data.chars.length:m.metric==='streak'?data.value:data.value+add;
   if(data.value>=m.target&&!data.claimed){data.claimed=true;if(awardLocal){r.xp+=m.xp;p.rewards.push('mission:'+m.id);}}
  }p.missions[m.id]=data;
 }
 const activeIds=new Set(missions.map(m=>m.id));p.missions=Object.fromEntries(Object.entries(p.missions).filter(([id])=>activeIds.has(id)));
 p.xp+=r.xp;p.revision++;p.history=[r,...p.history].slice(0,TRAINING_RULES.historyLimit);p.rewards=p.rewards.slice(-1200);return p;
}
const STORE='dedilho-wars-training-reborn-v1';
export function localTraining():TrainingProgress{
 try{const raw=localStorage.getItem(STORE);if(raw)return readProgress(JSON.parse(raw));const p=freshProgress();const legacy=JSON.parse(localStorage.getItem('dedilho-wars-training-badges-v1')||'[]');p.legacy=Array.isArray(legacy)?legacy.filter(s=>typeof s==='string').slice(0,100):[];return p;}catch{return freshProgress();}
}
export function saveLocalTraining(result:TrainingResult){const p=applyResult(localTraining(),{...result,verified:false},rotatingMissions(result.at/1000,localTraining()),true);try{localStorage.setItem(STORE,JSON.stringify(p));}catch{/* practice remains usable without browser storage */}return p;}
export const gradeLabel=(g:Grade)=>g;

const LAB_TIME='dedilho-wars-training-lab-seconds-v1';
export function laboratorySeconds(){try{const n=Number(localStorage.getItem(LAB_TIME));return safe(n)?n:0;}catch{return 0;}}
export function saveLaboratoryTime(seconds:number){if(!safe(seconds)||seconds===0)return;try{localStorage.setItem(LAB_TIME,String(Math.min(1e9,laboratorySeconds()+seconds)));}catch{/* no rewards or account data depend on this local clock */}}
