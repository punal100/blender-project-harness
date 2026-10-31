# Goal: Initial Brief (2026-10-31)

Read `../../../../AGENTS.md` first and obey it. Read `blender-project-goal`,
`blender-project-requirements`, `blender-project-workflow`, `blender-project-readme`, and
`blender-assets` when relevant. This is a design goal, not a coding plan: do not create a `PLAN/`
folder and do not use coding plan/check/verifier gates.

## Mission

room with books on shelf

## Project

MinimalBookWall — minimal modern room corner with a wall shelf of books and one plant.

- Project README: `../../README.md`
- Confirmed requirements: `../REQUIREMENTS.md`
- Workflow mode: `../WORKFLOW.md` (Fully Autonomous)
- Review mode: `../REVIEW.md` (All: visual, technical, spec)
- Asset register: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A quiet minimal modern corner: warm neutral wall, light wood wall-mounted bookshelf with several rows
of books in varied heights, widths, and muted spine colours, one small plant, subtle floor, and soft
warm interior light with gentle shadows. The single camera sits in a three-quarter corner view with the
shelf and books clearly readable and breathing room around them. Deliverable is one 16:9 still render
at 1920x1080 or larger in `renders/final/`.

## Scope

- In scope: room corner shell (wall and floor), wall-mounted bookshelf, multiple rows of books, one
  small plant, interior lighting, single camera, one still render, project documents.
- Out of scope: animation, additional large furniture, full-room layout, close-up detail renders,
  external assets.
- External dependencies: none; all geometry and materials authored in Blender.

## Deliverables

- [ ] Updated scene saved as `minimalbookwall.blend` in the project root.
- [ ] Review render in `renders/final/`.
- [ ] README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, and `DECISIONS.md` updated.
- [ ] External assets register current (none).
- [ ] Required review-round records completed for this goal file.

## Acceptance

- [ ] Room corner reads as minimal modern with neutral wall, light wood shelf, and subtle floor.
- [ ] Wall-mounted bookshelf has several rows of books with varied height, width, and muted colour.
- [ ] Exactly one small plant is present; no other large furniture.
- [ ] Lighting is soft and warm with gentle shadows; materials are deliberate and documented.
- [ ] Single camera frames shelf and books in a three-quarter corner view with breathing room.
- [ ] One 16:9 render at 1920x1080 or larger exists and was inspected with `look`.
- [ ] The scene opens without missing external files.
- [ ] README reflects the delivered state.
- [ ] Review mode is current; the final applicable grader round is `PASS` with no genuine unresolved
      blocker or major finding.

## Workflow

1. Requirements, workflow, and review records are confirmed and scaffold documents and this goal are
   committed. Call `blender_workflow` `prepare` with only
   `{project:"Blender/MinimalBookWall",goal:"Documents/Goals/01-project-brief.md",scene:"minimalbookwall.blend"}`
   as its JSON-string payload. Pass its exact registration question and labels to `question` as one
   single-select question; omit `custom`/`multiple` or set them false. Only genuine runtime answers
   grant registration. Then call `goal(action="start", objective=<this entire filled prompt>)`; a
   successful goal call ends the turn.
2. Read the README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, asset register, decisions, and
   references.
3. Inspect harness `status` before launch and after compaction/restart; never recreate or manually
   edit external state.
4. Launch with `blender_workflow` `{action:"launch"}`; stop with `{action:"stop"}`. Never invoke
   Blender from the shell.
5. Call `blender_get_addon_status` and `blender_get_scene_info(fields=["settings"])`. Stop on
   connection, addon, or file mismatch. For the new unsaved scene, open a bounded `begin`, use
   ticketed `save` as `minimalbookwall.blend`, verify that exact path, commit the scene, and close
   with `checkpoint` (recorded as BOOTSTRAP). Never seal or grade the empty bootstrap scene.
6. Build in small bounded changes using the canonical `AGENTS.md` harness contract:
   `blender_workflow` takes `{action: string,payload: JSON string}`. `begin` declares one outcome,
   exact objects, and project-relative files; one change stays open, bounded by 40 operations and 15
   minutes. Request `ticket` for apply/save/seal, then call `blender_harness_execute` with the
   matching token, operation, payload, and verbatim user goal. Supported operations only:
   `create_mesh` (cube, uv_sphere, plane, cylinder), `transform`, `material`, `create_light`,
   `create_camera`, `set_camera`, `render_settings`, `delete_object`. Raw Python, imports, and
   generation are blocked; stop for reviewed tooling extension if unsupported.
   Suggested change split: room shell (floor, wall); bookshelf (uprights, shelves); books (rows);
   plant; lighting, camera, render settings. Save after every meaningful change and before risky work.
7. Every meaningful change: save, `seal` (saves scene, captures evidence, final PNG, manifest), then
   mandatory `blender_look(image=<returned absolute render path>)`. Inspect status/diff/log, stage
   exact scoped paths, commit the scene and round artifacts atomically, call `checkpoint`, then next
   `begin`. Failed rounds commit before fixes. Never defer into a late mega-commit.
8. Review mode is `All`: after seal and successful `look`, call `grader-ticket` `{name}` for `visual`,
   `technical`, and `spec`; dispatch normal `task` calls with `subagent_type: "blender-grader"`, the
   unique token, exact report path, and `HARNESS_GRADER:<token>` marker, in batches bounded by
   `max_parallel` 3. Read reports, record every finding disposition and exact scene hash/verdict in
   `Documents/Reviews/<round>/REVIEW.md`, update the round index, then call `review` `{notes}` to
   validate receipts. Never fabricate receipts or edit sealed metadata. `Off` is not selected.
9. Save, seal, inspect, and grade the final deliverable state; require final applicable `PASS` and no
   genuine unresolved blocker or major finding. User approval does not waive those findings.
10. Update README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, `DECISIONS.md`, and `ASSETS.md`
    within their bounded change. Completion hook requires a clean checkpoint, final applicable
    `PASS`, and inspected sealed render. Once all acceptance checks pass, call
    `goal_report(status="complete", reason=<evidence>)`, then give the final response without further
    actions.

## Done

The goal is complete only when all acceptance checks pass, requirements, workflow, and review mode are
current, the scene and inspected review render are saved, no external asset is missing or unregistered,
and all required documents including `REVIEW.md` are current. Review mode is `All`, so the final
applicable round must be `PASS`; no genuine unresolved blocker or major finding permits completion.
Harness state at `~/.local/state/blender-workflow-harness/<workspace-hash>` is external and not
agent-editable. This is a same-user guard, not an OS sandbox; manual Blender/external-shell edits
invalidate evidence.
