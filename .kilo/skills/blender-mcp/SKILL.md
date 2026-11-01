---
name: blender-mcp
description: Control a live Blender session through MCP for Blender. Use for modeling, scene edits, materials, lighting, animation, rendering, viewport checks, asset import, and 3D generation.
license: MIT
---

# Blender MCP

Use the `blender` MCP server to operate the user's open Blender. The server is `mcp-for-blender` (upstream `ahujasid/mcp-for-blender`); the Blender addon exposes a socket on the workspace's `BLENDER_PORT` from the root `.kilo/kilo.jsonc`.

This skill is required before any Blender scene operation. Do not rely on general Blender knowledge instead.

`AGENTS.md` defines hard invariants; `blender-workflow-harness` defines the runtime contract.
Workspace maintenance is exempt from project/goal/review gates and must not launch or modify Blender
unless separately requested.

## Preflight

1. Before launching or editing, verify confirmed requirements, selected workflow, an active goal, and
   a valid `Documents/REVIEW.md`, plus grader readiness for `All`/`Single`
   ([`blender-project-grading`](../blender-project-grading/SKILL.md)). Invalid configuration stops
   production. The orchestrator owns registration and launch; a worker verifies the supplied
   preflight and returns `BLOCKED` if absent or inconsistent.
   Call `get_addon_status` once; check addon compatibility, Blender version, and enabled
   libraries/generators from the actual response.
2. Call `get_scene_info(fields=["settings"])` before changing anything. Verify the exact authoritative
   file path. Use `query`, `root`, `fields`, and `limit` for later targeted checks.
3. On a connection failure, stop scene work. The orchestrator relaunches with `blender_workflow`
   `{action:"launch"}` or stops with `{action:"stop"}`; never invoke Blender from the shell. The
   harness owns the port, run log, instance metadata, and one-instance guard.
4. Retry preflight after launch. Stop on addon or file mismatch; never edit the wrong scene. Use the
   harness bootstrap flow for a new unsaved scene. Workers never launch or switch files.

## Tools

| Tool | Use |
|---|---|
| `get_addon_status` | Connection, addon version, Blender version, enabled libraries and generators |
| `get_scene_info` | Text summary: objects, placement, materials, topology, weights, settings |
| `blender_workflow` | Orchestrator custom tool: `{action: string, payload: JSON string}`; registration, bounded changes, tickets, review, approval, checkpoint/status |
| `harness_execute` | Execute one ticketed, schema-validated apply/save/seal operation; exposed as `blender_harness_execute` |
| `execute_blender_code` | Blocked raw Python; never a fallback or diagnostic loophole |
| `look` | Inspect an image: viewport, camera, multi-angle, animation frames, render, or image file |
| `search_assets` | Search Poly Haven, Sketchfab, or Poly Pizza assets |
| `import_asset` | Blocked until reviewed harness support exists |
| `generate_3d` | Blocked until reviewed harness support exists |
| `disable_telemetry` | Disable telemetry |
| `record_trajectory_feedback` | Record workflow feedback |

Tool names here are server-local names; use the exposed `blender_` prefix when required by the
client. Pass `user_prompt` with the user's exact words when the tool accepts it. Do not paraphrase.

## Production workflow

`blender-workflow-harness` owns registration, launch/stop, bounded changes, tickets, save/seal,
review, approval, and checkpoints. Recover with `blender_workflow` `status`; call `capabilities` for
the runtime operation and bootstrap lists. Do not infer supported operations from examples.

Use one ticketed operation at a time. The orchestrator issues an `apply` ticket and passes it to
`blender-worker`, who executes it; the orchestrator executes `save`/`seal` only. Seal before review,
inspect the returned final PNG with `blender_look`, then call the harness `commit` action and
`checkpoint` before the next `begin`. Do not stage or commit manually. Create new markdown through
the harness `document` action after declaring its path; review documents are harness-generated.

Visual verification is mandatory. Every scene, material, lighting, or camera change must be
inspected with `look` before completion; code output alone is not proof.

Use `look` after material, lighting, camera, or modeling changes:

- `look(mode="viewport")` for the user's view.
- `look(mode="viewport", shading="material")` for material checks.
- `look(mode="camera")` for the render camera.
- `look(mode="angles", target=["Object"])` for a multi-view check.
- `blender_look(image=<returned absolute render path>)` after seal; viewport checks do not replace it.

