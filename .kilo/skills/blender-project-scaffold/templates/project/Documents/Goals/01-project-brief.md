# Goal: {{GOAL_TITLE}} ({{DATE}})

Read `../../../../AGENTS.md` first and obey it. Read `blender-project-goal`,
`blender-project-requirements`, `blender-project-workflow`, `blender-project-readme`, and
`blender-assets` when relevant. This is a design goal, not a coding plan: do not create a `PLAN/`
folder and do not use coding plan/check/verifier gates.

## Mission

{{GOAL}}

## Project

{{PROJECT_NAME}} — {{DESCRIPTION}}

- Project README: `../../README.md`
- Confirmed requirements: `../REQUIREMENTS.md`
- Workflow mode: `../WORKFLOW.md`
- Review mode: `../REVIEW.md`
- Asset register: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

Describe the result the viewer should see: subject, composition, camera, lighting, materials,
colour, scale, and mood. Name the review image or render that will prove it.

## Scope

- In scope:
- Out of scope:
- External dependencies:

## Deliverables

- [ ] Updated scene saved as `{{PROJECT_SLUG}}.blend` in the project root.
- [ ] Review render in `renders/final/`.
- [ ] README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, and `DECISIONS.md` updated.
- [ ] External assets registered in `ASSETS.md`.
- [ ] Required review-round records completed for the active goal's actual file path.

## Acceptance

- [ ] The scene opens without missing external files.
- [ ] The camera framing and visual direction match the brief.
- [ ] Materials, lighting, and scale are deliberate and documented.
- [ ] A review render exists and has been inspected with `look`.
- [ ] The README reflects the delivered state.
- [ ] Review mode is current; the final applicable grader round is `PASS` when grading is enabled.
- [ ] No genuine unresolved blocker or major finding remains; declining one is not a waiver.

## Workflow

1. Before this goal, confirm requirements, collect workflow and review answers, scaffold, persist all
   three exact records, and fill this prompt. Inspect status/diff/log, stage exact scaffold paths, and
   commit documents and goal before launch. Call `blender_workflow` `prepare` with only
   `{project:"Blender/{{PROJECT_NAME}}",goal:"Documents/Goals/NN-slug.md",scene:"{{PROJECT_SLUG}}.blend"}`
   as its JSON-string payload, using this goal's actual path. Pass its exact registration question
   and labels to `question` with `custom:false,multiple:false`; only genuine runtime answers grant
   registration, never approved JSON. Resolve blocking questions and require selected modes before
   `goal(action="start", objective=<this entire filled prompt>)`.
   A one-line summary is not an objective. A successful goal call ends the turn; continue when the
   goal resumes. For saved work, ask both mode questions before resume on a genuine later return.
   Routine approval pauses within the same task retain modes. Do not repeat start/resume on automatic
   goal turns or after compaction. Use this active goal's actual `NN-<slug>.md` path for grading;
   `01-project-brief.md` is only the initial bootstrap template.
2. Read the README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, asset register, decisions, and
   references.
3. Stop if requirements are unconfirmed, either mode is `Unset`, or required grader configuration is
   missing or disabled for `All` or `Single`. Resolve the mismatch before editing. Inspect harness
   `status` before launch and after compaction/restart; never recreate or manually edit external state.
4. From the workspace root, launch this project with
   `.\tools\start-blender.cmd "Blender\{{PROJECT_NAME}}"`. The launcher validates project records,
   path containment, the workspace port, and one-instance rules.
5. Call `blender_get_addon_status` and `blender_get_scene_info(fields=["settings"])`. Stop on
   connection, addon, or file mismatch. For a new unsaved scene, save to this project's declared
   `.blend` through a bounded `begin` and ticketed `save` first, then verify that exact path before
   production edits. Update README's planned path to saved only after verification.
