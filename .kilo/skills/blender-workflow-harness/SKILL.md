---
name: blender-workflow-harness
description: Use before any production blender_workflow action. Defines the harness-driven lifecycle, bootstrap, tickets, review, approval, commits, checkpoints, and recovery.
---

# Blender Workflow Harness

`blender_workflow` takes `{action:string,payload:JSON string}`. The runtime owns state, evidence,
approval receipts, and project commits.

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
2. `begin` `{outcome,objects,paths,revision?}`. One bounded change; exact object names and
   project-relative paths. `revision:true` requires the prior committed verdict.
3. Issue `ticket` `{operation:"apply",payload:<supported operation>}`. Pass the token to one
   foreground `blender-worker`; the worker calls `blender_harness_execute` with the exact token,
   operation, and payload. Each apply auto-saves. The orchestrator NEVER executes apply.
4. The orchestrator executes `ticket` `{operation:"save"|"seal",payload:{}}`. Seal only after at
   least one apply. `seal` writes immutable evidence, a final PNG, and a manifest.
5. Call `blender_look` on the returned absolute render path. A receipt requires a real image.
6. Review: `self-review` `{notes}` when mode is `Off`; otherwise dispatch every configured grader
   with `grader-ticket` `{name}` and the normal `blender-grader` task. Aggregate with
   `review` `{notes,reason,dispositions}`. The harness computes the verdict and writes `REVIEW.md`.
7. In Partially Autonomous mode call `approval` `{}` and pass its exact question and labels to
   `question`. Approval is required before the change commit.
8. `commit` `{message}`. In Fully Autonomous with `All` or `Single`, `review` already auto-committed
   the reviewed change and artifacts; skip to `checkpoint`. With `Off`, or in Partially Autonomous,
   `commit` creates the single scoped commit after approval/self-review. NEVER use manual Git for
   project paths.
9. `checkpoint` `{}`. It requires exactly one commit after the change base and a clean project.
   Then start the next `begin` or report completion.

Bootstrap save: use ticketed `save`, then `commit`, then `checkpoint`. NEVER seal, render, grade, or
open a review round for the initial empty/default scene.

## Limits and recovery

- Maximum 20 applies per change before checkpoint; hard cap 40; 15 minutes. Recovery `save` and
  `seal` remain available after the apply budget or a failed apply.
- `recover` releases only an expired or dead ticket. If the writer started, inspect the live scene,
  save, and reseal. NEVER release a live writer.
- `max_rounds` is configured 1-4. A capped review requires `escalate` `{reason,max_rounds?}`, then
  the exact registration question again. Escalation preserves history.
- `status.nextStep` is authoritative for pending tickets, missing `look`, review, approval, commit,
  checkpoint, and completion. Do not repeat a completed phase.

## Documents and commits

- Pre-registration new markdown: `bootstrap-document`; commit with `bootstrap-commit`.
- Registered new markdown: declare its exact path in `begin`, then call `document` `{path,content}`.
- Existing documents update only within the declared change paths.
- Review artifacts are harness-generated; each grader writes only its assigned `REPORT.md`.
- Project commits: `bootstrap-commit` before registration; `commit` after registration. One bounded
  message. `checkpoint` verifies the exact commit and clean project.

## Forbidden

- Raw `execute_blender_code`, imports, generation, arbitrary Python, shell Blender commands, or
  manual project Git commands.
- Editing external harness state; creating fake tickets, receipts, approvals, or reports.
- Sealing without a saved reviewable change; grading the bootstrap save; skipping required review.
- Continuing after a gate error without resolving the phase named by `status.nextStep`.
