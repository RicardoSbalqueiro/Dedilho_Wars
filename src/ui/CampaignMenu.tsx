import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import type {CSSProperties,KeyboardEvent} from 'react';
import {CAMPAIGNS} from '../game/campaigns';
import {audio} from '../game/audio';
import {loadPrefs,savePrefs} from '../game/prefs';
import {MenuPage} from './MenuLayout';

export function CampaignMenu({onBack}:{onBack:()=>void}){
 const [selected,setSelected]=useState(0),cards=useRef<(HTMLButtonElement|null)[]>([]);
 const music=useSyncExternalStore(audio.subscribeCampaignMusic,audio.getCampaignMusicSnapshot);
 const radio=useSyncExternalStore(audio.subscribeRadio,audio.getRadioSnapshot);
 useEffect(()=>{audio.startCampaignMusic();const key=(e:globalThis.KeyboardEvent)=>{if(e.code==='Escape'){e.preventDefault();onBack()}};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);audio.stopCampaignMusic()}},[onBack]);
 const navigate=(e:KeyboardEvent)=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
  e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?4:(selected+(e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1)+5)%5;
  setSelected(n);cards.current[n]?.focus();audio.select();
 };
 const volume=(v:number)=>{audio.setSettings({music:v});savePrefs({...loadPrefs(),music:v})};
 const campaign=CAMPAIGNS[selected];
 return <MenuPage className="dw-story" label="Wars of Champions">
  <header className="dw-story-top"><button type="button" className="dw-story-back" onClick={onBack}>← MENU INICIAL</button><div className="dw-story-audio"><span className={'music-eq'+(music.playing&&radio.volume>0?' playing':'')} aria-hidden="true">{[0,1,2,3].map(i=><span key={i} style={{animationDelay:`${i*-.17}s`}}/>)}</span><span>TRILHA EXCLUSIVA</span><input type="range" aria-label="Volume da trilha de campanha" min="0" max="1" step="0.01" value={radio.volume} onChange={e=>volume(+e.target.value)}/></div></header>
  <div className="dw-story-heading"><p>QUATRO LUTADORES. QUATRO CAMINHOS.</p><h1>WARS <span>OF</span> CHAMPIONS</h1><div>As histórias por trás da arena.</div></div>
  <section className="dw-story-grid" aria-label="Campanhas em breve" onKeyDown={navigate}>
   {CAMPAIGNS.map((c,i)=><button type="button" key={c.id} ref={el=>{cards.current[i]=el}} className="dw-story-card" style={{'--dw-story-color':c.color} as CSSProperties} data-campaign={c.id} data-selected={selected===i?'1':'0'} aria-pressed={selected===i} aria-label={`${c.title} — ${c.fighter} — Em breve`} onFocus={()=>setSelected(i)} onClick={()=>{setSelected(i);audio.select()}}>
    <img src={c.art} alt={c.pose} draggable={false} decoding="async" loading={i>1?'lazy':'eager'}/><span className="dw-story-card-shade"/><span className="dw-story-number">0{i+1}<i/></span><span className="dw-story-soon">EM BREVE</span>
    <span className="dw-story-caption"><small>{c.theme}</small><strong>{c.title}</strong><span>{c.fighter}</span></span>
   </button>)}
   <button type="button" ref={el=>{cards.current[4]=el}} className="dw-story-card dw-story-more" data-campaign="more" data-selected={selected===4?'1':'0'} aria-pressed={selected===4} aria-label="Mais campanhas — Em breve" onFocus={()=>setSelected(4)} onClick={()=>{setSelected(4);audio.select()}}><span className="dw-story-more-orbit" aria-hidden="true"/><span className="dw-story-more-plus" aria-hidden="true">+</span><strong>EM BREVE</strong><span>Mais campanhas<br/>estão vindo.</span><small>A PRÓXIMA HISTÓRIA<br/>AINDA VAI COMEÇAR</small></button>
  </section>
  <footer className="dw-story-footer"><div aria-live="polite"><strong>{campaign?campaign.title:'Novos caminhos'}</strong><p>{campaign?campaign.line:'A arena ainda tem muitas histórias para contar.'}</p><span>EM BREVE · CAMPANHA AINDA INDISPONÍVEL</span></div><div className="dw-story-track"><span>Ada’s Theme · Resident Evil 2</span><small>TRILHA FIXA DESTE MENU</small>{music.error&&<button type="button" onClick={()=>audio.startCampaignMusic()}>TOCAR TRILHA</button>}</div></footer>
 </MenuPage>;
}
