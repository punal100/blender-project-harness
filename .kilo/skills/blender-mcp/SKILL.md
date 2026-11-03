---
name: blender-mcp
description: Control a live Blender session through MCP for Blender. Use for modeling, scene edits, materials, lighting, animation, rendering, viewport checks, local asset import, reference images, and exports. Remote library import and 3D generation remain blocked.
license: MIT
---

# Blender MCP

Use the `blender` MCP server to operate the user's open Blender. The server is `mcp-for-blender`
(upstream `ahujasid/mcp-for-blender`); the addon exposes a socket on the workspace `BLENDER_PORT`
from `.kilo/kilo.jsonc`.

This skill is required before any Blender scene operation. `AGENTS.md` defines hard invariants;
`blender-workflow-harness` defines the runtime contract. Read both.

## Preflight

1. Verify confirmed requirements, selected workflow/review records, active goal, and valid grader
   configuration for `All` or `Single`. Stop on a mismatch.
2. Launch only through `blender_workflow` `launch`; stop only through `stop`. NEVER invoke Blender
   from the shell.
3. Call `blender_get_addon_status` once. Check addon compatibility, Blender version, and enabled
   libraries/generators from the actual response.
4. Call `blender_get_scene_info(fields=["settings"])` before editing. Verify the exact authoritative
   file path. Stop on connection, addon, or file mismatch.
5. Use `status.nextStep` for the next harness action. Do not infer a lifecycle step.

## Tools

| Tool | Use |
|---|---|
| `blender_get_addon_status` | Connection, addon version, Blender version, enabled libraries/generators |
| `blender_get_scene_info` | Text summary: objects, placement, materials, topology, weights, settings |
| `blender_workflow` | Orchestrator lifecycle and review actions; payload is a JSON string |
| `blender_document` | Structured document read; declared document or assigned grader-report write |
| `blender_harness_execute` | Execute one ticketed apply batch/save/seal operation |
| `blender_look` | Inspect an exact image: sealed render, viewport, camera, angles, frames |
| `blender_search_assets` | Search asset libraries |
| `blender_execute_blender_code` | Blocked raw Python; never a fallback or diagnostic route |
| `blender_import_asset` | Blocked until reviewed harness support exists |
| `blender_generate_3d` | Blocked until reviewed harness support exists |
| `blender_disable_telemetry` | Disable telemetry only on user request |
| `blender_record_trajectory_feedback` | Record user result feedback |

Use the exposed `blender_` prefix. Pass the user's exact words in `user_prompt` when supported.

## Production

- The orchestrator issues an `apply` ticket and passes it to `blender-worker`. The worker calls
  `blender_harness_execute` with the exact token and payload.
- The orchestrator executes `save` and `seal` only. Each operation in an apply batch auto-saves.
- After `seal`, inspect the returned absolute PNG with `blender_look`. Viewport checks do not replace
  the sealed render.
- Review, approve, commit, and checkpoint through the harness. Never stage or commit project files
  manually or create review documents manually.
- Read project documents through `blender_document` `{action:"read"}`; direct full-file reads are
  acceptable but discouraged. Create new project markdown with `bootstrap-document` before
  registration or `blender_document` `{action:"write"}` / `document` inside a declared change.
- Raw Python is forbidden for scene edits, saves, renders, API probes, or filesystem access.

## Visual checks

Every scene, material, lighting, or camera change MUST be inspected with `look` before review.

- `look(mode="viewport")` for the user's view.
- `look(mode="viewport", shading="material")` for materials.
- `look(mode="camera")` for the render camera.
- `look(mode="angles", target=["Object"])` for a multi-view check.
- `blender_look(image=<returned absolute render>)` after `seal`.

## Scene operations

Reviewed operations cover primitives, text objects, transforms, materials, shared materials,
duplication, lights, cameras, render settings, and the safe modifier subset: bevel, subdivision
surface, solidify, mirror, and array. Modifiers are added through `modifier` and are applied only
when the operation sets `apply:true`. Text objects can receive materials through `material` or
`shared_material`.

## Assets

External asset work requires `blender-assets`: licence, attribution, registration, relative paths,
packing, and delivery rights. Use `blender_workflow {action:"intake"}` for user files; it copies,
hashes, registers, and adds exact paths to the open change. Use `download` only for HTTPS staging,
then `intake`. Use the reviewed harness operations for local files:

- `import_asset` for GLB/glTF/FBX/OBJ/USD/`.blend`.
- `link_library` for `.blend` link/append.
- `import_audio`, `image_reference`, `image_texture`, `world_hdri`.
- `check_assets`, `pack_assets`, and `export_scene`.

The raw `blender_import_asset`, `blender_generate_3d`, and arbitrary Python tools remain blocked.
Library search does not authorize a remote import. Scripts are source-only under `scripts/` and are
never executed by the harness.

## API and documentation gaps

1. Resolve Blender with Context7 and query the matching version's API and manual.
2. Inspect the reviewed operation schema and available read-only scene facts. Do not use raw Python
   probes.
3. If Context7 is incomplete, search official docs, release notes, Blender source, Blender Stack
   Exchange, and devtalk. Note the Blender version.
4. If reviewed operations cannot verify the behavior, STOP and request a reviewed tooling extension
   with isolated tests. Never guess properties, operators, or signatures.
5. Report the source and test result; report unresolved gaps instead of pretending they work.

Official starting points:

- https://docs.blender.org/api/current/
- https://docs.blender.org/manual/en/latest/
- https://blender.stackexchange.com/
- https://devtalk.blender.org/

## Safety

`execute_blender_code` is blocked. The harness is a same-user guard, not an OS sandbox; manual
Blender or external-shell edits invalidate evidence. State under
`~/.local/state/blender-workflow-harness/<workspace-hash>` is runtime-owned and not agent-editable.

Check `telemetry_consent` in addon status; do not assume it. Call `blender_disable_telemetry`
immediately when the user requests opt-out. Do not disable safe mode or add credentials, tokens, or
private data to payloads.

## Troubleshooting

- **Connection refused**: the addon is stopped, on another port, or MCP started before Blender. Stop
  through the harness, confirm `BLENDER_PORT`, relaunch, and reload Kilo if needed.
- **Addon outdated**: reinstall `uvx --from mcp-for-blender==2.2.6 mcp-for-blender install-addon`,
  then stop and relaunch through the harness.
- **Asset source unavailable**: the library toggle is off in the addon. Ask before enabling.
- **Generator unavailable**: no API key or premium access is configured. Report the missing provider.
- **`look` fails**: inspect `status` and retry the exact sealed render path. A viewport fallback does
  not satisfy review inspection.
- **Harness unavailable or stale**: reload Kilo, inspect `status`, and follow `nextStep`. NEVER
  fabricate tickets, reports, approvals, or state.
- **Registration pending**: wait for the challenge to expire or finish it in its owning session.
  `status {project}` identifies the current bootstrap step.
