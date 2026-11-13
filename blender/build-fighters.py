import os
"""Create source-modeled, skinned Senbukan prototype fighters and FBX clips.

Run: blender --background --factory-startup --python blender/build-fighters.py
No downloaded mesh, texture or Unity runtime is required. Unity execution must
be verified separately in the Unity Editor; the roundtrip here checks Blender.
"""
import bpy, math, json, random, os
from pathlib import Path
from mathutils import Vector, Quaternion, Matrix
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'unity/SenbukanPrototype/Assets/Senbukan/Art'
QA=Path(os.environ.get('SENBUKAN_QA_DIR', str(ROOT/'blender/previews/fighters')))
OUT.mkdir(parents=True,exist_ok=True);QA.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for data in list(bpy.data.materials):bpy.data.materials.remove(data)
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
scene.render.fps=30
random.seed(26)

def material(name,color,rough=.78):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough
 return m
M={
 'skin':material('Skin warm ochre',(.64,.32,.17)),
 'skinLight':material('Skin lit planes',(.72,.39,.22)),
 'skinShade':material('Skin sculpt shadows',(.39,.16,.085)),
 'ivory':material('Gi ivory',(.83,.80,.71)),
 'ivoryShade':material('Gi fold planes',(.54,.54,.51)),
 'belt':material('Black belt and wristbands',(.018,.022,.028)),
 'hair':material('Chestnut curls',(.055,.025,.014)),
 'hairLight':material('Chestnut curl planes',(.12,.052,.022)),
 'navy':material('Student indigo gi',(.035,.075,.15)),
 'navyShade':material('Indigo fold planes',(.019,.035,.075)),
 'white':material('Eye white',(.94,.92,.83)),
 'ink':material('Face ink',(.009,.009,.014)),
 'iris':material('Amber brown iris',(.20,.10,.028)),
}
S=1;parts=[]

def V(p):return Vector(p)*S

def weights(o,fn):
 groups={}
 for vertex in o.data.vertices:
  ws=fn(vertex.co/S)
  total=sum(ws.values())
  if not total:raise RuntimeError('Unweighted vertex in '+o.name)
  for bone,w in ws.items():
   if w<=0:continue
   if bone not in groups:groups[bone]=o.vertex_groups.new(name=bone)
   groups[bone].add([vertex.index],w/total,'REPLACE')

def rigid(bone):return lambda p:{bone:1.}

def finish(o,mat,fn,smooth=True):
 o.data.materials.append(mat)
 if smooth:
  for p in o.data.polygons:p.use_smooth=True
 weights(o,fn);parts.append(o);return o

def mesh(name,verts,faces,mat,fn,smooth=True):
 d=bpy.data.meshes.new(name);d.from_pydata([V(v) for v in verts],[],faces);d.update();o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);return finish(o,mat,fn,smooth)

def ellipsoid(name,center,scale,mat,fn,segments=16,rings=8):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=1,location=V(center));o=bpy.context.object;o.name=name;o.scale=Vector(scale)*S
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 # All source mesh coordinates live in the rig's coordinate system.
 transform=o.matrix_world.copy()
 for v in o.data.vertices:v.co=transform@v.co
 o.matrix_world=Matrix.Identity(4)
 return finish(o,mat,fn)

def loft(name,rings,mat,fn,n=24):
 verts=[];faces=[]
 for z,cx,cy,rx,ry in rings:
  for j in range(n):
   a=j/n*math.tau;verts.append((cx+rx*math.cos(a),cy+ry*math.sin(a),z))
 for i in range(len(rings)-1):
  for j in range(n):a=i*n+j;b=i*n+(j+1)%n;c=(i+1)*n+(j+1)%n;d=(i+1)*n+j;faces.append((a,b,c,d))
 faces.extend([tuple(reversed(range(n))),tuple((len(rings)-1)*n+j for j in range(n))])
 return mesh(name,verts,faces,mat,fn)

