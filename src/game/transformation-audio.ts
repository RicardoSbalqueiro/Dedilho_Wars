import {audio} from './audio';
import {FORMS} from './resources';
import type {CharId} from './data';
/** Original synthesized stings; radio remains independent and keeps its tracks. */
export function transformationAudio(ch:CharId){
 audio.tone(ch==='patrick'||ch==='tubarao'?95:165,.5,'sawtooth',.13,820);
 audio.say(FORMS[ch].name,1.1,1.1);
 if(ch==='gabrielzin'){
  for(const [i,n]of [523.25,659.25,783.99,659.25,587.33,523.25].entries())audio.tone(n,.13,'triangle',.11,n,i*.15);
  audio.say('Miau! Miau!',1.3,1.4);
 }else if(ch==='felipence')for(const [i,n]of [110,164.81,220].entries())audio.tone(n,.5,'sawtooth',.08,n,i*.08);
}
