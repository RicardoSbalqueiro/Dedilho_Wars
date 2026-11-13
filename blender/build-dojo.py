import os
"""Create the provisional Senbukan dojo in Blender; all geometry is in metres.
The source has no external textures and is intended for Unity's toon materials.
Run: blender --background --factory-startup --python blender/build-dojo.py
"""
from pathlib import Path
import bpy, bmesh, math, random, json
from mathutils import Vector

ROOT=Path(__file__).resolve().parent.parent
OUT=Path(os.environ.get('SENBUKAN_QA_DIR', str(ROOT/'blender/previews/dojo')));OUT.mkdir(parents=True,exist_ok=True)
ART=ROOT/'unity/SenbukanPrototype/Assets/Senbukan/Art';ART.mkdir(parents=True,exist_ok=True)
random.seed(17)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for d in list(bpy.data.materials):bpy.data.materials.remove(d)

M={}
def mat(name,color,rough=.8,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 M[name]=m;return m
mat('Timber_Deep',(0.13,.065,.042));mat('Timber_Edge',(.28,.14,.073));mat('Timber_Honey',(.56,.30,.125));mat('Timber_Warm',(.41,.20,.088));mat('Timber_Light',(.66,.40,.20));mat('Timber_Seam',(.20,.105,.055))
mat('Plaster_Cream',(.84,.77,.58));mat('Paper_Shoji',(.90,.87,.70));mat('Paper_Shade',(.73,.76,.61));mat('Tatami_Sage',(.32,.40,.24));mat('Tatami_Sand',(.55,.59,.35));mat('Tatami_Weave',(.40,.46,.27));mat('Tatami_Trim',(.085,.16,.11));mat('Senbukan_Orange',(.95,.31,.045));mat('Senbukan_Gold',(.90,.62,.16),.45,.15);mat('Banner_Black',(.035,.055,.055));mat('Text_Ivory',(.97,.88,.66));mat('Stone',(.27,.30,.27));mat('Stone_Light',(.47,.45,.36));mat('Garden_Gravel',(.30,.32,.24));mat('Foliage',(.11,.24,.12));mat('Foliage_Light',(.22,.37,.14));mat('Bamboo',(.30,.44,.16));mat('Rope',(.74,.61,.37));mat('Training_Pad',(.13,.17,.16));mat('Sky_Ground',(.055,.025,.09))


mat('Banner_Violet',(.075,.025,.13));mat('City_Dark',(.025,.018,.065));mat('City_Purple',(.055,.025,.11));mat('City_Slate',(.035,.04,.10));mat('Petal_Pink',(.62,.16,.36));mat('Petal_Light',(.95,.37,.60));mat('Petal_Shade',(.35,.08,.24));mat('Cherry_Bark',(.13,.055,.08))
for key,col,power in [('Neon_Violet',(.48,.045,1.0),3),('Neon_Pink',(.95,.05,.55),2),('Window_Gold',(.9,.44,.08),2),('Lantern_Gold',(1.0,.50,.10),4),('Moon_Ivory',(.70,.62,1),2)]:
 m=mat(key,col);bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(*col,1);bs.inputs['Emission Strength'].default_value=power
for key in ['Timber_Honey','Timber_Warm','Timber_Light']:M[key].node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.36

def finish(o,name,material):
 o.name=name
 if material:o.data.materials.append(M[material])
 return o

def cube(name,loc,scale,material,bevel=0):
 x,y,z=[v/2 for v in scale]
 verts=[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
 faces=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
 if bevel:
  bm=bmesh.new();bm.from_mesh(mesh)
  bmesh.ops.bevel(bm,geom=list(bm.edges),offset=min(bevel,min(scale)*.3),segments=1,affect='EDGES')
  bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
 o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.location=loc
 return finish(o,name,material)

def cylinder(name,loc,radius,depth,material,vertices=12):
 points=[(math.cos(i/vertices*math.tau)*radius,math.sin(i/vertices*math.tau)*radius,z) for z in [-depth/2,depth/2] for i in range(vertices)]
 faces=[tuple(reversed(range(vertices))),tuple(range(vertices,vertices*2))]+[(i,(i+1)%vertices,(i+1)%vertices+vertices,i+vertices) for i in range(vertices)]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(points,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.location=loc
 return finish(o,name,material)

def ico(name,loc,scale,material,subdivisions=1):
 mesh=bpy.data.meshes.new(name);bm=bmesh.new();bmesh.ops.create_icosphere(bm,subdivisions=subdivisions,radius=1);bm.to_mesh(mesh);bm.free()
 o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.location=loc;o.scale=scale
 return finish(o,name,material)

def beam(name,a,b,width,material):
 a,b=Vector(a),Vector(b);o=cube(name,(a+b)*.5,(width,width,(b-a).length),material,.025);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o

def text(name,body,loc,size,material,rotation=(math.pi/2,0,0),align='CENTER'):
 cu=bpy.data.curves.new(name,'FONT');cu.body=body;cu.align_x=align;cu.size=size;cu.extrude=.009;cu.bevel_depth=.002;cu.resolution_u=3
 font=Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc') if any(ord(c)>12288 for c in body) else Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
 if font.is_file():cu.font=bpy.data.fonts.load(str(font))
 o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=rotation;o.data.materials.append(M[material]);return o

# Foundation, a visible step and free 18 x 18 metre training floor.
cube('Foundation_Stone',(0,0,-.40),(30,29,.6),'Stone',.10)
cube('Deck_Wood',(0,0,-.045),(29.6,28.6,.22),'Timber_Honey',.035)
cube('Front_Step',(0,-15.1,-.42),(18,1.4,.3),'Timber_Edge',.04)
cube('Front_Step_Tread',(0,-15.1,-.24),(18.2,1.4,.12),'Timber_Warm',.035)
for side in [-1,1]:
 for j in range(25):
  y=-13.8+j*1.12
  cube('Deck_Plank_Side', (side*12.1,y,.084),(5.3,1.09,.018),['Timber_Honey','Timber_Warm','Timber_Light'][random.randrange(3)])
for end in [-1,1]:
 for j in range(4):
  y=end*(10.0+j*1.12)
  for k in range(12):cube('Deck_Plank_End',(-8.65+k*1.57,y,.084),(1.54,1.09,.018),['Timber_Honey','Timber_Warm','Timber_Light'][random.randrange(3)])
cube('Floor_Arena',(0,0,.095),(18.4,18.4,.07),'Timber_Deep',.025)
for row in range(32):
 y=-8.72+row*.563
 cuts=[-9,-6.75,-2.25,2.25,6.75,9] if row%2 else [-9,-4.5,0,4.5,9]
 for a,b in zip(cuts,cuts[1:]):
  cube('Arena_Wood_Plank',((a+b)/2,y,.155),(b-a-.025,.545,.065),['Timber_Honey','Timber_Warm','Timber_Light'][random.choices(range(3),[6,2,2])[0]],.010)
for x in [-9.22,9.22]:cube('Arena_Gold_Edge',(x,0,.15),(.065,18.5,.07),'Senbukan_Gold')
for y in [-9.22,9.22]:cube('Arena_Gold_Edge',(0,y,.15),(18.5,.065,.07),'Senbukan_Gold')
for rad in [1.18,1.36]:
 bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=4,location=(0,0,.195),major_radius=rad,minor_radius=.023)
 finish(bpy.context.object,'Arena_Crest_Ring','Senbukan_Gold')
cube('Arena_Sen_Stem',(0,0,.196),(.08,1.45,.008),'Senbukan_Gold')
cube('Arena_Sen_Bar',(0,.12,.196),(1.15,.08,.008),'Senbukan_Gold')
o=cube('Arena_Sen_Top',(0,.60,.196),(.9,.08,.008),'Senbukan_Gold');o.rotation_euler.z=.16

# Back wall and shoji. The front stays open, making the test camera readable.
cube('Wall_Back_Centre', (0,14.1,3.5),(9.3,.32,7),'Banner_Violet',.035)
cube('Wall_Back_Base',(0,13.89,.85),(29.6,.18,1.65),'Timber_Warm',.02)
for z in [.18,1.7,6.9]:cube('Wall_Back_Rail',(0,13.66,z),(29.8,.30,.22),'Timber_Deep',.02)
for x in [-14.5,-9.7,-4.9,4.9,9.7,14.5]:
 cube('Pillar_Back',(x,13.6,3.75),(.40,.52,7.5),'Timber_Deep',.035)
 cube('Pillar_Gold_Foot',(x,13.6,.28),(.49,.60,.17),'Senbukan_Gold',.02)

def shoji(name,x,y,w,h=4.8,z=2.1,rot=0):
 root=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(root);root.location=(x,y,z);root.rotation_euler.z=rot
 objs=[]
 objs.append(cube(name+'_LowerPanel',(0,0,.25),(w,.075,.50),'Timber_Deep'))
 for xx in [-w/2,w/2]:objs.append(cube(name+'_Side',(xx,-.065,h/2),(.10,.10,h+.1),'Timber_Edge',.015))
 for zz in [0,h]:objs.append(cube(name+'_Frame',(0,-.065,zz),(w+.1,.10,.12),'Timber_Edge',.012))
 for j in range(1,5):objs.append(cube(name+'_GridH',(0,-.10,j*h/5),(w,.07,.045),'Timber_Honey'))
 for j in [-1,0,1]:objs.append(cube(name+'_GridV',(j*w/4,-.10,h/2),(.045,.07,h),'Timber_Honey'))
 for o in objs:o.parent=root
 return root
for x in [-11.8,-7.3,7.3,11.8]:shoji('Shoji_Back',x,13.60,3.75,4.4,2.15)
# Side galleries have partially open sliding screens and garden views.
for side in [-1,1]:
 for y in [-12,-5,2,9,13]:
  cube('Pillar_Side',(side*14.5,y,3.75),(.43,.43,7.5),'Timber_Deep',.035)
  cube('Pillar_Collar',(side*14.5,y,6.3),(.54,.54,.16),'Timber_Honey',.02)
 for z in [1.4,7.2]:cube('Gallery_Rail',(side*14.5,.5,z),(.3,27,.28),'Timber_Deep',.02)
 for y in [-8.3,5.8,11.2]:shoji('Shoji_Side',side*14.45,y,4.4,4.9,1.75,side*math.pi/2)
 # Lower balustrade keeps the open wall visibly grounded.
 for y in [-11+q*.65 for q in range(38)]:cube('Gallery_Baluster',(side*14.5,y,.78),(.07,.07,1.2),'Timber_Edge')

# Roof structure: carved brackets, crossing rafters and translucent open sky.
for y in [-10,-3,4,11]:
 cube('Rafter_Cross',(0,y,7.3),(29.5,.38,.42),'Timber_Deep',.04)
 for side in [-1,1]:
  beam('Rafter_Bracket',(side*14.4,y,5.9),(side*12.8,y,7.25),.22,'Timber_Edge')
  beam('Roof_Rise',(side*14.7,y,7.55),(0,y,10.1),.24,'Timber_Warm')
for x in [-12,-8,-4,0,4,8,12]:
 z=10.1-abs(x)/14.7*2.55
 cube('Roof_Long_Rafter',(x,.7,z),(.20,27,.23),'Timber_Edge',.015)
# Rear roof lips give an actual silhouette without covering the fighting camera.
for side in [-1,1]:
 o=cube('Roof_Back_Slope',(side*7.4,12.8,8.90),(15.0,3.1,.18),'Timber_Deep',.03);o.rotation_euler.y=side*math.radians(10)

# Kamiza: central emblem and clearly legible name.
cube('Kamiza_Frame',(0,13.43,4.55),(8.9,.32,4.35),'Timber_Deep',.06)
cube('Kamiza_Panel',(0,13.22,4.55),(8.45,.16,3.95),'Banner_Violet',.045)
for x in [-4.25,4.25]:cube('Kamiza_Gold_Side',(x,13.08,4.55),(.055,.035,3.95),'Senbukan_Gold')
for z in [2.60,6.50]:cube('Kamiza_Gold_Rail',(0,13.08,z),(8.55,.035,.055),'Senbukan_Gold')
text('Senbukan_Name','千武館',(0,13.03,4.18),1.05,'Senbukan_Gold')
text('Dojo_Name','S E N B U K A N',(0,13.025,3.42),.31,'Senbukan_Gold')
# The reference's gold circular Sen emblem, traced as three clean strokes.
bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=6,location=(0,13.03,5.95),rotation=(math.pi/2,0,0),major_radius=.58,minor_radius=.035);finish(bpy.context.object,'Senbukan_Emblem_Ring','Senbukan_Gold')
beam('Senbukan_Emblem_Stem',(0,12.98,5.49),(0,12.98,6.39),.065,'Senbukan_Gold')
beam('Senbukan_Emblem_Bar',(-.43,12.98,5.91),(.43,12.98,5.91),.065,'Senbukan_Gold')
beam('Senbukan_Emblem_Top',(-.34,12.98,6.23),(.34,12.98,6.35),.065,'Senbukan_Gold')

for x in [-5.9,5.9]:
 cube('Hanging_Banner',(x,13.25,4.75),(1.05,.055,4.4),'Banner_Violet',.025)
 for k in range(3):
  o=cube('Banner_Ink_Mark',(x,13.20,5.65-k*.85),(.58,.035,.11),'Senbukan_Gold');o.rotation_euler.y=math.radians(-12)
 cube('Banner_Hanger',(x,13.25,7.0),(1.5,.15,.13),'Timber_Deep',.025)

# Small training props sit well outside the 18 x 18 metre clear arena.
for side in [-1,1]:
 for y in [-3.5,4.0]:
  x=side*12.35
  cube('Makiwara_Foot',(x,y,.25),(.80,.85,.28),'Stone',.04)
  cube('Makiwara_Post',(x,y,1.35),(.24,.24,2.30),'Timber_Edge',.025)
  cube('Makiwara_Pad',(x,y-.10,2.0),(.38,.33,.67),'Training_Pad',.07)
  for k in range(7):
   bpy.ops.mesh.primitive_torus_add(major_segments=12,minor_segments=4,location=(x,y,1.78+k*.067),major_radius=.21,minor_radius=.025)
   o=finish(bpy.context.object,'Makiwara_Rope','Rope');o.scale.y=.80
 for y in [10.8]:
  cube('Bench_Seat',(side*10.3,y,.62),(4.6,.68,.18),'Timber_Edge',.045)
  for x in [side*10.3-1.6,side*10.3+1.6]:cube('Bench_Leg',(x,y,.29),(.18,.5,.55),'Timber_Deep',.02)

# Exterior vista follows the supplied reference: Twitchcity at night, cherry
# blossoms, purple neon towers and moon, framed through open timber galleries.
cube('Garden_Ground',(0,10,-.62),(110,110,.22),'Sky_Ground')
for side in [-1,1]:
 cube('Garden_Gravel',(side*18,2,-.45),(6.2,34,.12),'Garden_Gravel',.05)
 for i in range(10):
  x=side*(16.2+random.random()*4);y=-13+i*3
  ico('Garden_Rock',(x,y,-.05),(.5+random.random()*.7,.4+random.random()*.7,.25+random.random()*.45),'Stone')
 for y in [-7,9]:
  x=side*18.5;beam('Cherry_Trunk',(x,y,-.35),(x-.3,y+.15,4.3),.45,'Cherry_Bark')
  for j in range(7):
   a=j/7*math.tau;tip=Vector((x+math.cos(a)*2.1,y+math.sin(a)*2.1,4.5+random.random()*1.8))
   beam('Cherry_Branch',(x-.3,y+.15,2.6+random.random()),tip,.16,'Cherry_Bark')
   for k in range(3):
    d=Vector((random.uniform(-.75,.75),random.uniform(-.75,.75),random.uniform(-.35,.55)))
    ico('Cherry_Blossoms',tip+d,(1.35,1.15,.85),['Petal_Pink','Petal_Light','Petal_Shade'][(j+k)%3],2)
for i in range(36):
 x=-48+(i%12)*8.7+random.uniform(-1,1);y=29+(i//12)*13+random.uniform(-2,2)
 w=random.uniform(3,5.5);d=random.uniform(3,6);h=random.uniform(8,21)+(4 if i in [4,9,19] else 0)
 cube('Twitchcity_Tower',(x,y,h/2-.4),(w,d,h),['City_Dark','City_Purple','City_Slate'][i%3])
 cube('Twitchcity_Roof',(x,y,h+.05),(w*.65,d*.65,.9),'City_Purple')
 for floor in range(3,round(h)-1,3):
  for col in [-1,0,1]:
   if random.random()<.7:cube('City_Window',(x+col*w*.25,y-d/2-.025,floor),(w*.12,.045,.22),'Window_Gold' if (i+floor)%5==0 else 'Neon_Violet')
 if i%3==0:
  for side in [-1,1]:cube('City_Neon_Spine',(x+side*w*.43,y-d/2-.04,h*.55),(.075,.075,h*.8),'Neon_Violet' if i%2 else 'Neon_Pink')
  cylinder('City_Antenna',(x,y,h+2.2),.045,4.0,'Neon_Violet',6)
ico('Moon',(-30,48,30),(2.4,2.4,2.4),'Moon_Ivory',3)
# Gold hanging lanterns describe the scale of the main hall.
for x in [-10.8,10.8]:
 for y in [-7,-1,5,11]:
  beam('Lantern_Cable',(x,y,7.2),(x,y,6.40),.025,'Banner_Black')
  cylinder('Lantern_Light',(x,y,6.02),.28,.72,'Lantern_Gold',12)
  for z in [5.64,6.40]:cylinder('Lantern_Cap',(x,y,z),.33,.10,'Timber_Deep',12)
  for j in range(4):
   a=j/4*math.tau
   beam('Lantern_Rib',(x+math.cos(a)*.285,y+math.sin(a)*.285,5.68),(x+math.cos(a)*.285,y+math.sin(a)*.285,6.37),.025,'Timber_Deep')

# Materials are vertex/flat-colour compatible with the Unity toon shader.
# Convert lettering to meshes and bake modifiers once for portable FBX geometry.
mesh_objects=[]
for o in list(bpy.context.scene.objects):
 if o.type in ['MESH','FONT','CURVE']:
  if o.type!='MESH':
   bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
  mesh_objects.append(o)
# The whole environment is static. Join by material to avoid thousands of
# renderer/draw calls on WebGL, preserving the collision floor as its own mesh.
source_mesh_count=len(mesh_objects);groups={}
for o in mesh_objects:
 if o.name=='Floor_Arena':continue
 groups.setdefault(o.data.materials[0].name,[]).append(o)
merged=[o for o in mesh_objects if o.name=='Floor_Arena']
for material,objects in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0]
 if len(objects)>1:bpy.ops.object.join()
 o=bpy.context.object;matrix=o.matrix_world.copy();o.parent=None;o.matrix_world=matrix;o.name='Dojo_Material_'+material;merged.append(o)
mesh_objects=merged
for mesh in list(bpy.data.meshes):
 if mesh.users==0:bpy.data.meshes.remove(mesh)

# Preview camera: a low enough three-quarter angle to read the actual free floor.
def aim(o,p):o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(7,-8,3.65));camera=bpy.context.object;camera.name='Concept_Camera';aim(camera,(-1,5,1.8));camera.data.type='PERSP';camera.data.lens=23;bpy.context.scene.camera=camera
world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.045,.018,.12,1);world.node_tree.nodes['Background'].inputs[1].default_value=.25
bpy.ops.object.light_add(type='SUN',location=(8,-9,15));sun=bpy.context.object;sun.name='Sun_Afternoon';sun.data.energy=.30;sun.data.color=(.47,.42,1.0);sun.rotation_euler=(math.radians(28),math.radians(-22),math.radians(-25));sun.data.angle=.12
for name,loc,energy,size,col in [('Key_Warm',(4,-8,10),2600,10,(1,.62,.26)),('Window_Fill',(-12,0,8),1400,10,(.46,.20,1)),('Kamiza_Glow',(0,9,7),1700,7,(1,.57,.21)),('Neon_Window',(16,7,10),1300,9,(.67,.15,1))]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.data.color=col;aim(o,(0,2,1))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32;scene.cycles.use_denoising=False;scene.render.threads_mode='FIXED';scene.render.threads=6
scene.render.resolution_x=1440;scene.render.resolution_y=810;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'dojo-reference-night.png')
scene['design_status']='Main hall concept adapted to supplied Senbukan reference; Unity build pending';scene['arena_clear_width_m']=18;scene['arena_clear_depth_m']=18
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/dojo_senbukan.blend'))
# Export only authored geometry; Unity owns runtime lighting and collision setup.
bpy.ops.object.select_all(action='DESELECT')
for o in mesh_objects:o.select_set(True)
bpy.context.view_layer.objects.active=mesh_objects[0]
bpy.ops.export_scene.fbx(filepath=str(ART/'DojoSenbukan.fbx'),use_selection=True,object_types={'MESH'},axis_forward='-Z',axis_up='Y',apply_unit_scale=True,global_scale=1,bake_anim=False,path_mode='AUTO',use_mesh_modifiers=True)
tris=sum(len(p.vertices)-2 for o in mesh_objects for p in o.data.polygons)
metrics={'meshObjects':len(mesh_objects),'sourceMeshObjects':source_mesh_count,'triangles':tris,'materials':len(bpy.data.materials),'arenaMetres':[18,18],'sourceMetres':[110,110],'export':str(ART/'DojoSenbukan.fbx'),'status':'reference-adapted-main-hall-night'}
(OUT/'metrics.json').write_text(json.dumps(metrics,indent=2));print('DOJO_METRICS',json.dumps(metrics),flush=True)
if tris>100000:raise RuntimeError('Dojo exceeds 100k triangle budget')
scene.use_nodes=True
tree=scene.node_tree;tree.nodes.clear();layers=tree.nodes.new('CompositorNodeRLayers');glare=tree.nodes.new('CompositorNodeGlare');glare.glare_type='FOG_GLOW';glare.quality='MEDIUM';glare.threshold=1.8;glare.mix=-.88;composite=tree.nodes.new('CompositorNodeComposite');tree.links.new(layers.outputs['Image'],glare.inputs['Image']);tree.links.new(glare.outputs['Image'],composite.inputs['Image'])
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/dojo_senbukan.blend'))
bpy.ops.render.render(write_still=True)
print('DOJO_PREVIEW_READY',scene.render.filepath,flush=True)
