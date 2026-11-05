# Review Rounds — CozyComputerRoom

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
| R01-20261105T044624Z | 20261105T044624Z | 27a5219d16c0 | All milestone | visual, technical, spec | CHANGES_REQUIRED | [R01-20261105T044624Z/REVIEW.md](R01-20261105T044624Z/REVIEW.md) |
| R02-20261105T045756Z | 20261105T045756Z | feebaf1c7e41 | All milestone | visual, technical, spec | PASS | [R02-20261105T045756Z/REVIEW.md](R02-20261105T045756Z/REVIEW.md) |
| R03-20261105T051224Z | 20261105T051224Z | da17d024a168 | All milestone | visual, technical, spec | PASS | [R03-20261105T051224Z/REVIEW.md](R03-20261105T051224Z/REVIEW.md) |

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

- R01-20261105T044624Z: Build the enclosed room shell with dusk window, curtains, door, hero camera, and cool/warm lighting.; evidence 9d4e636d28ec798fed644dceacbeef25032c972710c36b807d50e95d55a923e1

- R02-20261105T045756Z: Revise shell lighting and framing: soft warm area light, cool dusk spill, wider hero lens, and door casing with handle.; evidence 1a92bc57e28ccafa344b40aabf95518889c7c79cc04668a2ea1b10a9b36cdc97

- R03-20261105T051224Z: Build the wooden desk, desktop computer with monitor, tower, keyboard and mouse, office chair, and warm desk lamp.; evidence 332770b4dce244c4dd87694fcc7d124d6cc65aded71cc30ae11f0aa1908f2bf3
