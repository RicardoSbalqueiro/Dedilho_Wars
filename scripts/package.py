from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root=Path(__file__).resolve().parent.parent
client=root/'dist/client';out=client/'baixar';out.mkdir(exist_ok=True)
(out/'index.html').write_text('''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Baixar DEDILHO WARS</title><style>body{margin:0;background:#100b1c;color:white;font:18px/1.6 system-ui}main{max-width:700px;margin:6vh auto;padding:24px}a{display:block;padding:16px 20px;background:#6d28d9;color:white;border-radius:10px;margin:18px 0;text-decoration:none}small{color:#c7c0d2}</style><main><h1>DEDILHO WARS</h1><p>13 lutadores, 17 arenas, finishers, perfis e ranking, online por salas, controles para celular e 15 desafios de treino.</p><a href="/">Jogar no navegador</a><a href="Dedilho-Wars-projeto.zip" download="Dedilho-Wars-completo.zip">Baixar jogo completo e código-fonte (.zip)</a><p><small>Extraia toda a pasta e abra JOGAR.html. Mantenha src/assets/radio junto do HTML. Os modos locais e os desafios funcionam offline; contas e partidas online usam o site.</small></p></main></html>''')
offline=(client/'index.html').read_text();sounds=list(client.glob('*.mp3'));assert len(sounds)==7
for sound in sounds:
 name=sound.stem.rsplit('-',1)[0];assert (root/'src/assets/radio'/f'{name}.mp3').exists();assert sound.name in offline
 offline=offline.replace(sound.name,f'src/assets/radio/{name}.mp3')
with ZipFile(out/'Dedilho-Wars-projeto.zip','w',ZIP_DEFLATED) as z:
 for name in ['README.md','.gitignore','.openai/hosting.json','package.json','package-lock.json','tsconfig.json','vite.config.ts','drizzle.config.ts','index.html']:
  z.write(root/name,'Dedilho-Wars/'+name)
 for folder in ['src','worker','db','drizzle','scripts','tests','docs']:
  for p in sorted((root/folder).rglob('*')):
   if p.is_file() and '__pycache__' not in p.parts:z.write(p,'Dedilho-Wars/'+p.relative_to(root).as_posix())
 z.writestr('Dedilho-Wars/JOGAR.html',offline)
 assert z.testzip() is None
 assert len([i for i in z.namelist() if i.endswith('.mp3')])==7
for p in client.rglob('*'):
 if p.is_file():assert p.stat().st_size<25*1024*1024,(p,p.stat().st_size)
print('Offline project ZIP:',(out/'Dedilho-Wars-projeto.zip').stat().st_size,'bytes')
