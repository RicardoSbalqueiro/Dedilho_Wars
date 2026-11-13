import {build} from 'esbuild';
export const headlessPlugins=[{name:'server-combat-presentation',setup(b){
 b.onLoad({filter:/[\\/]src[\\/]game[\\/]audio\.ts$/},()=>({contents:'export const audio=new Proxy({ctx:null},{get(target,key){return key in target?target[key]:(()=>{});}});',loader:'js'}));
 b.onLoad({filter:/[\\/]src[\\/]game[\\/]anime-sprite\.ts$/},()=>({contents:'export const drawAnimeSprite=()=>{};export const drawAnimeSpriteHead=()=>{};',loader:'js'}));
}}];
export const buildWorker=outfile=>build({entryPoints:['worker/index.js'],outfile,bundle:true,format:'esm',platform:'browser',target:'es2022',plugins:headlessPlugins});
