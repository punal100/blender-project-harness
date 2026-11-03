# Goal: Initial Brief (2026-11-03)

Read `../../../../AGENTS.md` and the matching skills before acting. This is a design goal, not a
coding plan. Do not create `PLAN/` or verifier records.

## Mission

Make a cozy room with computer

The user confirmed this scope: warm evening lamp-lit single interior; desktop PC + monitor as focal
point; desk-corner three-quarter hero camera; CC0 Poly Haven assets permitted; one 1920x1080 PNG
still plus saved .blend; animation, characters, exterior and audio out of scope.

## Project

CozyStudyRoom — Cozy evening study room with a desktop computer workstation.

- README: `../../README.md`
- Requirements: `../REQUIREMENTS.md`
- Workflow: `../WORKFLOW.md`
- Review: `../REVIEW.md`
- Assets: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A warm, lived-in evening study corner about 4 m x 4 m with a 2.7 m ceiling. A wooden desk sits
against a wall with a glowing monitor, keyboard, mouse, and tower; a warm desk lamp provides the key
light, with a mug, notebook, chair, rug, shelf or wall art, plant, and soft textile detail completing
the room. The hero camera is a three-quarter desk-corner view at roughly seated eye height, framing
desk, monitor, chair, lamp and wall decor together at 16:9. The palette is warm amber, wood brown,
muted ochre and cream against deep soft shadow. Materials are plausible wood, fabric, painted wall,
metal and emissive surfaces at real-world scale. Mood: calm, inviting, lived-in. The sealed camera
PNG in `renders/final/` proves the result.

## Scope

- In scope: enclosed room shell; wooden desk workstation with desktop PC as focal point; cozy set dressing (chair, rug, mug, notebook, shelf or wall art, plant, textile detail); warm practical lamp plus cool low-level fill; one hero camera; 1920x1080 EEVEE-class still; saved scene and project documents.
- Out of scope: animation, camera moves, video export, characters, animals, exterior architecture beyond a simple window treatment, audio, interactive walkthrough, paid or non-CC0 assets.
- External dependencies: free CC0 Poly Haven textures and/or HDRI, each registered in `Documents/ASSETS.md` with source and licence before commit.

## Deliverables

- [ ] Scene saved as `cozystudyroom.blend` in the project root.
- [ ] Inspected review render in `renders/final/`.
- [ ] README, requirements, workflow, review, decisions, and assets updated.
- [ ] Required review rounds completed and committed.

## Acceptance

- [ ] Scene opens without missing external files; strict asset check passes.
- [ ] Warm evening lamp lighting is obvious and the desk lamp is visible.
- [ ] Desktop computer setup reads clearly as the focal point from the hero camera.
- [ ] Desk-corner three-quarter 16:9 framing includes desk, monitor, chair, lamp and wall decor without clipping.
- [ ] Materials, lighting, and scale are deliberate and documented.
- [ ] Sealed review render exists and was inspected with `look`.
- [ ] README reflects the delivered state.
- [ ] Final applicable review is `PASS`, or `Off` self-review is recorded.
- [ ] No genuine unresolved blocker or major remains.

## Workflow

1. Read `blender-project-goal` and `blender-workflow-harness`. Before this goal: confirm
   requirements, collect workflow and review answers, scaffold, fill all records through
   `bootstrap-document`, commit with `bootstrap-commit`, call `prepare`, answer its exact question,
   then start this goal with this entire filled prompt.
2. Inspect `blender_workflow` `status` and follow `nextStep` for every lifecycle action.
3. Launch and stop only through `blender_workflow`. Save the first scene through a bounded `begin`
   and ticketed `save`; commit and checkpoint without sealing the bootstrap save.
4. For every reviewable change: apply tickets from `blender-worker`, `seal`, inspect the returned
   render with `blender_look`, complete review, `commit`, and `checkpoint`. Fully Autonomous with
   review mode All means `review` auto-commits reviewed changes.
5. Keep project documents current inside the change that changes them. Create new markdown through
   `bootstrap-document` or `document`; commit through the harness.
6. Complete final grading, run `check_assets` with `{strict:true}` on the final scene, inspect the
   final sealed render, and call `goal_report(status="complete", reason=<evidence>)` only after
   every acceptance check passes.

## Done

All acceptance checks pass; records are current; the scene and inspected review render are saved;
no external asset is missing or unregistered; the final applicable review is `PASS` or recorded `Off`
self-review; and `checkpoint` is clean.