def limb(name,a,b,profile,mat,fn,n=16):
 a,b=Vector(a),Vector(b);axis=(b-a).normalized();u=axis.cross(Vector((0,1,0))).normalized();v=axis.cross(u).normalized();verts=[];faces=[]
 for t,ru,rv in profile:
  center=a.lerp(b,t)
  for j in range(n):
   angle=j/n*math.tau;p=center+u*ru*math.cos(angle)+v*rv*math.sin(angle);verts.append(tuple(p))
 for i in range(len(profile)-1):
  for j in range(n):faces.append((i*n+j,i*n+(j+1)%n,(i+1)*n+(j+1)%n,(i+1)*n+j))
 faces.extend([tuple(reversed(range(n))),tuple((len(profile)-1)*n+j for j in range(n))])
 return mesh(name,verts,faces,mat,fn)

def tube(name,points,radius,mat,fn,sides=6):
 points=[Vector(p)for p in points];verts=[];faces=[]
 for i,p in enumerate(points):
  direction=(points[min(len(points)-1,i+1)]-points[max(0,i-1)]).normalized();side=direction.cross(Vector((0,1,0)))
  if side.length<.01:side=direction.cross(Vector((1,0,0)))
  side.normalize();up=direction.cross(side).normalized()
  for j in range(sides):q=p+radius*(side*math.cos(j/sides*math.tau)+up*math.sin(j/sides*math.tau));verts.append(tuple(q))
 for i in range(len(points)-1):
  for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
 return mesh(name,verts,faces,mat,fn)

def torso_weights(p):
 z=p.z
 if z<1.05:return {'Hips':1}
 if z<1.26:
  t=(z-1.05)/.21;return {'Spine':1-t,'Chest':t}
 return {'Chest':1}

def leg_weights(side,p):
 z=p.z;thigh='Thigh.'+side;shin='Shin.'+side
 if z>.88:
  t=min(.6,(z-.88)/.12);return {thigh:1-t,'Hips':t}
 t=max(0,min(1,(.63-z)/.18));return {thigh:1-t,shin:t}

def make_rig(name):
 data=bpy.data.armatures.new(name+' Skeleton');rig=bpy.data.objects.new(name+'_Rig',data);scene.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True)
 bpy.ops.object.mode_set(mode='EDIT')
 definitions=[('Root',(0,0,0),(0,0,.15),None,False),('Hips',(0,0,.94),(0,0,1.09),'Root',True),('Spine',(0,0,1.09),(0,0,1.31),'Hips',True),('Chest',(0,0,1.31),(0,0,1.51),'Spine',True),('Neck',(0,0,1.51),(0,0,1.61),'Chest',True),('Head',(0,0,1.61),(0,0,1.79),'Neck',True)]
 for side,sign in [('L',1),('R',-1)]:
  definitions += [('Shoulder.'+side,(sign*.035,0,1.48),(sign*.215,0,1.48),'Chest',True),('UpperArm.'+side,(sign*.215,0,1.48),(sign*.405,.005,1.265),'Shoulder.'+side,True),('ForeArm.'+side,(sign*.405,.005,1.265),(sign*.54,-.015,1.09),'UpperArm.'+side,True),('Hand.'+side,(sign*.54,-.015,1.09),(sign*.58,-.03,1.01),'ForeArm.'+side,True),('Thigh.'+side,(sign*.105,0,.94),(sign*.12,-.012,.54),'Hips',True),('Shin.'+side,(sign*.12,-.012,.54),(sign*.12,0,.135),'Thigh.'+side,True),('Foot.'+side,(sign*.12,0,.135),(sign*.12,-.16,.055),'Shin.'+side,True),('HandTarget.'+side,(sign*.54,-.015,1.09),(sign*.58,-.03,1.01),'Root',False),('ElbowPole.'+side,(sign*.63,.17,1.24),(sign*.63,.17,1.34),'Root',False),('FootTarget.'+side,(sign*.12,0,.135),(sign*.12,-.16,.055),'Root',False),('KneePole.'+side,(sign*.12,-.65,.55),(sign*.12,-.65,.65),'Root',False)]
 for name_,head,tail,parent,deform in definitions:
  b=data.edit_bones.new(name_);b.head=V(head);b.tail=V(tail);b.use_deform=deform
  if parent:b.parent=data.edit_bones[parent]
 bpy.ops.object.mode_set(mode='POSE')
 for side in ['L','R']:
  fore=rig.pose.bones['ForeArm.'+side];ik=fore.constraints.new('IK');ik.name='Elbow volume and wrist reach';ik.target=rig;ik.subtarget='HandTarget.'+side;ik.pole_target=rig;ik.pole_subtarget='ElbowPole.'+side;ik.chain_count=2;ik.iterations=64;ik.pole_angle=math.pi/2 if side=='L'else -math.pi/2
  shin=rig.pose.bones['Shin.'+side];ik=shin.constraints.new('IK');ik.target=rig;ik.subtarget='FootTarget.'+side;ik.pole_target=rig;ik.pole_subtarget='KneePole.'+side;ik.chain_count=2;ik.iterations=64;ik.pole_angle=-math.pi/2
  foot=rig.pose.bones['Foot.'+side];copy=foot.constraints.new('COPY_ROTATION');copy.target=rig;copy.subtarget='FootTarget.'+side;copy.target_space='WORLD';copy.owner_space='WORLD'
 bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False);return rig

