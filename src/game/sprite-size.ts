import raw from '../assets/sprite-bodies.json';
import type {DrawOpts} from './rig';

interface BodyMetric {top:number;rise:number;baseline:number;anchorX:number;width:number;area:number}
const metrics=raw as {version:number;atlases:Record<string,{frames:BodyMetric[];references:number[]}>};
/** The same illustrated pixel unit for an entire sheet/form. Measurements are
 * calibrated against the upright character, independently of attack cropping,
 * weapons and pose height. A lunge or crouch keeps its natural bent posture;
 * it can never enlarge the body to fill a standing-height rectangle. */
export function spritePlacement(bank:'sprites'|'motion'|'actions'|'flow',key:string,index:number,height:number,_o:DrawOpts,fallback:{reference:number;baseline:number;anchorX:number}){
 const atlas=metrics.atlases[bank+'/'+key],body=atlas?.frames[index];
 if(!body)return {scale:height/Math.max(1,fallback.reference),baseline:fallback.baseline,anchorX:fallback.anchorX,bodyHeight:height,bodyTop:0};
 const variant=atlas.references.length===2?Math.floor(index/12):0;
 const scale=height/Math.max(1,atlas.references[variant]);
 return {scale,baseline:body.baseline,anchorX:body.anchorX,bodyHeight:body.rise*scale,bodyTop:body.top};
}
export const spriteBodyMetrics=()=>metrics;
