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
  names, exact project-relative paths, and `revision` only when authorized.
- A **reviewable change** is a bounded change with at least one apply operation. The bootstrap save
  is not reviewable.
- Every reviewable change MUST complete: apply tickets, `seal`, `blender_look` on the returned
  render, review, approval when required, exactly one harness commit (review's auto-commit or
  `commit`), and `checkpoint`.
- Apply edits are worker-only. Issue an `apply` ticket, pass its token to `blender-worker`, and let
  the worker call `blender_harness_execute`. Reuse one foreground worker task for consecutive tickets
  by resuming its `task_id`; never run parallel writers. The orchestrator executes `save` and `seal`
  only and MUST NOT execute apply.
- At most 20 apply operations per change; 15 minutes without a successful apply. Reopen a failed or
  expired reviewable change with `recover {reopen:true}` before another apply. Recovery `save` and
  `seal` remain available after the apply budget. Unsupported operations stop until reviewed.
- Seal ONLY after at least one apply. NEVER seal, render, or grade the bootstrap save. Close it with
  `commit` and `checkpoint`.
- Inspect every sealed render with `look`. Code output, scene text, and viewport checks do not
  replace the sealed render inspection.
- Use `blender_document` `{action:"read"}` for structured title, field, and section access. Direct
  full-file reads and edits are permitted but discouraged. Create pre-registration markdown with
  `bootstrap-document`; use `blender_document` `{action:"write"}` or `document` during a registered
  change. Update existing documents only inside declared change paths. Invalid known formats are
  rejected with diagnostics; direct edits are revalidated on the next lifecycle command.
- Commit atomically through the harness: `bootstrap-commit` before registration and `commit` after.
  Manual project `git add` and `git commit` are blocked. One bounded message; `checkpoint` MUST see
  exactly one scoped commit and a clean project.
- `revision:true` requires a committed prior verdict and stays within configured `max_rounds`.
  Exhausting the cap requires `escalate`, a reason, and re-registration. NEVER override it silently.

## Review and delegation

- Read `blender-subagents` before delegating and `blender-project-grading` for review modes,
  evidence, and aggregation.
- Validate `config.json` through the harness before delegation. NEVER guess, substitute, or borrow a
  model or budget.
- With review mode `All` or `Single`, every reviewable change MUST be graded before commit. Missing
  or disabled grader configuration stops production. NEVER downgrade silently to self-review.
- Graders are read-only. Each writes only its assigned `REPORT.md`, through `blender_document`
  `{action:"write"}`, and MUST NOT read peer reports. Dispatch only through `grader-ticket` and the
  normal `blender-grader` task.
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
| `blender-project-scaffold` | Project structure and new-project setup. |
| `blender-project-readme` | Project README structure. |
| `blender-assets` | Asset licensing, paths, packing, delivery. |
| `blender-mcp` | Blender MCP operations, rendering, API gaps. |

## Done

Blender production is complete only when all acceptance checks pass; the scene is saved; the sealed
review render exists and was inspected with `look`; requirements, workflow, and review records are
current; every required review has an applicable `PASS` or recorded `Off` self-review; no genuine
blocker or major remains; `checkpoint` is clean; and the goal prompt is recorded. Call
`goal_report {status:"complete",reason:<evidence>}` only after that state.

Workspace maintenance requires the relevant format, tooling, and diff checks. Report checks that
could not run; do not invent scene verification.