def build_character(name,student=False):
 global S,parts
 S=(1.78 if student else 1.83)/1.84;parts=[]
 skin=M['skin'];hair=M['hair'];ivory=M['ivory'];shade=M['ivoryShade'];cloth=M['navy']if student else ivory;fold=M['navyShade']if student else shade
 # Continuous body core: shoulder taper, rib cage, obliques and pelvis.
 torso=[(.92,0,0,.135,.09),(1.0,0,0,.158,.105),(1.08,0,0,.148,.094),(1.17,0,0,.162,.10),(1.27,0,0,.196,.118),(1.36,0,0,.22,.125),(1.44,0,0,.23,.112),(1.49,0,0,.205,.09),(1.535,0,0,.09,.067)]
 loft(name+' torso',torso,cloth if student else skin,torso_weights)
 if not student:
  for sign in [-1,1]:
   ellipsoid('Pectoral sculpt',(sign*.105,-.097,1.363),(.106,.041,.069),M['skinLight'],rigid('Chest'))
   for i,z in enumerate([1.10,1.185,1.26]):ellipsoid('Abdominal plane',(sign*.045,-.095,z),(.048,.017,.038),skin,torso_weights,12,6)
   tube('Clavicle plane',[(sign*.015,-.064,1.487),(sign*.09,-.084,1.477),(sign*.17,-.066,1.473)],.010,M['skinLight'],rigid('Chest'))
   tube('Oblique sculpt',[(sign*.13,-.074,1.08),(sign*.146,-.077,1.16),(sign*.17,-.077,1.23)],.014,skin,torso_weights)
  ellipsoid('Navel',(0,-.111,1.063),(.008,.003,.006),M['skinShade'],rigid('Spine'),8,4)
 else:
  for sign in [-1,1]:
   tube('Folded ivory gi lapel',[(sign*.075,-.055,1.52),(sign*.12,-.096,1.44),(sign*.055,-.139,1.27),(sign*.005,-.12,1.17)],.024,ivory,torso_weights,8)
   tube('Jacket waist fold',[(sign*.14,-.07,1.11),(sign*.095,-.103,1.15),(sign*.03,-.116,1.18)],.008,fold,torso_weights)
 loft('Neck',[(1.51,0,0,.055,.05),(1.60,0,-.005,.048,.046),(1.64,0,-.002,.054,.046)],skin,rigid('Neck'),16)
 # Broad low waist and separate puffed cloth legs keep joint topology legible.
 loft('Gi seat',[(.89,0,0,.155,.104),(.94,0,0,.177,.113),(1.0,0,0,.166,.109),(1.032,0,0,.159,.10)],cloth,rigid('Hips'))
 for side,sign in [('L',1),('R',-1)]:
  wf=lambda p,side=side:leg_weights(side,p)
  leg=[(.96,sign*.105,0,.106,.106),(.90,sign*.112,0,.125,.126),(.81,sign*.117,-.003,.132,.127),(.71,sign*.12,-.008,.116,.119),(.62,sign*.12,-.012,.121,.115),(.55,sign*.12,-.016,.103,.104),(.51,sign*.12,-.007,.11,.106),(.43,sign*.12,0,.104,.106),(.34,sign*.12,.001,.114,.103),(.27,sign*.12,.002,.09,.091),(.22,sign*.12,.002,.089,.087),(.16,sign*.12,0,.068,.073)]
  loft('Gi leg '+side,leg,cloth,wf,20)
  for z,w in [(.80,.075),(.63,.07),(.47,.067),(.29,.055)]:tube('Angular cloth fold',[(sign*(.12-w),-.07,z+.03),(sign*.12,-.118,z),(sign*(.12+w*.5),-.079,z-.025)],.005,fold,wf)
  # Shaped bare foot with five separate toe volumes, not a boot/capsule.
  ellipsoid('Heel '+side,(sign*.12,.012,.065),(.065,.075,.065),skin,rigid('Foot.'+side),16,8)
  ellipsoid('Foot arch '+side,(sign*.12,-.074,.05),(.068,.118,.049),skin,rigid('Foot.'+side),16,8)
  for j in range(5):
   x=sign*.12+(j-2)*.023;length=.041-(j*.003 if sign>0 else (4-j)*.003)
   ellipsoid('Toe '+side,(x,-.167,.027),(.014,length,.027),skin,rigid('Foot.'+side),10,5)
  shoulder=(sign*.215,0,1.48);elbow=(sign*.405,.005,1.265);wrist=(sign*.54,-.015,1.09)
  ellipsoid('Deltoid '+side,(sign*.22,0,1.46),(.086,.077,.095),cloth if student else skin,rigid('UpperArm.'+side))
  limb('Upper arm '+side,shoulder,elbow,[(0,.069,.063),(.28,.073,.068),(.57,.062,.064),(.84,.048,.049),(1,.041,.043)],cloth if student else skin,rigid('UpperArm.'+side))
  limb('Forearm '+side,elbow,wrist,[(0,.043,.042),(.21,.052,.052),(.48,.047,.046),(.77,.034,.035),(1,.029,.031)],skin,rigid('ForeArm.'+side))
  if student:
   a=Vector(elbow);b=Vector(wrist);end=a.lerp(b,.36)
   limb('Rolled gi sleeve '+side,shoulder,tuple(end),[(0,.083,.078),(.30,.093,.088),(.55,.083,.078),(.80,.07,.068),(1,.055,.054)],cloth,lambda p,side=side:{'UpperArm.'+side:1}if abs(p.x)<.39 else {'ForeArm.'+side:1},20)
  else:
   a=Vector(elbow);b=Vector(wrist);bandA=a.lerp(b,.77);bandB=a.lerp(b,.97)
   limb('Black wristband '+side,tuple(bandA),tuple(bandB),[(0,.036,.037),(.15,.038,.039),(.85,.032,.034),(1,.031,.032)],M['belt'],rigid('ForeArm.'+side))
  hand=Vector(wrist)+Vector((sign*.021,-.005,-.036))
  ellipsoid('Clenched palm '+side,tuple(hand),(.043,.037,.052),skin,rigid('Hand.'+side),16,8)
  for j in range(4):ellipsoid('Knuckle '+side,tuple(hand+Vector(((j-1.5)*.016,-.029,-.006))),(.012,.019,.023),skin,rigid('Hand.'+side),10,5)
  ellipsoid('Folded thumb '+side,tuple(hand+Vector((sign*-.029,-.006,-.005))),(.019,.024,.033),M['skinLight'],rigid('Hand.'+side),10,6)
 # Belt: wrap, square knot and layered cloth ends.
 belt=ivory if student else M['belt']
 loft('Karate belt',[(1.00,0,0,.173,.114),(1.04,0,0,.174,.116),(1.062,0,0,.169,.109)],belt,rigid('Hips'))
 ellipsoid('Belt knot',(0,-.132,1.028),(.038,.021,.027),belt,rigid('Hips'),12,6)
 for sign in [-1,1]:
  verts=[(sign*.008,-.13,1.02),(sign*.045,-.129,1.017),(sign*.058,-.142,.865),(sign*.029,-.147,.846)]
  # Small thickness prevents disappearing tails when seen from either side.
  verts+= [(x,y+.009,z)for x,y,z in verts]
  mesh('Belt hanging end',verts,[(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],belt,rigid('Hips'),False)
 # Angular jaw/head shell, profile nose, almond eyes and confident brows.
 head=[(1.585,0,-.008,.045,.042),(1.61,0,-.014,.071,.054),(1.66,0,-.002,.106,.081),(1.705,0,.003,.123,.095),(1.75,0,.006,.12,.099),(1.79,0,.012,.096,.075),(1.805,0,.014,.036,.029)]
 loft('Angular anime head',head,skin,rigid('Head'),24)
 for sign in [-1,1]:
  ellipsoid('Ear',(sign*.123,.006,1.675),(.023,.019,.038),skin,rigid('Head'),12,6)
  ellipsoid('Ear inner',(sign*.135,-.005,1.675),(.010,.012,.025),M['skinShade'],rigid('Head'),10,5)
  x=sign*.050;z=1.708
  eye=[(x-.035,-.089,z),(x-.014,-.103,z+.012),(x+.026,-.096,z+.008),(x+.034,-.086,z-.002),(x+.004,-.105,z-.011),(x-.019,-.101,z-.008)]
  mesh('Almond eye',eye,[(0,1,2),(0,2,3),(0,3,4),(0,4,5)],M['white'],rigid('Head'),False)
  ellipsoid('Iris',(x,-.107,z),(.010,.004,.012),M['iris'],rigid('Head'),12,6)
  ellipsoid('Pupil',(x,-.111,z),(.0045,.002,.007),M['ink'],rigid('Head'),10,5)
  tube('Upper eyelid',[(x-.035,-.092,z+.001),(x-.014,-.106,z+.013),(x+.026,-.099,z+.009)],.003,M['ink'],rigid('Head'))
  tube('Angular eyebrow',[(x-sign*.033,-.092,z+.030),(x,-.104,z+.037),(x+sign*.036,-.088,z+.047)],.007,hair,rigid('Head'),6)
 nose=[(-.012,-.086,1.699),(.012,-.086,1.699),(0,-.142,1.672),(-.015,-.096,1.658),(.015,-.096,1.658)]
 mesh('Nose profile',nose,[(0,1,2),(0,2,3),(1,4,2),(2,4,3)],M['skinLight'],rigid('Head'),False)
 tube('Mouth',[(-.029,-.077,1.634),(.002,-.088,1.631),(.032,-.074,1.638)],.0028,M['skinShade'],rigid('Head'))
 # A dark cap under dozens of real curl tubes, with brighter lock planes.
 ellipsoid('Hair foundation',(0,.014,1.746),(.126,.105,.071),hair,rigid('Head'),20,10)
 if student:
  for i in range(28):
   a=i*2.39996;phi=.18+(i%5)*.21;r=.115
   center=(math.sin(phi)*math.cos(a)*r,.014+math.sin(phi)*math.sin(a)*r*.83,1.747+math.cos(phi)*.071)
   ellipsoid('Cropped hair lock',center,(.026,.023,.023),hair,rigid('Head'),8,4)
 else:
  for i in range(43):
   theta=i*2.39996;phi=.10+(i%7)*.20
   normal=Vector((math.sin(phi)*math.cos(theta),math.sin(phi)*math.sin(theta),math.cos(phi)))
   center=Vector((normal.x*.121,.014+normal.y*.098,1.741+normal.z*.065))
   tangent=normal.cross(Vector((0,0,1)))
   if tangent.length<.05:tangent=Vector((1,0,0))
   tangent.normalize();bitangent=normal.cross(tangent).normalized();points=[]
   for j in range(14):
    a=j/13*math.tau*1.08;rr=.018*(.78+.22*math.sin(j/13*math.pi));p=center+tangent*math.cos(a)*rr+bitangent*math.sin(a)*rr+normal*.006*math.sin(a*.5);points.append(tuple(p))
   tube('Sculpted chestnut curl',points,.010,M['hairLight']if i%6==0 else hair,rigid('Head'),6)
 # Combine into a single weighted mesh, retaining small intentional material set.
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();body=bpy.context.object;body.name=name+'_SkinnedMesh'
 rig=make_rig(name);body.parent=rig;body.matrix_parent_inverse=Matrix.Identity(4)
 mod=body.modifiers.new('Deform skeleton','ARMATURE');mod.object=rig;mod.use_vertex_groups=True
 body.data.calc_loop_triangles();tris=len(body.data.loop_triangles)
 if tris>=30000:raise RuntimeError(name+' exceeds polygon budget: '+str(tris))
 missing=[v.index for v in body.data.vertices if not len(v.groups)]
 if missing:raise RuntimeError(name+' has unweighted vertices')
 return rig,body

# Translation/rotation helpers respect each bone's local rest basis.
def location(rig,bone,world):
 pb=rig.pose.bones[bone];pb.location=pb.bone.matrix_local.to_3x3().inverted()@(V(world)-pb.bone.head_local)

def offset(rig,bone,delta):
 pb=rig.pose.bones[bone];pb.location=pb.bone.matrix_local.to_3x3().inverted()@V(delta)

def rotation(rig,bone,x=0,y=0,z=0):
 pb=rig.pose.bones[bone];pb.rotation_mode='QUATERNION';basis=pb.bone.matrix_local.to_quaternion()
 world=Quaternion((0,0,1),z)@Quaternion((0,1,0),y)@Quaternion((1,0,0),x)
 pb.rotation_quaternion=basis.inverted()@world@basis

DURATIONS={'idle':60,'walk':32,'run':24,'punch1':16,'punch2':18,'punch3':24,'kick':24,'guard':30,'hit':18,'jump':30,'dash':18,'transform':48,'down':30}
LOOPS={'idle','walk','run','guard'}

def animate(rig,student=False):
 global S
 S=(1.78 if student else 1.83)/1.84
 ad=rig.animation_data_create();cursor=1;clipdata=[]
 for label,length in DURATIONS.items():
  action=bpy.data.actions.new(rig.name+'_'+label);ad.action=action
  # Key every other frame plus end points. FBX exporter samples at every frame.
  frames=sorted(set([1,length]+list(range(1,length+1,2))))
  for frame in frames:
   u=(frame-1)/(length-1);wave=math.sin(u*math.tau);breath=math.sin(u*math.tau)*.008
   for pb in rig.pose.bones:
    pb.location=(0,0,0);pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.scale=(1,1,1)
   hip=(0,0,-.037+breath);spx=.025;spz=.015*wave;chx=0;chz=0;headx=0
   hands={'L':(.205,-.235,1.42),'R':(-.22,-.17,1.32)}
   feet={'L':(.13,-.07,.135),'R':(-.13,.095,.135)};footTilt={'L':0,'R':0}
   if label in ['walk','run']:
    stride=.19 if label=='walk'else .29;lift=.065 if label=='walk'else .12
    hip=(0,0,-.025-abs(wave)*.018);spx=.10 if label=='walk'else .23
    for side,phase,sign in [('L',0,1),('R',math.pi,-1)]:
     a=u*math.tau+phase;feet[side]=(sign*.12,math.sin(a)*stride,.135+max(0,math.cos(a))*lift)
     hands[side]=(sign*.245,-.14-math.sin(a)*(.15 if label=='walk'else .24),1.28+max(0,-math.sin(a))*.08)
     footTilt[side]=max(0,math.cos(a))*.18
   elif label.startswith('punch'):
    pulse=math.sin(min(1,u/.76)*math.pi)**2 if u<.76 else 0
    recovery=max(0,(u-.45)/.55)
    if label=='punch1':side='L';goal=Vector((.15,-.535,1.42));coil=Vector((.26,-.14,1.39));chz=.20*pulse
    elif label=='punch2':side='R';goal=Vector((-.13,-.54,1.43));coil=Vector((-.28,-.11,1.38));chz=-.23*pulse
    else:side='R';goal=Vector((-.13,-.43,1.59));coil=Vector((-.26,-.12,1.18));chz=-.27*pulse;chx=-.06*pulse
    rest=Vector(hands[side]);blend=pulse;start=coil if u<.18 else rest
    hands[side]=tuple(start.lerp(goal,blend));hip=(0,-.027*pulse,-.037+.016*pulse)
   elif label=='kick':
    p=math.sin(math.pi*u)**2;hands['L']=(.20,-.24,1.45);hands['R']=(-.23,-.13,1.37)
    feet['R']=tuple(Vector(feet['R']).lerp(Vector((-.10,-.61,1.08)),p));footTilt['R']=-1.12*p
    spx=-.13*p;chz=-.12*p;hip=(0,.027*p,-.04+.02*p)
   elif label=='guard':
    hands={'L':(.15,-.225,1.49+breath),'R':(-.15,-.20,1.47-breath)};hip=(0,0,-.06+breath);chx=.08
   elif label=='hit':
    p=math.sin(math.pi*u);hands['L']=(.205+.16*p,-.235+.22*p,1.42-.1*p);hands['R']=(-.22-.13*p,-.17+.19*p,1.32+.08*p)
    chx=-.20*p;headx=-.15*p;hip=(0,.065*p,-.037-.02*p)
   elif label=='jump':
    p=math.sin(math.pi*u);feet['L']=(.15,-.14*p,.135+.24*p);feet['R']=(-.15,.095-.24*p,.135+.29*p)
    hands={'L':(.22,-.22,1.42+.055*p),'R':(-.24,-.17,1.40+.04*p)};spx=.12*p;hip=(0,0,-.037-.06*p);footTilt={'L':-.25*p,'R':-.35*p}
   elif label=='dash':
    p=.7+.3*math.sin(math.pi*u);spx=.30*p;hip=(0,-.045,-.10);feet={'L':(.13,-.24,.135),'R':(-.13,.27,.135)}
    hands={'L':(.23,-.26,1.34),'R':(-.32,.04,1.23)};footTilt['R']=.20
   elif label=='transform':
    p=math.sin(math.pi*u);hip=(0,0,-.04-.06*p);headx=-.16*p;chx=-.06*p
    hands={'L':(.22+.17*p,-.15,1.29+.17*p),'R':(-.22-.17*p,-.15,1.29+.17*p)}
   elif label=='down':
    p=min(1,u*2.8);hip=(0,.04,-.037-.43*p);chx=.48*p;headx=.20*p
    hands={'L':(.205+.10*p,-.235-.22*p,1.42-.92*p),'R':(-.22-.06*p,-.17-.19*p,1.32-.8*p)}
   offset(rig,'Hips',hip);rotation(rig,'Spine',spx,0,spz);rotation(rig,'Chest',chx,0,chz);rotation(rig,'Head',headx)
   for side in ['L','R']:
    location(rig,'HandTarget.'+side,hands[side]);location(rig,'FootTarget.'+side,feet[side]);rotation(rig,'FootTarget.'+side,footTilt[side])
   for pb in rig.pose.bones:
    pb.keyframe_insert('location',frame=frame,group=pb.name);pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name)
  # Bezier rotation/goal curves give continuously articulated motion on import.
  for fc in action.fcurves:
   for kp in fc.keyframe_points:kp.interpolation='BEZIER'
  ad.action=None
  track=ad.nla_tracks.new();track.name=label
  strip=track.strips.new(label,cursor,action);strip.action_frame_start=1;strip.action_frame_end=length;strip.extrapolation='NOTHING';strip.blend_type='REPLACE'
  clipdata.append({'name':label,'frames':length,'seconds':(length-1)/30,'loop':label in LOOPS,'nlaStart':cursor,'nlaEnd':cursor+length-1})
  cursor+=length+5
 rig['SenbukanClipManifest']=json.dumps(clipdata);return clipdata

