"""Ship one standard offline ZIP, reusing the site's illustrated asset bytes.

The download recipe contains a compressed source prefix, asset local headers
and a ZIP central directory. The browser fetches the existing art URLs once and
assembles those exact bytes. No duplicate 140+ MB download parts are hosted.
"""
from pathlib import Path
from hashlib import sha256
from zipfile import ZipFile
import base64, binascii, json, struct, zlib

root=Path(__file__).resolve().parent.parent
client=root/'dist/client';out=client/'baixar';out.mkdir(exist_ok=True)
for old in out.glob('Dedilho-Wars-*'):
 if old.is_file():old.unlink()
(out/'animation-frames.json').write_bytes((root/'docs/animation-frames.json').read_bytes())
(out/'action-atlas.json').write_bytes((root/'src/assets/actions/manifest.json').read_bytes())
(out/'flow-atlas.json').write_bytes((root/'src/assets/flow/manifest.json').read_bytes())
offline=(client/'index.html').read_text();assets=[];counts={}
for extension in ['mp3','webp']:
 sources=list((root/'src/assets').rglob('*.'+extension));hosted=sorted(client.glob('*.'+extension));counts[extension]=len(sources)
 assert len(hosted)==len(sources),(extension,len(hosted),len(sources))
 for asset in hosted:
  matches=[p for p in sources if asset.stem.startswith(p.stem+'-') and len(asset.stem)-len(p.stem)==9]
  assert len(matches)==1,asset.name
  source=matches[0];assert asset.name in offline,asset.name
  offline=offline.replace(asset.name,source.relative_to(root).as_posix())
  assets.append((source,'../'+asset.name))

# Stable, standard UTF-8 ZIP entries with a fixed timestamp (2026-01-01).
# Headers are prepared here, so the browser only concatenates verified bytes.
central=[];offset=0;prefix=bytearray();recipe=[];fullhash=sha256();entry_count=0
scratch=root/'.sites-runtime';scratch.mkdir(exist_ok=True);archive=scratch/'Dedilho-Wars-projeto.zip'
output=archive.open('wb')
def entry(name,data,compress=False):
 global offset,entry_count
 filename=name.encode('utf8');crc=binascii.crc32(data)&0xffffffff
 if compress:
  encoder=zlib.compressobj(9,zlib.DEFLATED,-15);payload=encoder.compress(data)+encoder.flush();method=8
 else:payload=data;method=0
 header=struct.pack('<IHHHHHIIIHH',0x04034b50,20,0x800,method,0,23585,crc,len(payload),len(data),len(filename),0)+filename
 central.append(struct.pack('<IHHHHHHIIIHHHHHII',0x02014b50,788,20,0x800,method,0,23585,crc,len(payload),len(data),len(filename),0,0,0,0,0o100644<<16,offset)+filename)
 output.write(header);output.write(payload);fullhash.update(header);fullhash.update(payload)
 offset+=len(header)+len(payload);entry_count+=1
 return header,payload

def source_entry(name,data):
 header,payload=entry('Dedilho-Wars/'+name,data,True);prefix.extend(header);prefix.extend(payload)
for name in ['README.md','.gitignore','.openai/hosting.json','package.json','package-lock.json','tsconfig.json','vite.config.ts','drizzle.config.ts','index.html']:
 source_entry(name,(root/name).read_bytes())
for folder in ['src','worker','db','drizzle','scripts','tests','docs','unity','blender']:
 for p in sorted((root/folder).rglob('*')):
  if p.is_file() and not any(part in {'__pycache__','Library','Temp','Obj','Logs','UserSettings','Builds','previews'} for part in p.parts) and p.suffix not in ['.mp3','.webp','.blend1','.blend2']:
   source_entry(p.relative_to(root).as_posix(),p.read_bytes())
source_entry('senbukan/Senbukan-Unity-projeto.zip',(root/'public/senbukan/Senbukan-Unity-projeto.zip').read_bytes())
source_entry('senbukan/build.json',(root/'public/senbukan/build.json').read_bytes())
source_entry('JOGAR.html',offline.encode())
source_name='Dedilho-Wars-codigo.bin';(out/source_name).write_bytes(prefix)
for p,url in assets:
 data=p.read_bytes();header,_=entry('Dedilho-Wars/'+p.relative_to(root).as_posix(),data)
 recipe.append({'url':url,'path':'Dedilho-Wars/'+p.relative_to(root).as_posix(),'bytes':len(data),'sha256':sha256(data).hexdigest(),'header':base64.b64encode(header).decode()})
directory=b''.join(central);suffix=directory+struct.pack('<IHHHHIIH',0x06054b50,0,0,entry_count,entry_count,len(directory),offset,0)
output.write(suffix);output.close();fullhash.update(suffix)
manifest={'version':2,'filename':'Dedilho-Wars-completo.zip','bytes':archive.stat().st_size,'sha256':fullhash.hexdigest(),'source':{'name':source_name,'bytes':len(prefix),'sha256':sha256(prefix).hexdigest()},'assets':recipe,'suffix':base64.b64encode(suffix).decode()}
(out/'download.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
(out/'download.js').write_bytes((root/'scripts/download-client.js').read_bytes())
with ZipFile(archive) as z:
 assert z.testzip() is None
 for extension,count in counts.items():assert len([i for i in z.namelist() if i.endswith('.'+extension)])==count
 assert z.read('Dedilho-Wars/JOGAR.html')==offline.encode()
(out/'index.html').write_text('''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Baixar DEDILHO WARS</title><style>body{margin:0;background:#100b1c;color:white;font:18px/1.6 system-ui}main{max-width:700px;margin:6vh auto;padding:24px}a,button{display:block;box-sizing:border-box;width:100%;padding:16px 20px;background:#6d28d9;color:white;border:0;font:inherit;text-align:left;border-radius:10px;margin:18px 0;text-decoration:none;cursor:pointer}button:disabled{opacity:.65;cursor:wait}small,#status{color:#c7c0d2}</style><main><h1>DEDILHO WARS</h1><p>18 lutadores com arte anime, transformações de 10 segundos, novos desenhos de dash, salto, defesa e ataques, efeitos de movimento e impacto, 17 arenas, quebra de guarda e 90 rotas de combos.</p><a href="/">Jogar no navegador</a><button id="download">Baixar jogo completo e código-fonte (.zip)</button><p id="status" role="status" aria-live="polite"></p><a href="action-atlas.json" download>Catálogo dos desenhos de golpes e ULTs (.json)</a><a href="flow-atlas.json" download>Catálogo dos novos quadros de movimento (.json)</a><a href="animation-frames.json" download>Catálogo das amostras de tempo (.json)</a><p><small>Extraia toda a pasta e abra JOGAR.html. Mantenha a pasta src/assets com todas as ilustrações e músicas. Os modos locais e desafios funcionam offline; contas e partidas online usam o site.</small></p></main><script src="download.js"></script></html>''')
for p in client.rglob('*'):
 if p.is_file():assert p.stat().st_size<25*1024*1024,(p,p.stat().st_size)
print(json.dumps({'archive':str(archive),'bytes':manifest['bytes'],'sourceBytes':len(prefix),'sharedAssets':len(recipe),'sha256':manifest['sha256']}))
