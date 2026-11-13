import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import type {GLTF} from 'three/addons/loaders/GLTFLoader.js';
import caetanoUrl from '../../assets/senbukan/3d/caetano.glb?url';
import studentUrl from '../../assets/senbukan/3d/dojo-student.glb?url';
import dojoUrl from '../../assets/senbukan/3d/dojo.glb?url';
import {audio} from '../audio';
import {ArenaInput} from './input';
import {FLOOR_Y,STEP,SenbukanSim} from './sim';
import type {ArenaEvent,Fighter} from './sim';

type Model={root:THREE.Group;mixer:THREE.AnimationMixer;actions:Map<string,THREE.AnimationAction>;clip:string;serial:number;glow:THREE.Group;marker:THREE.Mesh};
type Spark={x:number;y:number;z:number;vx:number;vy:number;vz:number;age:number;life:number;size:number;color:THREE.Color};
type Ring={mesh:THREE.Mesh<THREE.TorusGeometry,THREE.MeshBasicMaterial>;age:number;life:number;size:number};
const lerpAngle=(a:number,b:number,t:number)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
const temp=new THREE.Object3D();
export class SenbukanScene {
 readonly sim=new SenbukanSim();readonly input:ArenaInput;
 readonly renderer:THREE.WebGLRenderer;readonly scene=new THREE.Scene();readonly camera=new THREE.PerspectiveCamera(53,1,.08,120);
 readonly models:Model[]=[];
 ready=false;disposed=false;frames=0;azimuth=Math.PI;quality:'auto'|'low'='auto';
 private abort=new AbortController();private raf=0;private last=0;private accumulator=0;private clock=0;private hudTime=0;private lastEvent=0;
 private observer:ResizeObserver;private sparks:Spark[]=[];private rings:Ring[]=[];private shotModels=new Map<number,THREE.Group>();
 private particles:THREE.InstancedMesh;private gradient:THREE.DataTexture;private cachedMaterials=new Map<THREE.Material,THREE.Material>();
 private orbit=0;private pitch=.25;private distance=6.3;private drag:{id:number;x:number;y:number}|null=null;private shake=0;private cameraReady=false;
 private size={w:0,h:0,dpr:0};private contextLost=false;private adaptiveScale=1;private slowTime=0;private slowFrames=0;private reducedMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
 constructor(readonly canvas:HTMLCanvasElement,private notify:()=>void,command:(command:'pause'|'restart'|'lock')=>void,private failed:(reason:string)=>void){
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:!matchMedia('(pointer:coarse)').matches,powerPreference:'high-performance',alpha:false});
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.0;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.scene.background=new THREE.Color('#100e26');this.scene.fog=new THREE.Fog('#211333',28,90);
  this.scene.add(new THREE.HemisphereLight('#ddd5ff','#584040',1.4));
  const sun=new THREE.DirectionalLight('#ffe1b0',2.2);sun.position.set(-4,10,-4);sun.castShadow=true;
  sun.shadow.mapSize.set(matchMedia('(pointer:coarse)').matches?512:1024,matchMedia('(pointer:coarse)').matches?512:1024);sun.shadow.camera.left=-11;sun.shadow.camera.right=11;sun.shadow.camera.top=11;sun.shadow.camera.bottom=-11;sun.shadow.normalBias=.035;sun.shadow.bias=-.0002;
  this.scene.add(sun);this.scene.add(sun.target);
  const rim=new THREE.DirectionalLight('#b76aff',1.4);rim.position.set(2,4,9);this.scene.add(rim);
  const steps=new Uint8Array([80,145,210,255]);this.gradient=new THREE.DataTexture(steps,4,1,THREE.RedFormat);this.gradient.minFilter=THREE.NearestFilter;this.gradient.magFilter=THREE.NearestFilter;this.gradient.needsUpdate=true;
  this.particles=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.06,0),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false,transparent:true,opacity:.9}),120);
  this.particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.particles.frustumCulled=false;this.particles.count=0;this.scene.add(this.particles);
  this.input=new ArenaInput(canvas,command);this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);
  canvas.addEventListener('pointerdown',this.pointerDown);canvas.addEventListener('pointermove',this.pointerMove);canvas.addEventListener('pointerup',this.pointerUp);canvas.addEventListener('pointercancel',this.pointerUp);
  canvas.addEventListener('contextmenu',this.contextMenu);canvas.addEventListener('wheel',this.wheel,{passive:false});canvas.addEventListener('webglcontextlost',this.lost);
  this.resize();this.raf=requestAnimationFrame(this.frame);
 }
 async load(progress:(loaded:number)=>void){
  const loader=new GLTFLoader();let completed=0;
  const get=async(url:string)=>{const response=await fetch(url,{signal:this.abort.signal});if(!response.ok)throw new Error('Não foi possível carregar os modelos 3D.');const data=await response.arrayBuffer();const gltf=await loader.parseAsync(data,'');progress(++completed/3);return gltf;};
  const loaded=await Promise.all([get(dojoUrl),get(caetanoUrl),get(studentUrl)]);
  if(this.disposed){loaded.forEach(g=>this.disposeObject(g.scene));return;}
  this.toon(loaded[0].scene,false);this.scene.add(loaded[0].scene);
  for(const g of loaded.slice(1))this.models.push(this.makeModel(g));
  // A clean, thin ring makes the playable floor and selected target readable.
  const edge=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
   new THREE.Vector3(-8.5,FLOOR_Y+.005,-8.5),new THREE.Vector3(8.5,FLOOR_Y+.005,-8.5),new THREE.Vector3(8.5,FLOOR_Y+.005,8.5),new THREE.Vector3(-8.5,FLOOR_Y+.005,8.5)
  ]),new THREE.LineBasicMaterial({color:'#bb7b45',transparent:true,opacity:.45}));this.scene.add(edge);
  this.ready=true;this.notify();
 }
 private toon(root:THREE.Object3D,character:boolean){
  root.traverse(object=>{
   if(!(object instanceof THREE.Mesh))return;
   object.castShadow=character;object.receiveShadow=true;object.frustumCulled=!character;
   const convert=(old:THREE.Material)=>{
    const cached=this.cachedMaterials.get(old);if(cached)return cached;
    const src=old as THREE.MeshStandardMaterial;
    const material=new THREE.MeshToonMaterial({color:src.color??new THREE.Color('white'),emissive:src.emissive??new THREE.Color('black'),emissiveIntensity:src.emissiveIntensity??1,gradientMap:this.gradient,side:src.side});
    material.name=old.name;this.cachedMaterials.set(old,material);old.dispose();return material;
   };
   object.material=Array.isArray(object.material)?object.material.map(convert):convert(object.material);
  });
 }
 private makeModel(g:GLTF):Model {
  this.toon(g.scene,true);this.scene.add(g.scene);const mixer=new THREE.AnimationMixer(g.scene),actions=new Map<string,THREE.AnimationAction>();
  g.animations.forEach(c=>actions.set(c.name,mixer.clipAction(c)));
  const glow=new THREE.Group();
  for(let i=0;i<3;i++){
   const ring=new THREE.Mesh(new THREE.TorusGeometry(.6+i*.07,.012,4,40),new THREE.MeshBasicMaterial({color:i===1?'#fff3a0':'#ff8a0b',transparent:true,opacity:.7,toneMapped:false,depthWrite:false,blending:THREE.AdditiveBlending}));
   ring.rotation.x=Math.PI/2+i*.2;ring.position.y=.15+i*.62;glow.add(ring);
  }
  const marker=new THREE.Mesh(new THREE.RingGeometry(.42,.46,40),new THREE.MeshBasicMaterial({color:'#ffc258',side:THREE.DoubleSide,transparent:true,opacity:.8,depthWrite:false}));
  marker.rotation.x=-Math.PI/2;marker.position.y=.006;glow.visible=false;this.scene.add(glow,marker);
  return {root:g.scene,mixer,actions,clip:'',serial:-1,glow,marker};
 }
 private animate(model:Model,a:Fighter,dt:number,alpha:number){
  model.root.position.set(THREE.MathUtils.lerp(a.px,a.x,alpha),THREE.MathUtils.lerp(a.py,a.y,alpha),THREE.MathUtils.lerp(a.pz,a.z,alpha));
  model.root.rotation.y=lerpAngle(model.root.rotation.y,a.yaw,1-Math.exp(-20*dt));
  let clip='idle',progress:number|null=null;
  if(a.state==='attack'){clip=a.move==='special'?'punch3':a.move;progress=a.elapsed/a.duration;}
  else if(a.state==='down'){clip='down';progress=Math.min(1,(this.clock-this.koAt)/.8);}
  else if(a.state==='transform'){clip='transform';progress=a.elapsed/a.duration;}
  else if(a.state==='broken'){clip='hit';progress=.45;}
  else if(a.state==='hit'){clip='hit';progress=a.elapsed/a.duration;}
  else if(a.state==='dash'){clip='dash';progress=a.elapsed/a.duration;}
  else if(a.y>FLOOR_Y+.02){clip='jump';progress=THREE.MathUtils.clamp(.5-a.vy*.04,.1,.9);}
  else if(a.guarding){clip='guard';progress=.5+.07*Math.sin(this.clock*4);}
  else if(a.moving>.1)clip=a.moving>.65?'run':'walk';
  const action=model.actions.get(clip);
  if(action){
   if(model.clip!==clip||((a.state==='attack'||a.state==='transform'||a.state==='hit')&&model.serial!==a.serial)){
    const prior=model.actions.get(model.clip);action.reset().setEffectiveWeight(1).play();action.paused=true;
    if(prior&&prior!==action)prior.crossFadeTo(action,.085,false);
    model.clip=clip;model.serial=a.serial;
   }
   action.time=progress===null?(this.clock*(clip==='run'?1.2:1))%action.getClip().duration:THREE.MathUtils.clamp(progress,0,.999)*action.getClip().duration;
   model.mixer.update(dt);
  }
  model.glow.visible=a.prime>0;model.glow.position.copy(model.root.position);
  model.glow.children.forEach((ring,i)=>{ring.rotation.z=this.clock*(i%2?2:-2);ring.scale.setScalar(1+Math.sin(this.clock*7+i)*.12);});
  model.marker.position.set(a.x,FLOOR_Y+.012,a.z);model.marker.visible=a.id===1&&this.sim.lock&&a.hp>0;
 }
 private koAt=0;
 private effects(event:ArenaEvent){
  const color=event.kind==='block'?'#8edfff':event.kind==='immune'?'#ffe9a0':event.actor===0&&event.kind==='hit'?'#f7abff':'#ffb42e';
  const hit=['hit','break','prime','ko','block','immune'].includes(event.kind);
  const count=hit?Math.min(26,Math.round(event.power*11)):event.kind==='dash'?12:5;
  for(let i=0;i<count;i++){
   if(this.sparks.length>=120)this.sparks.shift();const angle=Math.random()*Math.PI*2,speed=1+Math.random()*event.power*4;
   this.sparks.push({x:event.x,y:event.y,z:event.z,vx:Math.cos(angle)*speed,vy:(Math.random()-.15)*speed,vz:Math.sin(angle)*speed,age:0,life:.3+Math.random()*.3,size:.6+Math.random(),color:new THREE.Color(color)});
  }
  if(['hit','break','prime','ko','block','land','jump','shot'].includes(event.kind)){
   let ring=this.rings.find(r=>r.age>=r.life);
   if(!ring&&this.rings.length<18){ring={mesh:new THREE.Mesh(new THREE.TorusGeometry(1,.018,4,48),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending})),age:0,life:0,size:1};this.rings.push(ring);this.scene.add(ring.mesh);}
   if(ring){ring.age=0;ring.life=event.kind==='prime'?.65:.32;ring.size=event.power;ring.mesh.material.color.set(color);ring.mesh.visible=true;ring.mesh.position.set(event.x,event.y,event.z);
    if(event.kind==='land'||event.kind==='jump'||event.kind==='prime')ring.mesh.rotation.set(-Math.PI/2,0,0);else ring.mesh.lookAt(event.x+event.nx,event.y,event.z+event.nz);
   }
  }
  if(event.kind==='hit'){this.shake=Math.max(this.shake,.045*event.power);audio.hit(Math.min(2,event.power));}
  else if(event.kind==='block'||event.kind==='immune')audio.block();
  else if(event.kind==='prime'||event.kind==='break'||event.kind==='ko'){this.shake=.14;audio.boom(1.2);}
  else if(event.kind==='swing'||event.kind==='dash'||event.kind==='shot')audio.whoosh(event.power);
  if(event.kind==='ko')this.koAt=this.clock;
 }
 private updateEffects(dt:number){
  for(const e of this.sim.events)if(e.id>this.lastEvent){this.lastEvent=e.id;this.effects(e);}
  this.sparks=this.sparks.filter(s=>s.age<s.life);
  this.sparks.forEach((s,i)=>{s.age+=dt;s.vy-=7*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;temp.position.set(s.x,s.y,s.z);temp.scale.setScalar(Math.max(.001,s.size*(1-s.age/s.life)));temp.updateMatrix();this.particles.setMatrixAt(i,temp.matrix);this.particles.setColorAt(i,s.color);});
  this.particles.count=this.sparks.length;this.particles.instanceMatrix.needsUpdate=true;if(this.particles.instanceColor)this.particles.instanceColor.needsUpdate=true;
  this.rings.forEach(r=>{r.age+=dt;r.mesh.visible=r.age<r.life;if(r.mesh.visible){r.mesh.scale.setScalar(.15+r.age/r.life*r.size);r.mesh.material.opacity=(1-r.age/r.life)*.8;}});
  const live=new Set(this.sim.shots.map(s=>s.id));
  this.shotModels.forEach((model,id)=>{if(!live.has(id)){this.scene.remove(model);this.disposeObject(model);this.shotModels.delete(id);}});
  for(const shot of this.sim.shots){
   let model=this.shotModels.get(shot.id);
   if(!model){model=new THREE.Group();const core=new THREE.Mesh(new THREE.SphereGeometry(.17,10,8),new THREE.MeshBasicMaterial({color:'#fff9c9',toneMapped:false}));const halo=new THREE.Mesh(new THREE.SphereGeometry(.29,10,8),new THREE.MeshBasicMaterial({color:'#ff9d13',transparent:true,opacity:.55,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false}));halo.scale.z=2.8;model.add(core,halo);this.shotModels.set(shot.id,model);this.scene.add(model);}
   model.position.set(shot.x,shot.y,shot.z);model.rotation.y=Math.atan2(shot.nx,shot.nz);
  }
 }
 private updateCamera(dt:number){
  const a=this.sim.fighters[0],b=this.sim.fighters[1];
  if(this.sim.lock){const ideal=Math.atan2(b.x-a.x,b.z-a.z);this.azimuth=lerpAngle(this.azimuth,ideal+this.orbit,1-Math.exp(-5*dt));}
  const forward=new THREE.Vector3(Math.sin(this.azimuth),0,Math.cos(this.azimuth));const right=new THREE.Vector3(forward.z,0,-forward.x);
  const pos=new THREE.Vector3(a.x,a.y+2.4+this.pitch*2,a.z).addScaledVector(forward,-this.distance).addScaledVector(right,1.35);
  pos.x=THREE.MathUtils.clamp(pos.x,-8.65,8.65);pos.z=THREE.MathUtils.clamp(pos.z,-8.65,8.65);pos.y=Math.max(2.3,Math.min(5.1,pos.y));
  const target=new THREE.Vector3(a.x,a.y+1.05,a.z).addScaledVector(forward,1.6);
  if(!this.cameraReady){this.camera.position.copy(pos);this.cameraReady=true;}else this.camera.position.lerp(pos,1-Math.exp(-10*dt));
  this.shake*=Math.exp(-15*dt);if(this.reducedMotion)this.shake=0;this.camera.position.x+=(Math.random()-.5)*this.shake;this.camera.position.y+=(Math.random()-.5)*this.shake;
  this.camera.lookAt(target);
 }
 private frame=(now:number)=>{
  if(this.disposed)return;this.raf=requestAnimationFrame(this.frame);const raw=this.last?(now-this.last)/1000:STEP,dt=Math.min(.12,raw);this.last=now;
  if(this.contextLost)return;
  if(this.ready&&this.sim.running&&this.quality==='auto'&&this.clock>3){this.slowTime+=Math.min(raw,.3);this.slowFrames++;if(this.slowFrames>=45){if(this.slowTime/this.slowFrames>.043&&this.adaptiveScale>.6){this.adaptiveScale=Math.max(.6,this.adaptiveScale*.85);this.renderer.shadowMap.enabled=false;this.size.w=0;this.resize();}this.slowTime=0;this.slowFrames=0;}}
  this.clock+=dt;
  if(this.ready){
   if(this.sim.running&&this.sim.winner===null){
    this.accumulator=Math.min(this.accumulator+dt,STEP*8);
    while(this.accumulator>=STEP){this.sim.step(this.input.frame(this.azimuth));this.accumulator-=STEP;}
   }else this.accumulator=0;
   const alpha=this.sim.running&&this.sim.winner===null?this.accumulator/STEP:1;
   this.updateEffects(dt);this.models.forEach((m,i)=>this.animate(m,this.sim.fighters[i],dt,alpha));this.updateCamera(dt);
   this.hudTime+=dt;if(this.hudTime>.085){this.hudTime=0;this.notify();}
  }
  this.renderer.render(this.scene,this.camera);this.frames++;
 };
 start(){this.sim.running=true;this.input.enabled=true;this.input.focus();this.last=0;}
 pause(){this.sim.running=false;this.input.enabled=false;this.input.clear();this.accumulator=0;this.notify();}
 restart(){this.sim.reset();this.lastEvent=0;this.koAt=this.clock;this.cameraReady=false;this.azimuth=Math.PI;this.orbit=0;this.sparks=[];this.rings.forEach(r=>r.age=r.life);this.start();this.notify();}
 toggleLock(){this.sim.lock=!this.sim.lock;this.orbit=0;this.notify();}
 setQuality(q:'auto'|'low'){this.quality=q;this.adaptiveScale=1;this.slowTime=0;this.slowFrames=0;this.renderer.shadowMap.enabled=q!=='low';this.size.w=0;this.resize();}
 private resize(){
  const w=Math.max(1,this.canvas.clientWidth),h=Math.max(1,this.canvas.clientHeight),mobile=matchMedia('(pointer:coarse)').matches;
  const cap=this.quality==='low'?1:mobile?1.5:1.75;const pixelBudget=this.quality==='low'?850000:mobile?1600000:3200000;
  const dpr=Math.min(devicePixelRatio||1,cap,Math.sqrt(pixelBudget/(w*h)))*this.adaptiveScale;
  if(w===this.size.w&&h===this.size.h&&dpr===this.size.dpr)return;
  this.size={w,h,dpr};this.renderer.setPixelRatio(dpr);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.fov=w<h?65:53;this.camera.updateProjectionMatrix();
 }
 private pointerDown=(e:PointerEvent)=>{if(e.button!==0&&e.button!==2)return;this.drag={id:e.pointerId,x:e.clientX,y:e.clientY};this.canvas.setPointerCapture(e.pointerId);this.input.focus();};
 private pointerMove=(e:PointerEvent)=>{if(this.drag?.id!==e.pointerId)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;this.drag.x=e.clientX;this.drag.y=e.clientY;this.orbit-=dx*.007;this.pitch=THREE.MathUtils.clamp(this.pitch+dy*.004,-.2,1.2);if(!this.sim.lock)this.azimuth-=dx*.007;};
 private pointerUp=(e:PointerEvent)=>{if(this.drag?.id===e.pointerId){this.drag=null;if(this.canvas.hasPointerCapture(e.pointerId))this.canvas.releasePointerCapture(e.pointerId);}};
 private contextMenu=(e:Event)=>e.preventDefault();
 private wheel=(e:WheelEvent)=>{e.preventDefault();this.distance=THREE.MathUtils.clamp(this.distance+e.deltaY*.005,3.5,9);};
 private lost=(e:Event)=>{e.preventDefault();this.contextLost=true;this.pause();this.failed('O navegador interrompeu o 3D. Recarregue o treino para continuar.');};
 private disposeObject(root:THREE.Object3D){root.traverse(obj=>{if(obj instanceof THREE.Mesh||obj instanceof THREE.Line){obj.geometry.dispose();const mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(m=>m.dispose());}});}
 dispose(){
  this.disposed=true;cancelAnimationFrame(this.raf);this.abort.abort();this.observer.disconnect();this.input.dispose();
  this.canvas.removeEventListener('pointerdown',this.pointerDown);this.canvas.removeEventListener('pointermove',this.pointerMove);this.canvas.removeEventListener('pointerup',this.pointerUp);this.canvas.removeEventListener('pointercancel',this.pointerUp);
  this.canvas.removeEventListener('contextmenu',this.contextMenu);this.canvas.removeEventListener('wheel',this.wheel);this.canvas.removeEventListener('webglcontextlost',this.lost);
  this.models.forEach(m=>{m.mixer.stopAllAction();m.mixer.uncacheRoot(m.root);});this.disposeObject(this.scene);this.gradient.dispose();this.cachedMaterials.clear();this.renderer.dispose();this.renderer.forceContextLoss();
 }
}
