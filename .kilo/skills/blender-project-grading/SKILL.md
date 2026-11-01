---
name: blender-project-grading
description: Use when configuring or running independent Blender grader subagents. Defines review modes, evidence, round folders, aggregation, dispositions, and re-review.
---

# Blender Project Grading

Graders review sealed evidence against confirmed requirements. They do not edit the scene and do not
replace the orchestrator's mandatory `blender_look` inspection.

`AGENTS.md` defines hard invariants. `blender-workflow-harness` defines the runtime actions. Call
`blender_workflow {action:"status"}` and follow `nextStep` when a review gate fails.

## When review is required

- Review every reviewable change: a bounded change with at least one apply operation.
- NEVER review the bootstrap save. Commit and checkpoint it without sealing or grading.
- Mode `Off`: call `self-review` after inspecting the sealed render.
- Mode `All`: every configured grader reviews each round.
- Mode `Single`: only the named configured grader reviews.
- Partially Autonomous: complete review and obtain approval before the change commit.
- Re-review a failed round with `revision:true` within `max_rounds`.
- Missing, disabled, invalid, or unavailable required grading STOPS production. NEVER silently
  downgrade to self-review.

## Review mode record

`Documents/REVIEW.md` MUST contain one `Mode:` value (`Off`, `All`, or `Single`), one `Selected:`
date, and for `Single` one `Single grader:` name. Ask the mode in ordinary chat before the goal
starts and on a genuine later return. Do not reask for routine approval or continuation pauses.
Switch modes only after explicit user direction. After registration, the review record is frozen;
stop and report the need for explicit re-registration instead of editing it inside a bounded change.

## Config

Read `blender_subagents.graders` from the gitignored workspace `config.json`; the tracked
`config.example.json` is the template.

```json
{
  "blender_subagents": {
    "graders": {
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
}
```

The harness validates the roster at `prepare`: unique slug, non-empty focus/model fields, positive
budgets, `max_steps` within the grader ceiling, `max_parallel` within the roster, and `max_rounds`
1-4. NEVER fabricate, drop, substitute, or borrow a grader or model. Resolve models with
`agent_manager_models`; per-task overrides require explicit user request.

## Evidence and round folder

Call `seal` after the reviewable scene is ready. It saves the authoritative scene and captures:

- a final camera PNG;
- `scene.txt` from `blender_get_scene_info`;
- `manifest.json` with UTC time, goal, base commit, dirty state, scene hash, spec hashes, selected
  graders, and evidence hashes.

Immediately call `blender_look` on the returned absolute render path. The runtime records the
inspection receipt. NEVER substitute an image, rewrite sealed evidence, or change the manifest.

The harness creates `Documents/Reviews/R<NN>-<yyyyMMddTHHmmssZ>/`. `NN` is the next project-wide round number; never reuse or overwrite a round. `_evidence/` is ignored; reports, manifest, and the round index are tracked. Each grader writes only `<grader>/REPORT.md`, through `blender_document` `{action:"write"}`. Direct report edits are denied.

## Dispatch

0. Read spec documents through `blender_document` `{action:"read"}`. Direct `read`/`grep` is
   acceptable but discouraged. Read non-markdown evidence directly.

1. After seal and successful `look`, call
   `blender_workflow` `grader-ticket` `{name}` for each selected grader.
2. Pass its returned prompt to the normal `blender-grader` task. Keep the literal
   `HARNESS_GRADER:<token>`, report path, scene hash, evidence key, and deadline unchanged.
3. Fill only the user-prompt and prior-findings placeholders. Do not invent a child session or
   report receipt.
4. Dispatch in batches no larger than `max_parallel`; graders run read-only and never edit the
   scene. One writer rule remains.
5. Retain each runtime-bound `task_id`. Resume the same grader session for re-review when model and
   focus are unchanged.

A missing or failed report permits one replacement `grader-ticket` before `review`; the replacement
gets a fresh pass budget. A second failure aggregates as `BLOCKED`. Graders never loop or ask the
user.

## Aggregate and dispose

1. Verify each report exists, cites the sealed evidence and scene hash, and declares exactly one
   verdict.
2. Merge duplicate findings; the highest substantiated severity wins.
3. Resolve disagreements against the confirmed spec and frozen evidence; record the reasoning.
4. Record every finding as `open`, `fixed`, `deferred`, or `declined` with a reason. A declined
   blocker or major requires evidence that it is false or outside confirmed scope. Time pressure or
   preference is not a waiver.
5. Call `review` `{notes,reason,dispositions}`. The harness validates reports, computes the verdict,
   writes `REVIEW.md`, and auto-commits in Fully Autonomous mode. In Partially Autonomous mode it
   writes the verdict and waits for approval; `commit` then creates the single commit.
6. Call `checkpoint` after the scoped commit. NEVER create or commit review documents manually.

Verdicts:

- `PASS`: all selected graders completed, required dimensions were assessed, evidence is complete,
  and no substantiated blocker or major remains.
- `CHANGES_REQUIRED`: at least one blocker or major remains.
- `BLOCKED`: evidence/spec missing, grader failed, or a necessary decision is unavailable.

One substantiated blocker fails the round regardless of other PASS verdicts. Two rounds without
improvement on the same finding STOP for user direction; do not run a third automatic round.

## Re-review

Create a new round with `revision:true`. Resume the same grader sessions where possible. Give each
grader its own prior report path, the new frozen evidence, the new exact report path, and the
orchestrator's dispositions. The grader marks each prior finding `FIXED`, `OPEN`, or `REGRESSED`
with evidence, then adds new findings. NEVER permit peer report reads or rewrite sealed metadata.

## Approval and completion

- In Partially Autonomous mode, complete review before calling `approval`. Pass its exact question
  and labels to `question`; only a runtime answer authorizes the commit.
- Findings do not authorize fixes. A correction requires a new bounded `begin` with `revision:true`.
- Completion requires a clean `checkpoint`, current records, inspected sealed render, and final
  applicable `PASS` or recorded `Off` self-review with no unresolved blocker or major.
- Commit policy: `bootstrap-commit` before registration, `commit` after registration. Manual project
  Git commands are blocked. Failed rounds commit before fixes; `checkpoint` verifies exactly one
  scoped commit after the change base.

## References

- `.kilo/agent/blender-grader.md` for the report rubric and output contract.
- `config.example.json` for the tracked config template.
