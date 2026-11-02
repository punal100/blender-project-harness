# Goal: Initial Brief (2026-11-02)

Read `../../../../AGENTS.md` and the matching skills before acting. This is a design goal, not a coding plan. Do not create `PLAN/` or verifier records.

## Mission

cozy room with computer

## Project

CozyRoomLive — Warm stylized cozy room with a computer desk as the focal point

- README: `../../README.md`
- Requirements: `../REQUIREMENTS.md`
- Workflow: `../WORKFLOW.md`
- Review: `../REVIEW.md`
- Assets: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A warm stylized evening interior about 4.0 × 3.5 m with a 2.7 m ceiling. A wooden desk sits against the window wall with a glowing 27-inch monitor, keyboard, mouse, mug, and desk lamp; an ergonomic chair, rug, bookshelf with books, plant, wall art, curtains, and a soft blanket complete the lived-in room. One hero camera at about 1.25 m seated height, 3/4 angle toward the desk, computer centered, 16:9 at 1920×1080. Lighting combines a warm practical table lamp and monitor glow with a cool dusk window fill, soft shadows, and an amber/terracotta palette against teal-blue dusk. Materials are stylized wood, fabric, ceramic, and matte paint at real-world scale. Mood: calm, inviting, lived-in. The sealed camera PNG in `renders/final/` proves the result.

## Scope

- In scope: enclosed room shell; workstation with the computer as focal point; cozy set dressing; warm/cool evening lighting; one hero camera; EEVEE 1920×1080 still; saved scene and project documents.
- Out of scope: characters, rigs, animation, sound, interactivity, game-engine setup, GLB export.
- External dependencies: none required; optional CC0 Poly Haven textures or HDRI only if needed and registered in `Documents/ASSETS.md` first.

## Deliverables

- [ ] Scene saved as `cozyroomlive.blend` in the project root.
- [ ] Inspected review render in `renders/final/`.
- [ ] README, requirements, workflow, review, decisions, and assets updated.
- [ ] Required review rounds completed and committed.

## Acceptance

- [ ] Sealed 1920×1080 render shows the complete cozy room with the computer as the clear focal point.
- [ ] Warm practical/monitor light and cool dusk window fill are both readable; no black voids or blown highlights.
- [ ] No floating or intersecting objects; proportions are plausible at real-world scale.
- [ ] Scene opens without missing external files and every declared object exists.
- [ ] Visual, technical, and spec graders return `PASS` with no open blocker or major.
- [ ] README reflects the delivered state and the sealed render was inspected with `look`.
- [ ] `checkpoint` is clean.

## Workflow

1. Launch and stop only through `blender_workflow`; save the first scene through a bounded `begin` and ticketed `save`; commit and checkpoint without sealing the bootstrap save.
2. For every reviewable change: apply tickets from `blender-worker`, `save` when needed, `seal`, inspect the returned render with `blender_look`, grade with visual, technical, and spec graders, aggregate with `review`, then `checkpoint` (Fully Autonomous review auto-commits).
3. Keep documents current inside the change that changes them; use harness document and commit actions.
4. Call `goal_report(status="complete", reason=<evidence>)` only after every acceptance check passes.

## Done

All acceptance checks pass; records are current; the scene and inspected review render are saved; no external asset is missing or unregistered; the final review is `PASS`; and `checkpoint` is clean.
