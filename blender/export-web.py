"""Export the authored Senbukan FBX assets to portable, verified browser GLBs.

Run: blender --background --python blender/export-web.py
The original Blender/Unity sources are read-only inputs.  Runtime consumers load
the GLB scene at scale 1, facing +Z, with its feet placed at the arena floor.
"""

import hashlib
import json
import math
import struct
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "unity/SenbukanPrototype/Assets/Senbukan/Art"
OUTPUT = ROOT / "src/assets/senbukan/3d"
CLIPS = (
    "idle", "walk", "run", "punch1", "punch2", "punch3", "kick",
    "guard", "hit", "jump", "dash", "transform", "down",
)
FPS = 30


def fresh_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = FPS
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1


def glb_document(path):
    data = path.read_bytes()
    magic, version, size = struct.unpack_from("<4sII", data)
    assert magic == b"glTF" and version == 2 and size == len(data)
    length, kind = struct.unpack_from("<II", data, 12)
    assert kind == 0x4E4F534A
    doc = json.loads(data[20:20 + length])
    assert not any("uri" in x for x in doc.get("buffers", []))
    assert not doc.get("images"), "These assets must not depend on texture files"
    return doc


def material_settings():
    # All authored materials use solid base colours, with optional neon emission.
    # Do not let FBX's generic blend defaults turn the whole mesh transparent.
    for material in bpy.data.materials:
        material.use_backface_culling = False
        if material.use_nodes:
            for node in material.node_tree.nodes:
                if node.type == "BSDF_PRINCIPLED":
                    node.inputs["Alpha"].default_value = 1


def export_selected(path, animated):
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_animations=animated,
        export_animation_mode="ACTIONS",
        export_anim_single_armature=True,
        export_frame_range=False,
        export_frame_step=1,
        export_force_sampling=True,
        export_anim_slide_to_zero=True,
        export_nla_strips=True,
        export_optimize_animation_size=True,
        export_skins=True,
        export_all_influences=False,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_extras=False,
    )
    assert path.stat().st_size < 10_000_000
    doc = glb_document(path)
    assert all(m.get("alphaMode", "OPAQUE") == "OPAQUE" for m in doc.get("materials", []))
    return doc


def character(source_name, output_name, target_height):
    fresh_scene()
    bpy.ops.import_scene.fbx(filepath=str(SOURCE / (source_name + ".fbx")))
    rig = next(o for o in bpy.context.scene.objects if o.type == "ARMATURE")
    body = next(o for o in bpy.context.scene.objects if o.type == "MESH")
    assert len([o for o in bpy.context.scene.objects if o.type == "MESH"]) == 1
    assert len(rig.data.bones) == 20

    actions = {}
    removed_constant_object_channels = 0
    for action in list(bpy.data.actions):
        short = next((name for name in CLIPS if action.name.endswith("_" + name)), None)
        assert short is not None, action.name
        assert short not in actions
        action.name = short
        action.use_fake_user = True
        # The FBX exporter includes constant object channels as well as bone
        # animation.  They have no motion and must not override the model pivot.
        for curve in list(action.fcurves):
            if not curve.data_path.startswith("pose.bones["):
                values = [curve.evaluate(point.co.x) for point in curve.keyframe_points]
                assert not values or max(values) - min(values) < 0.00001
                action.fcurves.remove(curve)
                removed_constant_object_channels += 1
        actions[short] = action
    assert set(actions) == set(CLIPS)
    rig.animation_data.action = None
    for track in list(rig.animation_data.nla_tracks):
        rig.animation_data.nla_tracks.remove(track)
    # Explicit action stashes keep clips discoverable across Blender exporter
    # versions (and provide the exact exported clip names).
    for short in CLIPS:
        action = actions[short]
        track = rig.animation_data.nla_tracks.new()
        track.name = short
        track.strips.new(short, int(action.frame_range[0]), action)
        track.mute = True

    # A single nonanimated parent normalizes the bind height.  Skinning and all
    # animation curves stay in the authored rig space; no framewise rescaling.
    rig.data.pose_position = "REST"
    bpy.context.view_layer.update()
    points = [body.matrix_world @ Vector(p) for p in body.bound_box]
    low = min(v.z for v in points)
    high = max(v.z for v in points)
    uniform_scale = target_height / (high - low)
    normalizer = bpy.data.objects.new(source_name + "_Model", None)
    bpy.context.scene.collection.objects.link(normalizer)
    normalizer.scale = (uniform_scale,) * 3
    normalizer.location = (0, 0, -low * uniform_scale)
    rig.parent = normalizer
    rig.matrix_parent_inverse = Matrix.Identity(4)
    rig.data.pose_position = "POSE"
    rig.animation_data.action = actions["idle"]
    bpy.context.scene.frame_set(1)
    material_settings()
    bpy.ops.object.select_all(action="DESELECT")
    for obj in (normalizer, rig, body):
        obj.select_set(True)
    bpy.context.view_layer.objects.active = rig
    path = OUTPUT / output_name
    doc = export_selected(path, True)
    exported = {a["name"]: a for a in doc["animations"]}
    assert set(exported) == set(CLIPS), list(exported)
    assert len(doc.get("skins", [])) == 1
    durations = {}
    for name, animation in exported.items():
        durations[name] = round(max(
            doc["accessors"][sampler["input"]]["max"][0]
            for sampler in animation["samplers"]
        ), 6)
    return {
        "file": output_name,
        "source": str((SOURCE / (source_name + ".fbx")).relative_to(ROOT)),
        "bodyHeightMeters": target_height,
        "pivot": "feet at y=0; hip x/z origin preserved",
        "forward": "+Z",
        "normalizationAppliedInAsset": {
            "uniformScale": uniform_scale,
            "sourceRestHeightMeters": high - low,
            "sourceRestMinZ": low,
            "removedConstantObjectAnimationChannels": removed_constant_object_channels,
        },
        "runtimeScale": 1,
        "runtimeRotationY": 0,
        "clipDurationsSeconds": {name: durations[name] for name in CLIPS},
    }


