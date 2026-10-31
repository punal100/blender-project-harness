---
name: blender-mcp
description: Control a live Blender session through MCP for Blender. Use for modeling, scene edits, materials, lighting, animation, rendering, viewport checks, asset import, and 3D generation.
license: MIT
---

# Blender MCP

Use the `blender` MCP server to operate the user's open Blender. The server is `mcp-for-blender` (upstream `ahujasid/mcp-for-blender`); the Blender addon exposes a socket on the workspace's `BLENDER_PORT` from the root `.kilo/kilo.jsonc`.

This skill is required before any Blender scene operation. Do not rely on general Blender knowledge instead.

## Preflight

1. Before launching or editing, MUST verify confirmed project requirements, selected workflow, an
   active goal, and `Documents/REVIEW.md` with review mode `Off`, `All`, or `Single`; `Unset` is invalid.
   For `All` or `Single`, MUST verify `blender_graders.enabled` is true and validate the required
   grader configuration using
   [`blender-project-grading`](../blender-project-grading/SKILL.md). Missing or disabled required
   configuration MUST stop production. The controller validates the roster; a worker MUST verify the
   supplied preflight status and project records, returning `BLOCKED` if absent or inconsistent.
   Workers do not read local model settings or dispatch graders.
   Call `get_addon_status` once at the start. Check addon compatibility, Blender version, and enabled
   libraries/generators from the actual response; do not assume a particular response field exists.
2. Call `get_scene_info(fields=["settings"])` before changing anything. Verify the exact authoritative
   file path. Use `query`, `root`, `fields`, and `limit` for later targeted checks.
3. On a connection failure, stop scene work. The controller may launch the declared project through:
   ```powershell
   .\tools\start-blender.cmd "Blender\<project-folder>"
   ```
   Do not launch `blender.exe` directly. The launcher discovers Blender, reads the workspace port,
   sets the addon port, opens a live log terminal, writes the log to the project's ignored `logs/`
   folder, and allows only one Blender instance from this workspace at a time.
4. Retry preflight after launch. Stop on addon or file mismatch; never edit the wrong scene. For a
   new unsaved startup scene, save it to the declared project `.blend` first, then verify that path
   before production edits. Workers must return `BLOCKED` instead of launching or switching files.

## Tools

| Tool | Use |
|---|---|
| `get_addon_status` | Connection, addon version, Blender version, enabled libraries and generators |
| `get_scene_info` | Text summary: objects, placement, materials, topology, weights, settings |
| `execute_blender_code` | Run Python with full `bpy`, `bmesh`, and `mathutils` access |
| `look` | Inspect an image: viewport, camera, multi-angle, animation frames, render, or image file |
| `search_assets` | Search Poly Haven, Sketchfab, or Poly Pizza assets |
| `import_asset` | Import a searched model, HDRI world, or texture material |
| `generate_3d` | Generate and import one textured model from text or an image |
| `disable_telemetry` | Disable telemetry |
| `record_trajectory_feedback` | Record workflow feedback |

Tool names here are server-local names; use the exposed `blender_` prefix when required by the
client. Pass `user_prompt` with the user's exact words when the tool accepts it. Do not paraphrase.

## Workflow

1. Inspect with `get_scene_info`.
2. Make one bounded change with `execute_blender_code` or an asset tool.
3. Print a compact JSON result from the code: names, counts, bounds, material slots, or errors.
4. Verify with `get_scene_info` and `look`.
5. Continue from verified state, not from what the script intended.

## Save and visual checks

Save the authoritative `.blend` after every meaningful change and before risky work or handoff.
Review git changes at major milestones and commit atomically after each verified change: one logical
change per commit. Commits are mandatory; never defer them to the end of the task. Keep logs,
backups, caches, and WIP renders out of commits. Apply the Partially Autonomous approval gate before
the next meaningful change, including delegated work.

Visual verification is mandatory. Every scene, material, lighting, or camera change must be
inspected with `look` before completion; code output alone is not proof.

Use `look` after material, lighting, camera, or modeling changes:

- `look(mode="viewport")` for the user's view.
- `look(mode="viewport", shading="material")` for material checks.
- `look(mode="camera")` for the render camera.
- `look(mode="angles", target=["Object"])` for a multi-view check.
- `look(image="Render Result")` after rendering.

Before adding, importing, linking, packing, or delivering external assets, MUST read and follow
[`blender-assets`](../blender-assets/SKILL.md), including licence, attribution, registration, and
relative-path requirements.

