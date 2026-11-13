import { Game } from './engine';
import { computeRig } from './rig';
export const ONLINE_PROTOCOL = 'dw-online-13';
const FIELDS = ['x','y','vx','vy','facing','manualFacing','hp','maxHp','dispHp','meter','stamina','staminaDelay','exhaustT','energy','blood','battery','formT','formStartup','formElapsed','formVariant','aftermathT','charging','formShield','confusionT','predictionCooldown','state','stateT','move','moveT','connected','contact','contactFrame','poseName','impact','hitDone','hbActive','serial','hitstun','blockstun','stunLow','groundSmash','crouch','guard','guardMeter','guardDelay','guardBreakT','resonance','resonanceT','guardSpentAt','guardResult','guardResultT','guardReadyT','walking','landLag','airAttacked','airJumps','precision','parryCooldown','momentum','momentumT','throwShield','throwTechUntil','rangedUses','rangedCooldown','fourthCooldown','bikeCooldown','bikeTicks','bikeHits','bikeNextHit','bikeDizzy','hidden','juggle','invuln','armor','ko','pose','poseOverride','animT','turn','rotAdd','exprT','exprOverride','expr','glow','aura','comboHits','comboDmg','comboMoves','comboKind','comboLastSerial','comboResult','wins'] as const;
const GLOBAL = ['tick','hitstop','slowmo','paused','phase','phaseT','round','winsNeeded','timeLeft','timeAcc','cam','camOv','camOvT','flash','shake','ann','moveBanner','expl','comboShow','hype','speed','perfect','winner','finisher','finishedBy','elapsedTicks','arena'] as const;
export interface NetState {v: string; inputAck?:number; f: Record<string, unknown>[]; g: Record<string, unknown>; parts: Game['parts']; projectiles: Game['projectiles']; seq: Record<string, unknown>|null; cine: Record<string, unknown>|null; clash: Record<string, unknown>|null}
export function captureState(game: Game): NetState {
  // Keep recent floor impacts visible during particle-heavy online fights.
  const craters=game.parts.filter(p=>p.type==='crater').slice(-4);
  return {
    v: ONLINE_PROTOCOL,
    f: game.f.map(f=>Object.fromEntries(FIELDS.map(k=>[k,f[k]]))),
    g: Object.fromEntries(GLOBAL.map(k=>[k,game[k]])),
    parts: [...craters,...game.parts.filter(p=>p.type!=='crater').slice(-(60-craters.length))],projectiles:game.projectiles,
    seq: game.seq ? {...game.seq,a:game.seq.a.idx,d:game.seq.d.idx}:null,
    cine: game.cine ? {...game.cine,f:game.cine.f.idx}:null,
    clash: game.clash ? {...game.clash,a:game.clash.a.idx,b:game.clash.b.idx}:null,
  };
}
export function applyState(game: Game, state: NetState) {
  if(state?.v!==ONLINE_PROTOCOL || !Array.isArray(state.f) || state.f.length!==2 || !state.g)return false;
  // Validate the complete revision-13 resource payload before mutating either fighter.
  for(const s of state.f){
    if(!s||!Number.isFinite(s.x)||!Number.isFinite(s.y)||!s.pose)return false;
    for(const key of ['meter','stamina','energy','blood','battery','formT','formStartup','formElapsed','formVariant','aftermathT','exhaustT','staminaDelay','formShield','confusionT','predictionCooldown','guardMeter','guardDelay','guardBreakT','resonance','resonanceT'])if(!Number.isFinite(s[key])||(s[key] as number)<0)return false;
    if((s.guardMeter as number)>100||(s.guardBreakT as number)>42||(s.resonance as number)>3)return false;
    if((s.meter as number)>200||(s.stamina as number)>120||(s.energy as number)>100||(s.battery as number)>100||(s.blood as number)>3||(s.formT as number)>900||(s.formStartup as number)>72||(s.aftermathT as number)>7200)return false;
  }
  const arena=state.g.arena as Game['arena']|undefined;
  if(!arena||!Array.isArray(arena.damage)||arena.damage.length!==3||arena.damage.some(n=>!Number.isInteger(n)||n<0||n>3)||!Number.isFinite(arena.tick)||!Number.isInteger(arena.slot)||arena.slot< -1||arena.slot>2)return false;
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
