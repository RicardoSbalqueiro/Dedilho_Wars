"""Ship source and a file:// playable game, respecting the hosting asset limit."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from hashlib import sha256
import json

root = Path(__file__).resolve().parent.parent
client = root / 'dist/client'
out = client / 'baixar'
out.mkdir(exist_ok=True)
for old in out.glob('Dedilho-Wars-*'):
    if old.is_file():
        old.unlink()
(out / 'animation-frames.json').write_bytes((root / 'docs/animation-frames.json').read_bytes())
offline = (client / 'index.html').read_text()
for extension, folder, count in [('mp3', 'radio', 7), ('webp', 'sprites', 36)]:
    assets = list(client.glob('*.' + extension))
    assert len(assets) == count, (extension, len(assets))
    for asset in assets:
        sources = list((root / 'src/assets' / folder).glob('*.' + extension))
        matches = [p for p in sources if asset.stem.startswith(p.stem + '-') and len(asset.stem) - len(p.stem) == 9]
        assert len(matches) == 1, asset.name
        name = matches[0].name
        assert (root / 'src/assets' / folder / name).exists(), name
        assert asset.name in offline, asset.name
        offline = offline.replace(asset.name, 'src/assets/' + folder + '/' + name)

scratch = root / '.sites-runtime'
scratch.mkdir(exist_ok=True)
archive = scratch / 'Dedilho-Wars-projeto.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED) as z:
    for name in ['README.md', '.gitignore', '.openai/hosting.json', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'drizzle.config.ts', 'index.html']:
        z.write(root / name, 'Dedilho-Wars/' + name)
    for folder in ['src', 'worker', 'db', 'drizzle', 'scripts', 'tests', 'docs']:
        for p in sorted((root / folder).rglob('*')):
            if p.is_file() and '__pycache__' not in p.parts:
                z.write(p, 'Dedilho-Wars/' + p.relative_to(root).as_posix())
    z.writestr('Dedilho-Wars/JOGAR.html', offline)
    assert z.testzip() is None
    assert len([i for i in z.namelist() if i.endswith('.mp3')]) == 7
    assert len([i for i in z.namelist() if i.endswith('.webp')]) == 36

payload = archive.read_bytes()
parts = []
# The browser assembles one standard ZIP; each hosted part stays below 25 MiB.
for i, start in enumerate(range(0, len(payload), 20 * 1024 * 1024), 1):
    data = payload[start:start + 20 * 1024 * 1024]
    name = 'Dedilho-Wars-projeto.zip' if len(payload) < 25 * 1024 * 1024 else f'Dedilho-Wars-projeto.part{i}.bin'
    (out / name).write_bytes(data)
    parts.append({'name': name, 'bytes': len(data)})
    if name.endswith('.zip'):
        # A small complete archive needs no second part.
        (out / name).write_bytes(payload)
        parts[0]['bytes'] = len(payload)
        break
manifest = {'version': 1, 'filename': 'Dedilho-Wars-completo.zip', 'bytes': len(payload), 'sha256': sha256(payload).hexdigest(), 'parts': parts}
(out / 'download.json').write_text(json.dumps(manifest, indent=2) + '\n')
assert b''.join((out / p['name']).read_bytes() for p in parts) == payload

(out / 'index.html').write_text('''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Baixar DEDILHO WARS</title><style>body{margin:0;background:#100b1c;color:white;font:18px/1.6 system-ui}main{max-width:700px;margin:6vh auto;padding:24px}a,button{display:block;box-sizing:border-box;width:100%;padding:16px 20px;background:#6d28d9;color:white;border:0;font:inherit;text-align:left;border-radius:10px;margin:18px 0;text-decoration:none;cursor:pointer}button:disabled{opacity:.65;cursor:wait}small,#status{color:#c7c0d2}</style><main><h1>DEDILHO WARS</h1><p>18 lutadores com arte anime, 18 transformações de 10 segundos, 432 poses ilustradas, 17 arenas, rádio, stamina, dois estoques de ULT, finishers, perfis e ranking, partidas online, controles para celular, 18 desafios e 72 rotas de combos.</p><a href="/">Jogar no navegador</a><button id="download">Baixar jogo completo e código-fonte (.zip)</button><p id="status" role="status" aria-live="polite"></p><a href="animation-frames.json" download>Catálogo das amostras de tempo de animação (.json)</a><p><small>Extraia toda a pasta e abra JOGAR.html. Mantenha a pasta src/assets com as ilustrações e os sete MP3. Os modos locais e os desafios funcionam offline; contas e partidas online usam o site.</small></p></main><script>
const button=document.querySelector('#download'),status=document.querySelector('#status');
button.addEventListener('click',async()=>{
 button.disabled=true;status.textContent='Preparando download…';
 try{
  const response=await fetch('download.json');if(!response.ok)throw Error('manifest');
  const spec=await response.json(),chunks=[];let loaded=0;
  for(const part of spec.parts){
   const r=await fetch(part.name);if(!r.ok)throw Error('part');
   const data=await r.arrayBuffer();if(data.byteLength!==part.bytes)throw Error('length');
   chunks.push(data);loaded+=data.byteLength;status.textContent='Preparando arquivo: '+Math.round(loaded/spec.bytes*100)+'%';
  }
  if(loaded!==spec.bytes)throw Error('total');
  const blob=new Blob(chunks,{type:'application/zip'});
  if(globalThis.crypto?.subtle){const digest=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());const hash=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');if(hash!==spec.sha256)throw Error('checksum');}
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=spec.filename;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),60000);status.textContent='Download pronto. Extraia a pasta e abra JOGAR.html.';
 }catch{status.textContent='Não foi possível concluir o download. Tente novamente.';}
 finally{button.disabled=false;}
});
</script></html>''')
for p in client.rglob('*'):
    if p.is_file():
        assert p.stat().st_size < 25 * 1024 * 1024, (p, p.stat().st_size)
print(json.dumps({'archive': str(archive), 'bytes': len(payload), 'parts': len(parts), 'sha256': manifest['sha256']}))
