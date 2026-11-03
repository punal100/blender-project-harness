---
name: blender-workflow-harness
description: Use before any production blender_workflow action. Defines the harness-driven lifecycle, bootstrap, tickets, review, approval, commits, checkpoints, and recovery.
---

# Blender Workflow Harness

`blender_workflow` takes `{action:string,payload:JSON object or string}`. The runtime owns state,
evidence, approval receipts, and project commits.

MUST:
- Call `status` first and after every deny, compaction, restart, or completed phase.
- Execute `status.nextStep.command` exactly. Do not infer another route.
- Call `capabilities` for actions, operations, primitives, document formats, and limits.
- Treat a gate error as a missing prerequisite. Fix the prerequisite; never bypass with shell,
  raw Python, direct state edits, or a temp copy.

## Bootstrap before registration

1. Scaffold with `node tools/harness/cli.mjs scaffold --name "Name"`.
2. Create or update project markdown with `bootstrap-document`
   `{project,path,content}`. `capabilities.documentFormats` defines required headings and fields;
   `bootstrap-document` rejects malformed documents.
3. Commit the exact scaffold with `bootstrap-commit` `{project,message}`. It accepts only
   documentation and metadata, never scene, render, evidence, or asset binaries.
4. Call `prepare` `{project,goal,scene}`. Answer its exact question and labels through `question`.
   Only a runtime answer registers. NEVER forge approval JSON or answer for the user.
5. Start or resume the registered goal with its exact prompt. Launch only after the goal is active.

Inspect bootstrap state with `status` `{project}`. Its `nextStep` names the missing document,
scaffold commit, `prepare`, or registration question. Manual project writes and project
`git add`/`git commit` are blocked before and after registration.

## Registered lifecycle

1. `launch` `{}`. Verify `blender_get_addon_status` and
   `blender_get_scene_info(fields=["settings"])`; stop on connection, addon, or file mismatch.
2. `begin` `{outcome,objects,paths,milestone?,requirements?,final?,revision?}`. One bounded change;
   exact object names and project-relative paths. Use `milestone` and the requirement IDs the change
   advances for intermediate changes; use `final:true` only for the final full-spec change. Do not
   pass full-deliverable IDs whose content is intentionally deferred. `extend` adds exact scope
   while the change is open; `finalize` marks the change ready to seal.
   `revision:true` requires the prior committed verdict.
3. Issue `ticket` `{operation:"apply",payload:<operation or {operations:[...]}>}`. A batch contains
   up to 10 operations and executes sequentially under one token. Pass the token to one foreground
   `blender-worker`; the worker calls `blender_harness_execute` with the exact token, operation, and
   payload. Each operation auto-saves. Strict changes commit each successful apply batch. The
   orchestrator NEVER executes apply.
4. A change whose declared paths are all markdown is document-only: after editing, use `commit` and
   `checkpoint` without `apply`, `seal`, or review. Every scene change requires `finalize`, then
   `ticket` `{operation:"wip",payload:{}}`, then `blender_look` on the WIP render; every third apply
   also requires a WIP check. Seal only after that look. `seal` writes immutable evidence, a final
   PNG, and a manifest.
5. Call `blender_look` on the returned absolute render path. A receipt requires a real image.
6. Review: `self-review` `{notes}` when mode is `Off`; otherwise issue every configured
   `grader-ticket` and dispatch the `blender-grader` tasks up to `max_parallel` at once. The ticket
   lists exact evidence files; read those paths, not a folder. Non-final tickets grade only their
   milestone; absent future scope is deferred, not a finding. Final tickets require the complete
   deliverable. If a task fails before binding a child, call `grader-fail {name,reason}`. A
   tooling-blocked grader is retried without a scene
   revision. When retries are exhausted, aggregate with `review` `{notes,reason,dispositions}`; the
   harness records the missing/expired grader as `BLOCKED`, computes the verdict, and writes
   `REVIEW.md`. Seal and grader task metadata commit at task completion; review artifacts and the
   sealed scene commit at the review boundary.
7. In Partially Autonomous mode call `approval` `{}` and pass its exact question and labels to
   `question`. Approval is required before the review commit.
8. In Fully Autonomous with `All` or `Single`, `review` auto-commits reports and the verdict; skip to
   `checkpoint`. With `Off`, or in Partially Autonomous, `commit` creates the scoped review commit.
   Apply batches are already committed. NEVER use manual Git for project paths.
9. `checkpoint` `{}`. It accepts the validated commit range after the change base and requires a
   clean project. Then start the next `begin` or report completion. Completion needs a final
   full-spec change before `goal_report`.
10. To stop cleanly, close the change with `commit`/`checkpoint` or WIP, call `pause` `{reason}`,
    then stop Blender. A stale expired owner can be transferred with `reclaim` `{project,reason}`. Do not leave an open change owned by a dead session.

