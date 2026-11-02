# Goal: Initial Brief (2026-11-03)

Read `../../../../AGENTS.md` and the matching skills before acting. This is a design goal, not a
coding plan. Do not create `PLAN/` or verifier records.

## Mission

make cozy room with computer

## Project

CozyRoomDiorama — a low-poly cozy computer room diorama on a rainy evening.

- README: `../../README.md`
- Requirements: `../REQUIREMENTS.md`
- Workflow: `../WORKFLOW.md`
- Review: `../REVIEW.md`
- Assets: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A self-contained low-poly diorama of one room, built from a floor and two walls with the foreground
corner open to the camera. The desk and computer are the focal point: a monitor with a soft glow, a
keyboard, a mouse, a PC tower, and a desk chair. Behind and beside the desk: a window with curtains
showing visible rain and a dark cool-blue exterior, a filled bookshelf, wall art, and everyday
clutter such as a mug and papers. A rug anchors the centre, a floor lamp and desk lamp provide warm
practical light, and at least two potted plants soften the corners. Geometry is faceted and
simplified with deliberate low-poly silhouettes; materials are flat and procedural, with no
photoreal textures. The palette mixes warm amber interior light, cool blue rain light, muted wood,
and teal accents. The mood is calm, warm, slightly nostalgic, and lived-in. The camera is a
three-quarter view from the open corner at 16:9, framing the full diorama with the desk clearly
readable as the main subject. Scale is believable room scale in metres. The sealed review render is
the image that proves the result.

## Scope

- In scope: one room diorama with a floor and two walls; desk, monitor, keyboard, mouse, PC tower, and
  chair; window with curtains and rain; bookshelf with books; rug; floor lamp; at least two potted
  plants; wall art; mug and papers clutter; warm/cool lighting; one hero camera; 1920x1080 EEVEE
  render; project documentation.
- Out of scope: bed or sofa, additional rooms, animation, audio, interactive behaviour, photoreal
  assets, external asset libraries, and exports beyond the `.blend` and PNG render.
- External dependencies: none. Only Blender primitives and procedural materials, using harness-
  supported operations.

## Deliverables

- [ ] Scene saved as `cozyroomdiorama.blend` in the project root.
- [ ] Inspected review render in `renders/final/`, 1920x1080 EEVEE.
- [ ] README, requirements, workflow, review, assets, decisions, and goal records updated.
- [ ] Required review rounds completed and committed.

## Acceptance

- [ ] Scene opens without missing external files.
- [ ] Hero render clearly shows the desk, monitor, keyboard, mouse, PC tower, and chair.
- [ ] Window with curtains, rain, and cool exterior light is visible.
- [ ] Bookshelf with books, rug, floor lamp, at least two plants, wall art, and clutter are visible.
- [ ] Low-poly faceted style is consistent; no photoreal textures or external assets.
- [ ] Warm interior lamps and monitor glow contrast with cool rainy window light; mood reads cozy.
- [ ] Three-quarter 16:9 framing shows the full room with the desk as the focal point.
- [ ] Materials, lighting, and scale are deliberate and documented.
- [ ] Sealed review render exists and was inspected with `look`.
- [ ] README reflects the delivered state.
- [ ] Final applicable review is `PASS`, or `Off` self-review is recorded.
- [ ] No genuine unresolved blocker or major remains.

## Workflow

1. Requirements are confirmed; workflow is Fully Autonomous; review mode is All with the configured
   visual, technical, and spec graders. Registration was completed before this goal started.
2. Inspect `blender_workflow` `status` and follow `nextStep` for every lifecycle action.
3. Launch and stop only through `blender_workflow`. Save the first scene through a bounded `begin`
   and ticketed `save`; commit and checkpoint it without sealing the bootstrap save.
4. For every reviewable change: `begin`, issue apply tickets to `blender-worker`, run a WIP render
   every three applies and before sealing, inspect it with `look`, `finalize`, `seal`, inspect the
   sealed render with `look`, complete all three grader reviews, `commit`, and `checkpoint`.
5. Keep project documents current inside the change that changes them. Create new markdown through
   `bootstrap-document` or `document`; commit through the harness. Never edit frozen registration
   documents.
6. Complete final grading, inspect the final sealed render, and call
   `goal_report(status="complete", reason=<evidence>)` only after every acceptance check passes.

## Done

All acceptance checks pass; records are current; the scene and inspected review render are saved; no
external asset is missing or unregistered; the final applicable review is `PASS`; and `checkpoint` is
clean.
