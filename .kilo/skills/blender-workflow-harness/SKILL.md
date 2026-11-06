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
5. Start the mission with `goal_blender {action:"start"}` or `/goal-blender start`; launch only after
   the mission is active.

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
- A scaffolded project ships `.gitignore`; `logs/`, WIP renders, `_evidence/`, `.blend1`, and
  `__pycache__` stay out of the snapshot. If `begin` reports "project changed since checkpoint", a
  runtime file is untracked and unignored: commit the exact scope or ask for an approved shell fix,
  then retry.
- Bootstrap save: begin with `objects:[]` and `paths:["<scene>.blend"]`, then ticketed `save`, `commit`,
  `checkpoint`; never seal, render, or grade it. Paths are relative to `Blender/<Project>/`; never
  prepend `Blender/<Project>/`.
- Supplied references: `prepare` requires `intake {scan:true}` when the answer is `Use my references`.
  After bootstrap, the harness records a pending reference gate. Open the non-scene reference-intake
  change and call `intake {scan:false}`; scene `begin` and apply are blocked until every scanned file is
  copied into `Documents/References/`.
- Tool exposure lives in `.kilo/blender-project-harness/config.json`, not `kilo.jsonc`. Read
  `status.toolExposure`; `lite`/`smart`/`full`/`readonly`/`unsafe` change what is listed, not the
  underlying safety gates. Role profiles apply when the server is launched with `BLENDER_ROLE`;
  raw tools in `unsafe` mode require the session in `unsafe.sessions`.
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
  then `checkpoint`. An expired change with zero applies closes with `abandon {reason}` (no commit);
  `commit {mode:"wip"}` also closes an empty change without a commit.
- `recover` releases only an expired or dead ticket. A bound ticket is live only for its 10-minute
  window after the writer starts; an unstarted ticket expires on its ticket TTL. Never release a live
  writer.
- If a worker child fails before executing, the ticket is still `issued`; dispatch a fresh worker and
  it rebinds. A ticket already authorized or running stays bound to that child.
- Sealed tooling `BLOCKED` after the grader retry budget: `preserve {reason}`, then `checkpoint`.
- To stop immediately, use `/goal-blender stop`; it works with an open change and aborts active
  worker/grader children. To stop cleanly, close the change with `commit`/`checkpoint` or WIP, call
  `pause {reason}`, then stop Blender. Transfer a stale expired owner only with `reclaim {project,reason}`; it is denied when
  the registration's checkpoint or snapshot does not match this checkout. Discard such a stale
  registration with `forget {project,reason}` before scaffolding or preparing that name again.
- `max_rounds` is configured 1-4. Cap exhaustion requires `escalate`, then the exact registration
  question. A tooling `BLOCKED` retries the grader; `CHANGES_REQUIRED` is the design revision path.
- `schedule_wakeup`, cron, and `background_process` are orchestrator-only. A background process
  records a bounded wait; stop it or let it expire before continuing.
- Harness mission state is authoritative. Use `goal_blender` for start, status, pause, stop, resume,
  complete, and clear. `/goal-blender stop` aborts active children and works with an open change. If
  `nextStep.phase` is `goal-blender`, call `/goal-blender resume` before continuing. If
  `status.goalConflict` is present, stop production, run `/goal clear`, close any open change, and
  reregister.

## Documents and commits

- Use `blender_document` `{action:"read"}` for structured access; `{action:"write"}` for declared
  writes; `{action:"ledger"}` for harness-owned task rows.
- Pre-registration: `bootstrap-document` then `bootstrap-commit`.
- Registered: declare the exact path in `begin`, then use `document` or `blender_document` write.
- Registration documents are frozen after `prepare`: `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`,
  and the active goal document. Close the change and call `reregister {reason}` to replace them.
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

- Harness mission state is authoritative. `/goal-blender` must not set `kilo.goal`; a built-in
  `/goal` invalidates the registration. Never emit `resume-goal`.
- `question` remains available during an active mission for clarifications and approval. Never use
  `goal_report`.
- Specification and mode changes require re-registration; roster changes block new work but allow
  review, preserve, commit, checkpoint, and seal for an existing change.
- A registered root may commit code-only workspace changes through the approved shell path when every
  staged path is outside the project. Project paths remain harness-owned.
- A registered root may use `agent_manager`; workers and graders remain denied.
- Workspace `.temp` writes are allowed; project files remain change-scoped.
