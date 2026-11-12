import { useEffect, useRef, useState,useSyncExternalStore } from 'react';
import type { RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { Action } from '../game/input';
import type { Game } from '../game/engine';
import {getMobileSettings,subscribeMobileSettings,touchHaptic} from '../game/mobile-settings';
import { touchInput } from '../game/touch';
export function useMobile() {
 const [mobile,setMobile]=useState(()=>typeof window!=='undefined'&&matchMedia('(pointer: coarse)').matches);
 useEffect(()=>{const m=matchMedia('(pointer: coarse)');const update=()=>setMobile(m.matches);m.addEventListener('change',update);return()=>m.removeEventListener('change',update)},[]);return mobile;
}
export function GameOverlay({children,layer=70}:{children:React.ReactNode;layer?:number}) {
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  root.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({preventScroll:true});
  const trap=(e:KeyboardEvent)=>{
   if(e.code!=='Tab'||document.querySelector('[data-radio-panel]'))return;
   const controls=[...(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]')||[])];
   if(!controls.length)return;e.preventDefault();
   const index=controls.indexOf(document.activeElement as HTMLElement);
   controls[(index+(e.shiftKey?-1:1)+controls.length)%controls.length].focus();
  };
  window.addEventListener('keydown',trap);
  return()=>{window.removeEventListener('keydown',trap);if(previous?.isConnected)previous.focus({preventScroll:true})};
 },[]);
 return createPortal(<div ref={root} className="dw-game-overlay" role="dialog" aria-modal="true" aria-label="Menu da partida" style={{zIndex:layer}}>{children}</div>,document.body);
}
function TouchFeedback({gameRef,side}:{gameRef:RefObject<Game|null>;side:0|1}){
 const [text,setText]=useState('');
 const [clashAction,setClashAction]=useState<'super'|'p'|undefined>();
 useEffect(()=>{const timer=window.setInterval(()=>{
  const g=gameRef.current,f=g?.f[side];if(!g||!f||g.phase!=='fight'||g.seq||g.cine){setText('');return;}
  if(g.clash){const c=g.clash,superClash=c.kind==='super';setClashAction(c.t>=150?undefined:superClash?'super':'p');setText(c.t<0?`PREPARE · ${superClash?'ULT':'SOCO'} EM ${Math.ceil(-c.t/60)}`:c.t>=150?'AGUARDE · CONFERINDO TOQUES':`${superClash?'BATALHA DE ULTS · TOQUE ULT':'CHOQUE · TOQUE SOCO'} · ${c.c[side]} TOQUES`);return;}
  setClashAction(undefined);
  const free=f.state==='ground'&&f.landLag===0,defending=f.guard&&(free||f.state==='block'),parts:string[]=[];
  if(f.guardResultT>0&&(free||f.state==='block'))parts.push(f.guardResult==='precision'?'LEITURA PERFEITA':f.guardResult==='perfect'?'DEFESA PERFEITA':`BLOQUEIO ${f.crouch?'BAIXO':'ALTO'}`);
  else if(defending)parts.push(`DEFESA ${f.crouch?'BAIXA':'ALTA'}`);
  if(free&&f.guardReadyT>0)parts.push('LIVRE · RESPONDA');
  if(f.manualFacing)parts.push(`MANUAL ${f.facing===1?'→':'←'}`);
  setText(parts.join(' · '));
 },75);return()=>clearInterval(timer)},[gameRef,side]);
 return text?<div className="touch-feedback" data-clash-action={clashAction} role="status" aria-live="polite">{text}</div>:null;
}
export function TouchControls({onMenu,gameRef,side=0}:{onMenu:()=>void;gameRef?:RefObject<Game|null>;side?:0|1}) {
 const mobile=useMobile(),prefs=useSyncExternalStore(subscribeMobileSettings,getMobileSettings);
 const root=useRef<HTMLElement>(null),stick=useRef<HTMLDivElement>(null),thumb=useRef<HTMLDivElement>(null),stickPointer=useRef<number|null>(null);
 const [status,setStatus]=useState({rick:false,meter:0,form:0,lastDmg:-1,hits:0});
 const clear=()=>{touchInput.clear();stickPointer.current=null;if(thumb.current)thumb.current.style.transform='translate(0,0)';root.current?.querySelectorAll('[data-held]').forEach(el=>el.removeAttribute('data-held'))};
 useEffect(()=>{if(!mobile)return;const reset=()=>clear();window.addEventListener('blur',reset);window.addEventListener('pagehide',reset);window.addEventListener('resize',reset);document.addEventListener('visibilitychange',reset);return()=>{clear();window.removeEventListener('blur',reset);window.removeEventListener('pagehide',reset);window.removeEventListener('resize',reset);document.removeEventListener('visibilitychange',reset)}},[mobile]);
 useEffect(()=>{if(!mobile||!root.current)return;const update=()=>{const height=Math.ceil(root.current?.getBoundingClientRect().height||310);document.documentElement.style.setProperty('--dw-controls-height',height+'px');window.dispatchEvent(new Event('dedilho-controls-change'))};const ro=new ResizeObserver(update);ro.observe(root.current);update();return()=>ro.disconnect()},[mobile]);
 useEffect(()=>{if(!mobile||!gameRef)return;const update=()=>{const g=gameRef.current,f=g?.f[side];if(!f||!g)return;const next={rick:f.ch==='rickzera',meter:Math.floor(f.meter),form:Math.ceil(f.formT/60),lastDmg:g.training?Math.round(g.train.lastDmg):-1,hits:g.train.combo};setStatus(old=>old.rick===next.rick&&old.meter===next.meter&&old.form===next.form&&old.lastDmg===next.lastDmg&&old.hits===next.hits?old:next)};update();const id=window.setInterval(update,120);return()=>clearInterval(id)},[mobile,gameRef,side]);
 if(!mobile)return null;
 const move=(e:React.PointerEvent)=>{
  if(stickPointer.current!==e.pointerId)return;e.preventDefault();
  const r=stick.current!.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;
  const max=r.width*.31,len=Math.max(1,Math.hypot(x,y)),factor=Math.min(1,max/len);
  if(thumb.current)thumb.current.style.transform=`translate(${x*factor}px,${y*factor}px)`;
  const actions:Action[]=[];if(x<-r.width*.12)actions.push('left');if(x>r.width*.12)actions.push('right');if(y<-r.height*.18)actions.push('up');if(y>r.height*.18)actions.push('down');touchInput.set(e.pointerId,actions);
 };
 const release=(e:React.PointerEvent)=>{if(stickPointer.current!==e.pointerId)return;touchInput.set(e.pointerId,[]);stickPointer.current=null;if(thumb.current)thumb.current.style.transform='translate(0,0)'};
 const buttons:[Action,string,string][]=[['s1','ESP 1','#c291ff'],['s2','ESP 2','#c291ff'],['s3','ESP 3','#c291ff'],['p','SOCO','#65e7fa'],['k','CHUTE','#65e7fa'],['block','DEFESA','#71cfff'],['headbutt','CABEÇADA','#ffc28c'],['grab','AGARRAR','#ffc28c'],['turn','VIRAR','#dbd5f2'],['transform','FORMA','#88efa9'],['super','ULT','#ffde76'],['charge','CARREGAR','#a9edbc']];
 const actionButton=(action:Action,label:string,color:string,index:number)=><button key={action} type="button" data-touch-action={action} data-ready={action==='super'&&status.meter>=100||action==='transform'&&status.meter>=200?'1':'0'} aria-label={label} title={action==='charge'?'Carregar energia do Rickzera':label} disabled={action==='charge'&&!status.rick} style={{'--button-color':color} as React.CSSProperties} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);touchInput.set(e.pointerId,[action]);e.currentTarget.dataset.held='1';touchHaptic()}} onPointerUp={e=>{touchInput.set(e.pointerId,[]);delete e.currentTarget.dataset.held}} onPointerCancel={e=>{touchInput.set(e.pointerId,[]);delete e.currentTarget.dataset.held}} onLostPointerCapture={e=>{touchInput.set(e.pointerId,[]);delete e.currentTarget.dataset.held}} onClick={e=>{if(e.detail===0){touchInput.set(-200-index,[action]);touchInput.set(-200-index,[])}}}><span>{label}</span>{action==='charge'&&!status.rick&&<small>RICK</small>}{action==='super'&&<small>{Math.floor(status.meter/100)}/2</small>}{action==='transform'&&status.form>0&&<small>{status.form}s</small>}</button>;
 const fullscreen=()=>{if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});else void document.documentElement.requestFullscreen().catch(()=>{})};
 return createPortal(<section ref={root} className="touch-controls" data-hand={prefs.hand} data-size={prefs.largeButtons?'large':'standard'} aria-label="Controles de combate" onContextMenu={e=>e.preventDefault()}>
  {gameRef&&<TouchFeedback gameRef={gameRef} side={side}/>}
  <div className="touch-utility"><span>P{side+1}<small>{status.lastDmg>=0?`DANO ${status.lastDmg} · ${status.hits} HIT`:'TOQUE E SEGURE'}</small></span><div>{document.fullscreenEnabled&&<button type="button" onClick={fullscreen} aria-label="Alternar tela cheia">⛶ <span>TELA</span></button>}<button type="button" onClick={()=>{clear();onMenu()}}>Ⅱ MENU</button></div></div>
  <div className="touch-deck"><div className="touch-left"><div className="touch-stick" ref={stick} role="group" aria-label="Direcional: mover, pular e agachar" onPointerDown={e=>{if(stickPointer.current!==null)return;stickPointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);move(e)}} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}><span className="stick-up">PULAR</span><span className="stick-down">AGACHAR</span><span className="stick-left" aria-hidden="true">‹</span><span className="stick-right" aria-hidden="true">›</span><div className="stick-cross" aria-hidden="true"/><div className="stick-thumb" ref={thumb}/></div></div>
  <div className="touch-buttons">{buttons.map(([action,label,color],i)=>actionButton(action,label,color,i))}</div></div>
 </section>,document.body);
}
