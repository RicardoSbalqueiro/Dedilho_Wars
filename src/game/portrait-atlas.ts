import raw from '../assets/portraits/manifest.json';
import {notifyArtReady} from './art-events';
const manifest=raw as unknown as {src:string;portraits:Record<string,[number,number,number,number]>};
let image:HTMLImageElement|undefined,status:'unloaded'|'loading'|'ready'|'error'='unloaded';
/** Exact lossless crops of the existing heads: no full body-sheet decode is
 * necessary for a roster, account page or HUD portrait. */
export function loadedPortrait(key:string){
 const rect=manifest.portraits[key];if(!rect)return;
 if(status==='unloaded'&&typeof Image!=='undefined'){
  status='loading';image=new Image();image.decoding='async';
  image.onload=()=>{status='ready';image!.onload=image!.onerror=null;notifyArtReady();};
  image.onerror=()=>{status='error';image!.onload=image!.onerror=null;notifyArtReady();};
  image.src=new URL('../assets/portraits/roster-heads.webp',import.meta.url).href;
 }
 if(status==='ready'&&image)return {image,rect};
}
export const portraitAtlasFailed=()=>status==='error';
