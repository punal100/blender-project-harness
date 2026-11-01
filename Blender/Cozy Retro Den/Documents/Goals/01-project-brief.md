# Goal: Initial Brief (2026-11-01)

Read `../../../../AGENTS.md` first and obey it. Read `blender-project-goal`, `blender-project-workflow`, `blender-project-grading`, `blender-workflow-harness`, `blender-project-readme`, and `blender-mcp` before production. This is a design goal, not a coding plan: do not create `PLAN/` or verifier records.

## Mission

make cozy retro room with computer

## Project

Cozy Retro Den — Cozy 1980s home computer den interior in stylized realism, one wide three-quarter hero render.

- Project README: `../../README.md`
- Confirmed requirements: `../REQUIREMENTS.md`
- Workflow mode: `../WORKFLOW.md`
- Review mode: `../REVIEW.md`
- Asset register: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

Viewer sees a warm, lived-in 1980s home computer den at night in stylized realism. A wood desk with a CRT computer (monitor, keyboard, mouse, tower) is the focal point, backed by wood-panel walls. Include a window with cool night light, shelves with clutter, retro posters or wall art, a rug, soft seating, and a warm desk lamp. Lighting is an evening mix: warm tungsten lamp pool at the desk against cool blue window fill. Palette is walnut, beige, and orange/brown accents with soft falloff and cozy contrast. Camera is one wide three-quarter interior view showing desk plus enough room context to establish the den. Human metric scale; desk about 0.75 m high. Materials are believable PBR surfaces with clean, slightly idealized proportions. Review image: sealed camera PNG in the round evidence folder, final PNG copied to `renders/final/`.

## Scope

- In scope: room shell, desk, CRT computer setup, window with night light, shelves and clutter, posters/wall art, rug, soft seating, desk lamp, procedural materials, evening lighting, one 1920×1080 hero render, documentation.
- Out of scope: animation, game-ready export, external asset imports, extra camera deliverables, room extensions beyond the den.
- External dependencies: none. All geometry and materials procedural; imports and generation are blocked by harness tooling.

## Deliverables

- [ ] Updated scene saved as `cozy-retro-den.blend` in the project root.
- [ ] 1920×1080 final render in `renders/final/`.
- [ ] README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, `DECISIONS.md`, and `ASSETS.md` current.
- [ ] Review-round records for this goal's actual file path, with all required grading.
- [ ] No external asset missing or unregistered; asset register states none.

## Acceptance

- [ ] Scene opens with no missing external files.
- [ ] Render visibly includes the CRT computer, desk, wood-panel walls, window with night light, shelves with clutter, retro posters, rug, soft seating, and warm desk lamp.
- [ ] Camera is a wide three-quarter interior view with the computer as focal point; framing matches the brief.
- [ ] Evening lighting reads warm inside with cool window light; palette and materials match the visual direction.
- [ ] Human scale is consistent; props rest on surfaces with no floating, clipping, or obvious interpenetration.
- [ ] Final render exists at 1920×1080 and was inspected with `look`.
- [ ] README reflects the delivered state.
- [ ] Review mode `All` is current; final applicable round is `PASS` with no unresolved blocker or major finding.

## Workflow

1. Requirements, workflow (`Fully Autonomous`), review (`All`), scaffold, and this prompt are already recorded and committed before launch. Call `blender_workflow` `prepare` with `{project:"Blender/Cozy Retro Den",goal:"Documents/Goals/01-project-brief.md",scene:"cozy-retro-den.blend"}` as a JSON-string payload. Pass its exact registration question and labels unchanged to `question` as one single-select question; omit `custom`/`multiple`. Only genuine answers grant registration. Then call `goal(action="start", objective=<this entire filled prompt>)`; success ends the turn.
2. Read the README, requirements, workflow, review, assets, decisions, and references. Stop if requirements are unconfirmed, a mode is `Unset`, or required grader configuration is missing or disabled.
3. Inspect harness `status` before launch and after compaction/restart. Launch with `blender_workflow` `{action:"launch"}`; stop with `{action:"stop"}`. Never invoke Blender or legacy scripts from the shell.
4. Call `blender_get_addon_status` and `blender_get_scene_info(fields=["settings"])`. Stop on connection, addon, or file mismatch. Bootstrap-save the new scene to `cozy-retro-den.blend` through one bounded `begin` and ticketed `save`, verify the exact path, commit only declared paths, then `checkpoint` as `BOOTSTRAP`. Never seal, render, or grade the empty default scene. Update README planned to saved.
5. Make bounded logical changes. `begin` declares one outcome and exact project-relative files; one change open at a time, at most 40 operations and 15 minutes; request `ticket`, then call `blender_harness_execute` with matching token, operation, payload, and the user's verbatim goal text. Save after every meaningful scene change and before risky work. Raw Python, `import_asset`, and `generate_3d` are blocked. Inspect every visual change with `look`; code output alone is not proof.
6. Seal each meaningful saved visual state. `seal` saves the authoritative scene and writes immutable evidence plus a final PNG render and manifest; immediately call `blender_look(image=<returned absolute render path>)` to record inspection. Do not substitute or edit evidence.
7. Review mode is `All` with graders `visual`, `technical`, and `spec` (config `blender_subagents.graders`, enabled). After seal, call `grader-ticket` `{name}` for each selected grader, pass its exact prompt, token, paths, hashes, and deadline to a normal `blender-grader` task, respecting `max_parallel`. Read all reports, record every finding as open/fixed/deferred/declined with reasons in the round `REVIEW.md`, and call `review` `{notes}` with the exact saved scene hash and verdict. A round with a substantiated blocker or major is `CHANGES_REQUIRED`; re-review fixes within the configured `max_rounds` cap; never silently downgrade or exceed it.
8. Commit each change atomically: inspect status/diff/log, stage exactly the scoped scene, docs, and round artifacts, commit once, then `checkpoint` before the next `begin`. Failed rounds commit before fixes. Never defer work into an end-of-task mega-commit.
9. In Fully Autonomous mode proceed without approval pauses. Stop only for a requirements conflict, destructive or irreversible choice, missing asset or licence, or technical blocker.
10. Before completion, save the final deliverable, seal a final review render, inspect its returned PNG, complete final applicable grading, and require `PASS` with no genuine unresolved blocker or major finding. Update README, requirements, workflow, review, decisions, and assets. Then call `goal_report(status="complete", reason=<evidence>)` and give the final response with no further actions.

## Done

The goal is complete only when all acceptance checks pass, the scene is saved, a review render exists and was inspected with `look`, requirements/workflow/review are current, final applicable grading is `PASS`, no genuine unresolved blocker or major remains, all project documents are current, and the goal prompt is recorded. A clean checkpoint and matching hashes are required. Harness state at `~/.local/state/blender-workflow-harness/<workspace-hash>` is external and not agent-editable; manual Blender or external-shell edits invalidate evidence.