External asset work still requires [`blender-assets`](../blender-assets/SKILL.md), including licence,
attribution, registration, relative paths, and delivery rights. Search may inform a proposal, but raw
imports and generation are blocked. Stop until reviewed tooling supports the requested operation;
asset approval or paid-generation consent does not unlock unsupported harness operations.

## Tooling rules

Raw Python is not permitted for scene edits, saves, renders, API probes, or filesystem access.
During separately authorized tooling maintenance, review implementation against official API docs:
query exact object names, validate enum identifiers, find shader nodes by type, reject name collisions,
and keep filesystem/network/process access within reviewed tooling scope. Do not test maintenance
against live Blender unless separately requested. Current workers remain read-only; orchestrator owns
harness operations.

## API and documentation gaps

When a Blender API, operator, property, or version behavior is missing or unclear:

1. Resolve the matching library with Context7 and query Blender API/manual documentation for the
   actual version. Read the official documentation before relying on API behavior.
2. Inspect the reviewed operation schema and available read-only scene facts. Do not use raw Python
   API probes to bypass the harness.
3. If Context7 is incomplete or lags the live version, web-search official docs and release notes,
   Blender source, Blender Stack Exchange, and devtalk. Prefer official sources, and note the
   Blender version.
4. If existing schema-validated operations cannot verify the behavior, stop production and request a
   reviewed tooling extension with isolated tests. Do not guess properties, operators, or signatures.
5. Report the source and the test result; if still unresolved, report the gap instead of pretending
   it works.

Official starting points:

- https://docs.blender.org/api/current/
- https://docs.blender.org/manual/en/latest/
- https://blender.stackexchange.com/
- https://devtalk.blender.org/

## Safety

Raw `execute_blender_code` is blocked. The harness is a same-user guard, not an OS sandbox; manual
Blender or external-shell edits invalidate evidence, and unrestricted same-user execution can bypass
controls. State at `~/.local/state/blender-workflow-harness/<workspace-hash>` is not agent-editable.
Check `telemetry_consent` in addon status; do not assume its current value or enable
collection without consent. When the user requests an opt-out, call `disable_telemetry` immediately.
Do not disable safe mode or add credentials, tokens, or private data to scripts or payloads.

## Troubleshooting

- **Connection refused**: the addon server is stopped, on another port, or the MCP server started before Blender. Stop with `blender_workflow` `{action:"stop"}`, confirm the workspace `BLENDER_PORT`, then `{action:"launch"}`; workers must return `BLOCKED`. Reload the Kilo window if the MCP server was already running against the wrong port.
- **Addon outdated**: run `uvx --from mcp-for-blender==2.2.6 mcp-for-blender install-addon`, then stop and relaunch with `blender_workflow`.
- **Asset source unavailable**: the library toggle is off in the addon sidebar. Ask the user before enabling it.
- **Generator unavailable**: no API key or premium access is configured. Report the missing provider; do not retry blindly.
- **`look` fails**: inspect harness `status` and retry the exact sealed render path when safe. A viewport
  fallback does not satisfy required render inspection; unresolved failure stops production.
- **Harness unavailable or stale**: reload Kilo and inspect `status`; never fabricate registration,
  tokens, report receipts, approval JSON, or external state. Stop if reviewed recovery cannot proceed.
- **`registration is pending in another session`**: an earlier session left a challenge. It expires
  after 10 minutes; call `prepare` again then. `status` works before registration and reports the
  bootstrap phase, so inspect it instead of retrying `prepare` blindly.
- **`production files require a registered project`**: expected before registration. Only scaffold
  documentation writes are allowed at that point. Finish and commit the scaffold documents and the
  filled goal, call `blender_workflow` `prepare`, and complete its registration question. Never route
  the write through bash, redirection, or a temp copy; the denial means the lifecycle step is missing.
- **API or docs missing**: follow "API and documentation gaps"; do not invent a property, operator, or signature.

## References

Read only the relevant upstream guide:

Workspace gates and the preflight above remain mandatory. Reference dimensions, materials, camera
values, topology budgets, styles, and snippets are examples, not confirmed project requirements.
Reference Python snippets are research material, not permission to execute raw code. Adapt only
through reviewed schema-validated tooling; unsupported animation, rigging, imports, and other scene
operations stop production until tooling is extended. Do not change preferences without authorization.

- `references/bpy.md` — Blender Python API patterns
- `references/scene.md` — scene assembly
- `references/materials.md` — materials and shading
- `references/animation.md` — animation
- `references/rigging.md` — rigging
- `references/retopology.md` — retopology
- `references/level-design.md` — level design