actors=[];report={'source':'procedurally modeled in Blender; no image billboards','unityEditorTested':False,'characters':{}}
for name,student in [('Caetano',False),('DojoStudent',True)]:
 rig,body=build_character(name,student);S=(1.78 if student else 1.83)/1.84
 rest_min=min(v.co.z for v in body.data.vertices);rest_max=max(v.co.z for v in body.data.vertices)
 clips=animate(rig,student);actors.append((rig,body))
 bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);body.select_set(True);bpy.context.view_layer.objects.active=rig
 target=OUT/(name+'.fbx')
 bpy.ops.export_scene.fbx(filepath=str(target),use_selection=True,object_types={'ARMATURE','MESH'},global_scale=1,apply_unit_scale=True,apply_scale_options='FBX_SCALE_UNITS',axis_forward='-Z',axis_up='Y',use_space_transform=True,bake_space_transform=False,use_mesh_modifiers=True,add_leaf_bones=False,use_armature_deform_only=True,bake_anim=True,bake_anim_use_all_bones=True,bake_anim_use_nla_strips=True,bake_anim_use_all_actions=False,bake_anim_force_startend_keying=True,bake_anim_step=1,bake_anim_simplify_factor=0,path_mode='AUTO',embed_textures=False)
 body.data.calc_loop_triangles()
 report['characters'][name]={'file':str(target.relative_to(ROOT)),'vertices':len(body.data.vertices),'triangles':len(body.data.loop_triangles),'materials':len(body.data.materials),'deformBones':[b.name for b in rig.data.bones if b.use_deform],'controlBones':[b.name for b in rig.data.bones if not b.use_deform],'unweightedVertices':sum(not len(v.groups)for v in body.data.vertices),'restHeightMeters':rest_max-rest_min,'minimumZ':rest_min,'clips':clips,'fbxBytes':target.stat().st_size}
