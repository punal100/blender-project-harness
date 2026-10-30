# Goal: Initial Brief (2026-10-31)

Read `../../../../AGENTS.md` first and obey it. Read `blender-project-goal`,
`blender-project-requirements`, `blender-project-workflow`, `blender-project-readme`, and
`blender-assets` when relevant. This is a design goal, not a coding plan: do not create a `PLAN/`
folder and do not use coding plan/check/verifier gates.

## Mission

make cozy retro room with computer

The user's exact request also includes the workflow choice: "Partial autonomous". Treat the image
as a nostalgic, cozy late-90s bedroom computer corner, not a generic office.

## Project

CozyRetroRoom — Cozy late-90s bedroom computer corner, photoreal hero still

- Project README: `../../README.md`
- Confirmed requirements: `../REQUIREMENTS.md`
- Workflow mode: `../WORKFLOW.md` (Partially Autonomous)
- Asset register: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A single photoreal 16:9 hero still of a small late-90s bedroom corner containing a working beige
CRT desktop computer. The CRT monitor, matching desktop tower, and chunky keyboard sit on a
pine/MDF desk; the desk is pushed into a corner with woodgrain wall paneling behind it. Period
clutter sells the room: posters and pinned notes on the wall, a shelf or stack of CDs, floppy
disks and game boxes, tangled but controlled cables, a mug, small knick-knacks, a houseplant, and
a blanket or rug. Worn carpet, aged beige plastic, dusty CRT glass, printed paper, and woven
fabric are visible at close range.

Lighting is cozy evening: a warm tungsten desk lamp makes the main pool of light; the CRT screen
glows and provides a cooler accent; soft window ambience fills the shadows. Palette is warm amber
and brown with cool screen highlights. Camera is a three-quarter view into the corner at roughly
seated/standing eye height, framing the desk, computer, and enough room context to establish the
space. The final review image is `renders/final/cozyretroroom-hero.png`, 1920x1080.

Scale is real-world metres: desk about 1.2-1.5 m wide, CRT about 0.35-0.45 m wide, walls about
2.4-2.8 m high. Everything rests on a surface or hangs correctly; no floating props. Hardware and
graphics are generic late-90s designs with no real brand logos.

## Scope

- In scope: bedroom corner geometry; desk; CRT monitor, desktop tower, keyboard, mouse; desk lamp;
  wall paneling; posters/notes; media shelf or stacks; plant; rug/blanket; small props; cables;
  window light source or suggestive window edge; full PBR materials; lighting; hero camera; Cycles
  final render; project documents.
- Out of scope: animation, orbit/turntable, other rooms, character models, modern equipment,
  RGB gaming styling, real-brand replicas, game-ready export.
- External dependencies: none planned. Any future external asset must be registered in
  `Documents/ASSETS.md` before use and must allow redistribution if packed or embedded.

## Deliverables

- [ ] Updated scene saved as `cozyretroroom.blend` in the project root.
- [ ] Final 1920x1080 hero render in `renders/final/cozyretroroom-hero.png`.
- [ ] Review renders in `renders/wip/` as needed, inspected with `look`.
- [ ] README, `REQUIREMENTS.md`, `WORKFLOW.md`, `DECISIONS.md`, and `ASSETS.md` updated.
- [ ] Goal file remains the record of this brief.

## Acceptance

- [ ] The scene opens without missing external files and the add-on reports the live Blender file.
- [ ] The final render instantly reads as a cozy late-90s bedroom computer corner, with the CRT and
  keyboard as the clear focal point.
- [ ] Posters, media clutter, plant, textiles, cables, and lamp are present and visually coherent.
- [ ] Materials read as aged beige plastic, wood veneer/laminate, dusty glass, paper, and fabric.
- [ ] Lighting shows warm tungsten pools, CRT glow, soft window fill, and legible shadows.
- [ ] No floating, intersecting, or visibly mis-scaled props.
- [ ] Camera framing matches the brief; the saved scene camera produces the delivered composition.
- [ ] A review render exists and has been inspected with `look`.
- [ ] README reflects the delivered state and all records are current.

## Workflow

1. Start this goal only after requirements are confirmed, the workflow mode is recorded, and every
   open question is answered. Call `goal(action="start", objective=<this entire filled prompt>)`; a
   one-line summary is not an objective. A successful goal call ends the turn; continue when the goal
   resumes. Do not repeat start/resume on automatic goal turns or after compaction.
2. Read the README, `REQUIREMENTS.md`, `WORKFLOW.md`, asset register, decisions, and references.
3. Stop if requirements are unconfirmed or the workflow mode is `Unset`; resolve both before editing.
4. From the workspace root, launch this project with
   `.\tools\start-blender.cmd "Blender\CozyRetroRoom"`. The launcher validates project records,
   path containment, the workspace port, and one-instance rules.
5. Call `blender_get_addon_status`; verify `blender_get_scene_info(fields=["settings"])` reports
   this project's `.blend` before editing. For a new unsaved scene, save it as
   `cozyretroroom.blend` first and verify that path.
6. Build in small steps. Save the authoritative `.blend` after every meaningful scene change and
   before risky work or handoff. Inspect every scene, material, lighting, and camera change with
   `look`. For Blender APIs, check Context7 and official docs; verify uncertain behavior with a
   minimal live test.
7. Partially Autonomous mode: after each meaningful change, save, inspect with `look`, summarize
   what changed and recommend the next step, then ask the user to run `/goal pause`; use `question`
   for approval, wait for the answer, and resume with `goal(action="resume")`. Make no further
   meaningful change until the user approves. If the user chooses manual modification, prepare the
   scene, save, and wait for them to finish.
8. Review git changes at each milestone and commit atomically after each verified change: one
   logical, verified change per commit, staging only intended files.
9. Save, render the final review image, and inspect it with `look` before calling the goal complete.
10. Update README, `REQUIREMENTS.md`, `WORKFLOW.md`, `DECISIONS.md`, and `ASSETS.md`. Once acceptance
    passes, call `goal_report(status="complete", reason=<evidence>)`, then give the final response
    without further actions.

## Done

The goal is complete only when acceptance checks pass, requirements and workflow are current, the
scene and review render are saved, no external asset is missing or unregistered, the documents are
current, and the final 1920x1080 hero render was inspected with `look`.
