# Review Rounds — Laundromat

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
| R01-20261110T050448Z | 20261110T050448Z | bca7ae54c4cb | Single milestone | visual | PASS | [R01-20261110T050448Z/REVIEW.md](R01-20261110T050448Z/REVIEW.md) |
| R02-20261110T052833Z | 20261110T052833Z | 8720b6fdd57a | Single milestone | visual | CHANGES_REQUIRED | [R02-20261110T052833Z/REVIEW.md](R02-20261110T052833Z/REVIEW.md) |
| R03-20261110T054528Z | 20261110T054528Z | 3ee473e58a10 | Single milestone | visual | PASS | [R03-20261110T054528Z/REVIEW.md](R03-20261110T054528Z/REVIEW.md) |
| R04-20261110T061240Z | 20261110T061240Z | ca99f0d63ab7 | Single milestone | visual | PASS | [R04-20261110T061240Z/REVIEW.md](R04-20261110T061240Z/REVIEW.md) |

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

- R01-20261110T050448Z: Build the interior shell: tile floor, three walls, drop ceiling with fluorescent panels, hero camera, and mixed fluorescent/daylight lighting.; evidence 99010d8725e0fb5b682678cfd1050184f4fd1ba62183bf23ef7f39d222c6b8e7

- R02-20261110T052833Z: Build the left row of six front-loading washers with sage painted bodies, dark control panels, and tinted glass doors facing the aisle.; evidence 977a5d3e70b965ced4dbac6366e49f7f919e8ebc673f070ed66b318526b8dbcf

- R03-20261110T054528Z: Revise the left washer row: add stainless drum rims around every round door, retune the doors to tinted glass, and pull the hero camera back slightly to reduce near-row cropping.; evidence e1384d2e4d402dcf0e0ea4585fb6a048bbc76b6ff68c57f40f1e9748df5cd8f8

- R04-20261110T061240Z: Build the first three right-row machines by duplicating the left row across the aisle, facing the centre.; evidence 041dd8a4ad61b6c228bb563e05a5718bcabbf5b087befe329eb333d89c599b07