Bootstrap save: use ticketed `save`, then `commit`, then `checkpoint`. NEVER seal, render, grade, or
open a review round for the initial empty/default scene.

## Limits and recovery

- Maximum 20 apply tickets per change, each carrying up to 10 operations. Operation tickets expire
  after 10 minutes; the change window is 15 minutes without a successful apply. Recovery `save` and
  `seal` remain available after the apply budget or a failed apply.
- `recover` releases only an expired or dead ticket. If the writer started, inspect the live scene,
  save, and reseal. NEVER release a live writer.
- `recover {reopen:true}` clears a failed or expired reviewable change so repair applies can run.
  It does not reopen a sealed or bootstrap change, and it keeps the failed round history.
- `commit {mode:"wip"}` preserves a failed or expired change and closes it at the next `checkpoint`
  with verdict `WIP`; it is not a review substitute and does not set a completion render.
- `preserve {reason}` closes a sealed tooling-blocked change after its grader retry budget is
  exhausted. It commits the sealed render, reports, review aggregate, tracker, and task records as
  `WIP`; then `checkpoint` and `pause` or `reregister`. Never mark a tooling block `PASS`.
- `status.change` reports `appliesRemaining`, `deadlineRemainingMs`, `commits`, `wipRender`, and
  `wipLook`. `Documents/TASKSTRACKER.md` and `Documents/Tasks/<id>/` are harness-owned and record
  every task's ID, token hash, child session, state, and result. Read them with
  `blender_document {action:"ledger"}`; never write it directly.
- `max_rounds` is configured 1-4. A capped review requires `escalate` `{reason,max_rounds?}`, then
  the exact registration question again. Escalation preserves history.
- A tooling/evidence `BLOCKED` is not a design failure: retry the blocked grader; do not open a scene
  revision. `CHANGES_REQUIRED` is the design revision path.
- `schedule_wakeup`/cron and `background_process` are orchestrator-only production tools. Workers and
  graders cannot use them.
- `status.nextStep` is authoritative for pending tickets, missing `look`, WIP, review, approval,
  commit, checkpoint, `preserve`, and completion. Do not repeat a completed phase.
- Kilo's `kilo.goal.status` is authoritative for whether `goal_report` exists. If `status` reports
  `kiloGoal.status` as `blocked` or `paused` and `nextStep.phase` is `resume-goal`, call
  `goal {action:"resume"}` before any report or further production action.

## Documents and commits

- Use `blender_document` `{action:"read"}` for structured title, field, and section access. The
  default read returns an index and diagnostics, not the full file. Pass `section` to read one
  section. Direct `read`/`grep` is permitted but discouraged.
- Pre-registration new markdown: `bootstrap-document`; commit with `bootstrap-commit`.
- Registered new markdown: declare its exact path in `begin`, then call `blender_document`
  `{action:"write"}` or `document` `{path,content}`.
- Existing documents update only within the declared change paths. Direct edit is permitted but
  discouraged; the harness re-validates on the next lifecycle command.
- Registration documents are frozen after `prepare`: `Documents/REQUIREMENTS.md`,
  `Documents/WORKFLOW.md`, `Documents/REVIEW.md`, and the active goal. NEVER write them inside a
  bounded change. To change them, close the change and call `reregister` `{reason}`, edit with
  `bootstrap-document`, commit with `bootstrap-commit`, then call `prepare` and answer the new
  registration question. Re-registration clears the active goal and completion evidence.
- Each grader writes only its assigned `REPORT.md` through `blender_document` `{action:"write"}`.
  Direct report edits are denied. The harness generates the aggregate `REVIEW.md`.
- Project commits: `bootstrap-commit` before registration; `commit` after registration. One bounded
  message. `checkpoint` verifies the exact commit and clean project.

## Forbidden

- Raw `execute_blender_code`, imports, generation, arbitrary Python, shell Blender commands, command
  substitution, or manual project Git commands. Read-only inspection is always allowed; other
  non-project commands require the warning acknowledgement documented in `AGENTS.md`. The harness
  commits the command and reason under project `Documents/Commands/` or root `Commands/`; command
  output is never captured or committed. Project files stay tool-owned.
- Editing external harness state; creating fake tickets, receipts, approvals, or reports.
- Sealing without a saved reviewable change; grading the bootstrap save; skipping required review.
- Continuing after a gate error without resolving the phase named by `status.nextStep`.

## Live Test 03 state and workspace rules

- Treat kilo.goal as the goal source of truth. Reconcile goalActive before status and production
  checks. Never emit resume-goal while Kilo reports active.
- Split registration drift: specification and mode changes require re-registration before any work;
  roster changes block new work but allow review, preserve, commit, checkpoint, seal, and goal
  reconciliation.
- A registered root may commit code-only workspace changes through the approved shell path when
  every staged path is outside the project folder. Project paths remain harness-owned.
- A registered root may use agent_manager for session and worktree coordination.
- Workspace files under .temp may be written directly; project files remain change-scoped.
