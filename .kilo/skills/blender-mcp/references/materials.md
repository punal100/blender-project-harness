---
title: Materials and texturing
summary: Node-based materials that survive version and language changes, applying Poly Haven textures, real-world tiling, and procedural looks.
---

# Materials and texturing

## Creating materials

```python
mat = bpy.data.materials.new("Brushed Steel")
if bpy.app.version < (5, 0, 0):
    mat.use_nodes = True
bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
bsdf.inputs["Base Color"].default_value = (0.6, 0.6, 0.62, 1)
bsdf.inputs["Metallic"].default_value = 1.0
bsdf.inputs["Roughness"].default_value = 0.35
obj.data.materials.clear(); obj.data.materials.append(mat)
```

Sockets renamed in 4.0; resolve them defensively (`inputs.get("Emission Color") or inputs.get("Emission")`).

## Believable values

| Material | Base colour (linear) | Metallic | Roughness |
|---|---|---|---|
| Painted wall | 0.5–0.7 grey | 0 | 0.8–0.9 |
| Wood (varnished) | textured | 0 | 0.3–0.5 |
| Plastic | any | 0 | 0.3–0.6 |
| Polished metal | 0.9 | 1 | 0.05–0.2 |
| Rubber | 0.02–0.05 | 0 | 0.8 |
| Glass | white | 0 | 0; Transmission 1, IOR 1.45 |

These ranges are starting points for common materials, not physical limits or requirements.
Match measured/reference values, colour space, and the confirmed look.

## Textures

- Poly Haven textures come as PBR sets. `import_asset(source="polyhaven", asset_type="textures", id=...,
  apply_to=["Floor"])` builds the material and applies it in one call.
- Tiling: the import result gives the texture's real-world size. For 0–1 UVs across a surface,
  Mapping node Scale = surface size in metres / texture size in metres. Prefer large-coverage
  textures (`min_size_m` in search) for walls and floors; small ones repeat visibly.
- Objects need UVs. Primitives have them; scripted meshes need `smart_project` or box-projection
  (`Texture Coordinate > Object` into Mapping, and the Image Texture node's projection `BOX`).
- Treat roughness, metallic, and normal maps as non-colour data. Query available colour
  space names before assigning `img.colorspace_settings.name = "Non-Color"`.

## Procedural

Noise, Voronoi and Wave textures through a Color Ramp make variation without images: grunge for
roughness, stains, wood rings. Mixing a little noise into roughness makes any flat material look
less CG. Look each node up before indexing its sockets (see `bpy.md`).

## Check it

Shader node material colours show in Material Preview or Rendered shading:
`look(mode="camera", shading="material")` or `shading="rendered"`. Solid shading shows only the
viewport display colour. Rendered `look` is supported for EEVEE and Workbench; inspect a saved render
or `Render Result` for Cycles.

## Sources

- https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/principled.html
- https://developer.blender.org/docs/release_notes/5.0/python_api/#shading
