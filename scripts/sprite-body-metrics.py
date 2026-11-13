#!/usr/bin/env python3
"""Measure opaque body cores for fixed game-space sprite sizing.

Reads existing atlases only. No image is cropped, resized, redrawn or encoded.
Thin blades, raised fingers and detached energy must not set a person's scale.
"""
from pathlib import Path
from PIL import Image
from scipy import ndimage as ndi
import numpy as np,json,statistics,math
ROOT=Path(__file__).resolve().parent.parent

def measure(piece,baseline,anchor):
 a=np.asarray(piece.convert('RGBA'))[:,:,3]>128;yy,xx=np.nonzero(a)
 if not len(xx):raise ValueError('Empty figure')
 top=int(yy.min());bottom=min(int(baseline),int(yy.max())+1);height=max(1,bottom-top)
 # A small opening removes blades/individual sparks while retaining the head,
 # neck and torso. The body component must connect to the lower figure.
 radius=max(1,round(height*.012));core=ndi.binary_opening(a,iterations=radius)
 labels,n=ndi.label(core);areas=np.bincount(labels.ravel());lower=labels[max(top,int(bottom-height*.5)):bottom]
 connected=np.unique(lower);connected=connected[connected>0]
 if len(connected):
  chosen=max(connected,key=lambda i:areas[i]);body=labels==chosen
 else:body=a
 lo=top+round(height*.3);hi=top+round(height*.72)
 mass=body[lo:hi].sum(axis=0).astype(float);smooth=ndi.uniform_filter1d(mass,size=max(3,round(height*.12)))
 spine=int(np.argmax(smooth)) if smooth.max()>0 else int(anchor)
 half=max(10,round(height*.21));left=max(0,spine-half);right=min(a.shape[1],spine+half+1)
 widths=body[:,left:right].sum(axis=1);wide=widths>=max(7,height*.067)
 runs=ndi.convolve1d(wide.astype(int),np.ones(3,dtype=int),mode='constant')>=3
 rows=np.flatnonzero(runs[:bottom])
 head_top=max(top,int(rows[0])-radius) if len(rows) else top
 # Guard against an opening separating a very narrow neck from the torso.
 if head_top>top+height*.28:head_top=top
 return {'top':head_top,'rise':max(1,bottom-head_top),'baseline':float(bottom),'anchorX':float(anchor),'width':int(xx.max()-xx.min()+1),'area':int(a.sum())}

result={'version':1,'atlases':{}}
for bank in ['sprites','motion','actions']:
 manifest=json.loads((ROOT/f'src/assets/{bank}/manifest.json').read_text())
 for key,a in manifest['atlases'].items():
  if bank=='actions' and a['kind']=='effects':continue
  im=Image.open(ROOT/f'src/assets/{bank}'/a['src']).convert('RGBA');frames=[]
  count=len(a['frameRects']) if bank=='sprites' else len(a['frames'])
  for i in range(count):
   if bank=='sprites':
    x,y,w,h=a['frameRects'][i];baseline=a['baselines'][i//a['columns']];anchor=w/2
   else:
    f=a['frames'][i];x,y,w,h=f['rect'];baseline=f['baseline'];anchor=f['anchorX']
   frames.append(measure(im.crop((x,y,x+w,y+h)),baseline,anchor))
  result['atlases'][bank+'/'+key]={'frames':frames}
# Calibrate the artist's pixel unit from the same character's upright body.
# Every drawing in a sheet/form uses ONE scale. Normalizing each pose's height
# inflated bent knees and lunges; raised swords also changed that measurement.
# Median opaque mass measures drawing resolution independently of that pose.
for key,a in result['atlases'].items():
 bank,name=key.split('/',1);a['references']=[]
 variants=2 if bank=='motion' or bank=='actions' and len(a['frames'])==24 and not name.endswith(('-ult','-ult-form')) else 1
 for variant in range(variants):
  form=name.endswith('-form') if bank=='sprites' or name.endswith(('-ult','-ult-form')) else variant==1
  ch=name.split('-')[0];canonical=result['atlases']['sprites/'+ch+('-form' if form else '')]['frames'][:2]
  canonical_rise=statistics.mean(f['rise'] for f in canonical);canonical_area=statistics.mean(f['area'] for f in canonical)
  frames=a['frames'][variant*12:(variant+1)*12] if variants==2 else a['frames']
  if bank=='sprites':ref=canonical_rise
  elif name=='jane-bike':ref=statistics.median(frames[i]['rise'] for i in [0,1,6,7,8])/1.2
  else:
   basis=frames[:4] if name.endswith('-reactions') else [frames[i] for i in [0,1,2,22,23]] if name.endswith(('-ult','-ult-form')) else frames
   ref=canonical_rise*math.sqrt(statistics.median(f['area'] for f in basis)/canonical_area)
  a['references'].append(round(ref,4))
(ROOT/'src/assets/sprite-bodies.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
print(json.dumps({'atlases':len(result['atlases']),'bodyFrames':sum(len(a['frames']) for a in result['atlases'].values())}))
