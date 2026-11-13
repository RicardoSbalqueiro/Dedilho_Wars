"""Package only the authored Unity project and Blender sources; never caches."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
from hashlib import sha256
import json
root=Path(__file__).resolve().parent.parent
out=root/'public/senbukan';out.mkdir(parents=True,exist_ok=True)
path=out/'Senbukan-Unity-projeto.zip'
excluded={'Library','Temp','Obj','Logs','UserSettings','Builds','__pycache__','previews','.git'}
files=[]
for folder in ['unity/SenbukanPrototype','blender']:
 for p in sorted((root/folder).rglob('*')):
  if not p.is_file() or any(part in excluded for part in p.parts) or p.suffix in ['.blend1','.blend2']:continue
  files.append(p)
with ZipFile(path,'w',ZIP_DEFLATED) as z:
 for p in files:z.write(p,'Dedilho-Wars-Senbukan/'+p.relative_to(root).as_posix())
 z.writestr('Dedilho-Wars-Senbukan/LEIA-ME.txt','Abra unity/SenbukanPrototype/README.md. Projeto-fonte Unity + Blender preparado; Unity ainda não compilado/testado.\n')
 assert z.testzip() is None
 assert any(n.endswith('Caetano.fbx')for n in z.namelist())
 assert any(n.endswith('DojoSenbukan.fbx')for n in z.namelist())
assert path.stat().st_size<25*1024*1024
print(json.dumps({'archive':str(path),'bytes':path.stat().st_size,'files':len(files),'sha256':sha256(path.read_bytes()).hexdigest(),'unityExecution':'pending'}))
