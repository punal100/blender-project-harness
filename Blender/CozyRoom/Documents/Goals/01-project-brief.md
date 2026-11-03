# Goal: Initial Brief (2026-11-03)

Read `../../../../AGENTS.md` and the matching skills before acting. This is a design goal, not a
coding plan. Do not create `PLAN/` or verifier records.

## Mission

Make a cozy room with computer

## Project

CozyRoom — Cozy evening study room with a desktop computer

- README: `../../README.md`
- Requirements: `../REQUIREMENTS.md`
- Workflow: `../WORKFLOW.md`
- Review: `../REVIEW.md`
- Assets: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

Subject, composition, camera, lighting, materials, colour, scale, mood, and the review image that
proves the result.

## Scope

- In scope:
- Out of scope:
- External dependencies:

## Deliverables

- [ ] Scene saved as `cozyroom.blend` in the project root.
- [ ] Inspected review render in `renders/final/`.
- [ ] README, requirements, workflow, review, decisions, and assets updated.
- [ ] Required review rounds completed and committed.

## Acceptance

- [ ] Scene opens without missing external files.
- [ ] Visual direction and camera framing match the confirmed brief.
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
   render with `blender_look`, complete review, approve in Partially Autonomous mode, `commit`, and
   `checkpoint`.
5. Keep project documents current inside the change that changes them. Create new markdown through
   `bootstrap-document` or `document`; commit through the harness.
6. Complete final grading, inspect the final sealed render, and call
   `goal_report(status="complete", reason=<evidence>)` only after every acceptance check passes.

## Done

All acceptance checks pass; records are current; the scene and inspected review render are saved; no
external asset is missing or unregistered; the final applicable review is `PASS` or recorded `Off`
self-review; and `checkpoint` is clean.
