import assert from 'node:assert/strict';
import {ACTIVITIES,CHALLENGES,COMBO_LESSONS,EXAMS,LESSONS,MASTERY,NPC_DRILLS,RIVAL_ACTIVITIES,TRAINING_RULES,TRAINING_VERSION,TOWER,activity,lockedReason,rivalStyle,rotatingMissions,unlockedTier} from '../src/game/training/catalog';
import {freshProgress,applyResult,readProgress,masteryLevel} from '../src/game/training/progress';
import {createTrainingGame,replayTraining,parseTranscript} from '../src/game/training/verify';
import {freshMetrics,evaluate} from '../src/game/training/evaluation';
import {TrainingBrain,TRAINING_AI_PROFILES} from '../src/game/training/ai';
import {CHAR_IDS,CHARS} from '../src/game/data';
import {TRAINING_NPCS,npcDefinition} from '../src/game/training/npc';
import {DEFAULT_LAB} from '../src/game/training/catalog';
import {MAX_INPUT_MASK} from '../src/game/input';
import type {Game} from '../src/game/engine';
import type {CharId} from '../src/game/data';
import type {TrainingResult,TrainingSpec} from '../src/game/training/types';
(globalThis as any).window={addEventListener(){},removeEventListener(){},setInterval(){return 0}};
const spec=(activityId:string,p1:CharId='caetano',seed=1827):TrainingSpec=>({activityId,p1,seed,version:TRAINING_VERSION,npc:activity(activityId)?.npc});
const simulate=(s:TrainingSpec,input:(g:Game)=>{held:number;pressed:number},limit=10800)=>{let g:Game;g=createTrainingGame(s,()=>{},true,()=>input(g));for(let i=0;i<limit&&!g.reborn!.result;i++)g.step();return g;};
assert(CHALLENGES.length>=50);assert.equal(COMBO_LESSONS.length,90);assert.equal(TOWER.length,50);assert.equal(EXAMS.length,6);assert.equal(MASTERY.length,18*3);assert.equal(new Set(ACTIVITIES.map(a=>a.id)).size,ACTIVITIES.length);
for(const a of ACTIVITIES){assert(a.goals.length>0);for(const goal of a.goals)assert(goal.metric in freshMetrics());assert(a.xp>0);assert(CHAR_IDS.includes(a.opponent));}
let first:TrainingResult;
{
 const g=simulate(spec('lesson-move'),()=>({held:2,pressed:0}));assert(g.reborn!.result?.success);first=g.reborn!.result!;const replay=replayTraining(spec('lesson-move'),g.reborn!.transcript);assert.deepEqual(replay.metrics,first.metrics);g.destroy();
}
{
 const g=simulate(spec('lesson-basic'),g=>{if(g.tick===1)g.f[1].x=1450;return {held:16,pressed:0};},120);assert.equal(g.reborn!.metrics.hits,0,'punching air is not an accomplishment');assert.equal(g.reborn!.result,null);g.paused=true;const t=g.reborn!.metrics.activeTicks;for(let i=0;i<180;i++)g.step();assert.equal(g.reborn!.metrics.activeTicks,t);g.destroy();
}
{
 const g=simulate(spec('lesson-guard'),()=>({held:64,pressed:0}),2500);assert(g.reborn!.result?.success,'scripted opponent delivers actual block contacts');assert(g.reborn!.metrics.blocks>=4);assert.deepEqual(replayTraining(spec('lesson-guard'),g.reborn!.transcript).metrics,g.reborn!.metrics);g.destroy();
}
{
 const g=simulate(spec('lesson-perfect'),g=>{const m=g.f[1].move;const guard=!!m&&g.f[1].moveT>=m.startup-2&&g.f[1].moveT<=m.startup;return {held:guard?64:0,pressed:0};},3000);assert(g.reborn!.result?.success,'precise actual guard contacts complete the lesson');assert(g.reborn!.metrics.perfects>=3);assert.deepEqual(replayTraining(spec('lesson-perfect'),g.reborn!.transcript).metrics,g.reborn!.metrics);g.destroy();
}
for(const ch of CHAR_IDS){
 const g=simulate(spec('lesson-jump',ch),g=>({held:g.tick%85===0?4:0,pressed:0}),700);assert(g.reborn!.result?.success,ch+' jump lesson');const replay=replayTraining(spec('lesson-jump',ch),g.reborn!.transcript);assert.deepEqual(replay.metrics,g.reborn!.metrics,ch+' seeded replay');assert.equal(g.f[0].maxHp,CHARS[ch].hp);g.destroy();
}
{
 const g=simulate(spec('lesson-dash'),g=>({held:[0,3].includes(g.tick%45)?2:0,pressed:0}),600);assert(g.reborn!.result?.success,'double-tap transcripts preserve distinct edges');assert.deepEqual(replayTraining(spec('lesson-dash'),g.reborn!.transcript).metrics,g.reborn!.metrics);g.destroy();
}
{
 const before=freshProgress();let p=applyResult(before,{...first!,id:'unique-1',at:1794590000000,grade:'A',score:80,verified:false},[],true);assert.equal(p.xp,50);const same=applyResult(p,{...first!,id:'unique-1',at:1794590000000},[],true);assert.equal(same.xp,p.xp,'duplicate local completion cannot grant again');
 for(let i=0;i<5;i++)p=applyResult(p,{...first!,id:'repeat-'+i,at:1794590000000+i,grade:'A'},[],true);assert.equal(p.xp,74,'at most two eligible 25 percent repeats');
 const failed=applyResult(p,{...first!,id:'failed',success:false,at:1794590010000,grade:'D'},[],true);assert.equal(failed.xp,p.xp);assert.equal(readProgress(JSON.parse(JSON.stringify(p))).xp,p.xp);assert.equal(masteryLevel(freshProgress(),'caetano'),1);p.mastery.caetano=1080;assert.equal(masteryLevel(p,'caetano'),10);
}
{
 const p=freshProgress();assert.equal(unlockedTier(p),1);assert(lockedReason(TOWER[49],p,'caetano'));assert(lockedReason(RIVAL_ACTIVITIES.find(a=>a.tier===6)!,p,'caetano'));assert(lockedReason(EXAMS[0],p,'caetano'));
 for(const a of LESSONS.slice(0,5))p.completions[a.id]={count:1,wins:1,best:'A',score:80,first:1,last:1};p.exams=['exam-0','exam-1'];const normal=RIVAL_ACTIVITIES.find(a=>a.tier===1)!;p.completions[normal.id]={count:2,wins:2,best:'A',score:80,first:1,last:1};assert.equal(unlockedTier(p),2);p.history=[];assert.equal(unlockedTier(readProgress(p)),2,'unlocks survive bounded-history pruning');
}
{
 const now=1794590000,p=freshProgress(),m=rotatingMissions(now,p);assert(m.every(x=>x.start<=now&&x.end>now));assert(!m.some(x=>x.metric==='veteranWins'),'new players are offered possible daily missions');const high={...p,exams:['exam-1']};assert(rotatingMissions(now+86400,high).every(x=>x.id!==m[0].id||x.period==='weekly'));
}
{
 const a=CHALLENGES.find(a=>a.evaluation==='defense')!,b=CHALLENGES.find(a=>a.evaluation==='combo')!,m={...freshMetrics(),attempts:10,connected:4,bestCombo:6,blocks:7,perfects:3,enemyStarts:10,damageTaken:100};assert.notDeepEqual(evaluate(a,m,true).breakdown,evaluate(b,m,true).breakdown);assert(evaluate(a,m,true).recommendations.length<=3);
}
for(const tier of [0,1,2,3,4,5,6] as const){
 assert(TRAINING_AI_PROFILES[tier].reaction>=10);const g=createTrainingGame(spec('city-moderator'),()=>{},true);g.f[1].pad.reset();g.f[1].state='hit';g.f[1].hitstun=80;const brain=new TrainingBrain(tier,'adaptive');for(let i=0;i<50;i++){g.tick++;brain.act(g,g.f[1]);for(const a of ['p','k','s1','s2','s3','super','transform','grab'] as const)assert(!g.f[1].pad.held[a],'AI cannot attack while in hitstun');}g.destroy();
}
for(const id of ['moderator','supreme'] as const){const def=npcDefinition(id);assert.equal(def.hp,TRAINING_NPCS[id].hp);assert(def.moves.s1.label);assert.equal(CHAR_IDS.length,18,'training NPCs do not enter the PvP roster');}
{
 const s={...spec('lab'),lab:{...DEFAULT_LAB,dummy:'record' as const}},g=createTrainingGame(s,()=>{},true,()=>({held:2,pressed:0}));for(let i=0;i<60;i++)g.step();assert.equal(g.reborn!.recordTicks,60);assert(g.f[1].x>1040);const trace=JSON.stringify(g.reborn!.recording);g.reborn!.configureLab({...g.reborn!.lab,dummy:'playback'});for(let i=0;i<30;i++)g.step();assert(g.reborn!.playbackTick>0);assert.equal(JSON.stringify(g.reborn!.recording),trace);assert.equal(g.reborn!.result,null);assert.throws(()=>replayTraining(s,[[1,0,0]]));g.destroy();
}
// Account verification must reproduce full fights, not just short tutorials.
for(const ch of ['caetano','jane','ulisses','rickzera','santox'] as const){
 const s=spec('city-moderator',ch,98231);const g=simulate(s,g=>{const a=g.f[0],b=g.f[1],distance=Math.abs(a.x-b.x);let held=distance>75?(b.x>a.x?2:1):0;if(g.tick%24===0)held|=16;if(g.tick%91===0)held|=128;if(a.meter>=200&&a.formT===0&&a.formStartup===0)held|=16384;else if(a.meter>=100&&distance<160&&g.tick%60===0)held|=1024;return {held,pressed:0};});assert(g.reborn!.result,ch+' full fight reaches a result');const replay=replayTraining(s,g.reborn!.transcript);assert.deepEqual(replay.metrics,g.reborn!.result!.metrics,ch+' actual fight replay');g.destroy();
}
for(const bad of [null,[],[[0,0,0]],[[1,MAX_INPUT_MASK+1,0]],[[2,0,1]],[[10801,0,0]],[[1,-1,0]],[[1,0,NaN]]])assert.throws(()=>parseTranscript(bad));
assert.throws(()=>replayTraining(spec('lesson-move'),[[60,0,0]]),'unproven result never accepted');
{
 const g=createTrainingGame({...spec('lab'),lab:{...DEFAULT_LAB,dummy:'p2'}},()=>{},true);assert.equal(g.train.dummy,3,'P2 controls survive lab setup');assert(g.f.every(f=>f.blood<=3),'lab blood is a percentage of three lives');g.reborn!.configureLab({...DEFAULT_LAB,dummy:'p2'});assert.equal(g.train.dummy,3);g.destroy();
 const p=freshProgress(),now=1794590000,m=rotatingMissions(now,p)[0];p.missions[m.id]={value:1,chars:[],claimed:false};p.exams=['exam-0','exam-1'];const a=RIVAL_ACTIVITIES.find(a=>a.tier===1)!;p.completions[a.id]={count:2,wins:2,best:'A',score:90,first:1,last:1};assert.equal(rotatingMissions(now,p)[0].id,m.id,'daily assignment survives unlocking a difficulty');p.rivals[a.opponent]={character:a.opponent,tier:1,style:'technical',wins:2,losses:0,streak:2,best:2,last:'rematch'};assert.equal(rivalStyle(a,p),'adaptive','repeated victories change rival strategy without changing attributes');
}
assert.deepEqual(readProgress({version:99,xp:9999}),freshProgress());assert.equal(NPC_DRILLS.length,3);const cityWin=applyResult(freshProgress(),{...first!,id:'npc-victory',activityId:'city-moderator',opponent:'ulisses'},[],false);assert.equal(cityWin.completions['city-moderator'].wins,1);assert.equal(cityWin.rivals.ulisses,undefined,'soldier encounters do not count as victories against Ulisses');
console.log('Training Reborn: 54+ challenges, 18 mastery tracks, 90 real combo routes, 50 floors, actual contacts/perfects/jumps/dashes, seeded input replay, pause, idempotent progression, repeats, unlocks, possible rotations, distinct grading, AI state locks and NPC/lab recording passed.');
