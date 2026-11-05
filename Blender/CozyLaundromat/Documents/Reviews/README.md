# Review Rounds — CozyLaundromat

Independent grader rounds live here. One folder per round, never reused:

```text
R<NN>-<yyyyMMddTHHmmssZ>/
  manifest.json        # frozen goal/spec/scene/evidence hashes, graders, tasks, and verdicts
  REVIEW.md            # orchestrator verdict, merged findings, dispositions
  _evidence/           # ignored: previews, scene summary, temp files
  <grader>/
    REPORT.md          # that grader's structured verdict and findings
```

- At round creation, inspect all existing project round folders and this index. Use one more than
  the highest existing or indexed round number, or `01` when both are empty. Sequence numbers are
  project-wide across goals and sessions; re-reviews consume the next number too.
- Format the current UTC creation time as `yyyyMMddTHHmmssZ`. Never hardcode a date, reuse a round
  folder or identifier, or reset numbering for a new goal. Stop and resolve a naming collision.
- Each grader owns exactly one `<grader>/` folder and writes only `REPORT.md`.
- The orchestrator writes `manifest.json`, `REVIEW.md`, and the index below.
- Everything is tracked except `_evidence/` and `tmp/`, which this folder's `.gitignore` excludes.
- Record the active goal's actual `Documents/Goals/NN-<slug>.md` path in the manifest; do not assume
  the initial brief remains active. Cite requirement or acceptance IDs from that goal and requirements.
- Save the `.blend`, capture evidence, compute hashes, and freeze the evidence files and manifest
  hashes before dispatch. All graders in a round must review the same frozen evidence. Do not modify
  frozen evidence or baseline hashes after dispatch; create a new round for a changed target.
- A `PASS` requires no genuine unresolved blocker or major finding. Record every finding's
  disposition. Rejecting a false positive or inapplicable finding requires evidence and reasoning;
  declining a genuine blocker or major is not a waiver and cannot produce `PASS`.
- Two rounds without improvement on the same finding escalate to the user; do not loop.

## Index

| Round | UTC | Target | Mode | Graders | Verdict | Report |
|---|---|---|---|---|---|---|
| R01-20261105T143815Z | 20261105T143815Z | bdf5b9c6897f | All milestone | visual, technical, spec | CHANGES_REQUIRED | [R01-20261105T143815Z/REVIEW.md](R01-20261105T143815Z/REVIEW.md) |
| R02-20261105T150726Z | 20261105T150726Z | bbba0dc62c78 | All milestone | visual, technical, spec | CHANGES_REQUIRED | [R02-20261105T150726Z/REVIEW.md](R02-20261105T150726Z/REVIEW.md) |
| R03-20261105T153033Z | 20261105T153033Z | 34f4d125f3ef | All milestone | visual, technical, spec | CHANGES_REQUIRED | [R03-20261105T153033Z/REVIEW.md](R03-20261105T153033Z/REVIEW.md) |
| R04-20261105T154954Z | 20261105T154954Z | 1e18eb7f1226 | All milestone | visual, technical, spec | PASS | [R04-20261105T154954Z/REVIEW.md](R04-20261105T154954Z/REVIEW.md) |
| R05-20261105T162039Z | 20261105T162039Z | a9543155b0c7 | All milestone | visual, technical, spec | BLOCKED | [R05-20261105T162039Z/REVIEW.md](R05-20261105T162039Z/REVIEW.md) |

## Rules

- Grade saved work, not intentions: capture evidence after saving the `.blend`.
- Run required graders in bounded batches under `blender-project-grading` and complete every report
  and disposition before the Partially Autonomous change-review question. Findings do not authorize
  another reviewable correction without the user's approval or revision direction.
- Before production completion, require a final applicable `PASS` against the saved deliverable
  state when grading is enabled, with no genuine unresolved blocker or major finding.
- The harness commits each completed round's `REVIEW.md`, manifest, reports, and index entry with
  the reviewed change; only `_evidence/` and `tmp/` remain ignored. Manual review-document commits
  are blocked.

- R01-20261105T143815Z: Build the room shell, window, hero camera, and warm ceiling lighting; evidence 38fe4ac255ac5b2ed7dd227cf78a57e93acf504a8b0659d56e62110c392cb27f

- R02-20261105T150726Z: Fix R01 findings: reframe the full window, shape the warm practical lighting, add floor detail and matched ceiling fixtures; evidence 9513efd49190ae6733faf993ef2c6112d11bb23d630883862a04266a1f6b9a74

- R03-20261105T153033Z: Fix R02 findings: give the window clear margin, refine the floor grid, place the runner, and support the pendants; evidence 958425adac3d77f2fa8aeeaec2f4c65f72648e977fcc175e454842abd463784c

- R04-20261105T154954Z: Fix the cool mottled ceiling: lower the cool fill, lower the pendant bulbs, and make the ceiling warm cream; evidence 3da7d4c5e8cf259dd5b8d4abe989be05e29dafddcde5a98dca4e46a366cd2998

- R05-20261105T162039Z: Build the six front-loading machine row with steel door rims, dark glass, control strip, and laundromat sign; evidence a3ee8253c008b3263bcc8fb5b9178544adf615bf049e02459f5ec4f58744e361
