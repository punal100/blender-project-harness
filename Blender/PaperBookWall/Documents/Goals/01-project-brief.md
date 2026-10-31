# Goal: Paper Book Wall (2026-11-01)

Read `../../../../AGENTS.md` first and obey it. Read `blender-project-goal`,
`blender-project-requirements`, `blender-project-workflow`, `blender-project-readme`, and
`blender-assets` when relevant. This is a design goal, not a coding plan: do not create a `PLAN/`
folder and do not use coding plan/check/verifier gates.

## Mission

room with books on shelf

## Project

PaperBookWall — Minimal reading room with a pale-oak book wall and paper-neutral books, viewed frontally.

- Project README: `../../README.md`
- Confirmed requirements: `../REQUIREMENTS.md`
- Workflow mode: `../WORKFLOW.md` (Fully Autonomous)
- Review mode: `../REVIEW.md` (All)
- Asset register: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A minimal, bright reading room photographed straight-on. The hero is a pale-oak bookshelf wall,
centered with white wall margin above and at both sides, standing on a pale floor against white
walls. Books are arranged in curated mixed fashion: mostly upright rows with varied heights, a few
horizontal stacks and deliberate gaps, never fully packed. Spines are paper-neutral - cream, kraft,
off-white - with only faint muted accents. Lighting is bright airy daylight with soft shadows, calm
and light. Exactly one small potted plant and one horizontal book stack sit as accents; no other
furniture. The camera is frontal and symmetrical at eye level with a slight low angle, with breathing
room around the shelf wall. The proof is a single 1920x1080 EEVEE hero render in `renders/final/`.

## Scope

- In scope: shelf wall geometry, shelves and dividers, books with varied sizes and paper-neutral
  spines, one small potted plant, one horizontal book stack, white wall and pale floor, frontal
  camera, daylight lighting, one hero render.
- Out of scope: animation, extra camera views, imported third-party assets, furniture or large set
  dressing, text or logos on spines.
- External dependencies: none; fully procedural scene.

## Deliverables

- [ ] Updated scene saved as `paperbookwall.blend` in the project root.
- [ ] Review render in `renders/final/`.
- [ ] README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, and `DECISIONS.md` updated.
- [ ] External assets registered in `ASSETS.md` (none expected).
- [ ] Required review-round records completed for `Documents/Goals/01-project-brief.md`.

## Acceptance

- [ ] The scene opens without missing external files.
- [ ] The camera framing and visual direction match the brief: frontal symmetrical, shelf wall
      centered with white margin above and at both sides.
- [ ] Books are visibly shelved in rows; none float or intersect shelf boards, shelf sides, or each
      other.
- [ ] Shelf geometry is clean, level, and regular.
- [ ] Books are not fully packed; gaps and a few horizontal stacks are visible, with paper-neutral
      spines and faint muted accents.
- [ ] Exactly one small potted plant and one horizontal book stack appear as props.
- [ ] Lighting is bright airy daylight with soft shadows and reads clearly in the final render.
- [ ] A 1920x1080 EEVEE review render exists and has been inspected with `look`.
- [ ] The README reflects the delivered state.
- [ ] Review mode is current; the final applicable grader round is `PASS` for the All roster.
- [ ] No genuine unresolved blocker or major finding remains; declining one is not a waiver.

## Workflow

1. Requirements are confirmed, workflow is Fully Autonomous, review is All, and all three records are
   persisted. Inspect status/diff/log, stage only the exact scaffold paths, and commit documents and
   this goal before registration. Call `blender_workflow` `prepare` with only
   `{project:"Blender/PaperBookWall",goal:"Documents/Goals/01-project-brief.md",scene:"paperbookwall.blend"}`
   as its JSON-string payload. Pass its exact registration question and labels to `question` as one
   single-select question; omit `custom`/`multiple` or set them false where the tool exposes them.
   Only genuine runtime answers grant registration, never approved JSON. Then start the goal with
   this entire filled prompt as the objective. A successful goal call ends the turn; continue when
   the goal resumes.
