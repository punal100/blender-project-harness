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

## Milestone scope

- `final:false` is a partial milestone. Graders must judge only the declared milestone and the
  requirements it advances. Future or unbuilt scope is deferred, not a finding; absent future content
  MUST NOT be reported as a blocker or major.
- `final:true` is the full-spec review. Only then must every confirmed requirement and the complete
  deliverable be present.
- For intermediate changes, pass the milestone-specific requirement IDs the change advances. Do not
  pass full-deliverable IDs whose content is intentionally deferred; reserve the complete set for the
  final change.
- The grader ticket prompt includes the partial/final scope contract. Do not remove or weaken it.

## Review mode record

`Documents/REVIEW.md` MUST contain one `Mode:` value (`Off`, `All`, or `Single`), one `Selected:`
date, and for `Single` one `Single grader:` name. Ask the mode in ordinary chat before the goal
starts and on a genuine later return. Do not reask for routine approval or continuation pauses.
Switch modes only after explicit user direction. After registration, the review record is frozen;
stop and report the need for explicit re-registration instead of editing it inside a bounded change.

## Config

Read `blender_subagents.graders` from `.kilo/blender-project-harness/config.json`. The tracked
`.kilo/blender-project-harness/config.example.json` is the template.

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
          "backup": {
            "provider": "backup-provider-id",
            "model": "backup-model-name",
            "variant": "backup-reasoning-variant"
          },
          "max_minutes": 5,
          "max_steps": 10
        }
      ]
    }
  }
}
```

The harness validates the roster at `prepare`: unique slug, non-empty focus/model fields, one complete
backup provider/model/reasoning variant per grader, positive budgets, `max_steps` within the grader
ceiling, `max_parallel` within the roster, and `max_rounds` 1-4. Give the `spec` grader 12 steps when
it must complete a final full-spec review; 10 can be exhausted before the documentation reads. NEVER fabricate, drop, substitute, or
borrow a grader or model. Resolve models with `agent_manager_models`; per-task overrides require
explicit user request. A primary dispatch failure may retry once with the configured backup; record
`modelRole` and do not change the roster or review mode.

## Evidence and round folder

For every scene change, call `finalize`, then issue `wip`, and `blender_look` the WIP render before
`seal`; every third apply also requires a WIP check. A WIP render is not review evidence and stays
out of commits.

Call `seal` after the reviewable scene is ready. It saves the authoritative scene and captures every
declared scene:

- a camera PNG per scene (and a master sequence still when applicable);
- `scene.txt` and `scene-facts.json` per scene;
- `manifest.json` with UTC time, goal, base commit, dirty state, primary scene, scene list, scene
  requirement mapping, spec hashes, selected graders, and evidence hashes.

Call `blender_look` on every returned scene render. The runtime records one inspection receipt per
scene; review is blocked until every declared scene is inspected. NEVER substitute an image, rewrite
sealed evidence, or change the manifest.

The harness creates `Documents/Reviews/R<NN>-<yyyyMMddTHHmmssZ>/`. `NN` is the next project-wide round number; never reuse or overwrite a round. `_evidence/` is ignored; reports, manifest, and the round index are tracked. Each grader writes only `<grader>/REPORT.md`, through `blender_document` `{action:"write"}`. Direct report edits are denied. The ticket prompt lists exact evidence files with hashes; the grader must read those exact paths, not an evidence folder, and may use only its assigned report. A multi-scene report must cite every declared scene name. Read `operation_tasks` in the manifest and `Documents/TASKSTRACKER.md` with `Documents/Tasks/<id>/` as process evidence; `blender_document {action:"ledger"}` returns the structured rows. Never edit either.

## Dispatch

0. Read spec documents through `blender_document` `{action:"read"}`. Direct `read`/`grep` is
   acceptable but discouraged. Read non-markdown evidence directly.

1. After seal and successful `look`, call
   `blender_workflow` `grader-ticket` `{name}` for each selected grader.
2. Pass its returned prompt to the normal `blender-grader` task. Keep the literal
   `HARNESS_GRADER:<token>`, report path, scene hash, evidence key, and deadline unchanged.
3. Fill only the user-prompt and prior-findings placeholders. Do not invent a child session or
   report receipt.
4. Issue all selected grader tickets, then dispatch up to `max_parallel` grader tasks in one batch
   before waiting; graders run read-only and never edit the scene. One writer rule remains.
5. Retain each runtime-bound `task_id`. Resume the same grader session for re-review when model and
   focus are unchanged.
6. If a task fails before binding a child session, call `grader-fail {name,reason}` so the failure
   is recorded against the ticket.

A missing or failed report permits one replacement `grader-ticket` before `review`; the replacement
gets a fresh pass budget. A tooling/evidence `BLOCKED` report is retryable without a scene revision;
a second failure is aggregated by `review`, after which `nextStep` returns `retry-grader` or
`preserve`, not `begin`. Graders never loop or ask the user. The assigned report write is exempt
from both the step budget and the deadline so a grader can always record its verdict. A grader may
read its own prior `REPORT.md` under `Documents/Reviews/`; peer grader reports remain denied.

## Aggregate and dispose

1. Verify each report exists, cites the sealed evidence and scene hash, and declares exactly one
   verdict.
2. Merge duplicate findings; the highest substantiated severity wins.
3. Resolve disagreements against the confirmed spec and frozen evidence; record the reasoning.
4. Record every finding as `open`, `fixed`, `deferred`, or `declined` with a reason. A declined
   blocker or major requires evidence that it is false or outside confirmed scope. Time pressure or
   preference is not a waiver.
5. Call `review` `{notes,reason,dispositions}`. The harness validates reports, computes the verdict,
   writes `REVIEW.md`, appends the round row to `Documents/Reviews/README.md`, and auto-commits in
   Fully Autonomous mode. In Partially Autonomous mode it
   writes the verdict and waits for approval; `commit` then creates the review commit. A tooling
   `BLOCKED` verdict is not auto-committed; retry the blocked grader with the configured backup.
6. After the retry budget is exhausted, call `preserve {reason}` instead of looping. It commits the
   sealed render, reports, aggregate review, tracker, and task records as `WIP`; then `checkpoint`
   and `pause` or `reregister`. NEVER mark a tooling block `PASS`.
7. Call `checkpoint` after the scoped commit. NEVER create or commit review documents manually.

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
  Git commands are blocked. Failed/expired changes use `recover` for repairs or `commit {mode:"wip"}`
  to preserve them; a sealed tooling block uses `preserve`. `checkpoint` verifies exactly one scoped
  commit range after the change base and a clean project.

## References

- `.kilo/agent/blender-grader.md` for the report rubric and output contract.
- `.kilo/blender-project-harness/config.example.json` for the tracked config template.
