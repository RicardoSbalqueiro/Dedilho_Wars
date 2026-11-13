#!/usr/bin/env python3
"""Pack newly illustrated animation bridges and movement cutouts.

Source art is generated separately. This step copies complete figures, preserves
their alpha pixels, pads them and encodes WebP; it never invents or warps poses.
Each page has twelve base and twelve transformed drawings.
"""
from pathlib import Path
import argparse, hashlib, importlib.util, json, os
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('action_assets', ROOT/'scripts/action-assets.py')
art = importlib.util.module_from_spec(spec)
spec.loader.exec_module(art)
MOVES = ['pL', 'pM', 'pH', 'kL', 'kM', 'kH']
SUPPORT = ['dashPush', 'dashStrideA', 'dashStrideB', 'dashBrake',
           'jumpRise', 'jumpApex', 'jumpFall', 'land',
           'guardEnter', 'guardBrace', 'guardLow', 'guardBreak']

def pack(path, output):
    ch, page = path.stem.rsplit('-', 1)
    if ch not in art.CHARS or page not in ['support', 'bridges']:
        raise ValueError('Unknown animation page: '+path.stem)
    image = Image.open(path).convert('RGBA')
    pixels = np.asarray(image)
    if (pixels[:, :, 3] < 8).mean() < .3:
        raise ValueError('Source must have a transparent background')
    figures, geometry, seeds = art.complete_figures(pixels, 24, 4)
    cw, rh = max(f.width for f in figures)+16, max(f.height for f in figures)+16
    atlas = Image.new('RGBA', (cw*4, rh*6))
    frames, hashes = [], []
    for i, figure in enumerate(figures):
        row, col = divmod(i, 4)
        x, y = col*cw+(cw-figure.width)//2, row*rh+rh-8-figure.height
        atlas.paste(figure, (x, y))
        frames.append({'rect':[x,y,figure.width,figure.height], **geometry[i]})
        hashes.append(hashlib.sha256(figure.tobytes()).hexdigest())
    if len(set(hashes)) != 24:
        raise ValueError('A page must contain 24 distinct drawings')
    refs = [float(np.median([g['height'] for g in geometry[i:i+12]])) for i in [0,12]]
    for i, frame in enumerate(frames):
        frame['referenceHeight'] = refs[i//12]
    visible = int(np.count_nonzero(pixels[:, :, 3] > 48))
    if int(np.count_nonzero(np.asarray(atlas)[:, :, 3] > 48)) != visible:
        raise ValueError('Packing changed source visible pixels')
    target = output/('flow-'+path.stem+'.webp')
    atlas.save(target, 'WEBP', quality=72, method=6, exact=True, alpha_quality=100)
    with Image.open(target) as encoded:
        if encoded.convert('RGBA').getchannel('A').tobytes() != atlas.getchannel('A').tobytes():
            raise ValueError('Encoding changed alpha pixels')
    return {'ch':ch, 'kind':page, 'src':target.name, 'width':atlas.width,
            'height':atlas.height, 'columns':4, 'rows':6, 'formOffset':12,
            'sourceDrawings':24, 'frames':frames, 'frameHashes':hashes,
            'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),
            'encodedSha256':hashlib.sha256(target.read_bytes()).hexdigest(),
            'packing':{'sourceVisiblePixels':visible, 'packedVisiblePixels':visible,
                       'method':'complete-alpha128-nearest-seed', 'seedAreas':seeds},
            'encoding':{'format':'webp', 'quality':72, 'alpha':'lossless'}}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=Path('/workspace/work/animation-plus/raw'))
    parser.add_argument('--output', type=Path, default=ROOT/'src/assets/flow')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    target = args.output/'manifest.json'
    manifest = json.loads(target.read_text()) if target.exists() else {
        'version':1, 'formOffset':12, 'bridgeMoves':MOVES, 'supportPoses':SUPPORT, 'atlases':{}}
    failures = []
    for path in sorted(args.source.glob('*.png')):
        old = manifest['atlases'].get(path.stem)
        sha = hashlib.sha256(path.read_bytes()).hexdigest()
        if old and old['sourceSha256'] == sha and (args.output/old['src']).is_file():
            continue
        try:
            entry = pack(path, args.output)
        except Exception as exc:
            failures.append(path.stem)
            print('ERROR', path.stem, str(exc), flush=True)
            continue
        manifest['atlases'][path.stem] = entry
        print(path.stem, '24 new drawings', (args.output/entry['src']).stat().st_size, flush=True)
    manifest['atlases'] = dict(sorted(manifest['atlases'].items()))
    manifest['totalDrawings'] = sum(a['sourceDrawings'] for a in manifest['atlases'].values())
    tmp = target.with_suffix('.json.tmp')
    tmp.write_text(json.dumps(manifest, indent=2)+'\n')
    os.replace(tmp, target)
    print(json.dumps({'atlases':len(manifest['atlases']), 'drawings':manifest['totalDrawings'], 'failed':failures}))

if __name__ == '__main__':
    main()
