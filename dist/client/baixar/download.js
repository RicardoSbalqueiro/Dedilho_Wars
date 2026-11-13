const button=document.querySelector('#download'),status=document.querySelector('#status');
const decode64=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
const hash=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),n=>n.toString(16).padStart(2,'0')).join('');
button.addEventListener('click',async()=>{
 button.disabled=true;status.textContent='Preparando download…';
 try{
  const response=await fetch('download.json');if(!response.ok)throw Error('manifest');
  const spec=await response.json();if(spec.version!==2)throw Error('version');
  let loaded=0;const total=spec.source.bytes+spec.assets.reduce((n,a)=>n+a.bytes,0);
  const fetchChecked=async file=>{
   const r=await fetch(file.url||file.name);if(!r.ok)throw Error('file');
   const data=await r.arrayBuffer();if(data.byteLength!==file.bytes)throw Error('length');
   if(globalThis.crypto?.subtle&&await hash(data)!==file.sha256)throw Error('checksum');
   loaded+=data.byteLength;status.textContent='Preparando arquivo: '+Math.round(loaded/total*100)+'%';return data;
  };
  const source=await fetchChecked(spec.source),chunks=new Array(spec.assets.length);let next=0;
  // Reuse the exact hosted art bytes. Four bounded workers, no second copy of
  // every illustration on the server and no whole-archive hash allocation.
  const worker=async()=>{while(next<spec.assets.length){const i=next++,file=spec.assets[i];chunks[i]=[decode64(file.header),await fetchChecked(file)];}};
  await Promise.all(Array.from({length:4},worker));
  const blob=new Blob([source,...chunks.flat(),decode64(spec.suffix)],{type:'application/zip'});
  if(blob.size!==spec.bytes)throw Error('total');
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=spec.filename;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),60000);status.textContent='Download pronto. Extraia a pasta e abra JOGAR.html.';
 }catch{status.textContent='Não foi possível concluir o download. Tente novamente.';}
 finally{button.disabled=false;}
});
