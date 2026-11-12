#!/usr/bin/env python3
"""Pack complete, newly illustrated inbetween figures; never warp their artwork.

Input sheets have 4 columns and 6 rows: 12 normal and 12 transformed drawings.
Only lossless pixel copies, transparent padding and WebP encoding are performed.
"""
from pathlib import Path
from PIL import Image
import argparse, hashlib, json, math, os
import numpy as np
from scipy import ndimage as ndi

ROOT=Path(__file__).resolve().parent.parent
POSES=['walkPassA','walkDownA','walkPassB','walkDownB','drawBack','halfStrike','followThrough','retract','chamber','halfKick','kickReturn','lowStrike']

def prepare(path,out):
 im=Image.open(path).convert('RGBA');pixels=np.asarray(im);alpha=pixels[:,:,3];mask=alpha>48
 if (alpha<8).mean()<.3:raise ValueError(f'{path.name}: background is not transparent; regenerate the source cutout')
 # Source rows drift vertically and blades/hair can cross nominal gutters.
 # Assign each source pixel to its complete connected figure before packing.
 labels,count=ndi.label(alpha>128,np.ones((3,3),bool));areas=np.bincount(labels.ravel())
 major=sorted(range(1,count+1),key=lambda n:areas[n],reverse=True)[:24]
 if len(major)!=24 or min(areas[n] for n in major)<1000:raise ValueError(f'{path.name}: expected 24 separate full silhouettes')
 slices=ndi.find_objects(labels)
 def center(n):
  sl=slices[n-1];return ((sl[0].start+sl[0].stop)/2,(sl[1].start+sl[1].stop)/2)
 ordered=sorted(major,key=lambda n:center(n)[0]);ordered=[n for r in range(6) for n in sorted(ordered[r*4:r*4+4],key=lambda n:center(n)[1])]
 seeds=np.zeros(labels.shape,np.uint8)
 for i,n in enumerate(ordered):seeds[labels==n]=i+1
 _,nearest=ndi.distance_transform_edt(seeds==0,return_indices=True);ownership=seeds[tuple(nearest)]
 figures=[];meta=[]
 for i,n in enumerate(ordered):
  yy,xx=np.nonzero((ownership==i+1)&(alpha>16));pad=3
  left,top=max(0,int(xx.min())-pad),max(0,int(yy.min())-pad);right,bottom=min(im.width,int(xx.max())+1+pad),min(im.height,int(yy.max())+1+pad)
  piece=pixels[top:bottom,left:right].copy();piece[ownership[top:bottom,left:right]!=i+1]=0;figure=Image.fromarray(piece);a=piece[:,:,3];m=a>48
  yy,xx=np.nonzero(m)
  if len(xx)<900:raise ValueError(f'{path.name}: frame {i} is empty or implausibly small')
  h=int(yy.max())+1
  feet=(a>96)[max(0,h-max(2,round(h*.045))):h];_,fx=np.nonzero(feet)
  anchor=(float(fx.min()+fx.max())*.5 if len(fx) else figure.width*.5)
  if path.stem=='tubarao' and i>=12:anchor=figure.width*.5
  figures.append(figure);meta.append({'width':figure.width,'height':h-int(yy.min()),'baseline':h,'anchor':anchor,'visiblePixels':len(xx)})
 # Preserve whole figures at source resolution, with an independent foot anchor.
 cw=max(p.width for p in figures)+20;ch=max(p.height for p in figures)+20
 packed=Image.new('RGBA',(cw*4,ch*6));frames=[]
 for i,figure in enumerate(figures):
  row,col=divmod(i,4);left=col*cw+(cw-figure.width)//2;top=row*ch+ch-10-figure.height
  packed.paste(figure,(left,top));frames.append({'rect':[left,top,figure.width,figure.height],'anchorX':meta[i]['anchor'],'baseline':meta[i]['baseline'],'height':meta[i]['height'],'visiblePixels':meta[i]['visiblePixels']})
 visible=int(np.count_nonzero(mask));packed_visible=int(np.count_nonzero(np.asarray(packed)[:,:,3]>48))
 if visible!=packed_visible:raise ValueError(f'{path.name}: packing changed visible pixels ({visible} to {packed_visible})')
 heights=[max(meta[offset+i]['height'] for i in [0,2,4,7]) for offset in [0,12]]
 row_heights=[]
 for offset in [0,12]:
  row_heights.extend([max(meta[offset+i]['height'] for i in [0,2]),max(meta[offset+i]['height'] for i in [4,7])/.94,max(meta[offset+i]['height'] for i in [8,9,10])/.98])
 target=out/('motion-'+path.stem+'.webp');packed.save(target,'WEBP',quality=94,method=6,exact=True,alpha_quality=100)
 with Image.open(target) as encoded:
  if encoded.convert('RGBA').getchannel('A').tobytes()!=packed.getchannel('A').tobytes():raise ValueError('Encoding changed the alpha plane')
 return {'ch':path.stem,'geometryVersion':3,'src':target.name,'width':packed.width,'height':packed.height,'columns':4,'rows':6,'referenceHeights':heights,'rowReferenceHeights':row_heights,'frames':frames,'packing':{'method':'alpha128-largest24-nearest-seed','sourceVisiblePixels':visible,'packedVisiblePixels':packed_visible,'sourceSeedAreas':[int(areas[n]) for n in ordered]},'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'encodedSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sourceDrawings':24}

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--source',type=Path,default=Path('/workspace/work/combat-fluidity/raw'));parser.add_argument('--output',type=Path,default=ROOT/'src/assets/motion');parser.add_argument('--only',nargs='*');args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
 target=args.output/'manifest.json';manifest=json.loads(target.read_text()) if target.exists() else {'version':1,'poses':POSES,'formOffset':12,'atlases':{}}
 files=sorted(args.source.glob('*.png'))
 if args.only:files=[p for p in files if p.stem in args.only]
 for path in files:
  previous=manifest['atlases'].get(path.stem)
  if previous and previous.get('geometryVersion')==3 and previous.get('sourceSha256')==hashlib.sha256(path.read_bytes()).hexdigest() and (args.output/previous['src']).is_file():
   print(path.stem,'unchanged',flush=True);continue
  entry=prepare(path,args.output);manifest['atlases'][path.stem]=entry;print(path.stem,entry['width'],entry['height'],entry['referenceHeights'],flush=True)
 manifest['atlases']=dict(sorted(manifest['atlases'].items()));temporary=target.with_suffix('.json.tmp');temporary.write_text(json.dumps(manifest,indent=2)+'\n');os.replace(temporary,target)
if __name__=='__main__':main()
