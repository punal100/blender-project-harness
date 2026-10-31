---
name: blender-project-grading
description: Use when configuring or running independent Blender grader subagents. Defines review modes, the grader config array, evidence capture, round folders, aggregation, dispositions, re-review, and bounds.
---

# Blender Project Grading

Independent graders review saved work against confirmed requirements. They do not replace the
controller's own `look` inspection, and they never edit the scene. The controller owns design,
acceptance, fixes, approvals, and commits.

## When to grade

Grade after a meaningful, saved visual change and before asking for Partially Autonomous approval.
Grade again after fixes when a round returned `CHANGES_REQUIRED`.

Ask the review mode in ordinary chat before the goal starts, alongside the workflow question.
Kilo removes `question` during an active goal.

## Project review mode

Record the mode in `Blender/<Project>/Documents/REVIEW.md`:

- `Off` — no graders; the controller self-reviews with `look`.
- `All` — every configured grader reviews in parallel.
- `Single` — only the grader named in `Single grader`.

`Mode: Unset` is invalid once production starts. The user may switch modes at any pause; update the
record and change log. The machine-level `blender_graders.enabled` flag is a kill switch: grading runs
only when it is true and the project mode is not `Off`.

## Config

Read the gitignored `config.json` at the workspace root. `config.example.json` is the template.

```json
{
  "blender_graders": {
    "agent": "blender-grader",
    "enabled": true,
    "max_parallel": 3,
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
- Limits are positive integers. `max_steps` must not exceed `steps` in
  `.kilo/agent/blender-grader.md`. `max_parallel` must not exceed the number of graders.
- `max_rounds` is 1-3. Two rounds means the initial review plus one re-review; a third needs an
  explicit user request.
- Validate names and budgets before dispatching. Never silently substitute a model, lower a budget,
  or drop a grader because it is unavailable.
- If `config.json` is missing, copy `config.example.json` without overwriting local settings and stop
  grading until the user confirms. A local file without `blender_graders` means grading is
  unconfigured: report that and do not fabricate a roster.
- Resolve model, provider, and variant with `agent_manager_models` before dispatch. Runtime tool
  restrictions still apply; a configured model is not permission to bypass them.

## Evidence

Capture evidence once per round, before dispatch, so graders run in parallel without touching the
live scene:

- `_evidence/camera.png` — a camera render at review resolution.
- `_evidence/scene.txt` — `blender_get_scene_info` output with settings, placement, materials, and
  topology/weights health.
- Optional `_evidence/view-<name>.png` — orthographic or detail views the controller saves while the
  scene is open.
- `manifest.json` — round metadata and SHA-256 hashes of the evidence files.

Restore temporary render or camera settings after capture. Never capture evidence by changing the
deliverable framing. Live `look` inside a grader is allowed only when the project mode is `Single`
or `max_parallel` is `1`; parallel graders use files only.

`_evidence/` is gitignored. Reports, manifests, and the round index are tracked.

## Round folder

One folder per round, never reused:

```text
Documents/Reviews/
  README.md
  R01-20261031T081500Z/
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
`manifest.json` and `REVIEW.md` and updates the index in `Documents/Reviews/README.md`.

## Dispatch

Pre-create the round folders and evidence. Dispatch all selected graders in a single message with
multiple `task` calls, each `subagent_type: "blender-grader"`, the configured model, provider, and
variant, and a self-contained prompt:

```text
Round: R01
Project root: <absolute path>
Grader name / focus: <name> / <focus>
Spec: Documents/REQUIREMENTS.md, Documents/Goals/01-project-brief.md
Target: <commit sha or working tree>
Evidence: <round>/_evidence/
Report path: <round>/<grader>/REPORT.md
Prior round: none
Live inspection: not allowed
Budget: <max_minutes> minutes, <max_steps> steps
Stop: missing evidence/spec, out-of-folder path, scene edit request, budget reached
Output: verdict, findings, <= 20 lines
```

When `max_parallel` is lower than the grader count, dispatch in batches. One Blender writer rule is
unchanged; graders are read-only and never open or save Blender files.

Store each returned `task_id` in `manifest.json`. Resume that same session for the next round when
the model and focus are unchanged; otherwise start fresh and record why.

## Aggregate and dispose

After all graders return, the controller:

1. Validates each report exists, cites evidence, and ends with a verdict.
2. Merges duplicate findings; the highest severity wins.
3. Fixes blockers and majors or records `deferred`/`declined` with a concrete reason. A finding
   cannot be silently dropped, and a `PASS` requires every blocker/major to be `fixed` or `declined`
   with solver reasoning.
4. Writes `REVIEW.md` with the final verdict, per-grader verdicts, merged findings, dispositions,
   and the next action.
5. Fixes the scene only through normal controlled changes, saving and inspecting with `look`, then
   captures new evidence for the next round.
6. Commits atomically: the review round artifacts in one commit, fixes in their own commits.

Verdicts:

- `PASS` — no open blocker or major finding, and required evidence exists.
- `CHANGES_REQUIRED` — at least one blocker or major remains.
- `BLOCKED` — evidence/spec missing, grader failure, or a design decision is needed.

The final verdict belongs to the controller, not to a vote count. A single blocker fails the round
regardless of other PASS verdicts. Two consecutive rounds with no improvement on the same finding
escalate to the user instead of a third automatic round.

## Re-review

New round folder, same grader sessions where possible. Prompt each resumed grader with the prior
report path, new evidence path, new report path, and the controller's dispositions. The grader must
mark each prior finding `FIXED`, `OPEN`, or `REGRESSED` with evidence, then add any new findings.
Update the manifest with new task IDs and the previous round.

## Partially Autonomous

Graders run before the approval question, so the controller can fix blockers first. If fixes are
needed after approval, pause the goal, ask, then resume. Graders never ask the user.

## Commit and ignore policy

- Commit `REVIEW.md`, `manifest.json`, each `REPORT.md`, and the round index.
- Ignore only `_evidence/` and `tmp/` inside `Documents/Reviews/`; never ignore reports.
- Record the reviewed commit sha in the manifest and `REVIEW.md`.
- Keep temporary previews inside the round's ignored folders; do not scatter them elsewhere.

## References

- [Custom subagents](https://kilo.ai/docs/customize/custom-subagents)
- [Per-task model selection](https://kilo.ai/docs/code-with-ai/agents/model-selection#per-task-model-selection)
- [Session goals — clarification questions](https://kilo.ai/docs/code-with-ai/agents/goals#clarification-questions)
- Rubric: `.kilo/agent/blender-grader.md`
