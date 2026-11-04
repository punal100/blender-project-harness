---
name: blender-workflow-harness
description: Use before any production blender_workflow action. Defines the harness-driven lifecycle, bootstrap, tickets, review, approval, commits, checkpoints, and recovery.
---

# Blender Workflow Harness

`blender_workflow` takes `{action,payload}`. The runtime owns state, evidence, approvals, and project
commits. `status.nextStep.command` is the next call; execute it exactly. `capabilities` is
authoritative for actions, operations, document formats, limits, and policy strings. A gate error is a
missing prerequisite: fix it through the named action, never by bypassing the harness.

## Bootstrap

1. Scaffold with `node .kilo/blender-project-harness/tools/harness/cli.mjs scaffold --name "Name"`.
2. Create or update project markdown with `bootstrap-document`; use `capabilities.documentFormats`.
3. Commit the exact scaffold with `bootstrap-commit`; it accepts documentation and metadata only.
4. Call `prepare`; pass its exact question and labels to `question`. Only the runtime answer registers.
5. Start or resume the goal with its exact prompt; launch only after the goal is active.

`status {project}` names the missing document, scaffold commit, `prepare`, or registration question.
Manual project writes and project `git add`/`git commit` are blocked.

## Lifecycle

Use `status.nextStep`; do not infer a route. A reviewable change normally runs:

`launch` → `begin` → `ticket apply` → worker → WIP every 3 applies + `look` → `finalize` → `seal` →
`look` every scene → review/self-review → approval when required → `commit` → `checkpoint`.

- `begin` needs one outcome, exact object names, exact project-relative paths, and optional
  `milestone`, `requirements`, `scenes`, `sceneRequirements`, `final`, `revision`, `media`.
- `extend` adds exact scope; `finalize` marks ready to seal; `final:true` is only the final full-spec
  change. `revision:true` needs a committed prior verdict.
- Apply is worker-only. One ticket is one operation or a batch of up to 10; pass the token to one
  foreground `blender-worker`. The orchestrator never executes apply.
- A non-scene change (markdown, source-only `scripts/`, references, assets) commits and checkpoints
  without apply, seal, or review.
- Bootstrap save: ticketed `save`, `commit`, `checkpoint`; never seal, render, or grade it.
- Review: `Off` → `self-review`; `All`/`Single` → `grader-ticket` plus `blender-grader`, then `review`.
  Partially Autonomous needs approval before the review commit.

## Media

Media is allowed only after registration, with the initial scene saved and checkpointed, inside an
open non-bootstrap change. Call `media-request` before any Media MCP call. One generation call per
request; explicit permission before spending credits. Generated files stay under `.temp`; call
`media-complete`, then `intake {media:<id>}`. Scene work is blocked while the request is `requested`,
`generating`, or `generated`. Retry at most twice with `media-fail`; a failed request is recorded and
may close with `commit`. Requirements stay frozen.

## Limits and recovery

- `capabilities.limits` is authoritative: 20 applies per change, 10-minute tickets, 15-minute idle
  window, WIP every 3 applies.
- Failed or expired reviewable change: `recover {reopen:true}` for repairs, or `commit {mode:"wip"}`
  then `checkpoint`.
- `recover` releases only an expired or dead ticket. If the writer started, inspect the live scene,
  save, and reseal; never release a live writer.
- Sealed tooling `BLOCKED` after the grader retry budget: `preserve {reason}`, then `checkpoint`.
- To stop cleanly, close the change with `commit`/`checkpoint` or WIP, call `pause {reason}`, then
  stop Blender. Transfer a stale expired owner only with `reclaim {project,reason}`.
- `max_rounds` is configured 1-4. Cap exhaustion requires `escalate`, then the exact registration
  question. A tooling `BLOCKED` retries the grader; `CHANGES_REQUIRED` is the design revision path.
- `schedule_wakeup`, cron, and `background_process` are orchestrator-only.
- Kilo goal status is authoritative. If `nextStep.phase` is `resume-goal`, call
  `goal {action:"resume"}` before reporting or continuing.

## Documents and commits

- Use `blender_document` `{action:"read"}` for structured access; `{action:"write"}` for declared
  writes; `{action:"ledger"}` for harness-owned task rows.
- Pre-registration: `bootstrap-document` then `bootstrap-commit`.
- Registered: declare the exact path in `begin`, then use `document` or `blender_document` write.
- Registration documents are frozen after `prepare`: `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`,
  and the active goal. Close the change and call `reregister {reason}` to replace them.
- Grader reports are written only through `blender_document`; the harness writes `REVIEW.md`.
- Project commits use harness actions only. `checkpoint` verifies the scoped commit range and a clean
  project.

## Forbidden

- Raw Python, imports, generation, shell Blender commands, command substitution, manual project Git,
  and external harness-state edits.
- Fake tickets, receipts, approvals, reports, or review artifacts.
- Sealing without a saved reviewable change, grading the bootstrap save, or skipping required review.
- Continuing past a gate without resolving the phase named by `status.nextStep`.

## Live Test 03

- Treat `kilo.goal` as the goal source of truth. Never emit `resume-goal` while Kilo reports active.
- Specification and mode changes require re-registration; roster changes block new work but allow
  review, preserve, commit, checkpoint, seal, and goal reconciliation.
- A registered root may commit code-only workspace changes through the approved shell path when every
  staged path is outside the project. Project paths remain harness-owned.
- A registered root may use `agent_manager`; workers and graders remain denied.
- Workspace `.temp` writes are allowed; project files remain change-scoped.
