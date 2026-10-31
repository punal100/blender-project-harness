---
name: blender-project-grading
description: Use when configuring or running independent Blender grader subagents. Defines review modes, the grader config array, evidence capture, round folders, aggregation, dispositions, re-review, and bounds.
---

# Blender Project Grading

Independent graders review saved work against confirmed requirements. They do not replace the
controller's own `look` inspection, and they never edit the scene. The controller owns design,
acceptance, fixes, approvals, and commits.

## When to grade

When mode is `All` or `Single`, grading is mandatory after every meaningful, saved visual change.
In Partially Autonomous mode, complete required review before asking approval or revision direction.
Re-review fixes after `CHANGES_REQUIRED` within the configured round cap. If the cap is exhausted
with unresolved blockers or majors, stop production; never report completion or silently skip review.

Ask the review mode in ordinary chat before the goal starts, alongside the workflow question.
Kilo removes `question` during an active goal.

Use `question` with `Off`, `All`, and `Single` options and wait for the answer. For `Single`, ask which
configured grader to use before recording the mode. On a later return to a paused project, confirm
whether to keep or change the recorded mode before resuming. Routine approval pauses within the
same active task do not require repeated mode questions. Persist dates and exact answers; never
infer a selection from an existing config or another mode answer.

## Project review mode

Record the mode in `Blender/<Project>/Documents/REVIEW.md`:

- `Off` — no graders; the controller self-reviews with `look`.
- `All` — every configured grader reviews in batches bounded by `max_parallel`.
- `Single` — only the grader named in `Single grader`.

`Mode: Unset` is invalid once production starts. The user may switch modes at any pause; update the
record and change log. The machine-level `blender_graders.enabled` flag is a kill switch: grading runs
only when it is true and the project mode is not `Off`. If `All` or `Single` is selected but grading
is disabled, missing, invalid, or unavailable, stop production and resolve the mismatch. Do not
silently downgrade to self-review. In `Single`, the named grader must exist in the configured roster.
The controller must assess acceptance criteria outside that grader's focus.

## Config

Read the gitignored `config.json` at the workspace root. `config.example.json` is the template.

```json
{
  "blender_graders": {
    "agent": "blender-grader",
    "enabled": true,
    "max_parallel": 1,
    "max_rounds": 2,
    "graders": [
      {
        "name": "visual",
        "focus": "composition, camera, lighting, colour, materials",
        "provider": "provider-id",
        "model": "model-name",
        "variant": "reasoning-variant",
        "max_minutes": 5,
        "max_steps": 10
      }
    ]
  }
}
```

- `graders` is an array. Each entry has a unique lowercase slug `name`, a non-empty `focus`, and a
  provider, model, and reasoning variant. Different graders may use different models and variants.
- `agent` must be exactly `blender-grader`, `enabled` must be a boolean, and the roster must be
  non-empty. Reject invalid types, duplicate names, and unknown `Single grader` names before dispatch.
- Limits are positive integers. `max_steps` must not exceed `steps` in
  `.kilo/agent/blender-grader.md`. `max_parallel` must not exceed the number of graders.
- `max_rounds` is 1-3. Two rounds means the initial review plus one re-review; a third needs an
  explicit user request. A configured cap does not authorize that third round by itself.
- Validate names and budgets before dispatching. Never silently substitute a model, lower a budget,
  or drop a grader because it is unavailable.
- If `config.json` is missing, copy `config.example.json` without overwriting local settings and stop
  grading until the user confirms. A local file without `blender_graders` means grading is
  unconfigured: report that and do not fabricate a roster.
- Resolve model, provider, and variant with `agent_manager_models` before dispatch. Runtime tool
  restrictions still apply; a configured model is not permission to bypass them. Pass per-task
  model/provider/variant overrides only when explicitly requested by the user. Otherwise verify
  supported inheritance matches the configured roster or stop; never silently substitute.

## Evidence

Capture evidence once per round, before dispatch, so graders run in parallel without touching the
live scene:

- `_evidence/camera.png` — a camera render at review resolution.
- `_evidence/scene.txt` — `blender_get_scene_info` output with settings, placement, materials, and
  topology/weights health.
- Optional `_evidence/view-<name>.png` — orthographic or detail views the controller saves while the
  scene is open.
- `manifest.json` — round metadata and SHA-256 hashes of evidence, spec files, and the saved `.blend`.

Restore temporary render or camera settings after capture. Never capture evidence by changing the
deliverable framing. Live `look` inside a grader is allowed only when the project mode is `Single`
or `max_parallel` is `1`; parallel graders use files only.

`_evidence/` is gitignored. Reports, manifests, and the round index are tracked.

## Round folder

Generate the folder name dynamically when creating each round: `R<NN>-<yyyyMMddTHHmmssZ>`.
Use the current UTC time, not a copied example date. `NN` is the next project-wide sequence number,
zero-padded to at least two digits, found from existing round folders and the index; start at `01`
only when none exist. Never overwrite or reuse a round, including failed or incomplete rounds. On a
name collision, stop and resolve it rather than overwriting. The `max_rounds` budget applies to one
change and its re-reviews; it does not reset the project-wide sequence.

The tree uses placeholders, not literal folder names:

```text
Documents/Reviews/
  README.md
  R<NN>-<yyyyMMddTHHmmssZ>/
    manifest.json
    REVIEW.md
    _evidence/            # ignored
      camera.png
      scene.txt
    visual/
      REPORT.md
    technical/
      REPORT.md
    spec/
      REPORT.md
```

