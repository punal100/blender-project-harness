---
title: Version-aware bpy scripting
summary: Version-aware scripting, API introspection, operator context, and the mistakes that break scripts on other people's machines.
---

# Version-aware bpy scripting

Scripts run in the user's live Blender, whose version, language and add-ons you don't know.
`get_addon_status` reports `blender_version`; check it before using anything version-specific.

## Look things up instead of guessing

Introspect with RNA before indexing sockets or setting enums:

```python
# Values of a static enum property
[i.identifier for i in bpy.types.Keyframe.bl_rna.properties["interpolation"].enum_items]
# Properties of a type
[p.identifier for p in bpy.types.ShaderNodeTexSky.bl_rna.properties]
# Operator arguments
[(p.identifier, p.type) for p in bpy.ops.mesh.primitive_cube_add.get_rna_type().properties]
# A node's sockets, in the mode you intend to use
tree = bpy.data.node_groups.new("_probe", "ShaderNodeTree")
n = tree.nodes.new("ShaderNodeMix"); n.data_type = "RGBA"
print([(i, s.name, s.type) for i, s in enumerate(n.inputs) if s.enabled])
bpy.data.node_groups.remove(tree)
```

## Portability rules

- Find nodes by `type`, never by name: names are localized. `next(n for n in nodes if n.type == "BSDF_PRINCIPLED")`.
- Address sockets by name only after checking they exist in this version (Principled BSDF renamed
  many inputs in 4.0: `Emission Color`, `Subsurface Weight`, `Specular IOR Level`, `Coat Weight`,
  `Sheen Weight`, `Transmission Weight`). `sock = node.inputs.get("Emission Color") or node.inputs.get("Emission")`.
- Never guess enum identifiers; inspect them before assigning. Dynamic enum listings MUST NOT be
  treated as complete. `scene.render.engine` is a dynamic enum that RNA under-reports; MUST read
  the current value, and if switching is required, assign the requested engine inside
  `try/except TypeError` — the error lists every accepted value. EEVEE is `BLENDER_EEVEE_NEXT` in
  4.2–4.5 and `BLENDER_EEVEE` in 5.0; older releases also use `BLENDER_EEVEE`. Query later versions.
- Material colors live on shader node inputs. `material.diffuse_color` only drives the solid
  viewport when material colour is selected. In 5.0 `material.use_nodes` is deprecated and always on;
  it is scheduled for removal in 6.0. Do not rely on toggling it.
- Animation data changed in 4.4 (slotted actions) and 5.0 removed `Action.fcurves`. Insert keys with
  `obj.keyframe_insert("location", frame=f)` for supported animatable properties. For layered actions,
  use `bpy_extras.anim_utils.action_get_channelbag_for_slot(action, obj.animation_data.action_slot)`;
  use `action.fcurves` for legacy actions. See `animation.md` for the compatibility branch.

## Data API over operators

Prefer `bpy.data` and object properties over `bpy.ops`: they need no context and are faster.
`bpy.data.meshes.new` + `from_pydata`, `bmesh` for editing, `obj.modifiers.new`, `obj.matrix_world`.

When you need an operator:

- MUST verify the required mode, editable targets, exact operator selection, and `poll()` before
  execution. For example, this Object Mode shading operation overrides both selection members
  without changing the user's actual selection:
  ```python
  if bpy.context.mode != "OBJECT" or obj.type != "MESH":
      raise RuntimeError("Shading requires Object Mode and a mesh")
  if obj not in bpy.context.editable_objects or obj not in bpy.context.selectable_objects:
      raise RuntimeError("Target must be editable and selectable in the current view layer")
  with bpy.context.temp_override(object=obj, active_object=obj,
                                 selected_objects=[obj], selected_editable_objects=[obj]):
      if not bpy.ops.object.shade_smooth.poll():
          raise RuntimeError("shade_smooth is unavailable in this context")
      bpy.ops.object.shade_smooth()
  ```
- Code runs from a timer, not a UI area. Operators that require a viewport MUST use a verified
  `VIEW_3D` area and its `WINDOW` region in a matching window override; shading above needs neither.
- `selected_objects` and `selected_editable_objects` are distinct context members; overriding only
  one does not isolate an operator that reads the other. Some operators read actual selection too.
  If actual selection must change, MUST save selection and active object, select only intended
  targets, and restore both in `finally`. Adding `obj.select_set(True)` alone is insufficient.
- `mode_set` needs an active, visible, selectable object. MUST check its `poll()` before each mode
  switch and return to OBJECT mode in `finally` after a temporary Edit Mode step. If the starting
  mode is unexpected, stop before mutating data rather than silently leaving the user's mode.

## Working style

- Small steps. Run a chunk and `print` what you need to know.
- Name everything you create; later steps and the user refer to it by name.
- Keep the scene organized: one collection per logical group (`bpy.data.collections.new`, link
  to `scene.collection`).
- Assess scale before rigging, scale-sensitive modifiers, or export. Applying transforms can alter
  rigs, animation, constraints, and shared mesh data; follow the confirmed pipeline.
- Duplicate with `obj.copy()` (shares mesh data, cheap) for repeated props; `obj.data.copy()` only
  when the copy must differ.
- Read `scene.unit_settings` and `scale_length`; do not assume one Blender unit equals one metre.
  A door around 2.1 m, table around 0.75 m, and person around 1.7 m are scale references only.

## Sources

- https://docs.blender.org/api/current/info_gotchas_operators.html
- https://docs.blender.org/api/current/bpy.types.Context.html
- https://raw.githubusercontent.com/blender/blender/v5.0.0/source/blender/editors/object/object_edit.cc
- https://developer.blender.org/docs/release_notes/5.0/python_api/
