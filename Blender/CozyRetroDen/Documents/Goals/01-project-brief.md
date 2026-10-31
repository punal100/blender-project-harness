# Goal: Cozy Retro Computer Den (2026-10-31)

Read `../../../../AGENTS.md` first and obey it. Read `blender-project-goal`,
`blender-project-requirements`, `blender-project-workflow`, `blender-project-readme`, and
`blender-assets` when relevant. This is a design goal, not a coding plan: do not create a `PLAN/`
folder and do not use coding plan/check/verifier gates.

## Mission

make cozy retro room with computer

The user clarified and confirmed: a cozy 1980s home-computer den interior in stylized realism, one
hero Cycles still, all geometry and materials procedural, no external assets.

## Project

CozyRetroDen — Cozy 1980s home computer den interior in stylized realism, one hero Cycles still.

- Project README: `../../README.md`
- Confirmed requirements: `../REQUIREMENTS.md`
- Workflow mode: `../WORKFLOW.md`
- Review mode: `../REVIEW.md`
- Asset register: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A single warm, lived-in 1980s home-computer den seen in a wide three-quarter interior view at about
standing/seated eye level. A beige CRT computer on a wooden desk is the focal point, with a keyboard,
small mouse, and a softly glowing cool CRT screen. Surrounding the desk: a desk chair, a shag rug over
a warm floor, wood-panelled walls, one or two shelves of period clutter (books, cassettes, boxes,
small gadgets), one or two framed posters, a window with curtains, and visible warm practical lamps
(desk lamp and floor lamp). Materials are PBR procedural only: wood grain, fabric, beige plastic,
metal, paper. Palette is warm browns and oranges with beige plastics and small saturated accents.
Mood: cozy, nostalgic, golden, gently cluttered but readable. The review image is the final Cycles PNG
in `renders/final/` and its sealed evidence render.

## Scope

- In scope: one interior room; room shell with wood panelling and trim; floor with shag rug; desk;
  beige CRT computer with keyboard and mouse; desk chair; shelves with clutter; 1-2 posters; window
  with curtains; two practical lights; camera; Cycles render settings; one hero still.
- Out of scope: external assets, downloads, HDRIs, image textures, imported models, characters,
  animation, second room, exterior view, photoreal grime pass, detail/close-up renders.
- External dependencies: none. All work is procedural inside Blender.

## Deliverables

- [ ] Updated scene saved as `cozyretroden.blend` in the project root.
- [ ] Final hero render in `renders/final/`.
- [ ] Sealed review evidence and completed review round artifacts.
- [ ] README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, and `DECISIONS.md` updated.
- [ ] `ASSETS.md` records that no external assets exist.
- [ ] Required review-round records completed for this goal's actual file path.

## Acceptance

- [ ] The scene opens without missing external files, with no packed third-party data.
- [ ] A viewer recognises an 1980s home-computer den from the still alone (era cues plus computer).
- [ ] The CRT computer on the desk is the clear focal point; wide three-quarter framing reads the room.
- [ ] Lighting reads as warm incandescent practicals with a cool CRT accent; mood is cozy.
- [ ] Materials are procedural PBR; no magenta/missing surfaces, no obvious clipping or intersections.
- [ ] Final Cycles PNG exists in `renders/final/` at the production resolution and is free of visible artifacts.
- [ ] A review render exists and has been inspected with `look`.
- [ ] The README reflects the delivered state.
- [ ] Review mode `All` is current; the final applicable grader round is `PASS`.
- [ ] No genuine unresolved blocker or major finding remains; declining one is not a waiver.

## Workflow

1. Requirements are confirmed, workflow mode is Fully Autonomous, review mode is All, the project is
   scaffolded, and this prompt is committed. Call `blender_workflow` `prepare` with only
   `{project:"Blender/CozyRetroDen",goal:"Documents/Goals/01-project-brief.md",scene:"cozyretroden.blend"}`
   and pass its exact registration question and labels to `question`; only genuine runtime answers
   grant registration. Then start this goal with the entire filled prompt.
2. Read the README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, asset register, decisions, and
   references.
3. Stop if requirements are unconfirmed, either mode is `Unset`, or required grader configuration is
   missing or disabled. Inspect harness `status` before launch and after compaction/restart; never
   recreate or manually edit external state.
4. From the workspace root, launch with `.\tools\start-blender.cmd "Blender\CozyRetroDen"`. Never launch
   `blender.exe` directly and never use `--background`.
5. Call `blender_get_addon_status` and `blender_get_scene_info(fields=["settings"])`. Stop on
   connection, addon, or file mismatch. For the new unsaved scene, save to this project's declared
   `cozyretroden.blend` through a bounded `begin` and ticketed `save`, then verify that exact path
   before production edits. Update README's planned path to saved only after verification.
6. Build in bounded changes using the canonical `AGENTS.md` harness contract. One change stays open,
   bounded by 40 operations/15 minutes; `begin` declares one outcome, exact objects and project-relative
   files. Request `ticket` for apply/save/seal, then call `blender_harness_execute` with matching token,
   operation, payload, and verbatim user goal. Supported operations only; unsupported work stops for
   reviewed tooling extension. Save after meaningful changes and before risky work. Inspect every
   visual change with `look`.
7. Review mode All: after each meaningful saved change, seal to capture immutable evidence and the
   final PNG, immediately inspect the returned render path with `blender_look`, then run `visual`,
   `technical`, and `spec` graders via `grader-ticket` with their unique tokens and exact report
   paths. Read reports, record dispositions and the exact scene hash/verdict in `REVIEW.md`, and call
   `review` `{notes}`. Freeze evidence before dispatch; never edit sealed metadata.
8. Fully Autonomous: commit exactly one scoped change and `checkpoint` before the next `begin`.
   Failed rounds commit their artifacts before fixes. No change-approval questions.
9. Save, seal a review image, and inspect its returned final PNG. Complete final applicable grading
   against the saved deliverable state; require `PASS` and no genuine unresolved blocker or major
   finding.
10. Update README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, `DECISIONS.md`, and `ASSETS.md`
    within their bounded changes. Completion hook requires a clean checkpoint, final applicable
    `PASS`, and inspected sealed render. Then call `goal_report(status="complete", reason=<evidence>)`
    and give the final response.

## Done

The goal is complete only when all acceptance checks pass, requirements, workflow, and review mode
are current, the scene and inspected review render are saved, no external asset is missing or
unregistered, and all required documents including `REVIEW.md` are current. The final applicable
grader round must be `PASS`; no genuine unresolved blocker or major finding permits completion.
Harness state at `~/.local/state/blender-workflow-harness/<workspace-hash>` is external and not
agent-editable. This is a same-user guard, not an OS sandbox; manual Blender/external-shell edits
invalidate evidence, and unrestricted same-user execution can bypass controls.
