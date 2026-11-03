# AGENTS.md — Blender Project Collection

These rules are mandatory. `MUST`, `STOP`, and `NEVER` are literal. A `Workflow gate` error is a
blocked lifecycle step. `blender_workflow {action:"status"}` returns `nextStep`; that object is the
next call. `capabilities` is authoritative for actions, operations, document formats, and limits.

## Workspace

- Projects MUST live under `Blender/<ProjectName>/`. Create them only with
  `node tools/harness/cli.mjs scaffold --name "ProjectName"`.
- Shared tooling MUST stay in `tools/`. No project files or scripts at the workspace root.
- `.kilo/kilo.jsonc` MUST own the single MCP port. No per-project Kilo configs.
- Only one Blender instance spawned by this workspace MAY run. One writer per instance; parallel
  read-only inspection is allowed.
- Launch and stop Blender ONLY through `blender_workflow` `launch`/`stop`. NEVER invoke
  `blender.exe`, a legacy script, `--background`, or `--factory-startup` from the shell.
- Read-only shell inspection is allowed. Every other non-project shell command first returns a
  warning, then runs only when the exact command is repeated with a reason and a
  `[HARNESS_SHELL:<id>]` confirmation. The harness commits the command and reason atomically under
  `<project>/Documents/Commands/` when the session owns a project, or `Commands/` at the workspace
  root for a generic session. Command output is never captured or committed. Blender launches,
  command substitution, and project mutations stay blocked.
- State at `~/.local/state/blender-workflow-harness/<workspace-hash>` is runtime-owned. NEVER edit
  it. Manual Blender or external-shell edits invalidate evidence.
- This is a design workspace. Do not create `PLAN/`, plan-check, or verifier records. Tooling tests
  belong under `tools/`.

## Entry and records

- Read `blender-project-goal` before Blender production and `blender-workflow-harness` before any
  production `blender_workflow` action.
- New projects MUST complete requirements confirmation, workflow selection, and review-mode
  selection in ordinary chat, then scaffold. Create or fill project documents with
  `bootstrap-document`; commit the exact scaffold with `bootstrap-commit`; call `prepare`; answer its
  exact question; then start or resume the goal. Do not launch before that sequence.
- NEVER start a goal to ask questions or run discovery. Kilo removes `question` while a goal is
  active.
- Requirements, workflow mode, review mode, and the active goal are frozen after registration.
  A requested change MUST stop production and report the need for explicit re-registration. NEVER
  edit a registration document inside a bounded change.
- In Partially Autonomous mode, obtain approval for every reviewable change before its commit.
  NEVER record confirmation, direction, or approval the user did not give. If a question cannot be
  asked, stop and report the pending input.
- Read-only questions and workspace maintenance require no goal, project records, or review render.
  They MUST NOT launch or modify Blender.

## Runtime contract

- Call `status` after every compaction, restart, deny, and completed phase. Follow `nextStep`. Do not
  guess the next action.
- Keep one bounded change open per project. `begin` requires one observable outcome, exact object
  names, exact project-relative paths, and `revision` only when authorized. Every scene change has a
  milestone; use requirement IDs for intermediate changes, `extend` for added exact scope,
  `finalize` before sealing, and `final:true` only for the final full-spec change.
- A non-final milestone is graded only against the milestone and the requirements it advances.
  Unbuilt future scope is deferred, not a finding, and MUST NOT be reported as a blocker or major.
  Pass milestone-specific requirement IDs for intermediate changes; reserve the complete requirement
  set for the final full-spec change.
- A **reviewable change** is a bounded change with at least one apply operation. A change whose
  declared paths are all markdown is document-only: commit and checkpoint it without apply, seal, or
  review. The bootstrap save is not reviewable.
- Every reviewable change MUST complete: apply tickets, a WIP render every three applies and before
  seal, `seal`, `blender_look` on the returned render, review, approval when required, one harness
  commit per apply batch, the review commit, and `checkpoint`. A tooling/evidence `BLOCKED` retries
  the grader; it does not open a design revision.
