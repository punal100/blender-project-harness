# Goal: Initial Brief (2026-11-02)

Read `../../../../AGENTS.md` and the matching skills before acting. This is a design goal, not a coding plan. Do not create `PLAN/` or verifier records.

## Mission

make cozy room with computer

## Project

Cozy Computer Room — stylized low-poly cutaway diorama of a cozy computer room at night.

- README: `../../README.md`
- Requirements: `../REQUIREMENTS.md`
- Workflow: `../WORKFLOW.md`
- Review: `../REVIEW.md`
- Assets: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A cutaway corner room with a floor and two perpendicular walls, viewed from a three-quarter front angle at roughly seated eye height. The desk is the focal point: one monitor showing an emissive warm code editor, a PC tower, mechanical keyboard, mouse, mug, headphones, and a chair. A curtained window sits on the back wall with a cool teal-blue night beyond it. A rug, potted plants, wall art, and a wall shelf with small decor complete the lived-in scene. The palette is warm wood, amber, and cream against the cool window, lit by a warm desk lamp, monitor glow, and subtle shelf lighting with low ambient fill. The style is stylized low-poly with chunky forms, clean facets, and simple PBR materials. Metric scale: room corner about 4.2 m by 3.6 m, 2.6 m walls, 1.4 m desk. The sealed review render proves the result.

## Scope

- In scope: one cutaway room scene; desk workstation; window and curtains; rug; potted plants; wall art; wall shelf decor; warm evening lighting; one hero still; WIP renders; project documents.
- Out of scope: bed, couch, bookshelf, animation, interactivity, game-engine export, photoreal rendering, and third-party assets.
- External dependencies: none; harness-supported primitives and procedural materials only.

## Deliverables

- [ ] Scene saved as `cozy-computer-room.blend` in the project root.
- [ ] Inspected hero render in `renders/final/` at 1920x1080 or larger.
- [ ] WIP renders in `renders/wip/` during production.
- [ ] README, requirements, workflow, review, decisions, and assets current.
- [ ] Required review rounds completed and committed.

## Acceptance

- [ ] The sealed render shows a cutaway corner with floor and two walls and no camera clipping.
- [ ] Desk, single monitor with warm emissive code editor, PC tower, keyboard, mouse, mug, headphones, and chair are visible.
- [ ] Window with curtains, rug, potted plants, wall art, and wall shelf decor are visible.
- [ ] Warm amber interior and cool teal-blue night palette read clearly in the render.
- [ ] Lighting shows a warm desk lamp, monitor glow, and subtle shelf light with low ambient fill.
- [ ] The saved `.blend` opens without missing external files and uses relative paths only.
- [ ] The hero render exists under `renders/final/`, was inspected with `look`, and the README reflects the delivered state.
- [ ] The final applicable review is `PASS`, or `Off` self-review is recorded.
- [ ] No genuine unresolved blocker or major remains.

## Workflow

1. Read `blender-project-goal` and `blender-workflow-harness`. Before this goal: confirm requirements, collect workflow and review answers, scaffold, fill all records through `bootstrap-document`, commit with `bootstrap-commit`, call `prepare`, answer its exact question, then start this goal with this entire filled prompt.
2. Inspect `blender_workflow` `status` and follow `nextStep` for every lifecycle action.
3. Launch and stop only through `blender_workflow`. Save the first scene through a bounded `begin` and ticketed `save`; commit and checkpoint without sealing the bootstrap save.
4. For every reviewable change: apply tickets from `blender-worker`, WIP render and `look` every three applies and before seal, `seal`, `blender_look` on the sealed render, review with the configured `visual`, `technical`, and `spec` graders, `commit`, and `checkpoint`. Autonomy mode: Fully Autonomous. Review mode: All.
5. Keep project documents current inside the change that changes them. Create new markdown through `bootstrap-document` or `document`; commit through the harness.
6. Complete final grading, inspect the final sealed render, and call `goal_report(status="complete", reason=<evidence>)` only after every acceptance check passes.

## Done

All acceptance checks pass; records are current; the scene and inspected review render are saved; no external asset is missing or unregistered; the final applicable review is `PASS` or recorded `Off` self-review; and `checkpoint` is clean.
