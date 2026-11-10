# Review Rounds — Urban Laundromat

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
| R01-20261110T195508Z | 20261110T195508Z | c84ac88d74e6 | Single milestone | visual | BLOCKED | [R01-20261110T195508Z/REVIEW.md](R01-20261110T195508Z/REVIEW.md) |
| R02-20261110T203615Z | 20261110T203615Z | 7f89eab07a6f | Single milestone | visual | BLOCKED | [R02-20261110T203615Z/REVIEW.md](R02-20261110T203615Z/REVIEW.md) |

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

- R01-20261110T195508Z: Room shell with storefront glass, dusk backdrop, hero camera, and base lighting; evidence 250852884926badc5c5e616398f4c3c6578f6c9195fb0242a63f7eebd20381ca

- R02-20261110T203615Z: Washer and dryer banks with folding tables, cart, baskets, soap machine, and bench; evidence b69bac03cc92a83c6d3d789dec505110fa2d193f8789d59c503348078263727e