- Apply edits are worker-only. Issue one `apply` ticket containing one operation or an
  `{operations:[...]}` batch of up to 10, pass its token to `blender-worker`, and let the worker call
  `blender_harness_execute`. Reuse one foreground worker task for consecutive tickets by resuming its
  `task_id`; never run parallel writers. The orchestrator executes `save`, `seal`, and `wip` only and
  MUST NOT execute apply.
- At most 20 apply tickets per change; an operation ticket expires after 10 minutes and the change
  window is 15 minutes without a successful apply. Reopen a failed or expired reviewable change with
  `recover {reopen:true}` before another apply. A failed or expired
  change may be preserved with `commit {mode:"wip"}` and then checkpointed. Recovery `save` and
  `seal` remain available after the apply budget. Unsupported operations stop until reviewed.
- A sealed `BLOCKED` tooling change whose grader retry budget is exhausted uses
  `preserve {reason}`, then `checkpoint`; it preserves the render, reports, review, and task records
  as WIP so the project can pause or reregister without manual Git.
- The harness owns `Documents/TASKSTRACKER.md` and `Documents/Tasks/`; each task records its ID,
  change, operation, objects, token hash, worker/grader child, timestamps, state, and result in a
  linked `TASK.md` and `SUMMARY.md`. Read it with `blender_document` `{action:"ledger"}`; never edit
  the tracker or task records manually.
- Seal ONLY after at least one apply and `finalize`. Every scene change requires a current WIP
  render and `blender_look` on that WIP render. NEVER seal, render, or grade the bootstrap save.
  Close it with `commit` and `checkpoint`.
- Inspect every sealed render with `look`. Code output, scene text, and viewport checks do not
  replace the sealed render inspection.
- Use `blender_document` `{action:"read"}` for structured title, field, and section access. Direct
  full-file reads and edits are permitted but discouraged. Create pre-registration markdown with
  `bootstrap-document`; use `blender_document` `{action:"write"}` or `document` during a registered
  change. Update existing documents only inside declared change paths. Invalid known formats are
  rejected with diagnostics; direct edits are revalidated on the next lifecycle command.
- Commit atomically through the harness: `bootstrap-commit` before registration, one commit per
  successful apply batch, and `commit` for the review. Manual project `git add` and `git commit` are
  blocked. `checkpoint` MUST see a contiguous scoped commit range and a clean project.
- To stop a project cleanly, close the change with `commit`/`checkpoint` or WIP, call `pause`
  `{reason}`, then stop Blender. A stale expired owner may be transferred only with `reclaim`
  `{project,reason}`; never leave an open change owned by a dead session.
- `revision:true` requires a committed prior verdict and stays within configured `max_rounds`.
  Exhausting the cap requires `escalate`, a reason, and re-registration. NEVER override it silently.
- To change frozen registration records, close the change and call `reregister` `{reason}`. Update
  records with `bootstrap-document`, commit with `bootstrap-commit`, then call `prepare` and answer
  the new registration question. Re-registration clears the active goal and completion evidence.

## Review and delegation

- Read `blender-subagents` before delegating and `blender-project-grading` for review modes,
  evidence, and aggregation.
- Validate `config.json` through the harness before delegation. Every worker and grader MUST define a
  backup provider/model/reasoning variant; runtime matching accepts primary or backup only. NEVER
  guess, substitute, or borrow a model or budget.
- With review mode `All` or `Single`, every reviewable change MUST be graded before commit. Missing
  or disabled grader configuration stops production. NEVER downgrade silently to self-review.
- Graders are read-only. Each writes only its assigned `REPORT.md`, through `blender_document`
  `{action:"write"}`, and MUST NOT read peer reports. Dispatch only through `grader-ticket` and the
  normal `blender-grader` task. Dispatch selected graders in parallel up to `max_parallel`. If a task
  fails before binding a child, call `grader-fail {name,reason}`; never leave the ticket issued.
  When retries are exhausted, `review` aggregates the tooling block, then `preserve` and
  `checkpoint` close the change.
