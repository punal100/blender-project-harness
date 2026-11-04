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
| R01-20261104T212554Z | 20261104T212554Z | b4eb973417bc | All milestone | visual, technical, spec | PASS | [R01-20261104T212554Z/REVIEW.md](R01-20261104T212554Z/REVIEW.md) |
| R02-20261104T213739Z | 20261104T213739Z | 6b65269f21c4 | All milestone | visual, technical, spec | CHANGES_REQUIRED | [R02-20261104T213739Z/REVIEW.md](R02-20261104T213739Z/REVIEW.md) |
| R03-20261104T214814Z | 20261104T214814Z | 39007a16f460 | All milestone | visual, technical, spec | PASS | [R03-20261104T214814Z/REVIEW.md](R03-20261104T214814Z/REVIEW.md) |
| R04-20261104T220345Z | 20261104T220345Z | a50c2b4045c3 | All milestone | visual, technical, spec | PASS | [R04-20261104T220345Z/REVIEW.md](R04-20261104T220345Z/REVIEW.md) |
| R05-20261104T223723Z | 20261104T223723Z | 67cb24fa192a | All final | visual, technical, spec | CHANGES_REQUIRED | [R05-20261104T223723Z/REVIEW.md](R05-20261104T223723Z/REVIEW.md) |
| R06-20261104T230000Z | 20261104T230000Z | 477427fee5cc | All final | visual, technical, spec | BLOCKED | [R06-20261104T230000Z/REVIEW.md](R06-20261104T230000Z/REVIEW.md) |

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

- R01-20261104T212554Z: Build the enclosed room shell with floor, walls, ceiling, door, dusk window, curtains, and a working hero camera and evening lighting rig; evidence 2a5808b80bde1a602680812ed545107e83f189de10dc56129281119bff9f67e4

- R02-20261104T213739Z: Build the desk workstation with monitor, tower, keyboard, mouse, mug, warm desk lamp, and office chair at believable scale; evidence fb124fecf06996afdcf5a6e6b0fb6c7f7ad8d59f0ddc63378cce7ebabc20f11c

- R03-20261104T214814Z: Seat the chair base on the floor, connect the chair post, and lift the mouse onto the mouse pad; evidence 67bfdae726ae3f6024fca6221f2423db2a12889913a41bf58cc5f2ee0bbb5bbf

- R04-20261104T220345Z: Furnish the room with a low bed and bedding, an open wall bookshelf with books, a rug, a potted plant, and framed wall art; seat the chair back on its seat; evidence 84b000231f251adf4b4d96fad7511381490cb4c5a2864edf5d307fc16db691cc

- R05-20261104T223723Z: Complete the final evening lighting with warm practical fixtures and a deep dusk window, fix curtain and door contacts, refine the hero camera, add final trim, and update the project delivery documents; evidence a917b013f986323fde75a285b1fbc84d827e7084ac0447109053e11ff3cbbcf7

- R06-20261104T230000Z: Replace the crisp point practicals with soft area lights, lift the dark chair and tower, material the pendant cord, and deliver a soft-shadow final render; evidence 6793a860dfc10242a0aff151e84f4d1354df5fd18b762194684069be9ea0e8ae
