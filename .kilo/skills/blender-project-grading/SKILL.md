---
name: blender-project-grading
description: Use when configuring or running independent Blender grader subagents. Defines review modes, evidence, round folders, aggregation, dispositions, and re-review.
---

# Blender Project Grading

Graders review sealed evidence against confirmed requirements. They do not edit the scene and do not
replace the orchestrator's mandatory `blender_look` inspection. `AGENTS.md` holds hard invariants;
`blender-workflow-harness` holds the runtime actions. Follow `status.nextStep` when a review gate
fails. The grader's full rubric is in `.kilo/agent/blender-grader.md`.

## Review modes

- Review every reviewable change: a bounded change with at least one apply.
- Never review the bootstrap save. Commit and checkpoint it without sealing or grading.
- `Off`: `self-review` after inspecting the sealed render.
- `All`: every configured grader reviews each round.
- `Single`: only the named configured grader reviews.
- Partially Autonomous: complete review and obtain approval before the change commit.
- Re-review a failed round with `revision:true` within `max_rounds`.
- Missing, disabled, invalid, or unavailable required grading stops production. Never silently
  downgrade to self-review.

`Documents/REVIEW.md` records one `Mode:` value, one `Selected:` date, and for `Single` one
`Single grader:` name. Ask the mode in ordinary chat before the mission starts and on a genuine later
return. The record is frozen after registration; stop and report the need for re-registration instead
of editing it inside a bounded change.

## Milestone scope

- `final:false` is a partial milestone. Grade only the declared milestone and the requirements it
  advances. Future or unbuilt scope is deferred, not a finding.
- `final:true` is the full-spec review. Only then must every confirmed requirement and the complete
  deliverable be present.
- For intermediate changes, pass the milestone-specific requirement IDs the change advances. Reserve
  the complete set for the final change.
- The grader ticket includes the partial/final scope contract; do not remove or weaken it.

## Config

Read `blender_subagents.graders` from `.kilo/blender-project-harness/config.json`; the tracked
`.kilo/blender-project-harness/config.example.json` is the template. The harness validates unique
slugs, non-empty focus/model fields, one complete backup provider/model/variant per grader, positive
budgets, `max_steps` within the 24-step grader ceiling, `max_parallel` within the roster, and `max_rounds`
1-4. Give visual and technical graders 16 steps and a final full-spec `spec` grader 20 steps, reserving
one step for the report write. Never fabricate, drop, substitute, or borrow a grader or model. A
primary dispatch failure may retry once with the configured backup and must record `modelRole`.

Example config with two graders and `max_parallel` equal to roster size:

```json
{
  "blender_subagents": {
    "graders": {
      "agent": "blender-grader",
      "enabled": true,
      "graders": [
        {
          "name": "visual",
          "focus": "Composition and lighting",
          "provider": "anthropic",
          "model": "claude-opus-4",
          "variant": "high",
          "backup": {
            "provider": "anthropic",
            "model": "claude-sonnet-4",
            "variant": "high"
          },
          "max_minutes": 8,
          "max_steps": 16
        },
        {
          "name": "spec",
          "focus": "Requirements coverage",
          "provider": "anthropic",
          "model": "claude-opus-4",
          "variant": "high",
          "backup": {
            "provider": "anthropic",
            "model": "claude-sonnet-4",
            "variant": "high"
          },
          "max_minutes": 10,
          "max_steps": 20
        }
      ],
      "max_parallel": 2,
      "max_rounds": 2
    }
  }
}
```

## Evidence

For every scene change, call `finalize`, issue `wip`, and `blender_look` the WIP render before
`seal`; every third apply also needs a WIP check. A WIP render is not review evidence and stays out of
commits. `seal` saves the authoritative scene and captures every declared scene: a camera PNG per
scene, `scene.txt`, `scene-facts.json`, and a `manifest.json` with time, goal, base commit, dirty
state, scenes, requirement mapping, spec hashes, selected graders, and evidence hashes.

Call `blender_look` on every returned scene render. The runtime records one receipt per scene; review
is blocked until every declared scene is inspected. Never substitute an image, rewrite sealed
evidence, or change the manifest.

The harness creates `Documents/Reviews/R<NN>-<yyyyMMddTHHmmssZ>/` (UTC timestamp).
`NN` is the next project-wide round number; never reuse or overwrite a round. `_evidence/` is ignored; reports, manifest, and the
round index are tracked. Each grader writes only `<grader>/REPORT.md` through `blender_document`
`{action:"write"}`. The ticket lists exact evidence files with hashes; read those paths, not a folder.
Read `operation_tasks` in the manifest and the task ledger as process evidence; never edit either.

## Dispatch and aggregation

1. After seal and successful `look`, call `grader-ticket {name}` for each selected grader.
2. Dispatch the normal `blender-grader` tasks up to `max_parallel` in one batch. Keep the literal
   `HARNESS_GRADER:<token>`, report path, scene hash, evidence key, deadline, and hard-abort instant
   unchanged. A bound grader is aborted two minutes after the deadline if its report is still absent.
3. If a task fails before binding a child, call `grader-fail {name,reason}`.
4. Verify each report exists, cites sealed evidence and the scene hash, and declares one verdict.
5. Merge duplicate findings; highest substantiated severity wins. Resolve disagreements against the
   confirmed spec and frozen evidence.
6. Record every finding as `open`, `fixed`, `deferred`, or `declined` with a reason. A declined
   blocker or major needs evidence that it is false or outside confirmed scope.
7. Call `review {notes,reason,dispositions}`. The harness validates reports, computes the verdict,
   writes `REVIEW.md`, appends the round row, and auto-commits in Fully Autonomous mode. In Partially
   Autonomous mode, `commit` after approval creates the review commit.
8. A tooling `BLOCKED` is retried with the configured backup, not a scene revision. A valid
   `PASS`/`CHANGES_REQUIRED` report is recovered instead of re-dispatched; a `BLOCKED` retry archives
   the prior report as `REPORT.attemptN.md`. After the retry budget, `preserve {reason}` then
   `checkpoint`. Never mark a tooling block `PASS`.

Verdicts: `PASS` when all selected graders completed, required dimensions were assessed, evidence is
complete, and no substantiated blocker or major remains. `CHANGES_REQUIRED` when at least one blocker
or major remains. `BLOCKED` when evidence/spec is missing, a grader failed, or a necessary decision is
unavailable. One substantiated blocker fails the round. Two rounds without improvement on the same
finding stop for user direction.

## Re-review and completion

Create a new round with `revision:true`. Resume the same grader sessions where possible. Give each
grader its own prior report, new frozen evidence, new report path, and dispositions. The grader marks
each prior finding `FIXED`, `OPEN`, or `REGRESSED` with evidence, then adds new findings.
NEVER permit peer report reads or rewrite sealed metadata.

A milestone PASS is not final acceptance; the final full-spec review must include the frozen reference
evidence. Partially Autonomous completion requires review then `approval`; pass its exact question and
labels to `question`. For `CHANGES_REQUIRED`, choose `Request revision`, commit the failed round,
checkpoint, then begin with `revision:true`; never approve a failed review. Findings do not authorize
fixes; a correction needs a new bounded `begin` with `revision:true`. Completion requires a clean `checkpoint`, current records, inspected sealed render,
and final applicable `PASS` or recorded `Off` self-review with no unresolved blocker or major. Commit
policy and recovery are in `blender-workflow-harness`; manual project Git is blocked.