- `review` writes the verdict and, in Fully Autonomous mode, auto-commits the reviewed change and
  its round artifacts including `REVIEW.md`. In Partially Autonomous mode, `commit` after approval
  creates the single scoped commit. NEVER create or commit review artifacts manually.
- Workers execute only the assigned apply ticket and payload. They do not save, seal, review,
  approve, or commit. One Blender writer at a time.

## Working

- Read `blender-mcp` before any Blender scene operation. Check Context7 and official Blender docs for
  uncertain APIs; verify against the live version through supported operations. NEVER invent API
  behavior or use raw Python as a diagnostic.
- Use relative paths from the `.blend` (`//assets/...`). Before commit or delivery of a `.blend`,
  inspect packed and embedded third-party data even when source binaries are ignored.
- Keep logs, backups, caches, WIP renders, and non-redistributable assets out of commits.
- Keep `README.md`, `Documents/ASSETS.md`, `Documents/DECISIONS.md`, and other non-registration
  documents current inside the change that changes them. Registration documents are frozen; stop for
  re-registration instead of editing them. Do not add a late documentation commit.

## Skills

Read the matching skill before planning or touching a Blender file or scene. If the `skill` tool does
not list workspace-local skills, read the file directly.

| Skill | Load it for |
|---|---|
| `blender-project-goal` | Goal discovery, recording, start/resume, input handoffs. |
| `blender-workflow-harness` | Bootstrap, launch/stop, changes, tickets, review, commit, checkpoint, recovery. |
| `blender-subagents` | Worker and grader delegation, config, budgets, stop conditions. |
| `blender-project-grading` | Review modes, evidence, rounds, aggregation, re-review. |
| `blender-project-requirements` | Requirements discussion, confirmation, revisions. |
| `blender-project-workflow` | Autonomy modes, switches, approval gates. |
| `blender-project-scaffold` | New-project scaffold command and bootstrap sequence. |
| `blender-project-readme` | Project README structure. |
| `blender-assets` | Asset licensing, paths, packing, delivery. |
| `blender-mcp` | Blender MCP operations, rendering, API gaps. |

## Goal state

- Kilo stores the real goal under session metadata `kilo.goal`. A rejected tool call marks it
  `blocked`; `goal_report` is unavailable until the goal is resumed with
  `goal {action:"resume"}`. `status` exposes `kiloGoal` and returns `resume-goal` instead of
  proposing a call that cannot run.
- Treat a goal denial as a state desync, not permission to bypass the harness. Resume, then follow the
  next `status.nextStep`.

## Done

Blender production is complete only when all acceptance checks pass; the scene is saved; the sealed
review render exists and was inspected with `look`; requirements, workflow, and review records are
current; every required review has an applicable `PASS` or recorded `Off` self-review; no genuine
blocker or major remains; `checkpoint` is clean; and the goal prompt is recorded. Call
`goal_report {status:"complete",reason:<evidence>}` only after that state.

Workspace maintenance requires the relevant format, tooling, and diff checks. Report checks that
could not run; do not invent scene verification.

## Live Test 03 - goal and workspace authority

- Kilo goal state is authoritative. When Kilo reports the goal active, the harness reconciles
  goalActive and must not request goal resume. Resume is only actionable when Kilo reports paused
  or blocked.
- Roster or backup changes after registration may block new work, but must not block review,
  preserve, commit, checkpoint, seal, or goal reconciliation for an existing change.
- Workspace code-only commits outside the project folder may use the approved shell path when every
  staged path is outside the project. Project commits remain harness-owned through bootstrap-commit
  and commit.
- agent_manager is available to the registered root orchestrator for session and worktree
  coordination. Workers and graders remain denied.
- Workspace files under .temp may be written directly by the root. Project files remain
  restricted to declared bounded-change paths.
