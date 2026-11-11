import {CHARS} from './data';
import type {CharId,Pose} from './data';
/** Relaxed presentation stances reflect the supplied sheets; fighting stays in guard. */
export function modelSheetPose(ch:CharId,time=0):Pose{
 const p:Pose={...CHARS[ch].poses.idle,lean:0,head:-2,fa1:64,fa2:95,ba1:116,ba2:87,fl1:71,fl2:94,bl1:112,bl2:86,rot:0,finger:0,mouth:0};
 if(ch==='orango')return {...CHARS[ch].poses.idle,lean:35+Math.sin(time*.055)*.7,head:-5};
 if(ch==='tubarao')Object.assign(p,{lean:0,head:0,fa1:67,fa2:92,ba1:115,ba2:88,fl1:75,bl1:108});
 if(ch==='nomad')Object.assign(p,{lean:-2,head:3,fa1:-48,fa2:-127,ba1:115,ba2:87,mouth:.3});
 if(ch==='santox'||ch==='aneninha'||ch==='renngotti'||ch==='jane')Object.assign(p,{fa1:63,fa2:112,ba1:120,ba2:75,head:ch==='jane'?-1:-3});
 if(ch==='patrick')Object.assign(p,{fa1:62,fa2:109,ba1:115,ba2:88,head:-4});
 if(ch==='jao')Object.assign(p,{lean:-2,head:3,fa1:65,fa2:96,ba1:116,ba2:88});
 if(ch==='gabrielzin')Object.assign(p,{lean:-3,head:4,fa1:-36,fa2:-122,ba1:55,ba2:-35,finger:1,mouth:.8,fl1:77,bl1:106});
 if(ch==='ulisses')Object.assign(p,{lean:-3,head:-12,fa1:64,fa2:95,ba1:115,ba2:87,mouth:.5});
 if(ch==='felipence')Object.assign(p,{lean:-2,head:-4,fa1:65,fa2:94,ba1:116,ba2:88});
 if(ch==='hdsh')Object.assign(p,{lean:-1,head:-4,fa1:62,fa2:111,ba1:115,ba2:88});
 const breath=Math.sin(time*.055);p.lean+=breath*.6;p.head-=breath*.35;p.fa1+=breath*.65;return p;
}
