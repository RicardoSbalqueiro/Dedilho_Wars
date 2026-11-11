import {FORMS} from '../game/resources';
import {CanvasSurface} from '../game/canvas';
import {useEffect,useRef,useState} from 'react';
import {CHAR_IDS,CHARS} from '../game/data';
import type {CharId} from '../game/data';
import {ANIMATION_CLIPS,ANIMATION_CLIP_IDS,ANIMATION_FRAMES_PER_FIGHTER,ANIMATION_SUBFRAMES,animationFrame} from '../game/animation';
import type {AnimationClip} from '../game/animation';
import {computeRig,drawRig} from '../game/rig';
import {FrameTimer} from '../game/timing';

export function AnimationGallery({initial}:{initial:CharId}){
  const [ch,setCh]=useState(initial),[clip,setClip]=useState<AnimationClip>('idle'),[playing,setPlaying]=useState(true),[frame,setFrame]=useState(0),[form,setForm]=useState(false);
  const canvas=useRef<HTMLCanvasElement>(null),position=useRef(0),frames=ANIMATION_CLIPS[clip].frames;
  const seek=(n:number)=>{setPlaying(false);position.current=Math.max(0,Math.min(frames-1,n));setFrame(Math.floor(position.current))};
  useEffect(()=>{
    const surface=new CanvasSurface(canvas.current!,680,380),ctx=surface.ctx,clock=new FrameTimer();let raf=0,notice=0;
    const rebase=()=>clock.rebase();document.addEventListener('visibilitychange',rebase);
    const draw=(now:number)=>{
      surface.prepare();clock.sample(now,playing&&!document.hidden);
      position.current+=clock.deltaFrames*ANIMATION_SUBFRAMES;
      if(position.current>=frames)position.current=ANIMATION_CLIPS[clip].loop?position.current%frames:frames-1;
      const i=Math.floor(position.current),pose=animationFrame(ch,clip,position.current);
      ctx.clearRect(0,0,680,380);const bg=ctx.createRadialGradient(340,220,5,340,220,355);bg.addColorStop(0,CHARS[ch].color2);bg.addColorStop(1,'#0c0a16');ctx.fillStyle=bg;ctx.fillRect(0,0,680,380);
      ctx.strokeStyle=CHARS[ch].glow+'55';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(45,345);ctx.lineTo(635,345);ctx.stroke();
      ctx.save();ctx.translate(330,341);ctx.scale(form&&ch==='jane'?3.2:1.34,form&&ch==='jane'?3.2:1.34);drawRig(ctx,ch,computeRig(ch,pose),pose,{time:position.current/ANIMATION_SUBFRAMES,poseName:ANIMATION_CLIPS[clip].pose,transformation:form,formTime:position.current/ANIMATION_SUBFRAMES});ctx.restore();
      if(now-notice>50){setFrame(i);notice=now;}raf=requestAnimationFrame(draw);
    };raf=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',rebase)};
  },[ch,clip,playing,frames,form]);
  const reset=()=>{position.current=0;setFrame(0)};
  return <section className="animation-gallery" data-animation-character={ch} data-animation-frame={frame}>
    <div className="animation-gallery-fields"><label>Lutador<select aria-label="Lutador da galeria de animação" value={ch} onChange={e=>{setCh(e.target.value as CharId);reset()}}>{CHAR_IDS.map(id=><option key={id} value={id}>{CHARS[id].name}</option>)}</select></label><label>Animação<select aria-label="Clipe de animação" value={clip} onChange={e=>{setClip(e.target.value as AnimationClip);reset()}}>{ANIMATION_CLIP_IDS.map(id=><option key={id} value={id}>{ANIMATION_CLIPS[id].label} · {ANIMATION_CLIPS[id].frames} quadros</option>)}</select></label></div>
    <label><input type="checkbox" aria-label="Exibir transformação" checked={form} onChange={e=>setForm(e.target.checked)}/> Forma: {FORMS[ch].name}</label><p>{FORMS[ch].cost} · até {FORMS[ch].duration/60}s · {FORMS[ch].help}</p>
    <p><strong>{ANIMATION_FRAMES_PER_FIGHTER} quadros por lutador</strong> em {ANIMATION_CLIP_IDS.length} sequências, além dos golpes, Ultimates e finishers.</p>
    <canvas ref={canvas} width={680} height={380} aria-label={`${CHARS[ch].name}: ${ANIMATION_CLIPS[clip].label}`}/>
    <div className="animation-gallery-controls"><button type="button" aria-label="Quadro anterior" onClick={()=>seek(frame-1)}>◀</button><button type="button" onClick={()=>{if(position.current>=frames-1)reset();setPlaying(!playing)}}>{playing?'PAUSAR ANIMAÇÃO':'REPRODUZIR'}</button><button type="button" aria-label="Próximo quadro" onClick={()=>seek(frame+1)}>▶</button><output aria-live="off">QUADRO {frame+1} / {frames}</output></div>
    <label className="animation-gallery-scrubber">Inspecionar quadro<input aria-label="Quadro da animação" type="range" min={0} max={frames-1} step={1} value={frame} onChange={e=>seek(+e.target.value)}/></label>
    <p>Os ciclos são usados na luta. Pausar esta prévia não muda a duração dos golpes, a defesa ou as hitboxes.</p>
  </section>;
}
