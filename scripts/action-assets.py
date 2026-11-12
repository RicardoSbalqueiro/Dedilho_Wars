#!/usr/bin/env python3
"""Pack complete, unique attack drawings and illustrated effects without warping.

Each move sheet contains three four-drawing actions, first base then transformed.
Ultimate sheets contain twenty-four consecutive drawings of one form. All art
is authored; this script only isolates full cutouts, pads and encodes WebP.
"""
from pathlib import Path
from PIL import Image
from scipy import ndimage as ndi
import numpy as np
import argparse, hashlib, json, os, time

ROOT=Path(__file__).resolve().parent.parent
CHARS=['caetano','orango','tubarao','rickzera','bieu','nomad','renngotti','aneninha','santox','jao','jane','cristyan','eneas','patrick','gabrielzin','ulisses','felipence','hdsh']
GROUPS={'punches':['pL','pM','pH'],'kicks':['kL','kM','kH'],'low':['cP','cK','jP'],'misc':['jK','headbutt','throw'],'specials':['s1','s2','s3']}
FX={
 'a':['rick-orbs','rick-fist','bieu-rat','bieu-paint','aneninha-roach','aneninha-paint'],
 'b':['nomad-burger','nomad-boomerang','renngotti-mic','renngotti-shout','tubarao-water','orango-finger'],
 'c':['jao-chess','jao-formula','jao-ball','jane-java','jane-laser','jane-terminal'],
 'd':['eneas-name','eneas-ecg','eneas-56','hdsh-go','hdsh-trend','hdsh-drop'],
 'e':['gabriel-kiss','gabriel-wink','gabriel-cupid','felipence-riff','felipence-pulse','felipence-note'],
 'f':['ulisses-blood','ulisses-claw','patrick-impact','caetano-finger','cristyan-knee','combat-burst'],
 'scene':['zord-beam','atomic-missile','atomic-cloud','hammock','glitch-domain','arena-beam'],
}
EXPECTED={ch+'-'+page for ch in CHARS for page in [*GROUPS,'ult','ult-form','reactions']}|{'jane-bike'}|{'fx-'+key for key in FX}
VERSION=1

