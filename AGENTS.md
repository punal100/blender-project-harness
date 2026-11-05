# AGENTS.md — Blender Project Collection

Mandatory. `MUST` and `NEVER` are literal. `blender_workflow {action:"status"}` returns `nextStep`;
execute `nextStep.command` exactly. `capabilities` is authoritative for actions, operations, document
formats, limits, and policies. A `Workflow gate` error means a prerequisite is missing: fix it through
the named action; never bypass with shell, raw Python, state edits, or a temp copy.

## Workspace

- Projects live only under `Blender/<ProjectName>/`, created only with the harness scaffold command.
  Shared tooling stays in `.kilo/blender-project-harness/tools/`; no project files or scripts at the
  workspace root.
- `.kilo/kilo.jsonc` owns the single MCP port; no per-project Kilo config. One Blender instance and
  one writer; parallel read-only inspection is allowed.
- Launch and stop Blender only through `blender_workflow`; never invoke `blender.exe`, a legacy
  script, `--background`, or `--factory-startup` from the shell. Read-only shell inspection is
  allowed. Other non-project commands require the exact repeat, reason, and `[HARNESS_SHELL:<id>]`;
  the harness records them. Blender launches, command substitution, and project mutations stay
  blocked.
- Harness state under `~/.local/state/blender-workflow-harness/` is runtime-owned; never edit it.
  Manual Blender or shell edits invalidate evidence. This is a design workspace: no `PLAN/`,
  plan-check, or verifier records. Tooling tests belong under `.kilo/blender-project-harness/tools/`.

## Entry and records

- Read `blender-project-goal` before production and `blender-workflow-harness` before any production
  workflow action.
- New project: confirm requirements, workflow, and review mode in ordinary chat; scaffold; fill the
  records with `bootstrap-document`; `bootstrap-commit`; `prepare`; answer its exact question; then
  start or resume the goal. Do not launch before that sequence. Never start a goal to ask questions or
  run discovery; `question` is unavailable during an active goal. Read-only questions and workspace
  maintenance need no goal, records, or review render and must not launch or modify Blender.
- Requirements discovery MUST ask for reference images or links as its own question before the
  `Confirm requirements` question. It MUST accept supplied paths/URLs, a generated or web reference,
  or an explicit `none`; "fully modeled / no external assets" does not answer it. Record the answer in
  `REQUIREMENTS.md` and `Documents/References/README.md`.
- Requirements, workflow mode, review mode, and the active goal are frozen after registration.
  Changes stop production and require explicit re-registration. Never edit registration documents
  inside a bounded change.
- Partially Autonomous mode requires approval for every reviewable change before commit. Never record
  approval the user did not give. If `question` is unavailable, stop and report the pending input.

## Production

- Keep one bounded change open per project. `begin` needs one observable outcome, exact object names,
  exact project-relative paths, and `revision` only when authorized. Use milestone requirement IDs for
  intermediate changes, `extend` for exact added scope, `finalize` before sealing, and `final:true`
  only for the final full-spec change.
- A **reviewable change** has at least one apply operation. A change whose declared paths are all
  markdown, source-only scripts under `scripts/`, references, or assets is non-scene: commit and
  checkpoint it without apply, seal, or review. The bootstrap save is not reviewable.
- Reviewable path: apply tickets → WIP render every three applies and before seal → `blender_look` on
  it → `seal` → `look` every sealed scene → review → approval when required → commit(s) →
  `checkpoint`. The harness denies apply until the due WIP look exists; viewport or code checks do
  not replace `look`.
- Apply is worker-only. One `apply` ticket contains one operation or an `{operations:[...]}` batch of
  up to 10. Pass its token to one foreground `blender-worker`; reuse that `task_id`; never run
  parallel writers. The orchestrator executes only `save`, `seal`, and `wip`, never apply. Limits,
  recovery, document, commit, scene, and media procedure live in `capabilities` and
  `blender-workflow-harness`; follow `status.nextStep`.
- The harness owns `Documents/TASKSTRACKER.md`, `Documents/Tasks/`, and `Documents/MEDIA.md`; read
  them with `blender_document {action:"ledger"}`. Manual project `git add`/`git commit` are blocked;
  the harness commit atomically per successful apply batch.
- `revision:true` requires a committed prior verdict and stays within `max_rounds`. Cap exhaustion
  requires `escalate`, a reason, and re-registration. If the goal is active, report the exact pending
  registration question with `goal_report(status="blocked")`; never auto-confirm, loop, or raise the
  cap silently.

