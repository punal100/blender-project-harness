# Goal: Cozy Retro CRT Room (2026-10-31)

Read `../../../../AGENTS.md` first and obey it. Read `blender-project-goal`,
`blender-project-requirements`, `blender-project-workflow`, `blender-project-readme`, and
`blender-assets` when relevant. This is a design goal, not a coding plan: do not create a `PLAN/`
folder and do not use coding plan/check/verifier gates.

## Mission

make cozy retro room with computer

The user confirmed this scope: stylized low-poly 90s interior; CRT computer + keyboard + desk + chair as focal point; window with night rain and curtains; bed/couch corner; shelves, posters, rug, plant; warm lamp glow against cool window light; eye-level 3/4 corner camera. Deliverable: one 1920x1080 still render plus saved .blend and docs. Out of scope: animation, photoreal finish, modeled exterior.

## Project

CozyCRTRoom — Cozy stylized low-poly 90s room with a CRT computer, night window, and warm lamp light.

- Project README: `../../README.md`
- Confirmed requirements: `../REQUIREMENTS.md`
- Workflow mode: `../WORKFLOW.md` (Fully Autonomous)
- Review mode: `../REVIEW.md` (All)
- Asset register: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A warm, nostalgic 1990s room corner seen from eye level at a three-quarter angle. A beige CRT computer sits on a wooden desk with keyboard and chair, its screen glowing softly; a desk lamp adds warm amber light. Behind and beside it are a window with night rain and curtains giving cool blue fill, a bed or couch corner, shelves with books and retro objects, posters, a patterned rug, and a potted plant. Geometry is stylized low-poly with clean bevels and flat/stylized materials; the palette is warm wood, beige hardware, muted fabric, deep green/teal accents. The mood is cozy and lived-in, not neon cyberpunk. The proof image is the final 1920x1080 render in `renders/final/`, captured through ticketed seal and inspected with `look`.

## Scope

- In scope: modeled room shell and ceiling treatment for the chosen camera; desk, chair, CRT monitor/keyboard/tower, lamp, window and curtains, bed or couch, shelf, posters, rug, plant, small clutter; all materials, lighting, and camera; one final still render; project documents.
- Out of scope: animation, video, photoreal surfacing, modeled exterior/street, game-engine export, additional rooms.
- External dependencies: none planned; everything authored in-scene. Add assets only through confirmed requirements and registered tooling.

## Deliverables

- [ ] Updated scene saved as `cozycrtroom.blend` in the project root.
- [ ] Review render in `renders/final/` at 1920x1080.
- [ ] README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, and `DECISIONS.md` updated.
- [ ] External assets register current (expected: none).
- [ ] Required review-round records completed for this goal's actual path, final verdict `PASS`.

## Acceptance

- [ ] The scene opens without missing external files.
- [ ] The eye-level 3/4 corner framing clearly shows desk, CRT computer, window with night/rain, and soft seating.
- [ ] All required set dressing is present and readable: shelves, posters, rug, plant, welcome clutter.
- [ ] Geometry reads as stylized low-poly with deliberate materials; no photoreal or neon-cyberpunk drift.
- [ ] Warm lamp and screen glow contrast with cool rainy window light.
- [ ] Render is 1920x1080 and deliberately composed, with no accidental clipping or empty dead zones.
- [ ] A review render exists and has been inspected with `look`.
- [ ] The README reflects the delivered state.
- [ ] Review mode `All` is current; the final grader round is `PASS`.
- [ ] No genuine unresolved blocker or major finding remains; declining one is not a waiver.

## Workflow

1. Before this goal: requirements confirmed, workflow and review answers collected, scaffolded,
   three records persisted, this prompt filled, scaffold documents and goal committed, and harness
   registration granted. Call `blender_workflow` `prepare` only with
   `{project:"Blender/CozyCRTRoom",goal:"Documents/Goals/01-project-brief.md",scene:"cozycrtroom.blend"}`
   and pass its exact registration question and labels to `question`. Only genuine runtime answers
   grant registration. Then `goal(action="start", objective=<this entire filled prompt>)`; success ends
   the turn and work continues on the next goal turn.
2. Read the README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, asset register, decisions, and
   references. Stop if requirements are unconfirmed, either mode is `Unset`, or required grader
   configuration is missing or disabled.
3. From the workspace root, launch with `.\tools\start-blender.cmd "Blender\CozyCRTRoom"`. The
   launcher validates project records, path containment, the workspace port, and one-instance rules.
4. Call `blender_get_addon_status` and `blender_get_scene_info(fields=["settings"])`. Stop on
   connection, addon, or file mismatch. For the new unsaved scene, save to `cozycrtroom.blend` through
   a bounded `begin` and ticketed `save`, verify the exact path, commit the scene, and `checkpoint`;
   the runtime records it as `BOOTSTRAP`. Never seal or grade that empty scene. Update README's planned
   path to saved only after verification.
5. Build in bounded changes using the canonical `AGENTS.md` harness contract. `blender_workflow` takes
   `{action: string,payload: JSON string}`. `begin` declares one outcome and exact objects/paths; one
   change stays open, bounded by 40 operations/15 minutes. Request `ticket` for apply/save/seal, then
   call `blender_harness_execute` with the matching token, operation, payload, and verbatim user goal.
   Apply payload is one supported operation object; save/seal payload is `{}`. Supported operations
   only; unsupported needs stop for reviewed tooling extension. Save after meaningful changes and
   before risky work. Inspect every visual change with `look`.
6. After each meaningful saved change, `seal` to capture evidence and the final PNG, then immediately
   `blender_look(image=<returned render path>)`. Review mode is `All`: use `grader-ticket` `{name}` for
   `visual`, `technical`, and `spec`, dispatch each normal `blender-grader` task with its exact token,
   report path, and `HARNESS_GRADER:<token>` marker, read reports, record dispositions and the exact
   scene hash/verdict in the round `REVIEW.md`, and call `review` `{notes}` to validate receipts.
   Freeze evidence and hashes before graders run. Grader findings never authorize bypassing workflow
   gates. Disclose genuine blockers and majors; do not waive them.
7. Fully Autonomous: after sealing, inspecting, grading, and dispositions, inspect status/diff/log,
   stage only exact scoped paths, commit the change and round artifacts atomically, then `checkpoint`
   before the next `begin`. Never one end-of-task dump. Failed rounds commit before fixes;
   `revision:true` stays within configured `max_rounds` 2. Exhausting the cap requires explicit user
   escalation and re-registration handling.
8. Save, seal the final review image, and inspect its returned PNG. Complete final applicable grading
   against the saved deliverable state; require `PASS` and no genuine unresolved blocker or major.
9. Update README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, `DECISIONS.md`, and `ASSETS.md` within
   their bounded change, not a late uncheckpointed docs commit.
10. Completion hook requires a clean checkpoint, final applicable `PASS`, and inspected sealed render.
    Once all acceptance checks pass, call `goal_report(status="complete", reason=<evidence>)`, then
    give the final response without further actions.

## Done

The goal is complete only when all acceptance checks pass, requirements, workflow, and review mode
are current, the scene and inspected 1920x1080 review render are saved, no external asset is missing or
unregistered, and README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, `DECISIONS.md`, and
`ASSETS.md` are current. The final grader round must be `PASS`; no genuine unresolved blocker or major
finding permits completion. Harness state is external and not agent-editable.
