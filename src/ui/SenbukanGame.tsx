import {useEffect,useRef,useState} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';
import {SenbukanScene} from '../game/senbukan3d/scene';
import type {Action,Mode} from '../game/senbukan3d/sim';
import {audio} from '../game/audio';
import dojoStudy from '../assets/senbukan/dojo-concept.webp';
import fighterStudy from '../assets/senbukan/fighters-concept.webp';
import './SenbukanGame.css';

type Phase='loading'|'intro'|'playing'|'pause'|'result'|'error';
const commands=[['W A S D','Mover'],['J · J · J','Sequência de socos'],['K','Chute'],['U','Dedilho'],['E','Segurar defesa'],['SHIFT','Dash'],['ESPAÇO','Pular'],['F','Karatê Prime'],['Q','Fixar / liberar alvo'],['Arrastar','Girar câmera'],['P / ESC','Pausar'],['R','Recomeçar']];
export function SenbukanGame({onBack}:{onBack:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),engine=useRef<SenbukanScene|null>(null),started=useRef(false);
 const [phase,setPhase]=useState<Phase>('loading'),[loaded,setLoaded]=useState(0),[error,setError]=useState(''),[retry,setRetry]=useState(0),[,redraw]=useState(0);
 const [help,setHelp]=useState(false),[touch,setTouch]=useState(()=>matchMedia('(pointer:coarse)').matches),[stick,setStick]=useState({x:0,y:0}),[active,setActive]=useState<Set<string>>(new Set());
 const stickPointer=useRef<number|null>(null);
 useEffect(()=>{
  let scene:SenbukanScene|null=null,alive=true;started.current=false;setPhase('loading');setLoaded(0);audio.startCampaignMusic();
  const fail=(reason:string)=>{if(alive){setError(reason);setPhase('error');}};
  try{
   scene=new SenbukanScene(canvas.current!,()=>{if(!alive)return;redraw(n=>n+1);if(scene?.sim.winner!==null&&scene?.sim.winner!==undefined)setPhase('result');},command=>{
    if(!scene?.ready)return;
    if(command==='lock')scene.toggleLock();
    if(command==='restart'&&started.current){scene.restart();setPhase('playing');}
    if(command==='pause'&&started.current&&scene.sim.winner===null){if(scene.sim.running){scene.pause();setPhase('pause');}else{scene.start();setPhase('playing');}}
   },fail);engine.current=scene;
   // Read-only inspection plus real engine access for local development / QA.
   (window as unknown as {__senbukan:SenbukanScene|null}).__senbukan=scene;
   void scene.load(n=>{if(alive)setLoaded(n);}).then(()=>{if(alive)setPhase('intro');}).catch(e=>{if(alive&&e.name!=='AbortError')fail('Não foi possível abrir o 3D. Verifique a conexão e tente novamente.');});
  }catch{fail('Este navegador não conseguiu iniciar o WebGL. Tente um navegador atualizado com aceleração gráfica.');}
  const pause=()=>{if(scene?.sim.running&&scene.sim.winner===null){scene.pause();setPhase('pause');setStick({x:0,y:0});setActive(new Set());stickPointer.current=null;}};
  const visibility=()=>{if(document.hidden)pause();};
  window.addEventListener('blur',pause);document.addEventListener('visibilitychange',visibility);
  return()=>{alive=false;window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',visibility);scene?.dispose();engine.current=null;(window as unknown as {__senbukan:SenbukanScene|null}).__senbukan=null;audio.stopCampaignMusic();};
 },[retry]);
 useEffect(()=>{if(phase!=='playing'){setStick({x:0,y:0});setActive(new Set());stickPointer.current=null;}},[phase]);
 const scene=engine.current,a=scene?.sim.fighters[0],b=scene?.sim.fighters[1];
 const begin=()=>{audio.init();audio.startCampaignMusic();started.current=true;scene?.start();setHelp(false);setPhase('playing');};
 const pause=()=>{scene?.pause();setPhase('pause');setActive(new Set());setStick({x:0,y:0});};
 const restart=()=>{started.current=true;scene?.restart();setPhase('playing');setHelp(false);setActive(new Set());setStick({x:0,y:0});};
 const button=(action:Action|'guard',label:string,key:string,extra='')=><button type="button" className={`sb3-action ${extra} ${active.has(action)?'is-held':''}`} data-action={action}
  onPointerDown={e=>{e.preventDefault();e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);scene?.input.focus();scene?.input.button(action,true,e.pointerId);setActive(old=>new Set(old).add(action));}}
  onPointerUp={e=>release(action,e)} onPointerCancel={e=>release(action,e)} onLostPointerCapture={e=>release(action,e)} aria-label={label}>
   <span>{label}</span><kbd>{key}</kbd>
  </button>;
 function release(action:Action|'guard',e:ReactPointerEvent<HTMLButtonElement>){scene?.input.button(action,false,e.pointerId);setActive(old=>{const next=new Set(old);next.delete(action);return next;});}
 const updateStick=(e:ReactPointerEvent<HTMLDivElement>)=>{
  if(stickPointer.current!==e.pointerId)return;const r=e.currentTarget.getBoundingClientRect(),radius=r.width*.34;
  let x=(e.clientX-r.x-r.width/2)/radius,y=(e.clientY-r.y-r.height/2)/radius;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
  if(scene)scene.input.stick={x,y};setStick({x,y});
 };
 const releaseStick=(e:ReactPointerEvent<HTMLDivElement>)=>{if(stickPointer.current!==e.pointerId)return;stickPointer.current=null;if(scene)scene.input.stick={x:0,y:0};setStick({x:0,y:0});};
 const project=window.location.protocol==='file:'?'senbukan/Senbukan-Unity-projeto.zip':'/senbukan/Senbukan-Unity-projeto.zip';
 return <main className={`sb3-game ${touch?'sb3-touch':''}`} data-senbukan-game={phase}>
  <canvas ref={canvas} className="sb3-canvas" tabIndex={-1} aria-label="Arena de combate 3D do Dojo Senbukan"/>
  <div className="sb3-vignette"/>
  <header className="sb3-top"><button type="button" onClick={onBack} aria-label="Voltar para Wars of Champions">← <span>WARS OF CHAMPIONS</span></button><div className="sb3-location">千武館 <span>SENBUKAN</span><small>COMBATE 3D · ÁREA DE TESTES</small></div><button type="button" onClick={phase==='playing'?pause:()=>setHelp(v=>!v)} aria-label={phase==='playing'?'Pausar treino':'Ver controles'}>{phase==='playing'?'PAUSA':'?'}</button></header>
  {a&&b&&<div className="sb3-hud" aria-label="Estado do combate">
   {[a,b].map(f=><div key={f.id} className={`sb3-fighter-hud sb3-hud-${f.id}`}>
    <div className="sb3-name"><strong>{f.id?'ALUNO DO DOJO':'KARATÊ CAETANO'}</strong><span>{Math.ceil(f.hp)} <small>/ 1000</small></span></div>
    <div className="sb3-health" role="meter" aria-label={f.id?'Vida do aluno':'Vida de Caetano'} aria-valuenow={Math.ceil(f.hp)} aria-valuemin={0} aria-valuemax={1000}><i style={{width:f.hp/10+'%'}}/></div>
    <div className="sb3-resources"><span>GUARDA</span><div><i style={{width:f.guard+'%'}}/></div><b>{f.state==='broken'?'QUEBROU':Math.ceil(f.guard)}</b></div>
    <div className="sb3-resources sb3-energy"><span>ENERGIA</span><div><i style={{width:f.energy+'%'}}/></div><b>{Math.floor(f.energy)}</b></div>
    {f.prime>0&&<span className="sb3-prime-timer">KARATÊ PRIME <b>{f.prime.toFixed(1)}s</b></span>}
   </div>)}
   <div className="sb3-versus">VS</div>
  </div>}
  {phase==='playing'&&<>
   <div className="sb3-live-note"><span className="sb3-dot"/>{scene?.sim.mode==='ai'?'SPARRING':scene?.sim.mode==='guard'?'TREINO DE GUARDA':'TREINO LIVRE'}<span>•</span>{scene?.sim.lock?'ALVO FIXO':'CÂMERA LIVRE'}</div>
   {a&&a.combo>1&&<div className="sb3-combo"><b>{a.combo}</b> ACERTOS</div>}
   {!touch&&<div className="sb3-key-guide"><span><kbd>WASD</kbd> MOVER</span><span><kbd>J</kbd> SOCOS</span><span><kbd>K</kbd> CHUTE</span><span><kbd>U</kbd> DEDILHO</span><span><kbd>E</kbd> DEFESA</span><span><kbd>F</kbd> PRIME</span><button type="button" onClick={()=>{pause();setHelp(true);}}>CONTROLES</button></div>}
   <div className="sb3-utilities"><button type="button" onClick={()=>scene?.toggleLock()} aria-label="Alternar alvo fixo">{scene?.sim.lock?'◎ ALVO':'○ LIVRE'}</button><button type="button" onClick={()=>{scene?.input.clear();setStick({x:0,y:0});setActive(new Set());stickPointer.current=null;setTouch(v=>!v);}}> {touch?'OCULTAR TOQUE':'TOQUE'}</button></div>
   {touch&&<div className="sb3-touch-controls">
    <div className="sb3-stick" role="group" aria-label="Controle de movimento" data-joystick onPointerDown={e=>{e.preventDefault();if(stickPointer.current!==null)return;stickPointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);updateStick(e);}} onPointerMove={updateStick} onPointerUp={releaseStick} onPointerCancel={releaseStick} onLostPointerCapture={releaseStick}><span className="sb3-stick-cross">✣</span><i style={{transform:`translate(${stick.x*32}px,${stick.y*32}px)`}}/></div>
    <div className="sb3-actions">{button('prime','PRIME','F','sb3-prime')}{button('special','DEDILHO','U','sb3-special')}{button('jump','PULO','↑')}{button('guard','DEFESA','E')}{button('dash','DASH','⇢')}{button('kick','CHUTE','K')}{button('punch','SOCO','J','sb3-punch')}</div>
   </div>}
  </>}
  {phase!=='playing'&&<div className="sb3-overlay">
   <section className={`sb3-panel ${phase==='loading'?'sb3-loading':''}`} aria-label="Treino Senbukan">
    <p className="sb3-eyebrow">DEDILHO WARS · WARS OF CHAMPIONS</p>
    <h1>{phase==='result'?(scene?.sim.winner===0?'BOM TREINO.':'MAIS UMA VEZ?'):'SENBUKAN'}</h1>
    {phase==='loading'?<><p>Preparando o dojo e os lutadores…</p><div className="sb3-load-meter"><i style={{width:Math.max(5,loaded*100)+'%'}}/></div></>:phase==='error'?<><p role="alert">{error}</p><button className="sb3-primary" type="button" onClick={()=>setRetry(v=>v+1)}>TENTAR NOVAMENTE</button></>:<>
     <p className="sb3-subtitle">{phase==='intro'?'Karatê Caetano × Aluno do dojo':phase==='pause'?'TREINO PAUSADO':scene?.sim.winner===0?'Você venceu o sparring.':'O aluno venceu este sparring.'}</p>
     {phase==='intro'&&<><p>Entre no salão, encontre sua distância e emende os golpes. O dojo já está aberto.</p><p className="sb3-quickstart">{touch?'Mova no direcional à esquerda e ataque nos botões à direita.':'WASD move · J encadeia socos · K chuta · F transforma'}</p></>}
     <div className="sb3-panel-actions"><button type="button" className="sb3-primary" onClick={phase==='result'?restart:begin}>{phase==='intro'?'COMEÇAR TREINO ↗':phase==='result'?'LUTAR NOVAMENTE ↗':'CONTINUAR ↗'}</button>{phase==='pause'&&<button type="button" onClick={restart}>RECOMEÇAR</button>}</div>
     <div className="sb3-settings"><label>Adversário<select aria-label="Comportamento do adversário" value={scene?.sim.mode??'ai'} onChange={e=>{if(scene)scene.sim.mode=e.target.value as Mode;redraw(n=>n+1);}}><option value="ai">Aluno ativo</option><option value="idle">Alvo parado</option><option value="guard">Defesa constante</option></select></label><label>Gráficos<select aria-label="Qualidade gráfica" value={scene?.quality??'auto'} onChange={e=>{scene?.setQuality(e.target.value as 'auto'|'low');redraw(n=>n+1);}}><option value="auto">Automático</option><option value="low">Leve</option></select></label></div>
     <button className="sb3-help-toggle" type="button" aria-expanded={help} onClick={()=>setHelp(v=>!v)}>{help?'FECHAR CONTROLES −':'COMO JOGAR +'}</button>
     {help&&<div className="sb3-help">{commands.map(([key,text])=><div key={key}><kbd>{key}</kbd><span>{text}</span></div>)}<p>No celular, use o direcional e os botões de toque. Arraste o espaço livre para girar a câmera. Prime custa 60 de energia: 10 segundos de invulnerabilidade e golpes que atravessam a guarda.</p><details className="sb3-studies"><summary>ESTUDOS NO BLENDER</summary><img src={dojoStudy} alt="Estudo visual do salão Senbukan no Blender" loading="lazy"/><img src={fighterStudy} alt="Estudo visual dos modelos de Caetano e do aluno no Blender" loading="lazy"/></details></div>}
     <p className="sb3-build-note">Protótipo jogável em WebGL, com modelos e animações do Blender. O projeto Unity está disponível separadamente e ainda aguarda compilação.</p><a className="sb3-source" href={project} download>PROJETO UNITY + BLENDER ↓</a>
    </>}
    <button className="sb3-exit" type="button" onClick={onBack}>VOLTAR PARA WARS OF CHAMPIONS</button>
   </section>
  </div>}
 </main>;
}