2. Read the README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, asset register, decisions, and
   references.
3. Stop if requirements are unconfirmed, either mode is `Unset`, or required grader configuration is
   missing or disabled for All. Resolve the mismatch before editing. Inspect harness `status` before
   launch and after compaction/restart; never recreate or manually edit external state.
4. Launch this project with `blender_workflow` `{action:"launch"}` and stop it with
   `{action:"stop"}`. The harness validates project records, path containment, the workspace port, and
   one-instance rules; never invoke Blender from the shell.
5. Call `blender_get_addon_status` and `blender_get_scene_info(fields=["settings"])`. Stop on
   connection, addon, or file mismatch. For a new unsaved scene, save to this project's declared
   `.blend` through a bounded `begin` and ticketed `save` first, then verify that exact path before
   production edits. Update README's planned path to saved only after verification. The initial
   bootstrap save is committed and closed with `checkpoint`; never seal or grade it.
6. Build in small steps using the canonical `AGENTS.md` harness contract: `blender_workflow` takes
   `{action: string,payload: JSON string}`. `begin` declares one outcome, exact objects and
   project-relative files; one change stays open, bounded by 40 operations/15 minutes. Request
   `ticket` for apply/save/seal; next call `blender_harness_execute` with matching token, operation,
   payload, and verbatim user goal. Apply payload is a supported operation object; save/seal payload is
   `{}`. Save after meaningful changes and before risky work/handoff; recovery save/seal remain
   allowed after the apply budget. Raw `execute_blender_code`, `import_asset`, and `generate_3d` are
   blocked; unsupported operations stop for reviewed tooling extension. Inspect visual changes with
   `look`. Seal saves the scene and immutable evidence, final PNG, and manifest; mandatory
   `blender_look(image=<returned absolute render path>)` records successful inspection.
7. Review mode is All: complete required grading under `blender-project-grading` after each
   meaningful saved change. Use `grader-ticket` `{name}` and pass its unique token, exact report path,
   and `HARNESS_GRADER:<token>` to each normal grader task. Plugin binds actual child/runtime model;
   grader writes only its report and never reads peers. Read reports, record dispositions and exact
   scene hash/verdict in `REVIEW.md`, then call `review` `{notes}` to validate receipts and aggregate
   hash. Freeze evidence and hashes before graders run. Grader findings never authorize another
   meaningful change without a confirmed revision path; genuine blockers and majors stay open.
8. Fully Autonomous follows commit checkpoints without change-approval questions: after review,
   inspect status/diff/log, stage exact scoped paths, commit the scene and round artifacts, then
   `checkpoint` before the next `begin`. Exactly one scoped commit, clean project, and matching hashes
   are required. Failed rounds commit before fixes; `revision:true` stays within the configured
   `max_rounds` cap. Exhausting it requires explicit user escalation and re-registration handling.
   Never defer work into a late mega-commit.
9. Save, seal a review image, and inspect its returned final PNG. Complete final applicable grading
   against the saved deliverable state; require `PASS` and no genuine unresolved blocker or major
   finding.
10. Update README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, `DECISIONS.md`, and `ASSETS.md`.
    Include document updates in their bounded change, not a late uncheckpointed docs commit.
    Completion hook requires a clean checkpoint, final applicable `PASS`, and inspected sealed render.
    Once all acceptance checks pass, call `goal_report(status="complete", reason=<evidence>)`, then
    give the final response without further actions.

## Done

The goal is complete only when all acceptance checks pass, requirements, workflow, and review mode
are current, the scene and inspected review render are saved, no external asset is missing or
unregistered, and all required documents including `REVIEW.md` are current. When grading is enabled,
the final applicable round must be `PASS`; no genuine unresolved blocker or major finding permits
completion. Harness state at `~/.local/state/blender-workflow-harness/<workspace-hash>` is external
and not agent-editable. This is a same-user guard, not an OS sandbox; manual Blender/external-shell
edits invalidate evidence, and unrestricted same-user execution can bypass controls.
