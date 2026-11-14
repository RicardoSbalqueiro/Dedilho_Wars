/** Asset completion never means layout changed. Keep static stage previews out
 * of sprite loading redraws and coalesce all art banks into one notification. */
let pending=false;
export function notifyArtReady(){
 if(pending||typeof window==='undefined'||typeof window.dispatchEvent!=='function')return;
 pending=true;const notify=()=>{pending=false;window.dispatchEvent(new Event('dedilho-art-ready'));};
 if(typeof requestAnimationFrame==='function')requestAnimationFrame(notify);else queueMicrotask(notify);
}
