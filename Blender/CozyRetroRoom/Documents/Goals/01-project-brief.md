# Goal: Initial Brief (2026-10-31)

Read `../../../../AGENTS.md` first and obey it. Read `blender-project-goal`,
`blender-project-requirements`, `blender-project-workflow`, `blender-project-readme`, and
`blender-assets` when relevant. This is a design goal, not a coding plan: do not create a `PLAN/`
folder and do not use coding plan/check/verifier gates.

## Mission

Make cozy retro room with computer

User-selected direction: 1970s wood & warm orange era; CRT monitor + desktop tower; corner desk
vignette framing; one hero render + saved `.blend`.

## Project

CozyRetroRoom — Cozy 1970s wood-panelled room with a bulky CRT computer setup, hero still render.

- Project README: `../../README.md`
- Confirmed requirements: `../REQUIREMENTS.md`
- Workflow mode: `../WORKFLOW.md` (Fully Autonomous)
- Review mode: `../REVIEW.md` (All: visual, technical, spec)
- Asset register: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

An eye-level 3/4 view into the corner of a warm 1970s study. Wood-panelled back and side walls,
burnt-orange and brown soft furnishings, a textured shag rug, and a heavy wooden desk.

The focal subject is a bulky beige CRT monitor on the desk with a separate desktop tower beside it
and a chunky keyboard in front. A warm desk lamp on the desk edge, a curtained window on the left or
right wall, a worn chair pulled up, and small lived-in accessories (books, mug, plant, wall poster)
support the story.

Lighting: warm tungsten lamp as key, cool-soft window fill, gentle ambient; evening coziness. Materials
deliberately assigned — wood grain, beige plastic, fabric, metal. Palette: burnt orange, walnut brown,
cream beige, muted avocado. Scale is real-world metric: desk ~0.75 m high, CRT ~0.35 m tall.

Proof image: the sealed review render at 1920x1080 saved in `renders/final/`.

## Scope

- In scope: one room-corner still; floor, two walls, desk, chair, CRT + tower + keyboard, lamp, window,
  rug, small decor; lighting; camera; materials; final render.
- Out of scope: animation, characters, game export, exterior, additional rooms, photoreal hardware
  accuracy.
- External dependencies: none; primitive-level geometry and procedural materials only, built with
  supported harness operations.

## Deliverables

- [ ] Updated scene saved as `cozyretroroom.blend` in the project root.
- [ ] Review render in `renders/final/` at 1920x1080.
- [ ] README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, and `DECISIONS.md` updated.
- [ ] External assets registered in `ASSETS.md` (none expected).
- [ ] Required review-round records completed for this goal's actual file path.

## Acceptance

- [ ] The scene opens without missing external files.
- [ ] The camera framing shows an eye-level 3/4 corner desk vignette with the computer dominant.
- [ ] The 1970s era reads clearly through wood panelling, palette, and chunky hardware.
- [ ] Materials, lighting, and scale are deliberate and documented; no default gray surfaces.
- [ ] No floating, clipping, or intersecting props in the render.
- [ ] A 1920x1080 review render exists in `renders/final/` and has been inspected with `look`.
- [ ] The README reflects the delivered state.
- [ ] Review mode is current; the final applicable grader round is `PASS`.
- [ ] No genuine unresolved blocker or major finding remains; declining one is not a waiver.

## Workflow

1. Before this goal: requirements confirmed, workflow and review answers collected, scaffold
   persisted, all three exact records and this prompt filled, scaffold documents and goal committed,
   and `blender_workflow` `prepare` registration completed in ordinary chat. Start the goal with this
   entire filled prompt; a successful goal call ends the turn. Continue when the goal resumes.
2. Read the README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, asset register, decisions, and
   references.
3. Stop if requirements are unconfirmed, either mode is `Unset`, or required grader configuration is
   missing or disabled for `All`. Inspect harness `status` before launch and after compaction/restart;
   never recreate or manually edit external state.
4. From the workspace root, launch this project with
   `.\tools\start-blender.cmd "Blender\CozyRetroRoom"`. The launcher validates project records, path
   containment, the workspace port, and one-instance rules.
5. Call `blender_get_addon_status` and `blender_get_scene_info(fields=["settings"])`. Stop on
   connection, addon, or file mismatch. For a new unsaved scene, save to this project's declared
   `.blend` through a bounded `begin` and ticketed `save` first, then verify that exact path before
   production edits. Update README's planned path to saved only after verification.
6. Build in small bounded changes using the canonical `AGENTS.md` harness contract. `blender_workflow`
   takes `{action: string,payload: JSON string}`. `begin` declares one outcome, exact objects and
   project-relative files; one change stays open, bounded by 40 operations/15 minutes. Request
   `ticket` for apply/save/seal; next call `blender_harness_execute` with matching token, operation,
   payload, and verbatim user goal. Apply payload is a supported operation object; save/seal payload is
   `{}`. Save after meaningful changes and before risky work/handoff; recovery save/seal remain allowed
   after the apply budget. Raw `execute_blender_code`, `import_asset`, and `generate_3d` are blocked;
   unsupported operations stop for reviewed tooling extension. Inspect visual changes with `look`.
   Seal saves the scene and immutable evidence, final PNG, and manifest; mandatory
   `blender_look(image=<returned absolute render path>)` records successful inspection.
   Planned bounded changes: (a) save + room shell, (b) desk and chair, (c) CRT, tower, keyboard,
   (d) decor: lamp, rug, window, plant, books, posters, (e) lighting, camera, render settings, then
   final polish within review findings.
7. When review mode is `All`, complete required grading under `blender-project-grading` after each
   meaningful saved change. Use `grader-ticket` `{name}` and pass its unique token, exact report path,
   and `HARNESS_GRADER:<token>` to each normal grader task. Plugin binds actual child/runtime model;
   grader writes only its report and never reads peers. Read reports, record dispositions and exact
   scene hash/verdict in `REVIEW.md`, then call `review` `{notes}` to validate receipts and aggregate
   hash. Freeze evidence and hashes before graders run. Disclose genuine blockers and majors; do not
   waive them by declining the finding.
8. Fully Autonomous: proceed without approval pauses, but inspect status/diff/log, stage exact scoped
   paths, commit one exact scoped change, then `checkpoint` before the next `begin`. Failed rounds
   commit their review artifacts before fixes. Never defer work into a late mega-commit.
9. Save, seal a review render, and inspect its returned final PNG. Complete final applicable grading
   against the saved deliverable state; require `PASS` and no genuine unresolved blocker or major
   finding.
10. Update README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, `DECISIONS.md`, and `ASSETS.md`.
    Completion hook requires a clean checkpoint, final applicable `PASS`, and inspected sealed render.
    Once all acceptance checks pass, call `goal_report(status="complete", reason=<evidence>)`, then
    give the final response without further actions.

## Done

The goal is complete only when all acceptance checks pass, requirements, workflow, and review mode
are current, the scene and inspected 1920x1080 review render are saved, no external asset is missing
or unregistered, and all required documents including `REVIEW.md` are current. Grading is enabled:
the final applicable round must be `PASS`; no genuine unresolved blocker or major finding permits
completion. Harness state at `~/.local/state/blender-workflow-harness/<workspace-hash>` is external
and not agent-editable. This is a same-user guard, not an OS sandbox; manual Blender/external-shell
edits invalidate evidence, and unrestricted same-user execution can bypass controls.
