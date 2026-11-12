import {movePhase} from './data';
import type {Fighter} from './engine';
import type {DrawOpts} from './rig';

/** Match artwork to authoritative combat state, including interrupted attacks.
 * Held directions never hide a hit reaction or shorten committed recovery. */
export function animeMotion(f:Pick<Fighter,'state'|'move'|'moveT'|'connected'|'charging'|'guard'|'crouch'|'walking'|'landLag'>&Partial<Pick<Fighter,'stateT'|'ch'|'formT'|'stunLow'>>):Partial<DrawOpts>{
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
 const t=f.stateT??0;
 let reaction:number|undefined;
 if(f.state==='hit')reaction=f.stunLow&&t<7?4:t<4?1:t<10?2:10;
 else if(f.state==='launched')reaction=t<6?5:6;
 else if(f.state==='down')reaction=7;
 else if(f.state==='getup')reaction=t<5?8:t<12?9:10;
 else if(f.state==='dizzy')reaction=Math.floor(t/10)%2?10:2;
 else if(f.state==='block'||f.guard&&!f.crouch)reaction=11;
 return {spriteState,spritePhase:phase?.phase,spriteProgress:phase?.progress,
  spriteKind:m?.kind==='normal'?/^(k|cK|jK)/.test(m.id)?'kick':'punch':m?.kind==='super'?'super':'special',
  spriteRank:m?.rank,spriteAir:m?.air,normalAccessory:f.ch==='ulisses'&&(f.formT??0)>0?undefined:m?.accessory,spriteMove:m?.id,spriteAction:f.state,spriteStateTime:t,
  actionClip:reaction!==undefined?'react':undefined,actionProgress:reaction===undefined?undefined:(reaction+.01)/12};
}
