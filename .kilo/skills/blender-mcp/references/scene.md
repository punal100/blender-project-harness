---
title: Scene design
summary: Building a believable scene - scale, grounding, composition, choosing between generated and library assets, lighting and camera.
---

# Scene design

## Workflow

1. `get_scene_info` — know what's there and the scene's scale before adding anything.
2. Block out with primitives at real-world size: the layout, the big shapes, the camera.
   `look(mode="camera")` or `look(mode="angles")` to check proportions before spending on assets.
3. Replace blockout pieces with real assets, biggest and most visible first.
4. Light, then set materials, then dress with small props.
5. Judge the image, not your intentions: is anything
   floating, clipping, the wrong size, or hidden from camera?

## Getting assets

MUST read [`blender-assets`](../../blender-assets/SKILL.md) before external asset work and follow
the asset-type branches in `../SKILL.md`. Model size/support checks below do not apply to HDRI
worlds or texture materials; those require lighting/material inspection instead.

- **Import locally** with the harness `import_asset` operation after the file is registered under
  `assets/external/<source>/<asset>/`; use `link_library` for `.blend` libraries. Use
  `blender_workflow {action:"intake"}` to copy user files and create the register and sidecars. The
  raw `blender_import_asset` and `blender_generate_3d` tools stay blocked.
- **Poly Haven** (`search_assets(source="polyhaven")`): HDRIs, PBR textures for large surfaces
  (floors, walls, terrain), and generic realistic props. CC0.
- **Sketchfab**: specific real-world things (a named car model, a landmark), and realistic props.
  Check the licence and face count in results.
- **Poly Pizza**: stylised low-poly props, fast and light. Credit CC-BY creators.
- **Script it** only through reviewed harness operations; arbitrary project Python is blocked.

Match the confirmed style. Mixed low-poly and photoreal assets can be intentional; do not impose a
style restriction that the user has not confirmed.

## After every model import

Imported models arrive at arbitrary scale, rotation and origin. Inspect the imported parent or child
bounds with `get_scene_info`; use those facts:

- Scale to real size from the bounding box, not by eye.
- Place it on its intended support surface. For an unparented object on world Z=0,
  `obj.location.z -= min_z` uses the world bounding box minimum. Account for parent transforms.
- Rotate it to face the right way; generators usually face -Y or +Y. Check with
  `look(mode="angles", target=[name])`.
- Check it doesn't intersect its neighbours.

## Composition

- Decide the camera early and compose for it; set `scene.camera`, focal length 35–50 mm for
  natural views, 85 mm+ for product shots, 24 mm or wider for interiors.
- Foreground, midground, background. Leave negative space. Rule of thirds for the subject.
- Vary scale and rotation of repeated props slightly; perfect grids read as fake.
- Ground contact sells realism: props sit on surfaces, small things cluster against larger ones.

## Lighting

- Start with an HDRI from Poly Haven for ambient light and reflections; set its strength
  (0.5–1.5), then add a key light (sun or area) for shape and shadows.
- Three-point for products: key, fill at lower power, rim behind.
- Interiors: area lights in windows (portals in Cycles) plus practicals (lamps with emission).
- Check with `look(mode="camera", shading="rendered")` for EEVEE or Workbench. For Cycles, render
  and inspect `look(image="Render Result")`. Investigate exposure, lighting, materials, and intended
  contrast instead of treating every black or white area as a lighting error.

## Render settings

Read the current engine rather than setting one blindly (see `bpy.md`). For quick
previews keep samples low; raise them only for the final render.
