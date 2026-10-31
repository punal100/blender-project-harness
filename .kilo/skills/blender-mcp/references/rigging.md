---
title: Rigging
summary: Armatures from Python, Rigify for characters, skinning with automatic weights and how to fix it, and verifying deformation.
---

# Rigging

## Before rigging

- Inspect existing transforms, animation, constraints, and rig conventions before changing them.
  Applied scale and aligned mesh/rig transforms often help, but world origin, ground placement, and
  facing -Y are conventions, not universal automatic-weight requirements. Do not move or apply
  transforms to an existing rig without assessing the impact.
- Merge duplicate vertices (`bmesh.ops.remove_doubles`) and remove loose parts. Generated meshes
  are often many disconnected islands, which makes automatic weights fail.
- Characters rig best in A-pose or T-pose with a bit of bend at elbows and knees.

## Humanoids: Rigify

All operators below MUST follow `bpy.md`: verify required mode, exact targets, and `poll()`;
use a viewport override only when required. Any actual selection/active-object changes MUST be
saved and restored in `finally`. Edit bones MUST be accessed only in Edit Mode.

```python
import addon_utils
addon_utils.enable("rigify", default_set=False)  # when enabling it is authorized
bpy.ops.object.armature_human_metarig_add()     # needs a 3D viewport override
metarig = bpy.context.active_object
```

1. Scale and move the metarig to fit the mesh (edit bones: `metarig.data.edit_bones["spine"].head`),
   aligning joints with the mesh's joints. Check against the mesh with `look(mode="angles", shading="xray", views=["front","right"])`.
2. Generate: with the metarig active, `bpy.ops.pose.rigify_generate()`. Inspect the actual generated
   rig instead of assuming a fixed name. Preserve the metarig for regeneration.
3. Skin to the generated rig, not the metarig.

## Simple or non-humanoid rigs

Build bones directly in Edit Mode, starting from Object Mode. This example temporarily changes
actual selection, so restoration is mandatory even if bone creation fails:

```python
if bpy.context.mode != "OBJECT":
    raise RuntimeError("Rig creation requires Object Mode")
view_layer = bpy.context.view_layer
saved_selection = [o for o in view_layer.objects if o.select_get()]
saved_active = view_layer.objects.active
arm_data = bpy.data.armatures.new("Rig"); rig = bpy.data.objects.new("Rig", arm_data)
bpy.context.scene.collection.objects.link(rig)
try:
    for selected in saved_selection:
        selected.select_set(False)
    rig.select_set(True)
    view_layer.objects.active = rig
    if not bpy.ops.object.mode_set.poll():
        raise RuntimeError("Cannot enter Edit Mode for the new rig")
    try:
        bpy.ops.object.mode_set(mode="EDIT")
        root = arm_data.edit_bones.new("root"); root.head = (0, 0, 0); root.tail = (0, 0.3, 0)
        b = arm_data.edit_bones.new("arm"); b.head = (0, 0, 1); b.tail = (0, 0, 2); b.parent = root
    finally:
        if rig.mode != "OBJECT":
            if not bpy.ops.object.mode_set.poll():
                raise RuntimeError("Cannot leave Edit Mode; stop and report the current state")
            bpy.ops.object.mode_set(mode="OBJECT")
finally:
    rig.select_set(False)
    for selected in saved_selection:
        selected.select_set(True)
    view_layer.objects.active = saved_active
```

Mechanical things (doors, wheels, robots) often suit rigid bone parenting. Set the parent, bone, and
parent inverse while preserving the intended world transform; direct parent assignment can move parts.

## Skinning

For automatic weights, MUST isolate the intended mesh and armature, with the armature active.
This override leaves actual user selection unchanged; selecting the mesh alone would retain
unrelated selected objects and can reparent them:

```python
if bpy.context.mode != "OBJECT" or mesh.type != "MESH" or rig.type != "ARMATURE":
    raise RuntimeError("Automatic weights require Object Mode, a mesh, and an armature")
targets = [mesh, rig]
if any(o not in bpy.context.editable_objects or o not in bpy.context.selectable_objects
       for o in targets):
    raise RuntimeError("Skinning targets must be editable and selectable")
with bpy.context.temp_override(object=rig, active_object=rig,
                               selected_objects=targets, selected_editable_objects=targets):
    if not bpy.ops.object.parent_set.poll():
        raise RuntimeError("parent_set is unavailable in this context")
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
```

If Blender reports "Bone Heat Weighting: failed to find solution for one or more bones":

- Merge by distance and remove interior faces, then retry.
- Or skin a voxel-remeshed copy, then transfer weights to the original with a Data Transfer
  modifier (vertex groups, nearest face interpolated) and apply it.
- If scale contributes to failure, test larger scale on a copy while preserving transforms and rig
  relationships; do not rescale the original rig as a blind repair.

## Verify

`get_scene_info(fields=["weights"], query="Body")` reports vertices no deform bone moves and deform
bones with no vertex group. Investigate unweighted vertices and unused groups against the intended
deformation; intentionally unused deform bones are possible. Save existing pose transforms before
testing a controller whose actual name was inspected:

```python
pb = rig.pose.bones["upper_arm_fk.L"]; pb.rotation_mode = "XYZ"; pb.rotation_euler.x = 1.2
```

`look(mode="angles", target=["Body"])` and check elbows, shoulders, knees and hips for collapsing
or stretching. Restore the saved pose transforms afterward; do not clear the user's original pose.

## Sources

- https://docs.blender.org/manual/en/5.0/addons/rigging/rigify/introduction.html
- https://docs.blender.org/manual/en/5.0/addons/rigging/rigify/basics.html
- https://docs.blender.org/api/current/info_gotchas_armatures_and_bones.html
- https://raw.githubusercontent.com/blender/blender/v5.0.0/source/blender/editors/object/object_relations.cc
