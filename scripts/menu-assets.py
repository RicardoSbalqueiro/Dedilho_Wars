"""Prepack existing art for menus. Combat masters are never changed.

Portrait pixels are copied losslessly. Crowd poses retain their original
calibration and are resampled once to the size used by the ambient menu.
"""
from pathlib import Path
from hashlib import sha256
from PIL import Image
import json,math
root=Path(__file__).resolve().parent.parent
source=root/'src/assets/sprites';manifest=json.loads((source/'manifest.json').read_text())
menu=root/'src/assets/menu';heads=root/'src/assets/portraits'
menu.mkdir(exist_ok=True);heads.mkdir(exist_ok=True)
for p in menu.glob('crowd-*.webp'):p.unlink()
head_image=Image.new('RGBA',(224*6,168*6));portraits={};items=[];actors={};original=0
for n,(key,a) in enumerate(sorted(manifest['atlases'].items())):
 with Image.open(source/a['src']) as raw:
  image=raw.convert('RGBA');original+=image.width*image.height
  x,y,w,h=a['portraitRect'];assert w+4<=224 and h+4<=168
  hx=n%6*224+2;hy=n//6*168+2;head_image.paste(image.crop((x,y,x+w,y+h)),(hx,hy));portraits[key]=[hx,hy,w,h]
  frames=[]
  for i,(rect,bound) in enumerate(zip(a['frameRects'],a['bounds'])):
   sx,sy,sw,sh=rect;bx,by,bw,bh=bound;scale=min(1,224/a['idleHeight'])
   crop=image.crop((sx+bx,sy+by,sx+bx+bw,sy+by+bh));crop=crop.resize((max(1,round(bw*scale)),max(1,round(bh*scale))),Image.Resampling.LANCZOS)
   frame={'page':0,'rect':[],'x':(bx-sw/2)/a['idleHeight'],'y':-bh/a['idleHeight'],'w':bw/a['idleHeight'],'h':bh/a['idleHeight']}
   frames.append(frame);items.append((crop,key,i,frame))
  actors[key]={'frames':frames,'sourceSha256':sha256((source/a['src']).read_bytes()).hexdigest()}
pages=[];page=Image.new('RGBA',(2048,2048));x=y=row=0
# Shelf packing sorted by height avoids reserving a whole fighter-sized cell for
# small crouch/down silhouettes. A two-pixel gutter prevents atlas edge bleeding.
for crop,key,i,frame in sorted(items,key=lambda item:(-item[0].height,item[1],item[2])):
 w,h=crop.size;assert w+4<=2048 and h+4<=2048
 if x+w+4>2048:y+=row;x=0;row=0
 if y+h+4>2048:
  pages.append(page.crop((0,0,2048,y+row)));page=Image.new('RGBA',(2048,2048));x=y=row=0
 frame['page']=len(pages);frame['rect']=[x+2,y+2,w,h];page.paste(crop,(x+2,y+2));x+=w+4;row=max(row,h+4)
pages.append(page.crop((0,0,2048,y+row)))
for i,p in enumerate(pages):p.save(menu/f'crowd-{i}.webp','WEBP',quality=90,method=6,exact=True)
head_image.save(heads/'roster-heads.webp','WEBP',lossless=True,method=6,exact=True)
(menu/'manifest.json').write_text(json.dumps({'version':1,'actors':actors,'pages':[{'src':f'crowd-{i}.webp','width':p.width,'height':p.height} for i,p in enumerate(pages)],'originalPixels':original,'pixels':sum(p.width*p.height for p in pages)},indent=2)+'\n')
(heads/'manifest.json').write_text(json.dumps({'version':1,'src':'roster-heads.webp','width':head_image.width,'height':head_image.height,'portraits':portraits},indent=2)+'\n')
print(json.dumps({'pages':len(pages),'originalPixels':original,'menuPixels':sum(p.width*p.height for p in pages),'menuBytes':sum(p.stat().st_size for p in menu.glob('*.webp')),'portraitBytes':(heads/'roster-heads.webp').stat().st_size}))