Each grader owns exactly one subfolder and writes only `<grader>/REPORT.md`. The controller writes
`manifest.json` and `REVIEW.md` and updates the index in `Documents/Reviews/README.md`. Permission
globs restrict edits to report filenames but cannot isolate a dynamically assigned grader; the task
must enforce the exact report path. Graders must not edit another grader's report.

The manifest must record full round name, creation time in UTC, previous round (or null), active goal
path, base commit SHA, dirty state, project-relative scene path and SHA-256, spec/evidence paths and
SHA-256 hashes, selected graders with focus/model/provider/variant/budgets, task IDs, dispatch status,
and verdicts. Record failures too. Freeze spec and evidence for the round; any change requires a new
round. A base commit alone is insufficient evidence identity for an uncommitted scene.

## Dispatch

Pre-create the round folders and evidence. Dispatch selected graders in batches no larger than
`max_parallel`, using multiple `task` calls per batch, each `subagent_type: "blender-grader"`. Use
configured model/provider/variant only when runtime override rules permit. Every prompt must be
self-contained:

```text
Round: <full dynamically generated round folder name>
Project root: <absolute path>
Grader name / focus: <name> / <focus>
Spec: <absolute confirmed requirements path>, <absolute active goal prompt path>
Target: <base commit SHA, saved scene SHA-256, dirty state>
Evidence: <round>/_evidence/
Report path: <round>/<grader>/REPORT.md
Prior round: none
Live inspection: not allowed
User prompt: <verbatim user words for any permitted live Blender call>
Budget: <max_minutes> minutes, <max_steps> steps
Deadline UTC / rounds already used: <absolute deadline and cumulative tool-call rounds in this pass>
Stop: missing evidence/spec, out-of-folder path, scene edit request, budget reached
Output: verdict, findings, <= 20 lines
```

When `max_parallel` is lower than the grader count, dispatch in batches. One Blender writer rule is
unchanged; graders are read-only and never open or save Blender files.

Store each returned `task_id` in `manifest.json`. Resume that same session for the next round when
the model and focus are unchanged; otherwise start fresh and record why. Each new round receives a
new per-pass budget. Retrying or resuming within the same round must preserve its original deadline
and rounds already used; never reset limits to continue a failed pass.

## Aggregate and dispose

After all graders return, the controller:

1. Validates each report exists, cites the frozen evidence, and declares exactly one valid verdict.
   Missing, malformed, or failed reports make the round `BLOCKED`; never count them as `PASS`.
2. Merges duplicate findings; the highest substantiated severity wins. Resolve disagreements against
   the confirmed spec and evidence, recording the reasoning.
3. Records every finding as `open`, `fixed`, `deferred`, or `declined` with a concrete reason. A
   `declined` blocker/major requires evidence that the finding is false or outside confirmed scope;
   preference or time pressure cannot waive a real acceptance failure. `deferred` blockers/majors
   remain unresolved and prevent `PASS`. A claim of a fix requires new evidence and re-review.
4. Writes `REVIEW.md` with the final verdict, per-grader verdicts, merged findings, dispositions,
   and the next action.
5. Commits the completed round artifacts atomically before starting fixes. A round verdict describes
   its frozen evidence; never rewrite a failed verdict to `PASS` using later scene changes.
6. Fixes the scene only through normal workflow gates, saving and inspecting with `look`, then
   captures new evidence for the next round. Fixes get their own commits.

Verdicts:

- `PASS` — all selected graders completed, required dimensions were assessed, required evidence
  exists, and no substantiated blocker or major remains.
- `CHANGES_REQUIRED` — at least one blocker or major remains.
- `BLOCKED` — evidence/spec missing, grader failure, or a design decision is needed.

The final verdict belongs to the controller, not to a vote count. A single substantiated blocker fails the round
regardless of other PASS verdicts. Two consecutive rounds with no improvement on the same finding
escalate to the user instead of a third automatic round.

## Re-review

New round folder, same grader sessions where possible. Prompt each resumed grader with the prior
report path, new evidence path, new report path, and the controller's dispositions. The grader must
mark each prior finding `FIXED`, `OPEN`, or `REGRESSED` with evidence, then add any new findings.
Update the manifest with new task IDs and the previous round.

## Partially Autonomous

Graders run before the approval question. After each meaningful scene change, save, inspect with
`look`, complete its review round, then pause the goal and ask approval before making another
meaningful change, including grader-requested fixes. Review findings do not authorize bypassing
Partially Autonomous gates. Graders never ask the user.

## Commit and ignore policy

- Commit `REVIEW.md`, `manifest.json`, each `REPORT.md`, and the round index.
- Ignore only `_evidence/` and `tmp/` inside `Documents/Reviews/`; never ignore reports.
- Record the base commit SHA, saved scene SHA-256, and dirty state in the manifest and `REVIEW.md`.
- Keep temporary previews inside the round's ignored folders; do not scatter them elsewhere.

## References

- [Custom subagents](https://kilo.ai/docs/customize/custom-subagents)
- [Per-task model selection](https://kilo.ai/docs/code-with-ai/agents/model-selection#per-task-model-selection)
- [Session goals — clarification questions](https://kilo.ai/docs/code-with-ai/agents/goals#clarification-questions)
- Rubric: `.kilo/agent/blender-grader.md`
