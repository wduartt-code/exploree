"""Itapema Vista — editable conceptual architecture, authored for Blender 4.5.
Run: Blender --background --factory-startup --python render_architecture.py -- brisa [draft]
All buildings and surrounding architecture are illustrative, not surveyed projects.
"""
import bpy, math, random, sys, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['brisa']
key=args[0] if args else 'brisa';draft='draft' in args
SPECS={'brisa':(24,82,'Brisa do Canto',0),'vista':(32,109,'Vista Central',1),'horizonte':(38,129,'Horizonte',2),'atlantico':(45,152,'Atlântico Sul',3)}
floors,height,title,variant=SPECS[key]
random.seed(31+variant)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=20 if draft else 48;scene.cycles.use_denoising=True
scene.cycles.max_bounces=7;scene.cycles.diffuse_bounces=3;scene.cycles.glossy_bounces=3;scene.cycles.transmission_bounces=4
scene.render.resolution_x=1280 if draft else 2560;scene.render.resolution_y=720 if draft else 1440;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.film_transparent=False
scene.render.threads_mode='FIXED';scene.render.threads=10
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=-1.35
# Materials: physically based glazing, limestone, brushed metal, concrete and water.
def material(name,col,rough=.5,metal=0,texture=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*col,1);m.use_nodes=True;n=m.node_tree.nodes;bs=n.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*col,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 if texture:
  noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=texture;noise.inputs['Detail'].default_value=3;noise.inputs['Roughness'].default_value=.65
  bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.16;bump.inputs['Distance'].default_value=.05;m.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],bs.inputs['Normal'])
 return m
stone=material('Warm limestone • microtexture',(.72,.68,.57),.53,texture=8)
white=material('Ivory architectural concrete',(.87,.86,.78),.42,texture=18)
wood=material('Natural teak',(.25,.12,.053),.43,texture=4)
metal=material('Champagne anodized aluminum',(.4,.35,.25),.25,.72)
black=material('Charcoal metal',(.035,.045,.043),.28,.6)
glass=material('Coastal blue reflective glazing',(.1,.24,.26),.14,.52)
rail=material('Clear balcony glazing',(.36,.55,.53),.1,.15);rail.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value=.6;rail.node_tree.nodes['Principled BSDF'].inputs['IOR'].default_value=1.45
warm=material('Warm interior curtains',(.66,.51,.3),.6)
asphalt=material('Road asphalt',(.095,.108,.108),.95,texture=30)
paving=material('Limestone paving',(.49,.49,.43),.85,texture=5)
grass=material('Coastal lawn',(.12,.22,.055),.95,texture=90)
leaf=material('Atlantic foliage',(.08,.19,.04),.8,texture=14)
leaf2=material('Light palm leaves',(.17,.28,.065),.78,texture=9)
trunk=material('Palm trunk bark',(.3,.25,.17),.85,texture=13)
sand=material('Warm beach sand',(.64,.59,.43),.8,texture=9)
water=material('Atlantic ocean',(.025,.22,.26),.17,.12);water.node_tree.nodes['Principled BSDF'].inputs['IOR'].default_value=1.333;water.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value=.2
n=water.node_tree.nodes;noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=.07;noise.inputs['Detail'].default_value=4;bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.25;bump.inputs['Distance'].default_value=.32;water.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);water.node_tree.links.new(bump.outputs['Normal'],n['Principled BSDF'].inputs['Normal'])
poolmat=material('Pool azure',(.04,.42,.48),.1,.2)
# Efficient linked primitives.
bpy.ops.mesh.primitive_cube_add();cube=bpy.context.object.data;bpy.data.objects.remove(bpy.context.object,do_unlink=True)
bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8);sphere=bpy.context.object.data;bpy.data.objects.remove(bpy.context.object,do_unlink=True)
meshes={}
def box(name,loc,scale,mat,bevel=0):
 mesh=cube.copy() if bevel else meshes.setdefault(mat.name,cube.copy())
 if not mesh.materials:mesh.materials.append(mat)
 o=bpy.data.objects.new(name,mesh);scene.collection.objects.link(o);o.location=loc;o.scale=tuple(v/2 for v in scale)
 if bevel:
  bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);mod=o.modifiers.new('Soft edges','BEVEL');mod.width=bevel;mod.segments=2;o.select_set(False)
 return o
