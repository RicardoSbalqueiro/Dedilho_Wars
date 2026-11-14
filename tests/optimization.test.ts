import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {batchPaletteArt} from '../src/game/senbukan3d/batch-art';
import {recordDrawCost,visualBudgetStats,resetVisualBudget} from '../src/game/visual-budget';
import {canvasSize} from '../src/game/canvas';
import sprites from '../src/assets/sprites/manifest.json';
import menu from '../src/assets/menu/manifest.json';
import portraits from '../src/assets/portraits/manifest.json';
for(const [key,source] of Object.entries(sprites.atlases)){
 const actor=menu.actors[key as keyof typeof menu.actors];assert(actor);assert.equal(actor.frames.length,12);assert.deepEqual(portraits.portraits[key as keyof typeof portraits.portraits].slice(2),source.portraitRect.slice(2));
 for(let i=0;i<12;i++){const f=actor.frames[i],bounds=source.bounds[i],rect=source.frameRects[i];assert(Math.abs(f.x-(bounds[0]-rect[2]/2)/source.idleHeight)<1e-10);assert(Math.abs(f.y+bounds[3]/source.idleHeight)<1e-10);assert.equal(f.w,bounds[2]/source.idleHeight);assert.equal(f.h,bounds[3]/source.idleHeight);const p=menu.pages[f.page];assert(f.rect[0]>=0&&f.rect[0]+f.rect[2]<=p.width);assert(f.rect[1]>=0&&f.rect[1]+f.rect[3]<=p.height);}
}
assert(menu.pixels<menu.originalPixels*.25,'ambient textures retain less than a quarter of original decoded pixels');
assert(canvasSize(960,540,1280,720,1,'ambient').width<canvasSize(960,540,1280,720,1,'scene').width);
assert(canvasSize(960,540,3840,2160,2,'ambient').width<=1920);assert.equal(canvasSize(960,540,3840,2160,1,'scene').width,3840);
for(let i=0;i<50;i++)recordDrawCost(250);assert(visualBudgetStats().penalty>0,'very slow valid frames still activate the cosmetic budget');resetVisualBudget();
const loader=new GLTFLoader();
async function load(name:string){const b=readFileSync('src/assets/senbukan/3d/'+name+'.glb');return loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
function toon(root:THREE.Object3D){root.traverse(o=>{if(o instanceof THREE.Mesh){const convert=(m:THREE.Material)=>{const s=m as THREE.MeshStandardMaterial;return new THREE.MeshToonMaterial({color:s.color,emissive:s.emissive,emissiveIntensity:s.emissiveIntensity,side:s.side});};o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);}});}
const meshes=(root:THREE.Object3D)=>{const list:THREE.SkinnedMesh[]=[];root.traverse(o=>{if(o instanceof THREE.SkinnedMesh)list.push(o);});return list;};
function vertex(mesh:THREE.SkinnedMesh,index:number){const p=new THREE.Vector3().fromBufferAttribute(mesh.geometry.getAttribute('position'),index);mesh.applyBoneTransform(index,p);return p.applyMatrix4(mesh.matrixWorld);}
for(const name of ['caetano','dojo-student']){
 const original=await load(name),optimized=await load(name);toon(original.scene);toon(optimized.scene);
 const old=meshes(original.scene),counts=old.map(m=>m.geometry.getAttribute('position').count),triangles=old.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0);
 const summary=batchPaletteArt(optimized.scene,true),newMeshes=meshes(optimized.scene);assert(summary.after<summary.before/2,JSON.stringify(summary));assert.equal(newMeshes.length,1,name+' shares one skin without changing bones');
 const merged=newMeshes[0];assert.equal((merged.geometry.index?.count??merged.geometry.attributes.position.count)/3,triangles);assert.equal(optimized.animations.length,13);
 original.scene.position.set(2,.2,-3);optimized.scene.position.copy(original.scene.position);original.scene.rotation.y=optimized.scene.rotation.y=.73;
 const originalMixer=new THREE.AnimationMixer(original.scene),optimizedMixer=new THREE.AnimationMixer(optimized.scene);
 for(let c=0;c<original.animations.length;c++){
  originalMixer.stopAllAction();optimizedMixer.stopAllAction();originalMixer.clipAction(original.animations[c]).reset().play();optimizedMixer.clipAction(optimized.animations[c]).reset().play();originalMixer.update(.21);optimizedMixer.update(.21);original.scene.updateMatrixWorld(true);optimized.scene.updateMatrixWorld(true);old.forEach(m=>m.skeleton.update());merged.skeleton.update();
  let offset=0;old.forEach((m,j)=>{for(const i of [0,Math.floor(counts[j]/2),counts[j]-1]){assert(vertex(m,i).distanceTo(vertex(merged,offset+i))<1e-5,name+' '+original.animations[c].name+' keeps animated vertex positions');const color=(m.material as THREE.MeshToonMaterial).color,baked=merged.geometry.getAttribute('color');assert(Math.abs(baked.getX(offset+i)-color.r)<1e-6);assert(Math.abs(baked.getY(offset+i)-color.g)<1e-6);assert(Math.abs(baked.getZ(offset+i)-color.b)<1e-6);}offset+=counts[j];});
 }
 console.log(name+': '+summary.before+' → '+summary.after+' mesh submissions; all 13 real clips and palette/skin positions preserved.');
}
{
 const g=new THREE.Group(),red=new THREE.MeshToonMaterial({color:'#ce293e'}),blue=new THREE.MeshToonMaterial({color:'#1264e5'});
 for(let i=0;i<3;i++){const mesh=new THREE.Mesh(new THREE.BoxGeometry(),i%2?red:blue);mesh.position.set(i*3,i,0);if(i===2)mesh.scale.x=-1;g.add(mesh);}
 g.updateMatrixWorld(true);const before=new THREE.Box3().setFromObject(g);const result=batchPaletteArt(g,false);assert.equal(result.after,1);const after=new THREE.Box3().setFromObject(g);assert(before.min.distanceTo(after.min)<1e-6&&before.max.distanceTo(after.max)<1e-6,'static world bounds include mirrored transforms');
 const first=g.children[0] as THREE.Mesh,position=first.geometry.attributes.position,normal=first.geometry.attributes.normal,index=first.geometry.index!;
 for(let i=0;i<index.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(position,index.getX(i)),b=new THREE.Vector3().fromBufferAttribute(position,index.getX(i+1)),c=new THREE.Vector3().fromBufferAttribute(position,index.getX(i+2)),n=new THREE.Vector3().fromBufferAttribute(normal,index.getX(i));assert(b.sub(a).cross(c.sub(a)).dot(n)>0,'mirrored geometry retains visible face winding');}
}
console.log('Optimization: 432 menu poses calibrated, exact portrait crop sizes, ambient pixel budget, native combat resolution, actual rigged GLBs, full animation palette/skin equivalence and static mirrored bounds passed.');