6. Build in small steps using the canonical `AGENTS.md` harness contract. `blender_workflow` takes
   `{action: string,payload: JSON string}`. `begin` declares one outcome, exact objects and project-relative
   files; one change stays open, bounded by 40 operations/15 minutes. Request `ticket` for apply/save/seal;
   next call `blender_harness_execute` with matching token, operation, payload, and verbatim user goal.
   Apply payload is a supported operation object; save/seal payload is `{}`. Save after meaningful
   changes and before risky work/handoff; recovery save/seal remain allowed after the apply budget.
   Raw `execute_blender_code`, `import_asset`, and `generate_3d` are blocked; unsupported operations
   stop for reviewed tooling extension. Inspect visual changes with `look`. Seal saves the scene and
   immutable evidence, final PNG, and manifest; mandatory
   `blender_look(image=<returned absolute render path>)` records successful inspection.
7. When review mode is `All` or `Single`, complete required grading under `blender-project-grading`
   after each meaningful saved change and before every Partially Autonomous approval or
   revision-direction question.
   Use `grader-ticket` `{name}` and pass its unique token, exact report path, and `HARNESS_GRADER:<token>`
   to each normal grader task. Plugin binds actual child/runtime model; grader writes only its report
   and never reads peers. Read reports, record dispositions and exact scene hash/verdict in `REVIEW.md`,
   then call `review` `{notes}` to validate receipts and aggregate hash. Freeze evidence and hashes
   before graders run. Grader findings never authorize another meaningful change without the user's
   approval or revision direction in Partially Autonomous mode. Disclose genuine blockers and majors;
   do not waive them by declining the finding. In `Off`, inspect the sealed PNG and call `self-review`
   `{notes}`; no graders run.
8. In Partially Autonomous mode, summarize the saved, inspected, graded change and ask for approval
   or revision direction before the next meaningful change. In either autonomy mode, follow
   `blender-project-goal` for orchestrator-owned required-input handoffs and subsequent questions/resume.
   Users provide decisions, not goal commands. Already stopped work needs no repeated stop procedure.
   For change approval, call `approval` while paused and use its exact returned question and labels
   `Approve change`, `Request revision`, `Pause`, with `custom:false,multiple:false`. Only runtime answers
   count; forged JSON is ignored. Inspect status/diff/log, stage exact scoped paths, commit scene and
   round artifacts, then `checkpoint` before next `begin`. Exactly one scoped commit, clean project,
   and matching hashes are required. Failed rounds commit before fixes; `revision:true` stays within
   the configured `max_rounds` cap. Exhausting it requires explicit user escalation and re-registration
   handling. Fully Autonomous follows the same commit checkpoint without change-approval questions.
   Never defer work into a late mega-commit.
   Resume only after an answer permits the next action. Pause, cancellation, no answer, and manual
   editing keep work stopped. Changed objectives need supported registration and agent-owned start
   with the entire updated prompt; never resume stale objectives. Follow `blender-project-workflow`
   for manual handoff, inspection, required grading, and approval before resuming. Routine approval
   pauses do not reselect modes.
9. Save, seal a review image, and inspect its returned final PNG. Complete final applicable grading against the saved
   deliverable state when enabled; require `PASS` and no genuine unresolved blocker or major finding.
   Apply the same approval gate to any further meaningful correction in Partially Autonomous mode.
10. Update README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, `DECISIONS.md`, and `ASSETS.md`.
    Include document updates in their bounded change, not a late uncheckpointed docs commit.
    Completion hook requires a clean checkpoint, final applicable `PASS`, and inspected sealed render.
    Once all acceptance checks pass, call
    `goal_report(status="complete", reason=<evidence>)`, then give the final response without further
    actions.

## Done

The goal is complete only when all acceptance checks pass, requirements, workflow, and review mode
are current, the scene and inspected review render are saved, no external asset is missing or
unregistered, and all required documents including `REVIEW.md` are current. When grading is enabled,
the final applicable round must be `PASS`; no genuine unresolved blocker or major finding permits
completion. Harness state at `~/.local/state/blender-workflow-harness/<workspace-hash>` is external
and not agent-editable. This is a same-user guard, not an OS sandbox; manual Blender/external-shell
edits invalidate evidence, and unrestricted same-user execution can bypass controls.
