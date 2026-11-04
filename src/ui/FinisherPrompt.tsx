import { useEffect,useState } from 'react';
import { createPortal } from 'react-dom';
import type { RefObject } from 'react';
import type { Game } from '../game/engine';
import { CHARS } from '../game/data';
import { touchInput } from '../game/touch';
import { useMobile } from './TouchControls';
export function FinisherPrompt({gameRef,side}:{gameRef:RefObject<Game|null>;side?:number}){
 const mobile=useMobile(),[info,setInfo]=useState<{winner:number;name:string;time:number;cpu:boolean}|null>(null);
 useEffect(()=>{let timer=0;const update=()=>{const g=gameRef.current;if(g?.phase==='finishWindow')setInfo({winner:g.winner,name:CHARS[g.f[g.winner].ch].short,time:Math.max(0,(240-g.phaseT)/60),cpu:g.f[g.winner].cpu});else setInfo(null)};timer=window.setInterval(update,80);return()=>clearInterval(timer)},[gameRef]);
 if(!info)return null;const can=(side===undefined||side===info.winner)&&!info.cpu;
 const trigger=()=>{if(side===undefined)gameRef.current?.requestFinisher(info.winner);else {touchInput.set(-999,['super']);window.setTimeout(()=>touchInput.set(-999,[]),100)}};
 const panel=<div className={mobile?'finisher-prompt finisher-native':'finisher-prompt absolute bottom-[90px] left-1/2 -translate-x-1/2 z-20'}><strong>{info.name} · FINISHER!</strong><span>{info.time.toFixed(1)}s</span>{can?<button onClick={trigger}>FINALIZAR · ULT</button>:<p>Aguardando a finalização…</p>}</div>;
 return mobile?createPortal(panel,document.body):panel;
}
