---
name: blender-mcp
description: Control a live Blender session through MCP for Blender. Use for modeling, scene edits, materials, lighting, animation, rendering, viewport checks, asset import, and 3D generation.
license: MIT
---

# Blender MCP

Use the `blender` MCP server to operate the user's open Blender. The server is `mcp-for-blender` (upstream `ahujasid/mcp-for-blender`); the Blender addon exposes a socket on the workspace's `BLENDER_PORT` from the root `.kilo/kilo.jsonc`.

## Preflight

1. Call `get_addon_status`. Confirm `up_to_date`, the Blender version, and which libraries or generators are enabled.
2. Call `get_scene_info` before changing anything. Use `query`, `root`, `fields`, and `limit` to keep the result small.
3. If the call fails, launch Blender from the workspace root with:
   ```powershell
   .\start-blender.cmd Blender\<project-folder>
   ```
   Do not launch `blender.exe` directly. The launcher discovers Blender, reads the workspace port,
   sets the addon port, and allows only one Blender instance from this workspace at a time.
4. Verify the open file with `get_scene_info(fields=["settings"])` before editing.

## Tools

| Tool | Use |
|---|---|
| `get_addon_status` | Connection, addon version, Blender version, enabled libraries and generators |
| `get_scene_info` | Text summary: objects, placement, materials, topology, weights, settings |
| `execute_blender_code` | Run Python with full `bpy`, `bmesh`, and `mathutils` access |
| `look` | Inspect an image: viewport, camera, multi-angle, animation frames, render, or image file |
| `search_assets` | Search Poly Haven, Sketchfab, or Poly Pizza assets |
| `import_asset` | Import a searched asset at a target real-world size |
| `generate_3d` | Generate and import one textured model from text or an image |
| `disable_telemetry` | Disable telemetry |
| `record_trajectory_feedback` | Record workflow feedback |

Pass `user_prompt` with the user's exact words when the tool accepts it. Do not paraphrase.

## Workflow

1. Inspect with `get_scene_info`.
2. Make one bounded change with `execute_blender_code` or an asset tool.
3. Print a compact JSON result from the code: names, counts, bounds, material slots, or errors.
4. Verify with `get_scene_info` and `look`.
5. Continue from verified state, not from what the script intended.

Use `look` after material, lighting, camera, or modeling changes:

- `look(mode="viewport")` for the user's view.
- `look(mode="viewport", shading="material")` for material checks.
- `look(mode="camera")` for the render camera.
- `look(mode="angles", target=["Object"])` for a multi-view check.
- `look(image="Render Result")` after rendering.

For assets, search with `previews=3`, then import with an explicit `target_size`. Place the result on the ground and verify with `look`.

For `generate_3d`, one call creates one object. It can cost money or a generation credit: confirm with the user before spending, and resume with the returned `job` handle instead of submitting again.

## Python rules

- Query objects by name; do not assume the active object or selection.
- Read enum identifiers and RNA properties instead of hardcoding localized labels.
- Find shader nodes by `node.type`, never by display name.
- Check whether an object already exists before creating it; make scripts idempotent.
- Do not save, overwrite, delete, or replace user data without explicit permission.
- Do not use network, subprocess, or filesystem access in generated code unless the user asked for it.
- Keep code short and print only the facts needed for verification.

## Safety

`execute_blender_code` runs arbitrary Python inside the user's Blender. Only run code you wrote or reviewed. Telemetry is off by default; do not enable it without consent. Do not disable safe mode or add credentials, tokens, or private data to scripts or payloads.

## Troubleshooting

- **Connection refused**: the addon server is stopped, on another port, or the MCP server started before Blender. Run `.\start-blender.cmd Blender\<project-folder>` and confirm the workspace `BLENDER_PORT`. Reload the Kilo window if the MCP server was already running against the wrong port.
- **Addon outdated**: run `uvx mcp-for-blender install-addon`, restart Blender through the launcher.
- **Asset source unavailable**: the library toggle is off in the addon sidebar. Ask the user before enabling it.
- **Generator unavailable**: no API key or premium access is configured. Report the missing provider; do not retry blindly.
- **`look` fails**: try `mode="camera"` or render with `execute_blender_code`, then call `look(image="Render Result")`.

## References

Read only the relevant upstream guide:

- `references/bpy.md` — Blender Python API patterns
- `references/scene.md` — scene assembly
- `references/materials.md` — materials and shading
- `references/animation.md` — animation
- `references/rigging.md` — rigging
- `references/retopology.md` — retopology
- `references/level-design.md` — level design