spheres={}
def ball(name,loc,scale,mat):
 mesh=spheres.setdefault(mat.name,sphere.copy())
 if not mesh.materials:mesh.materials.append(mat)
 o=bpy.data.objects.new(name,mesh);scene.collection.objects.link(o);o.location=loc;o.scale=scale
 for poly in mesh.polygons:poly.use_smooth=True
 return o
# Ground / coastline. Architecturally illustrative environment.
box('Site base',(0,0,-1.4),(1700,1300,2),grass)
box('Ocean',(0,650,-.2),(2200,1100,.2),water)
box('Beach',(0,95,-.05),(2200,60,.25),sand)
box('Promenade',(0,60,.05),(1400,9,.45),paving)
box('Front avenue',(0,-46,.02),(1400,20,.2),asphalt)
box('Sidewalk',(0,-29,.12),(1400,13,.42),paving)
for x in range(-500,501,12):box('Road lane stripe',(x,-46,.135),(5,.18,.03),white)
# Landscape plan and podium.
box('Property paving',(0,0,.2),(84,67,.6),paving)
box('Limestone plinth',(0,5,1.2),(57,43,2.3),stone,.15)
box('Lobby glass',(0,5,5),(52,38,5.5),glass)
box('Podium fascia',(0,5,8),(58,44,1.1),white,.12)
box('Pool deck',(-21,8,8.8),(18,35,.5),wood,.08)
box('Raised pool edge',(-22,9,9.1),(11,24,.6),white,.12)
box('Pool surface',(-22,9,9.45),(9.7,22.7,.06),poolmat)
for i in range(10):box('Deck plank',(-21+i*1.6,8,9.08),(.035,34,.03),black)
# Lobby mullions, recessed entrances and vertical fins.
for x in range(-24,25,4):box('Lobby metal mullion',(x,-14.04,5),(.16,.18,5.5),metal)
box('Entrance canopy',(5,-20,5.9),(18,11,.7),white,.12)
for x in [-3,13]:box('Canopy column',(x,-24.2,2.8),(.35,.35,5.6),metal)
for x in [-24,-20,-16,20,24]:box('Podium stone fin',(x,-14.7,5),(.6,1.8,6),stone)
# Main tower with different massing per concept. All floors at human scale.
floorh=(height-12)/floors
for i in range(floors):
 z=10+i*floorh;w=28;d=23;shift=0
 if variant==1:w=29-i/floors*4;d=23-i/floors*2
 if variant==2:shift=math.sin(i*.14)*2
 if variant==3 and i>floors*.72:w=25;d=21
 box('Tower glazing',(shift,7,z+floorh/2),(w,d,floorh-.15),glass)
 box('Balcony slab',(shift,7,z),(w+4,d+4,.3),white)
 box('Balcony rail front',(shift,7-d/2-1.7,z+.8),(w+3.7,.07,1.25),rail)
 box('Balcony rail left',(shift-w/2-1.7,7,z+.8),(.07,d+3.7,1.25),rail)
 box('Balcony rail right',(shift+w/2+1.7,7,z+.8),(.07,d+3.7,1.25),rail)
 box('Handrail',(shift,7-d/2-1.7,z+1.45),(w+4,.06,.08),metal)
 for x in range(-12,13,4):
  if abs(x)<w/2:
   box('Facade mullion',(x+shift,7-d/2-.02,z+floorh/2),(.1,.12,floorh-.2),metal)
   if (i+x)%5==0:box('Interior warm curtain',(x+shift+1.2,7-d/2+.12,z+floorh/2),(2.1,.04,floorh-.45),warm)
 for side in [-1,1]:
  for y in [-7,-2,3,8]:box('Side mullion',(shift+side*(w/2+.02),y+7,z+floorh/2),(.12,.1,floorh-.2),metal)
 if i%5==0:
  box('Terrace planted box',(shift+w/2-3,7-d/2-1,z+.35),(5,1.5,.6),stone)
  for k in range(5):ball('Terrace planting',(shift+w/2-5+k,7-d/2-1,z+.8),(.65,.55,.55),leaf)
