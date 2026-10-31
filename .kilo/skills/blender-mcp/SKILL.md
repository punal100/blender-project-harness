---
name: blender-mcp
description: Control a live Blender session through MCP for Blender. Use for modeling, scene edits, materials, lighting, animation, rendering, viewport checks, asset import, and 3D generation.
license: MIT
---

# Blender MCP

Use the `blender` MCP server to operate the user's open Blender. The server is `mcp-for-blender` (upstream `ahujasid/mcp-for-blender`); the Blender addon exposes a socket on the workspace's `BLENDER_PORT` from the root `.kilo/kilo.jsonc`.

This skill is required before any Blender scene operation. Do not rely on general Blender knowledge instead.

`AGENTS.md` defines the canonical runtime harness contract. Workspace maintenance is exempt from
project/goal/review gates and must not launch or modify Blender unless separately requested.

## Preflight

1. Before launching or editing, MUST verify confirmed project requirements, selected workflow, an
   active goal, and `Documents/REVIEW.md` with review mode `Off`, `All`, or `Single`; `Unset` is invalid.
   For `All` or `Single`, MUST verify `blender_subagents.graders.enabled` is true and validate the required
   grader configuration using
   [`blender-project-grading`](../blender-project-grading/SKILL.md). Missing or disabled required
   configuration MUST stop production. The orchestrator validates the roster; a worker MUST verify the
   supplied preflight status and project records, returning `BLOCKED` if absent or inconsistent.
   Workers do not read local model settings or dispatch graders.
   Before launch, scaffold documents and goal must be committed and `blender_workflow` `prepare`
   registration granted by the exact runtime question/labels (`custom:false,multiple:false`). Start
   or resume the registered goal, end that turn, then inspect harness `status` before continuing.
   Call `get_addon_status` once at the start. Check addon compatibility, Blender version, and enabled
   libraries/generators from the actual response; do not assume a particular response field exists.
2. Call `get_scene_info(fields=["settings"])` before changing anything. Verify the exact authoritative
   file path. Use `query`, `root`, `fields`, and `limit` for later targeted checks.
3. On a connection failure, stop scene work. The orchestrator may launch the declared project through:
   ```powershell
   .\tools\start-blender.cmd "Blender\<project-folder>"
   ```
   Do not launch `blender.exe` directly. The launcher discovers Blender, reads the workspace port,
   sets the addon port, opens a live log terminal, writes the log to the project's ignored `logs/`
   folder, and allows only one Blender instance from this workspace at a time.
4. Retry preflight after launch. Stop on addon or file mismatch; never edit the wrong scene. For a
   new unsaved startup scene, open a bounded `begin` and use ticketed `save` to the declared project
   `.blend` first, then verify that path
   before production edits. Workers must return `BLOCKED` instead of launching or switching files.

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

## Workflow

1. Recover through `blender_workflow` `status`; inspect `get_scene_info`. `begin` declares
   `{outcome,objects:[exact names],paths:[exact project-relative files],revision?:bool}`. One logical
   change may be open, at most 40 operations/15 minutes; recovery save/seal remain allowed afterward.
2. Request `ticket` with `{operation:"apply"|"save"|"seal",payload:<operation JSON or {}>}`. Apply payload
   is an operation object; save/seal payload is `{}`. Next call `blender_harness_execute` with
   `{token,operation,payload,user_prompt:<verbatim user goal>}` matching the ticket. Never replay tokens.
3. Apply only `create_mesh` (`cube`, `uv_sphere`, `plane`, `cylinder`), `transform`, `material`,
   `create_light`, `create_camera`, `set_camera`, `render_settings`, or `delete_object`. Unsupported
   operations stop production until reviewed tooling extension; no arbitrary Python loophole.
4. Save after meaningful changes and before handoff. Seal saves the authoritative scene and captures
   immutable review evidence, final PNG, and manifest. Call mandatory
   `blender_look(image=<returned absolute render path>)`; the hook records successful inspection.
5. Complete `self-review` `{notes}` in `Off`, or ticketed grader tasks and `review` `{notes}` in
   `All`/`Single`. Complete required paused-goal runtime approval, inspect status/diff/log, stage exact
   scoped paths, commit, then `checkpoint` before next `begin`. Failed rounds commit before fixes;
   revisions use `revision:true` within the conservative two-round cap; a third round needs explicit user
   escalation and re-registration handling. Exactly one scoped commit, clean project state, and
   matching hashes are required. Never defer changes into a late mega-commit.

## Save and visual checks

Save the authoritative `.blend` after every meaningful change and before risky work or handoff.
Use ticketed save/seal, mandatory returned-render inspection, and the review/commit checkpoints
above. `checkpoint` must succeed before another `begin`; completion requires a clean checkpoint and
final applicable `PASS` with inspected sealed render. Keep logs, backups, caches, and WIP renders out
of commits. Apply the Partially Autonomous runtime approval gate before the next meaningful change.

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

- **Connection refused**: the addon server is stopped, on another port, or the MCP server started before Blender. The orchestrator must use `.\tools\start-blender.cmd "Blender\<project-folder>"` and confirm the workspace `BLENDER_PORT`; workers must return `BLOCKED`. Reload the Kilo window if the MCP server was already running against the wrong port.
- **Addon outdated**: run `uvx mcp-for-blender install-addon`, restart Blender through the launcher.
- **Asset source unavailable**: the library toggle is off in the addon sidebar. Ask the user before enabling it.
- **Generator unavailable**: no API key or premium access is configured. Report the missing provider; do not retry blindly.
- **`look` fails**: inspect harness `status` and retry the exact sealed render path when safe. A viewport
  fallback does not satisfy required render inspection; unresolved failure stops production.
- **Harness unavailable or stale**: reload Kilo and inspect `status`; never fabricate registration,
  tokens, report receipts, approval JSON, or external state. Stop if reviewed recovery cannot proceed.
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
