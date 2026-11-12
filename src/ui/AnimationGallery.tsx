import {useEffect,useRef,useState} from 'react';
import {CHAR_IDS,CHARS,movePhase} from '../game/data';
import type {CharId} from '../game/data';
import {FORMS} from '../game/resources';
import {CanvasSurface} from '../game/canvas';
import {ANIMATION_CLIPS,ANIMATION_CLIP_IDS,ANIMATION_SUBFRAMES,animationFrame,attackAnimation} from '../game/animation';
import type {AnimationClip} from '../game/animation';
import {computeRig,drawRig} from '../game/rig';
import type {DrawOpts} from '../game/rig';
import {modelSheetPose} from '../game/model-sheet';
import {FrameTimer} from '../game/timing';
import {preloadAnimeSprite} from '../game/anime-sprite';
import {drawFormPreview} from '../game/form-effects';

type GalleryClip=AnimationClip|`move:${string}`;
const ATTACKS=['pL','pM','pH','kH','cP','cK','s1','s2','s3'] as const;

export function AnimationGallery({initial}:{initial:CharId}){
  const [ch,setCh]=useState(initial),[clip,setClip]=useState<GalleryClip>('walk'),[playing,setPlaying]=useState(true),[frame,setFrame]=useState(0),[form,setForm]=useState(false),[sheet,setSheet]=useState(false);
  const canvas=useRef<HTMLCanvasElement>(null),position=useRef(0);
  const move=clip.startsWith('move:')?CHARS[ch].moves[clip.slice(5)]:undefined;
  const motion=move?undefined:ANIMATION_CLIPS[clip as AnimationClip];
  const frames=move?(move.startup+move.active+move.recovery+move.whiff)*ANIMATION_SUBFRAMES:motion!.frames;
  const label=move?.label||motion!.label;
  const seek=(n:number)=>{setPlaying(false);position.current=Math.max(0,Math.min(frames-1,n));setFrame(Math.floor(position.current))};
  useEffect(()=>{void preloadAnimeSprite(ch,form)},[ch,form]);
  useEffect(()=>{
    const surface=new CanvasSurface(canvas.current!,680,380),ctx=surface.ctx,clock=new FrameTimer();let raf=0,notice=0;
    const rebase=()=>clock.rebase();document.addEventListener('visibilitychange',rebase);
    const draw=(now:number)=>{
      surface.prepare();clock.sample(now,playing&&!document.hidden);
      position.current+=clock.deltaFrames*ANIMATION_SUBFRAMES;
      if(position.current>=frames)position.current=move||motion?.loop?position.current%frames:frames-1;
      const i=Math.floor(position.current),time=position.current/ANIMATION_SUBFRAMES;
      const pose=sheet?modelSheetPose(ch,time):move?attackAnimation(ch,move,time,false):animationFrame(ch,clip as AnimationClip,position.current);
      const phase=move?movePhase(move,time,false):undefined;
      const options:DrawOpts={time,transformation:form,formTime:time,poseName:sheet?'model':move?move.poses[phase?.phase==='startup'?0:1]:motion!.pose};
      if(sheet)options.spriteState='idle';
      else if(move)Object.assign(options,{spriteState:'attack',spriteMove:move.id,spritePhase:phase!.phase,spriteProgress:phase!.progress,spriteKind:move.kind==='normal'?/^(k|cK|jK)/.test(move.id)?'kick':'punch':'special',spriteRank:move.rank,spriteAir:move.air,normalAccessory:move.accessory});
      else Object.assign(options,{spriteAction:clip,spriteStateTime:time,spriteState:clip==='walk'||clip==='dash'?'walk':clip==='jump'?'jump':clip==='guard'?'guard':clip==='crouch'||clip==='getup'?'crouch':clip==='hit'?'hit':clip==='win'?'victory':'idle'});
      ctx.clearRect(0,0,680,380);const bg=ctx.createRadialGradient(340,220,5,340,220,355);bg.addColorStop(0,CHARS[ch].color2);bg.addColorStop(1,'#0c0a16');ctx.fillStyle=bg;ctx.fillRect(0,0,680,380);
      ctx.strokeStyle=CHARS[ch].glow+'55';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(45,345);ctx.lineTo(635,345);ctx.stroke();
      ctx.save();ctx.translate(330,341);ctx.scale(form&&ch==='jane'?3.2:1.34,form&&ch==='jane'?3.2:1.34);
      if(form)drawFormPreview(ctx,ch,time+30);
      const rig=computeRig(ch,pose);drawRig(ctx,ch,rig,pose,options);ctx.restore();
      if(now-notice>50){setFrame(i);notice=now;}raf=requestAnimationFrame(draw);
    };raf=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',rebase)};
  },[ch,clip,playing,frames,form,sheet,move,motion]);
  const reset=()=>{position.current=0;setFrame(0)};
  return <section className="animation-gallery" data-animation-character={ch} data-animation-frame={frame}>
    <div className="animation-gallery-fields"><label>Lutador<select aria-label="Lutador da galeria de animação" value={ch} onChange={e=>{setCh(e.target.value as CharId);reset()}}>{CHAR_IDS.map(id=><option key={id} value={id}>{CHARS[id].name}</option>)}</select></label><label>Animação<select aria-label="Clipe de animação" value={clip} onChange={e=>{setClip(e.target.value as GalleryClip);reset()}}><optgroup label="Movimentação">{ANIMATION_CLIP_IDS.map(id=><option key={id} value={id}>{ANIMATION_CLIPS[id].label}</option>)}</optgroup><optgroup label="Golpes">{ATTACKS.map(id=><option key={id} value={'move:'+id}>{CHARS[ch].moves[id].label}</option>)}</optgroup></select></label></div>
    <label><input type="checkbox" aria-label="Exibir transformação" checked={form} onChange={e=>setForm(e.target.checked)}/> Forma: {FORMS[ch].name}</label><p>{FORMS[ch].cost} · {FORMS[ch].duration/60}s · {FORMS[ch].help}</p>
    <label><input type="checkbox" aria-label="Pose do cartaz" checked={sheet} onChange={e=>setSheet(e.target.checked)}/> Pose do cartaz</label>
    <p><strong>24 desenhos por forma · 864 no elenco.</strong> Caminhada com seis poses e golpes com preparação, contato e recuperação ilustrados.</p>
    <canvas ref={canvas} width={680} height={380} aria-label={`${CHARS[ch].name}: ${label}`}/>
    <div className="animation-gallery-controls"><button type="button" aria-label="Quadro anterior" onClick={()=>seek(frame-1)}>◀</button><button type="button" onClick={()=>{if(position.current>=frames-1)reset();else setFrame(Math.floor(position.current));setPlaying(!playing)}}>{playing?'PAUSAR ANIMAÇÃO':'REPRODUZIR'}</button><button type="button" aria-label="Próximo quadro" onClick={()=>seek(frame+1)}>▶</button><output aria-live="off">TEMPO {frame+1} / {frames}</output></div>
    <label className="animation-gallery-scrubber">Inspecionar animação<input aria-label="Quadro da animação" type="range" min={0} max={frames-1} step={1} value={frame} onChange={e=>seek(+e.target.value)}/></label>
    <p>A régua inclui amostras entre desenhos. Pausar esta prévia não muda a duração dos golpes, a defesa ou as hitboxes.</p>
  </section>;
}