# Neutral two-fighter art review scene, separate from the dojo design.
for i,(rig,body)in enumerate(actors):rig.location.x=(-.72 if i==0 else .72);rig.rotation_euler.z=(-.10 if i==0 else .10)
scene.frame_start=1;scene.frame_end=60;scene.frame_set(1)
# Ground and lights are review-only and are not in either exported FBX.
floor=material('Review floor',(.035,.045,.06))
bpy.ops.mesh.primitive_plane_add(size=200);o=bpy.context.object;o.name='ReviewOnly_Floor';o.data.materials.append(floor);o.location.z=-.005
world=bpy.data.worlds.new('Studio warm gray')if not scene.world else scene.world;scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.15,.18,.23,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45
for name,loc,energy,size,color in [('Key',(-3,-4,5),900,4,(1,.83,.64)),('Fill',(4,-2,3),550,4,(.60,.76,1)),('Rim',(0,3,4),1100,3,(1,.61,.30))]:
 data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size;data.color=color;obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=loc;obj.rotation_euler=(Vector((0,0,1))-obj.location).to_track_quat('-Z','Y').to_euler()
camdata=bpy.data.cameras.new('Fighter review camera');cam=bpy.data.objects.new('Fighter review camera',camdata);scene.collection.objects.link(cam);cam.location=(3.3,-6.5,2.8);target=Vector((0,0,.95));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();camdata.type='ORTHO';camdata.ortho_scale=3.55;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=False;scene.render.resolution_x=1600;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(QA/'fighters-preview.png');scene.view_settings.view_transform='Standard';scene.view_settings.look='Medium High Contrast' if 'Medium High Contrast' in [i.identifier for i in scene.view_settings.bl_rna.properties['look'].enum_items]else 'None'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/fighters_senbukan.blend'))
(QA/'metrics.json').write_text(json.dumps(report,indent=2))
bpy.ops.render.render(write_still=True)
print('SENBUKAN_FIGHTER_ASSETS',json.dumps(report))
