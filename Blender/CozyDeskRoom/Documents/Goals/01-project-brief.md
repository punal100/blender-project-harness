# Goal: Initial Brief (2026-11-03)

Read `../../../../AGENTS.md` and the matching skills before acting. This is a design goal, not a
coding plan. Do not create `PLAN/` or verifier records.

## Mission

make cozy room with computer

## Project

CozyDeskRoom — Cozy evening study corner with a computer

- README: `../../README.md`
- Requirements: `../REQUIREMENTS.md`
- Workflow: `../WORKFLOW.md`
- Review: `../REVIEW.md`
- Assets: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A warm, lived-in study corner at blue hour. A wooden desk against the back wall holds a monitor with
an amber desktop glow, keyboard, mouse, notebook, mug, and a warm desk lamp. A dark computer tower
stands beside the desk; a low-backed chair sits in front. The wall behind carries a floating shelf
with books and a small framed print. A twilight window with cream curtains glows cool on the right,
a rust rug anchors the floor, and a potted plant fills the corner. Palette: warm walnut, painted
plaster, rust and cream fabric, dark metal, muted green, and deep twilight blue. Lighting: golden
2700 K practicals against a cool window fill, soft shadows, readable contrast, restrained highlights.
Camera: three-quarter view from the open room side at standing eye height, desk as the subject,
window and wall behind, 1920×1080 hero render. Room scale roughly 3.6 × 3.6 × 2.7 m with 0.75 m desk
height.

## Scope

- In scope: primitive-built room shell, desk, chair, computer tower, monitor, keyboard, mouse, lamp, window, curtains, shelf, books, rug, plant, small desk decor, lighting, hero camera, render settings, and project documentation.
- Out of scope: whole apartment, bed or sofa, characters, animation, physics, game export, downloaded models or textures, and external HDRIs.
- External dependencies: none. Blender and the harness only; no third-party assets.

## Deliverables

- [ ] Scene saved as `cozydeskroom.blend` in the project root.
- [ ] Inspected review render in `renders/final/`.
- [ ] README, requirements, workflow, review, decisions, and assets updated.
- [ ] Required review rounds completed and committed.

## Acceptance

- [ ] Scene opens without missing external files.
- [ ] The room contains the agreed desk, chair, computer, window, shelf, rug, plant, and decor; nothing required is absent or floating.
- [ ] Warm lamp light and cool twilight window fill produce a cozy, readable evening mood with soft shadows.
- [ ] Materials and palette match the confirmed warm-wood, fabric, plaster, metal, and emissive direction.
- [ ] Three-quarter hero camera frames the desk with the window and room behind at 1920×1080.
- [ ] Furniture and props are human-scaled and grounded in a roughly 3.6 × 3.6 × 2.7 m room.
- [ ] Saved scene and sealed review render exist and the render was inspected with `look`.
- [ ] README reflects the delivered state.
- [ ] Final applicable review is `PASS`, or `Off` self-review is recorded.
- [ ] No genuine unresolved blocker or major remains.

## Workflow

1. Read `blender-project-goal` and `blender-workflow-harness`. Requirements, workflow, and review answers are confirmed; this goal is filled and started before launch.
2. Inspect `blender_workflow` `status` and follow `nextStep` for every lifecycle action.
3. Launch and stop only through `blender_workflow`. Save the first scene through a bounded `begin` and ticketed `save`; commit and checkpoint without sealing the bootstrap save.
4. Build in bounded milestones: room shell and furniture, workstation and dressing, then final lighting, camera, remaining decor, and documentation.
5. For every reviewable change: apply tickets from `blender-worker`, WIP render and `look`, `seal`, inspect the sealed render with `blender_look`, complete `All` grader review, `commit`, and `checkpoint`.
6. Keep project documents current inside the change that changes them. Commit through the harness.
7. Complete final grading, inspect the final sealed render, and call `goal_report(status="complete", reason=<evidence>)` only after every acceptance check passes.

## Done

All acceptance checks pass; records are current; the scene and inspected review render are saved; no
external asset is missing or unregistered; the final applicable review is `PASS` or recorded `Off`
self-review; and `checkpoint` is clean.
