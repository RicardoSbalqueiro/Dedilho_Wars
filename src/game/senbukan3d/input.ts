import type {Action,Input} from './sim';
const bindings:Record<string,Action>={KeyJ:'punch',KeyK:'kick',KeyU:'special',ShiftLeft:'dash',ShiftRight:'dash',Space:'jump',KeyF:'prime'};
export class ArenaInput {
 private keys=new Set<string>(); private held=new Set<string>(); private pending=new Set<Action>();
 stick={x:0,y:0}; enabled=false;
 constructor(private target:HTMLElement,private command:(command:'pause'|'restart'|'lock')=>void){
  window.addEventListener('keydown',this.down);window.addEventListener('keyup',this.up);window.addEventListener('blur',this.clear);
 }
 private down=(e:KeyboardEvent)=>{
  if((e.target as HTMLElement)?.matches('input,textarea,select'))return;
  if(e.code==='Escape'||e.code==='KeyP'){if(!e.repeat)this.command('pause');return;}
  if(!this.enabled)return;
  if(e.code in bindings||['KeyW','KeyA','KeyS','KeyD','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  this.keys.add(e.code);if(e.repeat)return;
  if(bindings[e.code])this.pending.add(bindings[e.code]);
  if(e.code==='KeyQ')this.command('lock');if(e.code==='KeyR')this.command('restart');
 };
 private up=(e:KeyboardEvent)=>{this.keys.delete(e.code);};
 clear=()=>{this.keys.clear();this.held.clear();this.pending.clear();this.stick={x:0,y:0};};
 button(action:Action|'guard',pressed:boolean,pointer:number){
  const name=action+':'+pointer;if(pressed){this.held.add(name);if(action!=='guard')this.pending.add(action);}else this.held.delete(name);
 }
 frame(azimuth:number):Input {
  let x=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0)+this.stick.x;
  let y=(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)-(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)-this.stick.y;
  const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}
  const pressed=this.pending;this.pending=new Set();
  return {x:Math.cos(azimuth)*x+Math.sin(azimuth)*y,z:-Math.sin(azimuth)*x+Math.cos(azimuth)*y,
   guard:this.keys.has('KeyE')||Array.from(this.held).some(s=>s.startsWith('guard:')),pressed};
 }
 focus(){this.target.focus({preventScroll:true});}
 dispose(){this.clear();window.removeEventListener('keydown',this.down);window.removeEventListener('keyup',this.up);window.removeEventListener('blur',this.clear);}
}
