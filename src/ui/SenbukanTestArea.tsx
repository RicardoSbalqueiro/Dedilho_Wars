import {useEffect,useRef,useState} from 'react';
import {audio} from '../game/audio';
import {parseSenbukanBuild} from '../game/senbukan-test';
import type {SenbukanBuild} from '../game/senbukan-test';
import dojo from '../assets/senbukan/dojo-concept.webp';
import fighters from '../assets/senbukan/fighters-concept.webp';
import './SenbukanTestArea.css';

export function SenbukanTestArea({onBack}:{onBack:()=>void}){
 const [build,setBuild]=useState<SenbukanBuild|null>(null),[playing,setPlaying]=useState(false),[view,setView]=useState<'dojo'|'fighters'>('dojo');
 const iframe=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{
  audio.startCampaignMusic();const controller=new AbortController();
  fetch('/senbukan/build.json',{signal:controller.signal,cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{if(!controller.signal.aborted)setBuild(parseSenbukanBuild(data))}).catch(()=>{});
  return()=>{controller.abort();audio.stopCampaignMusic()};
 },[]);
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{if(e.code==='Escape'&&!playing){e.preventDefault();onBack()}};
  const message=(e:MessageEvent)=>{if(e.origin===window.location.origin&&e.source===iframe.current?.contentWindow&&e.data?.type==='dedilho:senbukan-exit')setPlaying(false)};
  window.addEventListener('keydown',key);window.addEventListener('message',message);return()=>{window.removeEventListener('keydown',key);window.removeEventListener('message',message)};
 },[onBack,playing]);
 if(playing&&build?.state==='ready')return <main className="senbukan-player"><button type="button" onClick={()=>setPlaying(false)}>← SAIR DO TESTE</button><iframe ref={iframe} title="Senbukan — combate Unity 3D" src={build.entry!} allow="fullscreen; autoplay; gamepad" allowFullScreen/></main>;
 return <main className="senbukan-lab" data-senbukan-lab="prepared">
  <header><button type="button" className="senbukan-back" onClick={onBack}>← WARS OF CHAMPIONS</button><span className="senbukan-state"><i/>{build?.state==='ready'?'TESTE DISPONÍVEL':'PROTÓTIPO EM PREPARAÇÃO'}</span></header>
  <section className="senbukan-intro"><div><p className="senbukan-eyebrow">KARATÊ CAETANO · CAMPANHA</p><h1>SENBUKAN</h1><p className="senbukan-lead">O primeiro passo para uma nova forma de lutar.</p></div><p className="senbukan-description">Caetano enfrenta um aluno do dojo em um experimento de combate 3D: movimento livre, câmera com alvo e golpes de karatê.</p></section>
  <section className="senbukan-preview" aria-label="Prévia do protótipo"><img src={view==='dojo'?dojo:fighters} alt={view==='dojo'?'Prévia renderizada no Blender do salão Senbukan: madeira, lanternas douradas e Twitchcity roxa ao fundo.':'Modelos de estudo no Blender: Caetano com calça branca e faixa preta, ao lado de um aluno com gi azul.'}/><div className="senbukan-preview-caption"><span>PRÉVIA NO BLENDER</span><strong>{view==='dojo'?'SALÃO PRINCIPAL':'CAETANO × ALUNO'}</strong><small>Estudo visual do protótipo. O combate Unity ainda precisa ser compilado e testado.</small></div><div className="senbukan-view-tabs" aria-label="Escolher prévia"><button type="button" aria-pressed={view==='dojo'} onClick={()=>setView('dojo')}>DOJO</button><button type="button" aria-pressed={view==='fighters'} onClick={()=>setView('fighters')}>LUTADORES</button></div></section>
  <section className="senbukan-bottom"><div className="senbukan-ready"><span className="senbukan-kicker">ÁREA DE TESTES</span><h2>Treino no Senbukan</h2><p>{build?.state==='ready'?'O build Unity está disponível para experimentar.':'O cenário, os modelos e o projeto Unity estão preparados. A versão jogável será liberada após a compilação e a validação no Unity.'}</p>{build?.state==='ready'?<button type="button" className="senbukan-enter" onClick={()=>setPlaying(true)}>ENTRAR NO TESTE ↗</button>:<span className="senbukan-pending">AGUARDANDO BUILD UNITY</span>}<a className="senbukan-project" href={window.location.protocol==='file:'?'senbukan/Senbukan-Unity-projeto.zip':'/senbukan/Senbukan-Unity-projeto.zip'} download>BAIXAR PROJETO UNITY + BLENDER ↓</a></div><div className="senbukan-combat"><h2>Combate em preparação</h2><ul><li>Movimentação em arena e câmera com alvo.</li><li>Sequências de socos, chute e Dedilho.</li><li>Defesa, quebra de guarda, pulo e dash.</li><li>Karatê Prime e controles para teclado e toque.</li></ul><p>Este espaço é um teste técnico da campanha. O restante do jogo continua acessível pelo menu inicial.</p></div></section>
 </main>;
}
