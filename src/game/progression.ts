import { CHAR_IDS } from './data';
import type { CharId } from './data';
import type { StageId } from './stage';
import type { Game } from './engine';
export interface LocalMatch {id:string;p1:CharId;p2:CharId;stage:StageId;winner:number;score:[number,number];finisher:number|null;at:number;mode:string}
const KEY='dedilho-wars-match-history-v1';
export function localMatches():LocalMatch[]{try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(m=>m&&CHAR_IDS.includes(m.p1)&&CHAR_IDS.includes(m.p2)&&[0,1].includes(m.winner)&&Array.isArray(m.score)&&Number.isFinite(m.at)).slice(0,40):[]}catch{return []}}
export function rememberLocal(game:Game){if(game.training||game.cfg.online)return;try{const previous=localStats();const won=game.winner===0,finish=game.finishedBy===0,streak=won?previous.streak+1:0;const next={games:previous.games+1,wins:previous.wins+(won?1:0),losses:previous.losses+(won?0:1),xp:previous.xp+(won?100:40)+(finish?20:0),points:previous.points+(won?3:0),finishers:previous.finishers+(finish?1:0),streak,best_streak:Math.max(previous.best_streak,streak)};localStorage.setItem('dedilho-wars-local-stats-v1',JSON.stringify(next));const m:LocalMatch={id:crypto.randomUUID(),p1:game.f[0].ch,p2:game.f[1].ch,stage:game.cfg.stage||'dojo',winner:game.winner,score:[game.f[0].wins,game.f[1].wins],finisher:game.finishedBy,at:Date.now(),mode:game.cfg.mode};localStorage.setItem(KEY,JSON.stringify([m,...localMatches()].slice(0,40)))}catch{/* offline combat works even without storage */}}
export function levelFor(xp:number){const level=Math.floor(Math.sqrt(Math.max(0,xp)/100))+1;return {level,min:(level-1)**2*100,next:level**2*100,title:level>=10?'Lenda do Dedilho':level>=6?'Mestre da Arena':level>=3?'Faixa do Dedilho':'Dedo Iniciante'}}
export function localStats(){
 const records=localMatches(),wins=records.filter(m=>m.winner===0).length;
 const fallback={games:records.length,wins,losses:records.length-wins,xp:records.reduce((n,m)=>n+(m.winner===0?100:40)+(m.finisher===0?20:0),0),points:wins*3,finishers:records.filter(m=>m.finisher===0).length,streak:0,best_streak:0};
 try{const s=JSON.parse(localStorage.getItem('dedilho-wars-local-stats-v1')||'null');if(s&&Object.keys(fallback).every(k=>Number.isSafeInteger(s[k])&&s[k]>=0))return s as typeof fallback}catch{/* use available recent history */}
 return fallback;
}