def complete_figures(rgba,count,columns):
 alpha=rgba[:,:,3];labels,n=ndi.label(alpha>128,np.ones((3,3),bool));areas=np.bincount(labels.ravel())
 major=sorted(range(1,n+1),key=lambda k:areas[k],reverse=True)[:count]
 if len(major)!=count or min(areas[k] for k in major)<700:raise ValueError(f'Expected {count} complete separate silhouettes; found {sum(areas[1:]>700)}')
 slices=ndi.find_objects(labels)
 def center(k):
  sl=slices[k-1];return ((sl[0].start+sl[0].stop)/2,(sl[1].start+sl[1].stop)/2)
 ordered=sorted(major,key=lambda k:center(k)[0]);ordered=[k for row in range(count//columns) for k in sorted(ordered[row*columns:row*columns+columns],key=lambda k:center(k)[1])]
 seeds=np.zeros(labels.shape,np.uint8)
 for i,k in enumerate(ordered):seeds[labels==k]=i+1
 _,nearest=ndi.distance_transform_edt(seeds==0,return_indices=True);ownership=seeds[tuple(nearest)]
 figures=[];geometry=[]
 for i in range(count):
  yy,xx=np.nonzero((ownership==i+1)&(alpha>16));left=max(0,int(xx.min())-3);top=max(0,int(yy.min())-3);right=min(rgba.shape[1],int(xx.max())+4);bottom=min(rgba.shape[0],int(yy.max())+4)
  piece=rgba[top:bottom,left:right].copy();piece[ownership[top:bottom,left:right]!=i+1]=0;a=piece[:,:,3];ys,xs=np.nonzero(a>48)
  base=int(ys.max())+1;feet=(a>96)[max(0,base-round((base-int(ys.min()))*.045)):base];_,fx=np.nonzero(feet)
  anchor=float(fx.min()+fx.max())/2 if len(fx) else piece.shape[1]/2
  figures.append(Image.fromarray(piece));geometry.append({'anchorX':anchor,'baseline':base,'height':base-int(ys.min()),'visiblePixels':int(len(xs))})
 return figures,geometry,[int(areas[k]) for k in ordered]

def encode(path,out):
 stem=path.stem;image=Image.open(path).convert('RGBA');rgba=np.asarray(image);alpha=rgba[:,:,3]
 if float((alpha<8).mean())<.28:raise ValueError('Source background is not transparent')
 is_fx=stem.startswith('fx-');ch,page=stem.split('-',1);count=12 if stem=='jane-bike' else 24;rows=count//4
 if is_fx:
  # Preserve transparent space inside FX cells: a growing effect must actually
  # expand inside the destination rectangle instead of being resized to fill it.
  figures=[];geometry=[];seed_areas=[]
  for i in range(count):
   row,col=divmod(i,4);left=round(col*image.width/4);right=round((col+1)*image.width/4);top=round(row*image.height/6);bottom=round((row+1)*image.height/6);piece=image.crop((left,top,right,bottom));a=np.asarray(piece)[:,:,3];visible=int(np.count_nonzero(a>48))
   if visible<30:raise ValueError(f'Effect cell {i} is empty')
   figures.append(piece);geometry.append({'anchorX':piece.width/2,'baseline':piece.height,'height':piece.height,'visiblePixels':visible})
 else:figures,geometry,seed_areas=complete_figures(rgba,count,4)
 cw=max(f.width for f in figures)+20;rh=max(f.height for f in figures)+20;packed=Image.new('RGBA',(cw*4,rh*rows));frames=[]
 for i,figure in enumerate(figures):
  row,col=divmod(i,4);left=col*cw+(cw-figure.width)//2;top=row*rh+rh-10-figure.height
  packed.paste(figure,(left,top));frames.append({'rect':[left,top,figure.width,figure.height],**geometry[i]})
 if page in GROUPS:
  for variant in range(2):
   for row,move in enumerate(GROUPS[page]):
    start=variant*12+row*4;fraction={'cP':.68,'cK':.52,'jP':.76,'jK':.78}.get(move,1.)
    if ch=='jane' and page=='specials':fraction=[.68,.9,.72][row]
    if ch=='orango' and move=='s3':fraction=.7
    ref=float(np.median([geometry[start+i]['height'] for i in range(4)]))/fraction
    for i in range(start,start+4):frames[i]['referenceHeight']=ref
 elif page=='reactions':
  for variant in range(2):
   start=variant*12;ref=max(geometry[start+i]['height'] for i in [0,3,10,11])
   for i in range(start,start+12):frames[i]['referenceHeight']=ref
 elif page in ['ult','ult-form']:
  ref=float(np.median([geometry[i]['height'] for i in [0,1,2,22,23]]))
  for f in frames:f['referenceHeight']=f['height'] if ch=='jane' else ref
 else:
  ref=float(np.median([geometry[i]['height'] for i in ([0,1,6,7,8] if page=='bike' else range(count))]))
  for f in frames:f['referenceHeight']=ref
 source_visible=int(np.count_nonzero(alpha>48));packed_alpha=np.asarray(packed)[:,:,3];packed_visible=int(np.count_nonzero(packed_alpha>48))
 if source_visible!=packed_visible:raise ValueError('Packing changed source visible pixels')
 target=out/('action-'+stem+'.webp');packed.save(target,'WEBP',quality=94,method=4,exact=True,alpha_quality=100)
 with Image.open(target) as check:
  if check.convert('RGBA').getchannel('A').tobytes()!=packed.getchannel('A').tobytes():raise ValueError('Encoding changed source alpha')
 kind='effects' if is_fx else 'ultimate' if page.startswith('ult') else 'prop' if page=='bike' else 'reactions' if page=='reactions' else 'moves'
 return {'ch':ch if ch in CHARS else None,'page':page,'kind':kind,'src':target.name,'width':packed.width,'height':packed.height,'columns':4,'rows':rows,'frames':frames,'sourceDrawings':count,'geometryVersion':VERSION,'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'encodedSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sourceStamp':[path.stat().st_mtime_ns,path.stat().st_size],'packing':{'method':'transparent-fixed-cells' if is_fx else 'alpha128-largest-nearest-seed','sourceVisiblePixels':source_visible,'packedVisiblePixels':packed_visible,'seedAreas':seed_areas}}

def clips(atlases):
 result={}
 for key,a in atlases.items():
  ch,page=a['ch'],a['page']
  if page in GROUPS:
   for variant in range(2):
    for row,move in enumerate(GROUPS[page]):result[f'{ch}/{"form" if variant else "base"}/{move}']={'atlas':key,'frames':list(range(variant*12+row*4,variant*12+row*4+4)),'kind':'move'}
  elif page in ['ult','ult-form']:result[f'{ch}/{"form" if page=="ult-form" else "base"}/ult']={'atlas':key,'frames':list(range(24)),'kind':'ultimate'}
  elif page=='reactions':
   for variant in range(2):result[f'{ch}/{"form" if variant else "base"}/react']={'atlas':key,'frames':list(range(variant*12,variant*12+12)),'kind':'move'}
  elif page=='bike':result['jane/base/bike']={'atlas':key,'frames':list(range(12)),'kind':'prop'}
  elif a['kind']=='effects':
   for row,name in enumerate(FX[page]):result['fx/'+name]={'atlas':key,'frames':list(range(row*4,row*4+4)),'kind':'effect'}
 return result

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--source',type=Path,default=Path('/workspace/work/unique-attacks/raw'));parser.add_argument('--output',type=Path,default=ROOT/'src/assets/actions');parser.add_argument('--watch',action='store_true');parser.add_argument('--only',nargs='*');args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
 target=args.output/'manifest.json';manifest=json.loads(target.read_text()) if target.exists() else {'version':1,'atlases':{},'clips':{}};failed={}
 while True:
  for path in sorted(args.source.glob('*.png')):
   if path.stem not in EXPECTED or args.only and path.stem not in args.only:continue
   stamp=[path.stat().st_mtime_ns,path.stat().st_size];old=manifest['atlases'].get(path.stem)
   if old and old.get('geometryVersion')==VERSION and old.get('sourceStamp')==stamp and (args.output/old['src']).exists():continue
   if failed.get(path.stem)==stamp:continue
   try:
    a=encode(path,args.output);manifest['atlases'][path.stem]=a;manifest['clips']=clips(manifest['atlases']);manifest['totalDrawings']=sum(a['sourceDrawings'] for a in manifest['atlases'].values());tmp=target.with_suffix('.json.tmp');tmp.write_text(json.dumps(manifest,indent=2)+'\n');os.replace(tmp,target);print(path.stem,a['sourceDrawings'],a['width'],a['height'],'total',len(manifest['atlases']),flush=True)
   except Exception as e:failed[path.stem]=stamp;print('ERROR',path.stem,str(e),flush=True)
  if not args.watch or EXPECTED<=manifest['atlases'].keys():break
  time.sleep(2)
 print(json.dumps({'atlases':len(manifest['atlases']),'drawings':manifest.get('totalDrawings',0),'missing':sorted(EXPECTED-manifest['atlases'].keys()),'failed':list(failed)}),flush=True)
if __name__=='__main__':main()
