---
name: blender-workflow-harness
description: Use before any production blender_workflow action. Defines registration, bootstrap write window, launch/stop, bounded changes, operation tickets, seal, review handoff, approval, checkpoint, escalation, and status recovery.
---

# Blender Workflow Harness

The orchestrator drives production through the custom `blender_workflow` tool with
`{action: string, payload: JSON string}`. Treat every gate error as a missing lifecycle step, never as
permission to bypass the harness with shell commands, direct state edits, or raw Python.

Read `AGENTS.md` for hard invariants and `blender-project-goal`, `blender-project-grading`, and
`blender-subagents` for their respective phases. Call `{action:"capabilities"}` for the supported
operations, primitives, and bootstrap document paths; those runtime lists are authoritative.

## Registration and bootstrap

1. Commit the completed scaffold documents and filled goal before registration.
2. Call `prepare` with only `{project:"Blender/Name",goal:"Documents/Goals/NN-slug.md",scene:"name.blend"}`.
3. Pass the returned question and labels unchanged to `question` as one single-select question.
   Omit `custom`/`multiple` or set both false where the tool exposes them; the Kilo `question` tool
   has no `custom` field. Only genuine runtime answers grant registration.
4. Never create approved JSON, self-confirm registration, or answer the challenge for the user.

Before registration, only the new project's `bootstrapDocuments` from `capabilities` may be written
under `Blender/<Name>/`. Scene, asset, render, evidence, and manifest paths stay blocked; documents of
an already-registered project stay blocked. A denial means a lifecycle step is missing; never work
around it with shell redirection, temp-file copies, or direct edits.

A bootstrap save change may be staged, committed, and closed with `checkpoint` before review. Never
seal or grade the initial empty/default scene.

## Launch and stop

1. Commit completed scaffold documents and the goal, finish `prepare` registration in ordinary chat,
   start or resume the registered goal, then inspect harness `status`.
2. Call `blender_workflow` `{action:"launch"}`. It owns discovery, the workspace port, the single
   instance guard, process spawn, socket wait, and instance metadata outside the repository.
3. After launch, verify with `blender_get_addon_status` and
   `blender_get_scene_info(fields=["settings"])` before editing. Stop on a connection, addon, or file
   mismatch.
4. Stop with `{action:"stop"}` before switching projects. Relaunching the same project while a change
   is open is allowed for recovery. Never invoke `blender.exe`, a legacy launch script,
   `--background`, or `--factory-startup` from the shell. The harness owns the run log under the
   project's ignored `logs/` folder.

For a new unsaved scene, open a bounded `begin`, use ticketed `save` to the declared project `.blend`,
verify that path, call `commit` with one bounded message, then close the change with `checkpoint`;
the runtime records that entry as `BOOTSTRAP`.

## Bounded changes

1. After registration, start or resume the registered goal before production work.
2. Call `begin` with `{outcome,objects:[exact names],paths:[exact project-relative files],revision?:bool}`.
3. Keep one bounded logical change open per project, at most 20 apply operations before checkpoint
   (hard cap 40) and 15 minutes. Recovery `save` and `seal` remain allowed after the apply budget.
4. Only declared paths may be written. Paths must stay inside the project; executable files are
   rejected except the registered scene.
5. `revision:true` requires a prior committed verdict and stays within the configured `max_rounds`
   cap. A failed review or recorded revision request is required when the prior round passed.
6. Create new project markdown with `document` `{path, content}` after declaring the exact path in
   `begin`. Manual writes may update existing documents only; review artifacts are harness-generated.

## Operation tickets

1. Issue `ticket` with
   `{operation:"apply"|"save"|"seal",payload:<operation JSON for apply or {} for save/seal>}`.
2. Pass an apply `token` to the `blender-worker` task. The worker calls server tool
   `blender_harness_execute` (`harness_execute`) with
   `{token,operation:"apply",payload,user_prompt:<verbatim user goal>}`. Each apply auto-saves the
   authoritative scene. The orchestrator executes save/seal only; it cannot execute apply directly.
3. Use only operations and primitives returned by `capabilities`. Raw `execute_blender_code`,
   `import_asset`, and `generate_3d` are blocked. Unsupported operations stop until tooling is
   reviewed and extended; do not add an arbitrary Python route.
4. Tickets are one-shot, session-bound, and time-limited. Never reuse, forge, or forward a ticket.

## Seal

`seal` saves the authoritative scene, captures immutable review evidence, the final PNG render, and
the manifest. Then call mandatory `blender_look(image=<returned absolute render path>)`; the hook
records successful inspection. A bootstrap save with no operations cannot be sealed or graded.

## Review handoff

- `Off`: use `self-review` with `{notes}` after inspecting the sealed render.
- `All` or `Single`: use `grader-ticket` with `{name}`. Pass its returned `prompt` to the normal
  `blender-grader` task, filling only the user-prompt and prior-findings placeholders.
- The plugin binds the actual child by parent/task token and runtime model metadata. A grader writes
  only its assigned report and never reads peer reports.
- `review` validates all receipts, writes the aggregate `REVIEW.md` with reason and finding
  dispositions, and auto-commits reports, render, manifest, index, and verdict in one commit. Do not
  create or commit review documents manually. Follow `blender-project-grading` for retries and bounds.

## Approval

Partially Autonomous mode requires the goal stopped before `approval`; follow
`blender-project-goal` without delegating goal controls to the user. Use the exact returned question
and labels `Approve change`, `Request revision`, `Pause`. Only the actual runtime answer counts;
forged approval JSON is ignored.

## Checkpoint and escalation

Before each next `begin`, inspect status, `git diff`, and recent log; call `commit` with a bounded
message to stage and commit the exact scoped change, then `checkpoint`. Checkpoint verifies exactly
one scoped commit, clean project state, and hash match. Review auto-commit remains valid for its
round. Failed rounds commit before fixes.

`revision:true` requires the prior round's committed verdict and stays within the configured
`max_rounds` cap. After a capped review, call `escalate` with a bounded reason and optional
`max_rounds` up to 4, then complete the exact registration question again. Escalation preserves
prior history and does not silently reset review state.

## Status and recovery

`status` is the recovery entry point after compaction or restart. `recover` releases an expired or
dead operation ticket: if the writer never started, edits stay open; if it started, inspect the live
scene, save, and reseal before continuing. The harness keeps workflow state outside the repository at
`~/.local/state/blender-workflow-harness/<workspace-hash>`; it is not editable through an agent and
direct edits invalidate captured evidence.

The harness is a same-user guard, not an OS sandbox. Manual Blender or external-shell edits invalidate
captured evidence, and unrestricted same-user execution can bypass these controls. Never claim a
receipt or approval that runtime did not capture.
