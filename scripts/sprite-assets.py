#!/usr/bin/env python3
"""Encode illustrated character atlases and record their fixed-cell geometry.

This pipeline slices and packs complete illustrated figures without redrawing, resizing, recolouring or sharpening the art. WebP
uses quality 92 RGB with its original lossless alpha plane. Alpha > 32 is only an
analysis mask: nearly transparent colour speckles are never sprite bounds.

Usage: python3 scripts/sprite-assets.py --source /path/to/illustrated-pngs
The default source is the current task's /workspace/work/anime-sprites directory.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import tempfile
from PIL import Image, features
import numpy as np
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = Path('/workspace/work/anime-sprites')
DEFAULT_OUTPUT = ROOT / 'src/assets/sprites'
POSES = ['idle', 'standing', 'walkA', 'walkB', 'windup', 'punch', 'kick', 'crouch', 'jump', 'guard', 'hit', 'charge']
COLUMNS, ROWS, ALPHA_THRESHOLD = 4, 3, 32
GEOMETRY_VERSION = 3
PROVENANCE_VERSION = 1
PORTRAIT_VERSION = 2
CHARS = {'caetano','orango','tubarao','rickzera','bieu','nomad','renngotti','aneninha','santox','jao','jane','cristyan','eneas','patrick','gabrielzin','ulisses','felipence','hdsh'}
# Height of the head/hat band in the standing frame. Long hair below the chin is
# deliberately excluded. The alpha mask finds its horizontal location.
PORTRAIT_HEIGHT = {'orango': .31, 'tubarao': .24, 'nomad': .23, 'ulisses': .25}
FORM_PORTRAIT_HEIGHT = {'santox': .36, 'gabrielzin': .29, 'jane': .22, 'orango': .31, 'tubarao': .29}


def rect_from_bbox(box: tuple[int,int,int,int]) -> list[int]:
    return [box[0], box[1], box[2]-box[0], box[3]-box[1]]


def split_edge(index: int, length: int, count: int) -> int:
    # Round halves up; adjacent cells share their exact integer boundary.
    return math.floor(index*length/count + .5)


def shared_edges(counts: list[int], count: int) -> list[int]:
    """Find transparent shared gutters without moving or clipping the artwork.

    Generated sheets can drift from exact thirds/quarters. All poses in a row
    still share one top/bottom; all poses in a column share one left/right.
    """
    length=len(counts)
    edges=[0]
    radius=round(length/count*(.32 if count==ROWS else .28))
    for index in range(1,count):
        target=split_edge(index,length,count)
        choices=range(max(edges[-1]+16,target-radius),min(length-16,target+radius)+1)
        costs={p:sum(counts[max(0,p-4):min(length,p+5)]) for p in choices}
        best=min(costs.values())
        candidates=[p for p in choices if costs[p]==best]
        # Prefer a transparent centre if a nine-pixel gutter cannot be entirely
        # empty, then the closest common boundary to the nominal atlas grid.
        edge=min(candidates,key=lambda p:(counts[p]>0,abs(p-target)))
        edges.append(edge)
    return edges+[length]


def atlas_geometry(image: Image.Image, stem: str) -> dict:
    width, height = image.size
    if width < COLUMNS*16 or height < ROWS*16:
        raise ValueError(f'{stem}: atlas dimensions too small: {image.size}')
    mask = image.getchannel('A').point(lambda alpha: 255 if alpha > ALPHA_THRESHOLD else 0)
    plane=mask.tobytes()
    row_counts=[sum(plane[y*width:(y+1)*width])//255 for y in range(height)]
    column_counts=[sum(plane[x::width])//255 for x in range(width)]
    row_edges=shared_edges(row_counts,ROWS)
    column_edges=shared_edges(column_counts,COLUMNS)
    frame_rects: list[list[int]] = []
    bounds: list[list[int]] = []
    for index in range(len(POSES)):
        col, row = index % COLUMNS, index // COLUMNS
        left, right = column_edges[col],column_edges[col+1]
        top, bottom = row_edges[row],row_edges[row+1]
        box = mask.crop((left,top,right,bottom)).getbbox()
        if box is None:
            raise ValueError(f'{stem}: frame {index} ({POSES[index]}) has no alpha > {ALPHA_THRESHOLD}')
        frame_rects.append([left,top,right-left,bottom-top])
        bounds.append(rect_from_bbox(box))
    baselines = []
    for row in range(ROWS):
        # Preserve the height of crouches/jumps. In particular frame 8 is never
        # re-grounded on its own bounding box: all row peers use this baseline.
        peers = [i for i in range(row*COLUMNS,(row+1)*COLUMNS) if i not in (8,10)]
        baselines.append(max(bounds[i][1]+bounds[i][3] for i in peers))
    idle_height = bounds[0][3]
    if idle_height < 16:
        raise ValueError(f'{stem}: implausible idle height {idle_height}')
    ch = stem.removesuffix('-form')
    is_form = stem.endswith('-form')
    # Frame 1 is the relaxed standing pose. Locate the hair/hat in its upper
    # band, then retain a small transparent margin without moving any pixels.
    standing, standing_rect = bounds[1], frame_rects[1]
    fraction = (FORM_PORTRAIT_HEIGHT.get(ch, .205) if is_form else PORTRAIT_HEIGHT.get(ch, .205))
    band_height = min(standing[3], max(24, round(idle_height*fraction)))
    band_top = standing[1]
    band = mask.crop((standing_rect[0], standing_rect[1]+band_top,
                      standing_rect[0]+standing_rect[2], standing_rect[1]+band_top+band_height))
    head_box = band.getbbox()
    if head_box is None:
        raise ValueError(f'{stem}: standing head band is empty')
    pad = max(2, round(idle_height*.012))
    center_x = (head_box[0]+head_box[2])/2
    crop_width = min(standing_rect[2], max(head_box[2]-head_box[0]+pad*2, round(band_height*.76)))
    crop_left = min(standing_rect[2]-crop_width, max(0, round(center_x-crop_width/2)))
    crop_top = max(0, band_top-pad)
    crop_height = min(standing_rect[3]-crop_top, band_height+pad*2)
    if is_form and ch=='jane':
        # EVA's wind-blown hair reaches far behind the helmet. Frame the face
        # and crown rather than letting that long silhouette shrink the head.
        crop_width=min(standing_rect[2],round(idle_height*.27))
        center_x=standing[0]+standing[2]*.60
        crop_left=min(standing_rect[2]-crop_width,max(0,round(center_x-crop_width/2)))
    if is_form and ch=='tubarao':
        # A dorsal fin is not the top of an aquatic shark's face. The snout and
        # lower jaw are lower and toward the forward (right) side of this pose.
        crop_width=min(standing_rect[2],round(idle_height*.54))
        center_x=standing[0]+standing[2]*.70
        crop_left=min(standing_rect[2]-crop_width,max(0,round(center_x-crop_width/2)))
        crop_top=max(0,standing[1]+round(standing[3]*.14)-pad)
        crop_height=min(standing_rect[3]-crop_top,round(idle_height*.32)+pad*2)
    portrait_rect=[standing_rect[0]+crop_left, standing_rect[1]+crop_top, crop_width, crop_height]
    portrait_alpha=np.array(image.getchannel('A').crop((portrait_rect[0],portrait_rect[1],portrait_rect[0]+portrait_rect[2],portrait_rect[1]+portrait_rect[3])))
    return {
        'ch': ch, 'src': stem+'.webp', 'width': width, 'height': height,
        'columns': COLUMNS, 'rows': ROWS, 'geometryVersion': GEOMETRY_VERSION,
        'columnEdges':column_edges, 'rowEdges':row_edges,
        'frameRects': frame_rects, 'bounds': bounds, 'baselines': baselines,
        'idleHeight': idle_height,
        'portraitRect': portrait_rect,
        'portraitOpaquePixels':int(np.count_nonzero(portrait_alpha>128)),
        'provenanceVersion':PROVENANCE_VERSION,'portraitVersion':PORTRAIT_VERSION,
        **({'packing':image.info['packing']} if 'packing' in image.info else {}),
    }


def pack_figures(image: Image.Image, stem: str) -> Image.Image:
    """Pack the twelve complete illustrated silhouettes into isolated atlas cells.

    Only asset slicing/packing is performed: source colours and figure alpha are
    retained. Connected silhouettes identify swords/coats crossing nominal grid
    edges, so those parts are not clipped or copied into a neighbouring pose.
    """
    rgba=np.array(image)
    labels,count=ndi.label(rgba[:,:,3]>128,np.ones((3,3),dtype=bool))
    areas=np.bincount(labels.ravel())
    major=sorted(range(1,count+1),key=lambda n:areas[n],reverse=True)[:12]
    if len(major)!=12 or min(areas[n] for n in major)<1000:
        raise ValueError(f'{stem}: expected twelve separate full character silhouettes')
    slices=ndi.find_objects(labels)
    def center(n):
        sl=slices[n-1];return ((sl[0].start+sl[0].stop)/2,(sl[1].start+sl[1].stop)/2)
    ordered=sorted(major,key=lambda n:center(n)[0])
    ordered=[n for row in range(3) for n in sorted(ordered[row*4:row*4+4],key=lambda n:center(n)[1])]
    seeds=np.zeros(labels.shape,dtype=np.uint8)
    for i,n in enumerate(ordered):seeds[labels==n]=i+1
    _,nearest=ndi.distance_transform_edt(seeds==0,return_indices=True)
    ownership=seeds[tuple(nearest)]
    boxes=[]
    for i in range(12):
        mask=(ownership==i+1)&(rgba[:,:,3]>16)
        ys,xs=np.nonzero(mask)
        boxes.append((int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)))
    origins=[0]+[round((max(b[3] for b in boxes[(r-1)*4:r*4])+min(b[1] for b in boxes[r*4:r*4+4]))/2)for r in [1,2]]
    pad=10;w=image.width;max_x=max(max(abs(b[0]-(i%4+.5)*w/4),abs(b[2]-(i%4+.5)*w/4))for i,b in enumerate(boxes))
    cell_w=int(math.ceil(max_x*2))+pad*2
    min_y=min(boxes[i][1]-origins[i//4]for i in range(12));offset_y=pad-min(0,min_y)
    cell_h=max(boxes[i][3]-origins[i//4]+offset_y for i in range(12))+pad
    result=Image.new('RGBA',(cell_w*4,cell_h*3))
    for i,b in enumerate(boxes):
        left=max(0,b[0]-3);top=max(0,b[1]-3);right=min(w,b[2]+3);bottom=min(image.height,b[3]+3)
        piece=rgba[top:bottom,left:right].copy()
        own=ownership[top:bottom,left:right]==i+1
        piece[~own]=0
        target_x=round((i%4+.5)*cell_w+left-(i%4+.5)*w/4)
        target_y=i//4*cell_h+top-origins[i//4]+offset_y
        result.paste(Image.fromarray(piece),(target_x,target_y))
    source_visible=int(np.count_nonzero(rgba[:,:,3]>ALPHA_THRESHOLD))
    packed_alpha=np.array(result.getchannel('A'))
    packed_visible=int(np.count_nonzero(packed_alpha>ALPHA_THRESHOLD))
    if source_visible!=packed_visible:
        raise ValueError(f'{stem}: packing changed visible alpha pixel count ({source_visible} to {packed_visible})')
    result.info['packing']={
        'method':'alpha128-largest12-nearest-seed',
        'sourceSize':[image.width,image.height],
        'sourceFigureRects':[rect_from_bbox(b)for b in boxes],
        'sourceSeedAreas':[int(areas[n])for n in ordered],
        'sourceSeedCenters':[[float(center(n)[1]),float(center(n)[0])]for n in ordered],
        'sourceVisiblePixels':source_visible,
        'packedVisiblePixels':packed_visible,
        'sourceOpaquePixels':int(np.count_nonzero(rgba[:,:,3]>128)),
        'packedOpaquePixels':int(np.count_nonzero(packed_alpha>128)),
    }
    if result.info['packing']['sourceOpaquePixels']!=result.info['packing']['packedOpaquePixels']:
        raise ValueError(f'{stem}: packing changed opaque pixel count')
    return result


def encode(source: Path, output: Path) -> tuple[dict,int]:
    # A copy detaches from the decoder; convert only standardises channel layout.
    with Image.open(source) as original:
        image = pack_figures(original.convert('RGBA'),source.stem)
    meta = atlas_geometry(image,source.stem)
    fd, temporary = tempfile.mkstemp(prefix='.sprite-',suffix='.tmp',dir=output)
    os.close(fd)
    try:
        image.save(temporary,format='WEBP',quality=92,method=6,lossless=False,exact=True,alpha_quality=100)
        with Image.open(temporary) as encoded:
            if encoded.size != image.size:
                raise ValueError(f'{source.name}: encoder changed atlas geometry')
            if encoded.convert('RGBA').getchannel('A').tobytes() != image.getchannel('A').tobytes():
                raise ValueError(f'{source.name}: alpha plane changed during encoding')
        target = output/(source.stem+'.webp')
        os.replace(temporary,target)
    finally:
        Path(temporary).unlink(missing_ok=True)
    meta['encodedSha256']=hashlib.sha256(target.read_bytes()).hexdigest()
    return meta,target.stat().st_size


def main() -> None:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path,default=DEFAULT_SOURCE)
    parser.add_argument('--output',type=Path,default=DEFAULT_OUTPUT)
    parser.add_argument('--only',nargs='*',help='Atlas stems to process, e.g. rickzera rickzera-form')
    args=parser.parse_args()
    if not features.check('webp'):
        parser.error('Pillow must have WebP encoder support')
    if not args.source.is_dir():
        parser.error(f'Source directory does not exist: {args.source}')
    args.output.mkdir(parents=True,exist_ok=True)
    manifest_path=args.output/'manifest.json'
    manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {'version':1,'poses':POSES,'atlases':{}}
    if manifest.get('version') != 1 or manifest.get('poses') != POSES:
        raise ValueError('Existing manifest uses an incompatible atlas schema')
    sources=sorted(args.source.glob('*.png'))
    if args.only is not None:
        wanted=set(args.only);sources=[p for p in sources if p.stem in wanted]
        missing=wanted-{p.stem for p in sources}
        if missing:parser.error('Missing source atlases: '+', '.join(sorted(missing)))
    if not sources:
        parser.error('No PNG atlases found')
    for source in sources:
        if source.stem.removesuffix('-form') not in CHARS:
            print(f'Skipped unknown atlas name: {source.name}')
            continue
        source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
        previous=manifest['atlases'].get(source.stem)
        if previous and previous.get('sourceSha256')==source_hash and previous.get('geometryVersion')==GEOMETRY_VERSION and previous.get('provenanceVersion')==PROVENANCE_VERSION and previous.get('portraitVersion')==PORTRAIT_VERSION and (args.output/(source.stem+'.webp')).is_file():
            print(f'{source.stem}: unchanged')
            continue
        target=args.output/(source.stem+'.webp')
        if previous and previous.get('sourceSha256')==source_hash and previous.get('geometryVersion')==GEOMETRY_VERSION and target.is_file():
            # Add validation/provenance to an already packed v3 atlas without
            # lossy re-encoding, and prove its alpha matches the same packing.
            with Image.open(source) as im:
                packed=pack_figures(im.convert('RGBA'),source.stem)
            with Image.open(target) as encoded:
                if encoded.size!=packed.size or encoded.convert('RGBA').getchannel('A').tobytes()!=packed.getchannel('A').tobytes():
                    raise ValueError(f'{source.name}: existing packed atlas does not match source alpha')
            entry=atlas_geometry(packed,source.stem)
            entry['encodedSha256']=hashlib.sha256(target.read_bytes()).hexdigest()
            size=target.stat().st_size
        else:
            entry,size=encode(source,args.output)
        entry['sourceSha256']=source_hash
        manifest['atlases'][source.stem]=entry
        print(f'{source.stem}: {entry["width"]}×{entry["height"]}, 12 frames, baseline {entry["baselines"]}, idle {entry["idleHeight"]}, {size:,} bytes')
    manifest['alphaThreshold']=ALPHA_THRESHOLD
    manifest['atlases']=dict(sorted(manifest['atlases'].items()))
    temporary=manifest_path.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(manifest,indent=2)+'\n')
    os.replace(temporary,manifest_path)
    print(f'Manifest: {manifest_path} ({len(manifest["atlases"])} atlases)')


if __name__=='__main__':main()
