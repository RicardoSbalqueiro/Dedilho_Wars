import { Game } from './engine';
import { computeRig } from './rig';
export const ONLINE_PROTOCOL = 'dw-online-2';
const FIELDS = ['x','y','vx','vy','facing','hp','maxHp','dispHp','meter','state','stateT','move','moveT','connected','hitDone','hbActive','serial','hitstun','blockstun','stunLow','crouch','guard','walking','landLag','airAttacked','airJumps','precision','parryCooldown','momentum','momentumT','throwShield','throwTechUntil','rangedUses','rangedCooldown','hidden','juggle','invuln','armor','ko','pose','poseOverride','animT','turn','rotAdd','exprT','exprOverride','expr','glow','aura','comboHits','comboDmg','wins'] as const;
const GLOBAL = ['tick','hitstop','slowmo','paused','phase','phaseT','round','winsNeeded','timeLeft','timeAcc','cam','camOv','camOvT','flash','shake','ann','moveBanner','expl','comboShow','hype','speed','perfect','winner','finisher','finishedBy','elapsedTicks'] as const;
export interface NetState {v: string; inputAck?:number; f: Record<string, unknown>[]; g: Record<string, unknown>; parts: Game['parts']; projectiles: Game['projectiles']; seq: Record<string, unknown>|null; cine: Record<string, unknown>|null; clash: Record<string, unknown>|null}
export function captureState(game: Game): NetState {
  return {
    v: ONLINE_PROTOCOL,
    f: game.f.map(f=>Object.fromEntries(FIELDS.map(k=>[k,f[k]]))),
    g: Object.fromEntries(GLOBAL.map(k=>[k,game[k]])),
    parts: game.parts.slice(-60),projectiles:game.projectiles,
    seq: game.seq ? {...game.seq,a:game.seq.a.idx,d:game.seq.d.idx}:null,
    cine: game.cine ? {...game.cine,f:game.cine.f.idx}:null,
    clash: game.clash ? {...game.clash,a:game.clash.a.idx,b:game.clash.b.idx}:null,
  };
}
export function applyState(game: Game, state: NetState) {
  if(state?.v!==ONLINE_PROTOCOL || !Array.isArray(state.f) || state.f.length!==2 || !state.g)return false;
  for(let i=0;i<2;i++) {
    const f=game.f[i],s=state.f[i];
    if(!s||!Number.isFinite(s.x)||!Number.isFinite(s.y)||!s.pose)return false;
    for(const key of FIELDS) if(key in s)(f as unknown as Record<string,unknown>)[key]=s[key];
    f.rig=computeRig(f.ch,f.pose);f.trail=[];
  }
  for(const key of GLOBAL)if(key in state.g)(game as unknown as Record<string,unknown>)[key]=state.g[key];
  game.parts=state.parts||[];game.projectiles=state.projectiles||[];
  game.seq=state.seq?{...state.seq,a:game.f[state.seq.a as number],d:game.f[state.seq.d as number]} as Game['seq']:null;
  game.cine=state.cine?{...state.cine,f:game.f[state.cine.f as number]} as Game['cine']:null;
  game.clash=state.clash?{...state.clash,a:game.f[state.clash.a as number],b:game.f[state.clash.b as number]} as Game['clash']:null;
  return true;
}
