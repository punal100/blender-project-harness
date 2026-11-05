# Goal: Initial Brief (2026-11-05)

Read `../../../../AGENTS.md` and the matching skills before acting. This is a design goal, not a coding plan. Do not create `PLAN/` or verifier records.

## Mission

make cozy room with computer

User direction: "Use a semi-realistic stylized look with warm evening lamps against a cool dusk window. Build the enclosed small full room (about 3.6 x 3.2 m, 2.6 m ceiling) with desk, desktop computer (monitor, tower, keyboard, mouse), chair, bed, bookshelf with books, rug, plant, and cozy props. Workflow: Fully Autonomous. Review mode: All with visual, technical, and spec graders. Save the scene as cozycomputerroom.blend and produce one 1920x1080 16:9 hero render. Procedural only, no project scripts, no external assets."

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

A semi-realistic stylized small room at evening, approximately 3.6 x 3.2 m with a 2.6 m ceiling. The desk workstation is the focal point: a wooden desk with a desktop computer (monitor, tower, keyboard, and mouse), an office chair, a warm monitor glow, and a warm desk lamp. The room is complete and lived-in with a bed, a window with cool dusk light and curtains, a bookshelf with books, a rug, a potted plant, wall art, a mug, and a soft blanket. Materials are procedural and believable across wood, fabric, plastic, metal, paper, ceramic, and plant, with clean stylized forms. Lighting is warm amber lamps against a cool blue window, with soft shadows and a calm cozy mood. One hero camera sits at eye level near 1.5 m in a wide three-quarter view toward the desk, 16:9 at 1920x1080, with the computer clearly readable. The sealed camera render in `renders/final/` proves the result.

## Scope

- In scope: enclosed compact room shell (floor, walls, ceiling, door, window); desk workstation with desktop computer (monitor, tower, keyboard, mouse); chair; bed; bookshelf with books; rug; plant; wall art; curtains; small cozy props; warm and cool evening lighting; one hero camera; 1920x1080 still; saved scene and project documents.
- Out of scope: characters, rigs, animation, sound, interactivity, game-engine setup, GLB/FBX export, photoreal texture sourcing, external assets, generated media, project scripts, multiple rooms or building exteriors.
- External dependencies: none.

## Deliverables

- [ ] Scene saved as `cozycomputerroom.blend` in the project root.
- [ ] One 1920x1080 16:9 hero PNG in `renders/final/`.
- [ ] Inspected sealed review render.
- [ ] README, requirements, workflow, review, decisions, and assets updated.
- [ ] Required All-grader review rounds completed and committed.

## Acceptance

- [ ] Scene opens without missing external files.
- [ ] Enclosed room is approximately 3.6 x 3.2 m with a 2.6 m ceiling.
- [ ] Desk, monitor, tower, keyboard, mouse, chair, and desk lamp are present and the computer is clearly readable in the hero render.
- [ ] Bed, bookshelf with books, rug, plant, wall art, curtains, and cozy props are present.
- [ ] Warm lamp light and cool dusk window light are both visible, with a calm cozy mood and soft shadows.
- [ ] Hero camera is eye level near 1.5 m, wide three-quarter view, 16:9 at 1920x1080.
- [ ] All geometry and materials are procedural in Blender; no external assets or scripts.
- [ ] Sealed review render exists and was inspected with `look`.
- [ ] Final All-grader review is `PASS` with no genuine unresolved blocker or major.
- [ ] README reflects the delivered state.

## Workflow

1. Read `blender-project-goal` and `blender-workflow-harness`. Before this goal: requirements confirmed, workflow and review answers collected, scaffold, all records through `bootstrap-document`, commit with `bootstrap-commit`, call `prepare`, answer its exact question, then start this goal with this entire filled prompt.
2. Inspect `blender_workflow` `status` and follow `nextStep` for every lifecycle action.
3. Launch and stop only through `blender_workflow`. Save the first scene through a bounded `begin` and ticketed `save`; commit and checkpoint without sealing the bootstrap save.
4. For every reviewable change: apply tickets from `blender-worker`, WIP checks, `finalize`, `seal`, inspect the returned render with `blender_look`, complete All-grader review, `commit`, and `checkpoint`.
5. Keep project documents current inside the change that changes them. Commit through the harness.
6. Complete final grading, inspect the final sealed render, and call `goal_report(status="complete", reason=<evidence>)` only after every acceptance check passes.

## Done

All acceptance checks pass; records are current; the scene and inspected review render are saved; no external asset is missing or unregistered; the final All-grader review is `PASS`; and `checkpoint` is clean.
