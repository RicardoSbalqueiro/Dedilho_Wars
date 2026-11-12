import type {CSSProperties} from 'react';
/** Light, decorative DOM particles leave gameplay and keyboard focus alone. */
export function MenuAtmosphere({cool=false}:{cool?:boolean}){
 return <div className={'menu-atmosphere'+(cool?' cool':'')} aria-hidden="true">{Array.from({length:22},(_,i)=><i key={i} style={{'--px':`${(i*41+7)%100}%`,'--py':`${(i*29+13)%100}%`,'--delay':`${i*-.73}s`,'--duration':`${7+i%6}s`,'--drift':`${i%2?35:-25}px`} as CSSProperties}/>)}<span className="menu-light-sweep"/></div>;
}
