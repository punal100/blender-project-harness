# Goal: Initial Brief — Cozy Retro Computer Room (2026-10-31)

Read `../../../../AGENTS.md` first and obey it. Read `blender-project-goal`,
`blender-project-requirements`, `blender-project-workflow`, `blender-project-readme`,
`blender-project-grading`, `blender-subagents`, `blender-assets`, and `blender-mcp` when relevant.
This is a design goal, not a coding plan: do not create a `PLAN/` folder and do not use coding
plan/check/verifier gates.

## Mission

"make cozy retro room with computer" — user's exact words. Build a cozy 1980s home-computer den as a
single still hero image, working in Partially Autonomous mode with review mode All.

## Project

CozyRetroRoom — Cozy 1980s retro computer den, desk-corner hero shot.

- Project README: `../../README.md`
- Confirmed requirements: `../REQUIREMENTS.md`
- Workflow mode: `../WORKFLOW.md` (Partially Autonomous)
- Review mode: `../REVIEW.md` (All: visual, technical, spec)
- Asset register: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A warm, quiet 1980s home-computer den seen as a close-medium 16:9 desk-corner hero shot. A beige CRT
computer — monitor plus system unit — and beige keyboard sit on an oak desk and remain the unmistakable
focal point. Wood wall paneling, a shag rug, a chair, a poster or wall art, a window edge, floppy
disks, and a mug build the period. An amber desk lamp pools warm light across the desk while teal-green
CRT glow spills onto the keyboard and wall. Palette stays cohesive: amber, oak brown, and beige against
teal-green. Materials read deliberately — wood grain, beige plastics, fabric, paper, glass. Real-world
metric scale; believable eye-level or slightly low camera. Proof image: `renders/final/cozyretroroom-review.png`
at 1920×1080, inspected with `look`.

## Scope

- In scope: room corner shell with paneled walls, floor, rug, window edge; oak desk; beige CRT computer
  and keyboard; chair; desk lamp; poster/wall art; floppy disks, mug, and small period desk clutter;
  procedural materials; lighting; one camera; one 1920×1080 review render; documentation.
- Out of scope: animation, rigged characters or people, full house or exterior architecture, audio,
  paid or unlicensed external assets.
- External dependencies: none planned. Procedural modeling and materials preferred. Any third-party
  asset must be registered in `ASSETS.md` with licence before use and linked with relative paths.

## Deliverables

- [ ] Updated scene saved as `cozyretroroom.blend` in the project root.
- [ ] Review render at 1920×1080 in `renders/final/`.
- [ ] README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, `DECISIONS.md`, and `ASSETS.md` current.
- [ ] External assets registered in `ASSETS.md` (none expected).
- [ ] Required review-round records completed for this goal file path.

## Acceptance

- [ ] The scene opens without missing external files.
- [ ] A beige CRT computer and keyboard on an oak desk clearly read as the focal point.
- [ ] 1980s cues present: wood paneling, shag rug, chair, poster/wall art, window edge, floppy disks, mug.
- [ ] 16:9 close-medium desk-corner composition matches the brief; window edge visible.
- [ ] Warm amber lamp plus teal-green CRT glow establishes a cozy evening mood and cohesive palette.
- [ ] Materials and real-world scale are deliberate; no floating or intersecting hero props; no visible artifacts.
- [ ] A 1920×1080 review render exists in `renders/final/` and has been inspected with `look`.
- [ ] README reflects the delivered state.
- [ ] Review mode is current; the final applicable grader round is `PASS`; no genuine unresolved
      blocker or major finding remains (declining one is not a waiver).

## Workflow

1. Requirements, workflow, review mode, and scaffolding records are complete before this goal. They
   are not to be reasked during routine approval pauses, automatic goal turns, or compaction.
   This goal file is the active goal for grading.
2. Read the README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, asset register, decisions, and
   references. Stop if requirements are unconfirmed, either mode is `Unset`, or required grader
   configuration is missing or disabled.
3. From the workspace root, launch with `.\tools\start-blender.cmd "Blender\CozyRetroRoom"`.
   Never launch `blender.exe` directly. Only one workspace-spawned Blender instance may run.
4. Call `blender_get_addon_status` and `blender_get_scene_info(fields=["settings"])`. Stop on
   connection, addon, or file mismatch. For the new unsaved scene, save to
   `D:\Projects\_Templates\Blender\Blender\CozyRetroRoom\cozyretroroom.blend` first, then verify that
   exact path before production edits. Update README's planned path to saved only after verification.
5. Build in small steps. Save the authoritative `.blend` after every meaningful scene change and
   before risky work or handoff. Inspect every scene, material, lighting, and camera change with `look`.
6. Partially Autonomous: one meaningful change at a time. A meaningful change is a new or removed
   object, collection, material, light, camera, render setting, imported asset, or a transform that
   changes the visible result or composition. After each change: save, inspect with `look`, complete
   the required grading round, record dispositions, summarize and recommend, then pause the goal and
   ask approval or revision direction before continuing. Never make the next meaningful change
   without approval.
7. Grading is mandatory for review mode All after every meaningful saved visual change. Follow
   `blender-project-grading`: capture evidence once per round before dispatch, generate round folder
   `R<NN>-<yyyyMMddTHHmmssZ>` from current UTC and project-wide sequence, dispatch configured graders
   visual, technical, and spec within `max_parallel` 3 and `max_rounds` 2, read and aggregate reports,
   record every disposition in the round's `REVIEW.md`, and commit the round atomically. Any genuine
   blocker or major prevents readiness and must be disclosed in the approval question.
8. Necessary questions during the active goal: ask the user to run `/goal pause`, wait until paused,
   then use `question`. Resume only when the answer permits the next action. Scheduled waits use the
   normal goal mechanisms; do not block a goal on a shell sleep.
9. When the scene is complete, save, render the 1920×1080 review image, inspect it with `look`, and
   complete a final applicable grading round against the saved deliverable. Require `PASS` and no
   genuine unresolved blocker or major finding. Apply the approval gate to any further meaningful
   correction.
10. Update README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, `DECISIONS.md`, and `ASSETS.md`.
    Review git changes at milestones and commit atomically after each verified change. Once all
    acceptance checks pass, call `goal_report(status="complete", reason=<evidence>)`, then give the
    final response without further actions.

## Done

The goal is complete only when all acceptance checks pass, requirements, workflow, and review mode
are current, the scene and inspected review render are saved, no external asset is missing or
unregistered, and all required documents including `REVIEW.md` are current. When grading is enabled,
the final applicable round must be `PASS`; no genuine unresolved blocker or major finding permits
completion.
