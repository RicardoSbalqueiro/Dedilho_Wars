import {writeFileSync} from 'node:fs';
import {CHAR_IDS,CHARS} from '../src/game/data';
import {ANIMATION_CLIP_IDS,ANIMATION_CLIPS,ANIMATION_FRAMES_PER_FIGHTER,ANIMATION_FPS,animationFrames} from '../src/game/animation';
const signature=(pose:Record<string,number>)=>JSON.stringify(Object.values(pose).map(v=>Math.round(v*1e6)/1e6));
const fighters=CHAR_IDS.map(id=>{
 const clips=ANIMATION_CLIP_IDS.map(clip=>{
  const frames=animationFrames(id,clip).map(p=>Object.fromEntries(Object.entries(p).map(([k,v])=>[k,Number(v.toFixed(6))])));
  const unique=new Set(frames.map(signature)).size;
  if(unique!==frames.length)throw Error(`${id}/${clip}: repeated finished frames`);
  return {id:clip,label:ANIMATION_CLIPS[clip].label,loop:ANIMATION_CLIPS[clip].loop,durationSeconds:ANIMATION_CLIPS[clip].ticks/60,count:frames.length,unique,frames};
 });
 const uniquePoses=new Set(clips.flatMap(c=>c.frames.map(signature))).size;
 if(uniquePoses<=1000)throw Error(`${id}: fewer than 1001 distinct animation frames`);
 return {id,name:CHARS[id].name,frameCount:clips.reduce((n,c)=>n+c.count,0),distinctPoses:uniquePoses,clips};
});
const report={format:'dedilho-animation-frames-v2',poseSampleRate:ANIMATION_FPS,simulationHz:60,framesPerFighter:ANIMATION_FRAMES_PER_FIGHTER,totalFrames:fighters.reduce((n,f)=>n+f.frameCount,0),note:'Frames vetoriais articulados. Mais amostras por segundo visual, com a mesma duração em segundos. A simulação continua a 60 Hz; os golpes, Ultimates e finishers são adicionais.',fighters};
writeFileSync(process.argv[2]||'docs/animation-frames.json',JSON.stringify(report));
console.log(JSON.stringify({fighters:fighters.map(({id,frameCount,distinctPoses})=>({id,frameCount,distinctPoses})),totalFrames:report.totalFrames}));
