# Goal: Initial Brief (2026-11-01)

Read `../../../../AGENTS.md` and the matching skills before acting. This is a design goal, not a
coding plan. Do not create `PLAN/` or verifier records.

## Mission

make cozy retro room with computer

## Project

CozyRetroComputerRoom — Late-80s/90s cozy computer corner with beige CRT desktop

- README: `../../README.md`
- Requirements: `../REQUIREMENTS.md`
- Workflow: `../WORKFLOW.md`
- Review: `../REVIEW.md`
- Assets: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A cozy late-80s/90s computer corner seen as a tight 3/4 desk-corner close-up in a 16:9, 1920x1080
hero still. Beige CRT monitor with a deep rear housing dominates the frame, yellowed plastic and a
glow on its screen; beige keyboard and mouse sit in the near foreground; a beige PC tower stands
beside the wood-veneer desk with floppy disks and small clutter around it. Warm tungsten desk lamp
is the key, the CRT screen the warm-teal accent, and the background wall, poster, plant, mug, and
chair edge fall into soft bokeh. Palette is beige/cream, warm wood, and teal-orange light; the meter
reads metric and the desk sits 0.75 m high. Mood: quiet nostalgic evening, lived-in and calm. The
review image that proves the result is the sealed camera render in `renders/final/`.

## Scope

- In scope: room shell needed by the camera, desk, CRT monitor, PC tower, keyboard, mouse, desk
  clutter (floppy disks, mug, CDs/cassettes, small plant), desk lamp, wall poster, chair edge,
  procedural materials, lighting, camera, one hero render, and project documents.
- Out of scope: animation, rigging, simulation, people, branded logos, downloaded assets, exports
  other than the hero PNG, and any area outside the camera's view depth.
- External dependencies: none; all geometry and materials are authored procedurally in the scene.

## Deliverables

- [ ] Scene saved as `cozyretrocomputerroom.blend` in the project root.
- [ ] Inspected review render in `renders/final/`.
- [ ] README, requirements, workflow, review, decisions, and assets updated.
- [ ] Required review rounds completed and committed.

## Acceptance

- [ ] Scene opens without missing external files.
- [ ] Render reads instantly as a cozy late-80s/90s computer corner with a beige CRT desktop.
- [ ] Camera is a tight 3/4 desk-corner close-up with the monitor as focal point and shallow depth of field.
- [ ] Warm lamp key plus CRT glow produce a coherent beige/wood/teal-orange palette without a cold dominant cast.
- [ ] Props contact surfaces correctly at believable metric scale; no floating or intersecting geometry.
- [ ] Materials look like aged beige plastic and wood veneer, not flat untextured primitives.
- [ ] No visible clipping, light leaks, or render artifacts; 1920x1080 16:9 output.
- [ ] Sealed review render exists and was inspected with `look`.
- [ ] README reflects the delivered state.
- [ ] Final applicable review is `PASS`.
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
self-review; and `checkpoint` is clean. Mode is Fully Autonomous with review mode All, so the final
round must aggregate to `PASS` from the configured graders.