## Review and delegation

- Read `blender-subagents` before delegating and `blender-project-grading` for modes, evidence, and
  aggregation. Validate `.kilo/blender-project-harness/config.json` through the harness. Every worker
  and grader needs a complete backup provider/model/variant; runtime matching accepts primary or
  backup only. Never guess, substitute, or borrow a model or budget. With review mode `All` or
  `Single`, every reviewable change must be graded before commit; missing or disabled grader
  configuration stops production and never downgrades to self-review. `review` writes the verdict;
  Fully Autonomous auto-commits the reviewed change and `REVIEW.md`, while Partially Autonomous
  `commit`s after approval. Never create or commit review artifacts manually.
- Graders are read-only, write only their assigned `REPORT.md`, and must not read peer reports.
  Dispatch only through `grader-ticket` and the normal `blender-grader` task. Workers execute only the
  assigned apply ticket and payload; they never save, seal, review, approve, or commit. One writer.

## Working and safety

- Read `blender-mcp` before any scene operation. Use Context7 and official Blender docs for uncertain
  APIs; verify against the live version through supported operations. Never invent API behavior or use
  raw Python as a diagnostic.
- Use relative paths from the `.blend`. Local assets use reviewed operations; external assets require
  `SOURCE.md` and `LICENSE.txt`. Raw `blender_import_asset`, `blender_generate_3d`, and arbitrary
  project Python remain blocked. Inspect packed and embedded third-party data before commit or
  delivery.
- User-supplied files enter only through `intake`. Never ask the user to create folders, rename files,
  or copy by hand, and never shell-copy project files. `download` is HTTPS staging only; inspect it,
  provide source/licence, then `intake`.
- Media generation is agent-owned but harness-booked: after registration, with the initial scene saved
  and checkpointed, open a bounded change with `media:true` and call `media-request` before any Media
  MCP generation. One generation call per request; explicit permission before spending credits.
  Generated files stay under `.temp`; use `media-complete`, then `intake {media:<id>}`. Never fake a
  result or use a hidden generator. Media does not reopen frozen requirements.
- `.py` and `.pyw` files are source-only under `scripts/`; the harness never executes project Python.
  Blender Python execution requires separately reviewed OS/VM isolation.
- After asset use, completion requires `check_assets {strict:true}` on the final unchanged scene.
  Every export requires a harness-verified receipt; completion is denied for a missing or changed
  export. External binaries are committed only when their sidecar allows redistribution.
- Keep `README.md`, `Documents/ASSETS.md`, `Documents/DECISIONS.md`, and other non-registration
  documents current inside the change that changes them. Never add a late documentation commit or
  commit secrets.

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
  `blocked`; `goal_report` is unavailable until `goal {action:"resume"}`. `status` exposes `kiloGoal`
  and returns `resume-goal` instead of proposing a call that cannot run. Treat a denial as a state
  desync, not permission to bypass the harness: resume, then follow `status.nextStep`.

## Done

Blender production is complete only when all acceptance checks pass; the scene is saved; the sealed
review render exists and was inspected with `look`; requirements, workflow, and review records are
current; every required review has an applicable `PASS` or recorded `Off` self-review; no genuine
blocker or major remains; `checkpoint` is clean; and the goal prompt is recorded. Call
`goal_report {status:"complete",reason:<evidence>}` only after that state. The harness's
`goal-complete` marks `Documents/TASKSTRACKER.md` complete and commits that tracker-only update;
verify the clean state before reporting. Then stop Blender through `blender_workflow` unless it is
intentionally left open for user inspection; report that choice. Workspace maintenance requires the
relevant format, tooling, and diff checks; report checks that could not run and never invent scene
verification.

## Live Test 03 - goal and workspace authority

- Kilo goal state is authoritative. When Kilo reports the goal active, the harness reconciles
  `goalActive` and must not request goal resume; resume is only actionable when Kilo reports paused or
  blocked. Roster or backup changes after registration may block new work, but must not block review,
  preserve, commit, checkpoint, seal, or goal reconciliation for an existing change.
- Workspace code-only commits outside the project folder may use the approved shell path when every
  staged path is outside the project. Project commits remain harness-owned. `agent_manager` is
  available to the registered root; workers and graders remain denied. Workspace `.temp` files may be
  written directly by the root; project files remain restricted to declared bounded-change paths.
