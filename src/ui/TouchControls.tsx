import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { Action } from '../game/input';
import type { Game } from '../game/engine';
import { touchInput } from '../game/touch';
export function useMobile() {
 const [mobile,setMobile]=useState(()=>typeof window!=='undefined'&&matchMedia('(pointer: coarse)').matches);
 useEffect(()=>{const m=matchMedia('(pointer: coarse)');const update=()=>setMobile(m.matches);m.addEventListener('change',update);return()=>m.removeEventListener('change',update)},[]);return mobile;
}
export function GameOverlay({children,layer=70}:{children:React.ReactNode;layer?:number}) {
 const mobile=useMobile();return mobile?createPortal(<div className="mobile-game-overlay" style={{zIndex:layer}}>{children}</div>,document.body):children;
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
 const mobile=useMobile();const stick=useRef<HTMLDivElement>(null);const [point,setPoint]=useState({x:0,y:0});
 useEffect(()=>{const clear=()=>{touchInput.clear();setPoint({x:0,y:0})};window.addEventListener('blur',clear);window.addEventListener('pagehide',clear);document.addEventListener('visibilitychange',clear);return()=>{clear();window.removeEventListener('blur',clear);window.removeEventListener('pagehide',clear);document.removeEventListener('visibilitychange',clear)}},[]);
 if(!mobile)return null;
 const move=(e:React.PointerEvent)=>{
  e.preventDefault();if(e.type==='pointermove'&&e.buttons===0)return;
  const r=stick.current!.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;
  const max=r.width*.35,len=Math.max(1,Math.hypot(x,y)),f=Math.min(1,max/len);setPoint({x:x*f,y:y*f});
  const actions:Action[]=[];if(x<-r.width*.12)actions.push('left');if(x>r.width*.12)actions.push('right');if(y<-r.height*.18)actions.push('up');if(y>r.height*.18)actions.push('down');touchInput.set(e.pointerId,actions);
 };
 const release=(e:React.PointerEvent)=>{touchInput.set(e.pointerId,[]);setPoint({x:0,y:0})};
 const buttons:[Action,string,string][]=[['s1','ESP 1','#a855f7'],['s2','ESP 2','#a855f7'],['s3','ESP 3','#a855f7'],['p','SOCO','#22d3ee'],['k','CHUTE','#22d3ee'],['block','DEFESA','#38bdf8'],['super','ULT','#facc15'],['grab','AGARRAR','#fb923c']];
 const actionButton=(action:Action,label:string,color:string,className?:string)=><button key={action} className={className} type="button" data-touch-action={action} aria-label={label} style={{borderColor:color,color}} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);touchInput.set(e.pointerId,[action]);e.currentTarget.dataset.held='1'}} onPointerUp={e=>{touchInput.set(e.pointerId,[]);delete e.currentTarget.dataset.held}} onPointerCancel={e=>{touchInput.set(e.pointerId,[]);delete e.currentTarget.dataset.held}} onLostPointerCapture={e=>{touchInput.set(e.pointerId,[]);delete e.currentTarget.dataset.held}}>{label}</button>;
 return createPortal(<div className="touch-controls" onContextMenu={e=>e.preventDefault()}>
  {gameRef&&<TouchFeedback gameRef={gameRef} side={side}/>}
  <div className="touch-left">{actionButton('turn','VIRAR','#ddd6fe','touch-turn')}<div className="touch-stick" ref={stick} role="group" aria-label="Direcional: mover, pular e agachar" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);move(e)}} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}><span className="stick-up">PULAR</span><span className="stick-down">AGACHAR</span><span className="stick-left">◀</span><span className="stick-right">▶</span><div className="stick-thumb" style={{transform:`translate(${point.x}px,${point.y}px)`}}/></div></div>
  <div className="touch-buttons">{buttons.map(([action,label,color])=>actionButton(action,label,color))}<button type="button" className="touch-menu" onClick={()=>{touchInput.clear();onMenu()}}>MENU</button></div>
 </div>,document.body);
}
