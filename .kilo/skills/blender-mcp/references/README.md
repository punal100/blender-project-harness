# Blender MCP references

Workflow guides for `blender-mcp`. Load only the guide relevant to the current task.

These files are adapted from the guides shipped with
[mcp-for-blender](https://github.com/ahujasid/mcp-for-blender) under the MIT License;
local changes add version checks, safety and approval rules, and workspace-specific
guidance. Full attribution and the upstream licence text are in
[`THIRD_PARTY_NOTICES.md`](../../../../THIRD_PARTY_NOTICES.md).

| File | Topic | Upstream guide |
|---|---|---|
| `bpy.md` | Version-aware Python API use, context overrides, data API | `src/blender_mcp/guides/bpy.md` |
| `scene.md` | Scene assembly, imports, composition, lighting | `src/blender_mcp/guides/scene.md` |
| `materials.md` | Shader nodes, PBR textures, procedural looks | `src/blender_mcp/guides/materials.md` |
| `animation.md` | Keyframes, slotted actions, loops, motion checks | `src/blender_mcp/guides/animation.md` |
| `rigging.md` | Armatures, Rigify, skinning, deformation checks | `src/blender_mcp/guides/rigging.md` |
| `retopology.md` | Cleanup, remeshing, decimation, baking | `src/blender_mcp/guides/retopology.md` |
| `level-design.md` | Player metrics, blockout, modular kits, export | `src/blender_mcp/guides/level-design.md` |

Reference dimensions, material values, camera settings, topology budgets, and snippets
are examples. Confirmed project requirements control the work.