def environment():
    fresh_scene()
    bpy.ops.import_scene.fbx(filepath=str(SOURCE / "DojoSenbukan.fbx"), use_anim=False)
    material_settings()
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj.select_set(True)
    path = OUTPUT / "dojo.glb"
    doc = export_selected(path, False)
    assert not doc.get("animations")
    assert not doc.get("cameras")
    return {
        "file": path.name,
        "source": str((SOURCE / "DojoSenbukan.fbx").relative_to(ROOT)),
        "floorY": 0.19,
        "woodSurfaceY": 0.1875,
        "clearArenaSizeMeters": [18, 18],
        "runtimeScale": 1,
        "runtimeRotationY": 0,
    }


def bounds_for(meshes):
    points = [o.matrix_world @ Vector(p) for o in meshes for p in o.bound_box]
    return [[round(min(p[i] for p in points), 6), round(max(p[i] for p in points), 6)] for i in range(3)]


def verify(path, animated):
    fresh_scene()
    bpy.ops.import_scene.gltf(filepath=str(path))
    rigs = [o for o in bpy.context.scene.objects if o.type == "ARMATURE"]
    # The Blender importer creates an Icosphere as a bone display shape.  It is
    # not exported geometry and has no skin weights by design.
    bone_shapes = {
        bone.custom_shape for rig in rigs for bone in rig.pose.bones
        if bone.custom_shape is not None
    }
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH" and o not in bone_shapes]
    triangles = 0
    for mesh in meshes:
        mesh.data.calc_loop_triangles()
        triangles += len(mesh.data.loop_triangles)
    result = {
        "roundtrip": "Blender 4.3.2 glTF import",
        "meshes": len(meshes),
        "armatures": len(rigs),
        "triangles": triangles,
        "materials": len(bpy.data.materials),
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }
    if not animated:
        assert len(meshes) == 26, len(meshes)
        assert triangles == 46056, triangles
        assert not rigs
        result["boundsBlenderZUp"] = bounds_for(meshes)
        floor = next(o for o in meshes if o.name.startswith("Floor_Arena"))
        floor_bounds = bounds_for([floor])
        result["baseFloorBoundsBlenderZUp"] = floor_bounds
        assert abs(floor_bounds[2][1] - .13) < .001
        surface_points = [
            mesh.matrix_world @ vertex.co
            for mesh in meshes for vertex in mesh.data.vertices
            if abs((mesh.matrix_world @ vertex.co).z - .1875) < .0001
        ]
        assert len(surface_points) > 100
        result["woodSurfaceY"] = .1875
        result["combatFloorY"] = .19
        result["woodSurfaceVertices"] = len(surface_points)
        return result

    assert len(rigs) == 1
    rig = rigs[0]
    assert len(rig.data.bones) == 20
    result["bones"] = len(rig.data.bones)
    result["unweightedVertices"] = sum(
        not any(g.weight > 0 for g in vertex.groups)
        for mesh in meshes for vertex in mesh.data.vertices
    )
    assert result["unweightedVertices"] == 0
    rig.data.pose_position = "REST"
    bpy.context.view_layer.update()
    result["restBoundsBlenderZUp"] = bounds_for(meshes)
    rig.data.pose_position = "POSE"
    if rig.animation_data:
        for track in rig.animation_data.nla_tracks:
            track.mute = True
    movements = {}
    for action in bpy.data.actions:
        short = next((name for name in CLIPS if action.name == name or action.name.startswith(name + "_")), None)
        assert short, action.name
        rig.animation_data_create().action = action
        start, end = action.frame_range
        positions = []
        for mix in (0, .28, .5, .72, 1):
            frame = start + (end - start) * mix
            bpy.context.scene.frame_set(int(frame), subframe=frame - int(frame))
            bpy.context.view_layer.update()
            positions.append({
                name: rig.matrix_world @ rig.pose.bones[name].tail
                for name in ("Hand.L", "Hand.R", "Foot.L", "Foot.R", "Head")
            })
        movements[short] = {
            name: round(max((a[name] - b[name]).length for a in positions for b in positions), 6)
            for name in positions[0]
        }
    assert set(movements) == set(CLIPS)
    assert all(max(travel.values()) > .003 for travel in movements.values())
    assert max(movements["walk"][n] for n in ("Foot.L", "Foot.R")) > .10
    for clip in ("punch1", "punch2", "punch3"):
        assert max(movements[clip][n] for n in ("Hand.L", "Hand.R")) > .08
    result["sampledJointTravelMeters"] = movements
    return result


OUTPUT.mkdir(parents=True, exist_ok=True)
manifest = {
    "format": "glTF 2.0 binary",
    "exporter": "Blender 4.3.2 glTF 2.0",
    "coordinateSystem": {"units": "meters", "up": "+Y", "forward": "+Z"},
    "runtimePlacement": "Load each scene at scale 1; place fighter scene root at arena floorY. Do not renormalize per frame or per clip.",
    "caetano": character("Caetano", "caetano.glb", 1.83),
    "student": character("DojoStudent", "dojo-student.glb", 1.78),
    "dojo": environment(),
}
print("GLBS_EXPORTED", flush=True)
for key in ("caetano", "student", "dojo"):
    metadata = manifest[key]
    metadata["validation"] = verify(OUTPUT / metadata["file"], key != "dojo")
(OUTPUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print("WEB_ASSETS_VERIFIED", json.dumps({key: manifest[key]["validation"]["bytes"] for key in ("caetano", "student", "dojo")}), flush=True)