# Two strong vertical architectural spines.
for x in [-13.7,13.7]:box('Stone facade spine',(x,8,height/2+5),(1,20,height-7),stone)
box('Roof terrace',(0,7,height+.2),(32,27,1),white,.1)
box('Rooftop penthouse',(0,11,height+2.5),(20,17,4),glass)
box('Roof canopy',(0,10,height+5),(25,22,.7),stone,.12)
for x in range(-11,12,2):box('Roof pergola slat',(x,6,height+6),(.22,27,.3),wood)
# Pool furniture: loungers, slim tables and umbrellas.
for y in [-2,4,10,16]:
 box('Sun lounger',(-13.8,y,9.6),(2.1,3.5,.32),white,.08)
 back=box('Lounger back',(-13.8,y+1.1,10),(2.1,1.3,.22),white,.05);back.rotation_euler.x=math.radians(18)
for x,y in [(18,-4),(18,9),(18,20)]:
 box('Outdoor table',(x,y,9.65),(2.3,2.3,.18),wood,.05);box('Table base',(x,y,9.2),(.3,.3,.9),metal)
 for a in [0,math.pi/2,math.pi,math.pi*1.5]:box('Terrace chair',(x+math.cos(a)*1.6,y+math.sin(a)*1.6,9.4),(.8,.8,.3),white)
# Palms and broadleaf trees, each frond modelled rather than flat billboards.
def palm(x,y,z=0,h=10):
 for j in range(7):ball('Palm trunk',(x+j*.08,y,z+(j+.5)*h/7),(.21,.21,h/13),trunk)
 top=Vector((x+.5,y,z+h));
 for i in range(10):
  a=i*math.tau/10;rad=4.5;verts=[];faces=[]
  for j in range(9):
   t=j/8;dist=rad*t;center=top+Vector((math.cos(a)*dist,math.sin(a)*dist,1.5*math.sin(math.pi*t)-1.6*t));width=.55*math.sin(math.pi*t)+.035
   for side in [-1,1]:verts.append(center+Vector((-math.sin(a)*width*side,math.cos(a)*width*side,0)))
   if j:faces.append((2*j-2,2*j-1,2*j+1,2*j))
  mesh=bpy.data.meshes.new('Palm frond mesh');mesh.from_pydata(verts,[],faces);mesh.materials.append(leaf2);ob=bpy.data.objects.new('Palm frond',mesh);scene.collection.objects.link(ob)
for x,y,h in [(-36,-20,11),(-36,25,12),(36,-20,10),(36,25,12),(-27,-26,9),(27,-26,10),(-60,59,11),(60,59,12),(100,59,11),(-100,59,11)]:palm(x,y,.3,h)
for x in [-100,-77,-53,53,77,100]:
 box('Street planter',(x,-27,.4),(6,6,.7),stone,.1);box('Street tree trunk',(x,-27,2.8),(.5,.5,5),trunk)
 for j in range(9):a=j*2.4;ball('Broadleaf crown',(x+math.cos(a)*1.4,-27+math.sin(a)*1.4,5+random.random()*2),(1.8,1.6,1.7),leaf)
# Context towers: architectural massing in neighboring parcels.
for j,(x,y,h) in enumerate([(-90,13,46),(85,20,64),(-157,25,76),(153,18,53),(-220,15,58),(215,15,85),(-310,5,61),(330,20,71)]):
 mat=white if j%2 else stone;box('Context residence',(x,y,h/2),(27,27,h),glass)
 for z in range(3,h,3):box('Context balcony',(x,y,z),(29,29,.3),mat)
 for off in [-11,0,11]:box('Context facade',(x+off,y-13.7,h/2),(1,.8,h),mat)