- For Poly Haven and Sketchfab searches, previews can help choose an asset (`previews=3`).
  Poly Pizza does not support previews.
- For model imports, MUST choose the intended real-world size. `target_size` is required for
  Sketchfab and recommended for Poly Pizza; for Poly Haven models, use `asset_type="models"`.
  MUST inspect the returned bounds, correct model size and orientation, place it on its intended
  support surface when applicable, and verify with `look`. Do not ground deliberately suspended,
  wall-mounted, or otherwise positioned assets.
- For Poly Haven HDRIs, MUST use `asset_type="hdris"`; this changes world lighting, not model
  placement. MUST inspect the resulting lighting with `look`; for Cycles, render first and inspect
  `look(image="Render Result")`.
- For Poly Haven textures, MUST use `asset_type="textures"`. For a material intended for scene use,
  MUST specify `apply_to` and verify its assignment and appearance; omitted `apply_to` creates an
  unused material that is lost on save. Applying textures replaces target materials, so MUST inspect
  existing slots and shared-data users first. `target_size` does not size HDRIs or texture materials.

For `generate_3d`, one call creates one object. It can cost money or a generation credit: confirm with the user before spending, and resume with the returned `job` handle instead of submitting again.

## Python rules

- Query objects by name; do not assume the active object or selection.
- Read enum identifiers and RNA properties instead of hardcoding localized labels.
- Find shader nodes by `node.type`, never by display name.
- Check whether an object already exists before creating it; make scripts idempotent.
- Save the authoritative `.blend` on the required cadence; ask before overwriting unrelated files or user data.
- Do not use network, subprocess, or filesystem access in generated code unless the user asked for it.
- Keep code short and print only the facts needed for verification.

## API and documentation gaps

When a Blender API, operator, property, or version behavior is missing or unclear:

1. Resolve the matching library with Context7 and query Blender API/manual documentation for the
   actual version. Read the official documentation before relying on API behavior.
2. Inspect the live API: `dir()`, `__doc__`, `bl_rna`, `help()`, `poll()`, and the current context.
3. If Context7 is incomplete or lags the live version, web-search official docs and release notes,
   Blender source, Blender Stack Exchange, and devtalk. Prefer official sources, and note the
   Blender version.
4. Reproduce with a minimal `execute_blender_code` test. Do not guess or invent properties,
   operators, or signatures.
5. Report the source and the test result; if still unresolved, report the gap instead of pretending
   it works.

Official starting points:

- https://docs.blender.org/api/current/
- https://docs.blender.org/manual/en/latest/
- https://blender.stackexchange.com/
- https://devtalk.blender.org/

## Safety

`execute_blender_code` runs arbitrary Python inside the user's Blender. Only run code you wrote or
reviewed. Check `telemetry_consent` in addon status; do not assume its current value or enable
collection without consent. When the user requests an opt-out, call `disable_telemetry` immediately.
Do not disable safe mode or add credentials, tokens, or private data to scripts or payloads.

## Troubleshooting

- **Connection refused**: the addon server is stopped, on another port, or the MCP server started before Blender. The controller must use `.\tools\start-blender.cmd "Blender\<project-folder>"` and confirm the workspace `BLENDER_PORT`; workers must return `BLOCKED`. Reload the Kilo window if the MCP server was already running against the wrong port.
- **Addon outdated**: run `uvx mcp-for-blender install-addon`, restart Blender through the launcher.
- **Asset source unavailable**: the library toggle is off in the addon sidebar. Ask the user before enabling it.
- **Generator unavailable**: no API key or premium access is configured. Report the missing provider; do not retry blindly.
- **`look` fails**: try `mode="camera"` or render with `execute_blender_code`, then call `look(image="Render Result")`.
- **API or docs missing**: follow "API and documentation gaps"; do not invent a property, operator, or signature.

## References

Read only the relevant upstream guide:

Workspace gates and the preflight above remain mandatory. Reference dimensions, materials, camera
values, topology budgets, styles, and snippets are examples, not confirmed project requirements.
Before execution, adapt examples to the actual version and task scope; do not run destructive sample
operations or change preferences without authorization.

- `references/bpy.md` — Blender Python API patterns
- `references/scene.md` — scene assembly
- `references/materials.md` — materials and shading
- `references/animation.md` — animation
- `references/rigging.md` — rigging
- `references/retopology.md` — retopology
- `references/level-design.md` — level design
