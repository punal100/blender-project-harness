# Goal: Initial Brief (2026-11-05)

Read `../../../../AGENTS.md` and the matching skills before acting. This is a design goal, not a coding plan. Do not create `PLAN/` or verifier records.

## Mission

make cozy room with computer

## Project

CozyComputerRoom — Semi-realistic stylized cozy small room with a desktop computer and warm evening lamp lighting.

- README: `../../README.md`
- Requirements: `../REQUIREMENTS.md`
- Workflow: `../WORKFLOW.md`
- Review: `../REVIEW.md`
- Assets: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A semi-realistic stylized small room at evening, approximately 3.6 x 3.2 m with a 2.6 m ceiling. The desk workstation is the focal point: a wooden desk with a desktop computer (monitor, tower, keyboard, and mouse), an office chair, a warm monitor glow, and a warm desk lamp. The room is complete and lived-in with a bed, a window with cool dusk light and curtains, a bookshelf with books, a rug, a potted plant, wall art or posters, a mug, and a soft blanket. Materials are procedural and believable across wood, fabric, plastic, metal, paper, ceramic, and plant, with clean stylized forms. Lighting is warm amber lamps against a cool blue window, with soft shadows and a calm cozy mood. One hero camera sits at eye level near 1.5 m in a three-quarter view toward the desk, 16:9 at 1920x1080, with the computer clearly readable. The sealed camera render in `renders/final/` proves the result.

## Scope

- In scope: enclosed compact room shell (floor, walls, ceiling, door, window); desk workstation with desktop computer (monitor, tower, keyboard, mouse); chair; bed; bookshelf with books; rug; plant; small cozy props; warm and cool evening lighting; one hero camera; EEVEE 1920x1080 still; saved scene and project documents.
- Out of scope: characters, rigs, animation, sound, interactivity, game-engine setup, GLB/FBX export, photoreal texture sourcing, additional camera deliverables, external or generated media, and project Python scripts.
- External dependencies: none; all geometry and materials are procedural in Blender.

## Deliverables

- [ ] Scene saved as `cozycomputerroom.blend` in the project root.
- [ ] Inspected 1920x1080 hero render in `renders/final/`.
- [ ] README, requirements, workflow, review, decisions, and assets updated.
- [ ] Required review rounds completed and committed.

## Acceptance

- [ ] Scene opens without missing external files.
- [ ] The room is enclosed and complete; floor, walls, ceiling, door, and window are present.
- [ ] Desk, desktop computer (monitor, tower, keyboard, mouse), and chair are clearly visible at believable scale.
- [ ] Bed, bookshelf with books, rug, plant, and cozy props furnish the room.
- [ ] Warm evening lamp lighting contrasts with cool dusk window light; mood is cozy and calm.
- [ ] One hero camera frames the computer as the focal point at 1920x1080, 16:9.
- [ ] Materials are procedural, believable, and free of missing textures.
- [ ] Sealed review render exists and was inspected with `look`.
- [ ] Final applicable review is `PASS`, or `Off` self-review is recorded.
- [ ] No genuine unresolved blocker or major remains.

## Workflow

1. Read `blender-project-goal` and `blender-workflow-harness`. Before this goal: confirm requirements, collect workflow and review answers, scaffold, fill all records through `bootstrap-document`, commit with `bootstrap-commit`, call `prepare`, answer its exact question, then start this goal with this entire filled prompt.
2. Inspect `blender_workflow` `status` and follow `nextStep` for every lifecycle action.
3. Launch and stop only through `blender_workflow`. Save the first scene through a bounded `begin` and ticketed `save`; commit and checkpoint without sealing the bootstrap save.
4. For every reviewable change: apply tickets from `blender-worker`, `seal`, inspect the returned render with `blender_look`, complete review, `commit`, and `checkpoint`. Review mode is `All` (visual, technical, spec).
5. Keep project documents current inside the change that changes them. Create new markdown through `bootstrap-document` or `document`; commit through the harness.
6. Complete final grading, inspect the final sealed render, and call `goal_report(status="complete", reason=<evidence>)` only after every acceptance check passes.

## Done

All acceptance checks pass; records are current; the scene and inspected review render are saved; no external asset is missing or unregistered; the final applicable review is `PASS` or recorded `Off` self-review; and `checkpoint` is clean.