# Human scale details: cars, pedestrians, bicycle racks.
colors=[material('Car pearl',(.75,.78,.76),.2,.65),material('Car graphite',(.045,.06,.07),.22,.6),material('Car sand',(.42,.35,.24),.25,.5)]
def car(x,y,col):
 box('Vehicle body',(x,y,1),(4.7,1.9,.85),col,.28);box('Vehicle cabin',(x-.1,y,1.7),(2.7,1.65,.9),glass,.23)
 for xx in [-1.5,1.5]:
  for yy in [-.95,.95]:ball('Tire',(x+xx,y+yy,.65),(.43,.13,.43),black)
for j,x in enumerate([-60,-14,38,90]):car(x,-41,colors[j%3])
clothes=[material('Clothing linen',(.7,.62,.46),.9),material('Clothing navy',(.025,.07,.12),.9),material('Clothing coral',(.56,.2,.12),.9)];skin=material('Human skin',(.44,.26,.15),.8)
for j,(x,y) in enumerate([(-8,-25),(11,-24),(17,-28),(-20,-29),(28,58),(-44,58)]):
 box('Pedestrian legs',(x,y,.46),(.3,.25,.85),clothes[j%3]);ball('Pedestrian torso',(x,y,1.18),(.27,.15,.4),clothes[j%3]);ball('Pedestrian head',(x,y,1.73),(.14,.14,.17),skin)
# Natural sky and grazing sunlight.
world=bpy.data.worlds.new('Coastal afternoon sky');scene.world=world;world.use_nodes=True;wn=world.node_tree.nodes;sky=wn.new('ShaderNodeTexSky');sky.sky_type='NISHITA';sky.sun_elevation=math.radians(28);sky.sun_rotation=math.radians(125);sky.air_density=1;sky.dust_density=.6;sky.ozone_density=1;world.node_tree.links.new(sky.outputs[0],wn['Background'].inputs['Color']);wn['Background'].inputs['Strength'].default_value=.35
sun=bpy.data.lights.new('Warm afternoon sun','SUN');sun.energy=2;sun.angle=math.radians(3);so=bpy.data.objects.new('Warm afternoon sun',sun);scene.collection.objects.link(so);so.rotation_euler=(math.radians(38),math.radians(-20),math.radians(-25))
# Camera chosen for complete building and space for the product information panel.
bpy.ops.object.camera_add();camera=bpy.context.object;camera.name='Hero camera';scene.camera=camera
k=max(height/105,1);camera.location=(130*k,-205*k,65*k);target=Vector((24,6,height*.45));direction=target-camera.location;camera.rotation_euler=direction.to_track_quat('-Z','Y').to_euler();camera.data.lens=36;camera.data.clip_end=5000
camera.data.dof.use_dof=False
# A gentle photographic bloom for highlights.
scene.use_nodes=True;nodes=scene.node_tree.nodes;nodes.clear();rl=nodes.new('CompositorNodeRLayers');glare=nodes.new('CompositorNodeGlare');glare.glare_type='FOG_GLOW';glare.quality='MEDIUM';glare.threshold=2;glare.mix=-.95;out=nodes.new('CompositorNodeComposite');scene.node_tree.links.new(rl.outputs['Image'],glare.inputs['Image']);scene.node_tree.links.new(glare.outputs['Image'],out.inputs['Image'])
scene['project_title']=title;scene['content_note']='Fictional concept architecture for Itapema Vista; surroundings illustrative.'
output=ROOT/'dist'/'renders'/'architecture'/f'{key}{"-draft" if draft else ""}.png';scene.render.filepath=str(output)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'production'/'blender'/f'{key}.blend'))
bpy.ops.render.render(write_still=True)
print('ARCHITECTURE_RENDER_COMPLETE',output)
