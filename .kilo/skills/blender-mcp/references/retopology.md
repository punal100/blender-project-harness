---
title: Retopology and mesh cleanup
summary: Turning generated or scanned meshes into clean, lighter geometry - cleanup, remeshing, decimation, UVs and baking detail back.
---

# Retopology and mesh cleanup

Generated and scanned models are dense, triangulated, and often non-manifold. What to do depends
on where the mesh is going:

| Goal | Approach |
|---|---|
| Still render, background prop | Leave it; maybe Decimate |
| Game prop | Decimate or remesh, then bake normals from the original |
| Deforming character | Quad remesh (QuadriFlow), clean loops at joints, then rig |
| 3D print | Voxel remesh for a watertight solid |

Always work on a copy and keep the original as the bake source: `low = src.copy(); low.data = src.data.copy()`.

## Diagnose

`get_scene_info(fields=["topology"], query=name)` reports quads, tris, ngons, non-manifold edges,
boundary edges, loose vertices and poles; `look(mode="angles", shading="wireframe", target=[name])`
shows the edges.

## Clean up

MUST verify mesh type and mode before editing. This standalone BMesh example requires Object Mode;
MUST NOT use it against Edit Mode's separate mesh data. Thresholds below are examples, not defaults
for every asset. MUST free an owned standalone BMesh in `finally`, including on failure.

```python
import bmesh
if obj.type != "MESH" or obj.mode != "OBJECT" or obj.data.is_editmode:
    raise RuntimeError("Standalone BMesh cleanup requires an Object Mode mesh")
if not obj.data.is_editable or obj.data.users != 1:
    raise RuntimeError("Cleanup requires an editable single-user mesh copy")
bm = bmesh.new()
try:
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0001)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=0.0001)
    loose = [v for v in bm.verts if not v.link_edges]
    bmesh.ops.delete(bm, geom=loose, context="VERTS")
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(obj.data)
finally:
    bm.free()
```

For authorized Edit Mode cleanup instead, MUST verify `obj.mode == "EDIT"` and
`obj.data.is_editmode`, use `bm = bmesh.from_edit_mesh(obj.data)`, and update with
`bmesh.update_edit_mesh(obj.data, loop_triangles=True, destructive=True)` after topology changes.
This BMesh is owned by Blender: MUST NOT call `to_mesh()` or `free()` on it. Reacquire it after mode
changes; do not reuse stale references. MUST apply the operator context rules in `bpy.md` to remesh,
UV, and bake operators below, including exact selection, mode, `poll()`, and restoration.

## Reduce

- **Decimate** reduces faces with shape changes. Inspect the silhouette, UVs, seams, and triangulation:
  `m = obj.modifiers.new("Decimate", "DECIMATE"); m.ratio = 0.1`. Planar mode (`decimate_type="DISSOLVE"`)
  is good for hard-surface.
- **Voxel remesh** makes a watertight, even mesh but loses UVs and sharp edges:
  `obj.data.remesh_voxel_size = 0.01; bpy.ops.object.voxel_remesh()` (active object needed).
  Size relative to the object: ~1/200 of its largest dimension is a sane start.
- **QuadriFlow** produces quads but does not guarantee animation-ready loops:
  `bpy.ops.object.quadriflow_remesh(target_faces=4000)`. It is slow on dense input and can fail on
  non-manifold meshes — voxel remesh first, then QuadriFlow the result.
- **Shrinkwrap** a low mesh onto the high one (`modifiers.new("Shrinkwrap", "SHRINKWRAP")`,
  `target = high`) to recover the silhouette after remeshing.

Example face budgets: hero game character 15–50k tris, prop 500–5k, background 50–500. Confirm actual
platform, camera distance, deformation, and performance targets; these are not acceptance limits.

## UVs

```python
# in edit mode with everything selected, via a 3D viewport override
bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.02)
```

For characters mark seams along hidden edges first (`edge.seam = True` in bmesh), then
`bpy.ops.uv.unwrap()`.

## Bake detail back

Bake normals (and colour) from the original high mesh to the low one's UVs, in Cycles:

1. Create an image (`bpy.data.images.new("Low_Normal", 2048, 2048, is_data=True)`) and an Image
   Texture node using it in the low mesh's material, set as the active node.
2. Select high, make low active; `scene.render.bake.use_selected_to_active = True`,
   `cage_extrusion` ~1–2% of the object size.
3. `bpy.ops.object.bake(type="NORMAL")`; for colour use `type="DIFFUSE"` with only the colour pass.
4. Save the image, wire it into a Normal Map node, and compare with `look(mode="angles")`.

Switching the engine to Cycles for the bake: read the current engine first and restore it after
(see `bpy.md`).

## Sources

- https://docs.blender.org/manual/en/5.0/modeling/modifiers/generate/decimate.html
- https://docs.blender.org/manual/en/5.0/modeling/meshes/retopology.html
- https://docs.blender.org/api/current/info_gotchas_meshes.html
- https://docs.blender.org/api/current/bmesh.html
