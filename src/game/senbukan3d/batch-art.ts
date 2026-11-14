import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
/** Bake solid palette colors into vertices so compatible surfaces can share one
 * draw call. Positions, skin weights, skeletons, clips and lighting are retained.
 * Textured/morphed/partial meshes are left alone. */
export function batchPaletteArt(root:THREE.Object3D,skinned:boolean){
 root.updateMatrixWorld(true);const inverseRoot=root.matrixWorld.clone().invert();
 const groups=new Map<string,THREE.Mesh[]>(),replaced=new Set<THREE.Material>();let before=0,after=0;
 root.traverse(object=>{
  if(!(object instanceof THREE.Mesh)||object instanceof THREE.InstancedMesh)return;before++;
  const skin=object instanceof THREE.SkinnedMesh;
  if(skin!==skinned||Array.isArray(object.material)||!(object.material instanceof THREE.MeshToonMaterial)||object.children.length||Object.keys(object.geometry.morphAttributes).length)return;
  const m:THREE.MeshToonMaterial=object.material,g:THREE.BufferGeometry=object.geometry;
  if(g.getAttribute('color')?.itemSize===4||m.map||m.alphaMap||m.emissiveMap||m.normalMap||m.bumpMap||m.displacementMap||!g.attributes.position||g.drawRange.start!==0||Number.isFinite(g.drawRange.count))return;
  const layout=Object.entries(g.attributes).sort(([a],[b])=>a.localeCompare(b)).filter(([name])=>name!=='color').map(([name,a])=>`${name}:${a.itemSize}:${a.array.constructor.name}:${a.normalized}`).join('|');
  const key=[m.side,m.transparent,m.opacity,m.alphaTest,m.depthTest,m.depthWrite,m.blending,m.toneMapped,m.fog,'flatShading' in m?m.flatShading:false,m.wireframe,m.emissive.r,m.emissive.g,m.emissive.b,m.emissiveIntensity,m.gradientMap?.uuid,!!g.index,layout,
   skin?object.parent?.uuid:'world',skin?object.matrix.elements.join(','):'',skin?object.skeleton.uuid:'',skin?object.bindMatrix.elements.join(','):'',object.renderOrder,object.castShadow,object.receiveShadow].join(';');
  const group=groups.get(key)??[];group.push(object);groups.set(key,group);
 });
 for(const meshes of groups.values()){
  if(meshes.length<2)continue;
  const geometries=meshes.map(mesh=>{
   const g=mesh.geometry.clone(),m=mesh.material as THREE.MeshToonMaterial,positions=g.getAttribute('position'),prior=g.getAttribute('color'),values=new Float32Array(positions.count*3);
   for(let i=0;i<positions.count;i++){values[i*3]=m.color.r*(m.vertexColors&&prior?prior.getX(i):1);values[i*3+1]=m.color.g*(m.vertexColors&&prior?prior.getY(i):1);values[i*3+2]=m.color.b*(m.vertexColors&&prior?prior.getZ(i):1);}
   g.setAttribute('color',new THREE.BufferAttribute(values,3));
   if(!skinned){const matrix=inverseRoot.clone().multiply(mesh.matrixWorld);g.applyMatrix4(matrix);if(matrix.determinant()<0)reverseWinding(g);}
   return g;
  });
  const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!merged)continue;
  merged.computeBoundingBox();merged.computeBoundingSphere();const first=meshes[0],material=(first.material as THREE.MeshToonMaterial).clone();material.color.set(0xffffff);material.vertexColors=true;
  let result:THREE.Mesh;
  if(first instanceof THREE.SkinnedMesh){const mesh=new THREE.SkinnedMesh(merged,material);mesh.bind(first.skeleton,first.bindMatrix);mesh.bindMode=first.bindMode;mesh.position.copy(first.position);mesh.quaternion.copy(first.quaternion);mesh.scale.copy(first.scale);mesh.frustumCulled=false;result=mesh;first.parent!.add(result);}
  else{result=new THREE.Mesh(merged,material);root.add(result);}
  result.name='Palette batch';result.castShadow=first.castShadow;result.receiveShadow=first.receiveShadow;result.renderOrder=first.renderOrder;
  meshes.forEach(mesh=>{replaced.add(mesh.material as THREE.Material);mesh.removeFromParent();});
  // Original buffers have never been uploaded; free their renderer resources if
  // the same helper is used after a scene has already been painted.
  const stillUsed=new Set<THREE.BufferGeometry>();root.traverse(o=>{if(o instanceof THREE.Mesh)stillUsed.add(o.geometry);});
  for(const mesh of meshes)if(!stillUsed.has(mesh.geometry))mesh.geometry.dispose();
 }
 root.updateMatrixWorld(true);const kept=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh){after++;for(const m of Array.isArray(o.material)?o.material:[o.material])kept.add(m);}});for(const m of replaced)if(!kept.has(m))m.dispose();return {before,after};
}
function reverseWinding(g:THREE.BufferGeometry){
 const indices=g.getIndex();if(indices){for(let i=0;i<indices.count;i+=3){const b=indices.getX(i+1);indices.setX(i+1,indices.getX(i+2));indices.setX(i+2,b);}return;}
 for(const a of Object.values(g.attributes))for(let i=0;i<a.count;i+=3)for(let k=0;k<a.itemSize;k++){const b=a.getComponent(i+1,k);a.setComponent(i+1,k,a.getComponent(i+2,k));a.setComponent(i+2,k,b);}
}
