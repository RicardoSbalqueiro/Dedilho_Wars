import {movePhase} from './data';
import type {Fighter} from './engine';
import type {DrawOpts} from './rig';

/** Match artwork to authoritative combat state, including interrupted attacks.
 * Held directions never hide a hit reaction or shorten committed recovery. */
export function animeMotion(f:Pick<Fighter,'state'|'move'|'moveT'|'connected'|'charging'|'guard'|'crouch'|'walking'|'landLag'>):Partial<DrawOpts>{
 let spriteState:DrawOpts['spriteState'];
 if(f.state==='attack'&&f.move)spriteState='attack';
 else if(f.state==='transform'||f.charging)spriteState='charge';
 else if(['hit','launched','down','dizzy'].includes(f.state))spriteState='hit';
 else if(f.state==='getup'||f.landLag>0&&f.state==='ground')spriteState='crouch';
 else if(f.state==='jump')spriteState='jump';
 else if(f.state==='block'||f.guard)spriteState='guard';
 else if(f.crouch)spriteState='crouch';
 else if(f.state==='win')spriteState='victory';
 else if(f.walking||f.state==='dash')spriteState='walk';
 else if(f.state==='ground')spriteState='idle';
 // Captures/cinematics use their authored pose names in the shared renderer.
 const m=f.move,phase=m?movePhase(m,Math.max(0,f.moveT-1),f.connected):undefined;
 return {spriteState,spritePhase:phase?.phase,spriteProgress:phase?.progress,
  spriteKind:m?.kind==='normal'?/^(k|cK|jK)/.test(m.id)?'kick':'punch':m?.kind==='super'?'super':'special',
  spriteRank:m?.rank,spriteAir:m?.air,normalAccessory:m?.accessory};
}
