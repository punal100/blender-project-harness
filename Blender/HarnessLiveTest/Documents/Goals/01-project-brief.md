# Goal: Live Harness Validation (2026-11-02)

Read `../../../../AGENTS.md` and the matching skills before acting. This is a design goal, not a coding plan. Do not create `PLAN/` or verifier records.

## Mission

Create a single-cube validation scene with a camera and light, then complete the harness lifecycle through an inspected sealed render, Single visual review, commit, checkpoint, and completion.

## Project

HarnessLiveTest — Live harness validation scene

- README: `../../README.md`
- Requirements: `../REQUIREMENTS.md`
- Workflow: `../WORKFLOW.md`
- Review: `../REVIEW.md`
- Assets: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A neutral grey 1 m cube centered on a 1 m dark plane, viewed from a three-quarter camera angle, lit by one warm key light, with a readable silhouette and clear margins. The review render is a 1024x768 PNG saved under `renders/final/`.

## Scope

- In scope: one cube, one plane, one camera, one light, simple matte materials, render settings, and review evidence.
- Out of scope: external assets, animation, exports, photorealistic detail, and additional set dressing.
- External dependencies: none.

## Deliverables

- [ ] Scene saved as `harnesslivetest.blend` in the project root.
- [ ] Inspected review render in `renders/final/`.
- [ ] README, requirements, workflow, review, decisions, and assets current.
- [ ] Required Single visual review round completed and committed.

## Acceptance

- [ ] Scene opens without missing external files.
- [ ] One cube, one plane, one camera, and one light exist at deliberate scale.
- [ ] Three-quarter camera framing shows the cube with clear margins.
- [ ] Materials, lighting, and scale are deliberate and documented.
- [ ] Sealed review render exists and was inspected with `look`.
- [ ] README reflects the delivered state.
- [ ] Final visual review is `PASS` with no genuine unresolved blocker or major.
- [ ] `checkpoint` is clean.

## Workflow

1. Read `blender-project-goal` and `blender-workflow-harness`. Before this goal: confirm requirements, collect workflow and review answers, scaffold, fill all records through `bootstrap-document`, commit with `bootstrap-commit`, call `prepare`, answer its exact question, then start this goal with this entire filled prompt.
2. Inspect `blender_workflow` `status` and follow `nextStep` for every lifecycle action.
3. Launch and stop only through `blender_workflow`. Save the first scene through a bounded `begin` and ticketed `save`; commit and checkpoint without sealing the bootstrap save.
4. For every reviewable change: apply tickets from `blender-worker`, `seal`, inspect the returned render with `blender_look`, complete review, `commit`, and `checkpoint`.
5. Keep project documents current inside the change that changes them. Create new markdown through `bootstrap-document` or `document`; commit through the harness.
6. Complete final review, inspect the final sealed render, and call `goal_report(status="complete", reason=<evidence>)` only after every acceptance check passes.

## Done

All acceptance checks pass; records are current; the scene and inspected review render are saved; no external asset is missing or unregistered; the final Single visual review is `PASS`; and `checkpoint` is clean.
