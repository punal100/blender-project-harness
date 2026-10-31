# Review Rounds — {{PROJECT_NAME}}

Independent grader rounds live here. One folder per round, never reused:

```text
R<NN>-<UTC timestamp>/
  manifest.json        # round, target commit, graders, task ids, evidence hashes
  REVIEW.md            # controller verdict, merged findings, dispositions
  _evidence/           # ignored: previews, scene summary, temp files
  <grader>/
    REPORT.md          # that grader's structured verdict and findings
```

- `R01-20261031T081500Z` is the first round; re-reviews get the next number and a new timestamp.
- Each grader owns exactly one `<grader>/` folder and writes only `REPORT.md`.
- The controller writes `manifest.json`, `REVIEW.md`, and the index below.
- Everything is tracked except `_evidence/` and `tmp/`, which this folder's `.gitignore` excludes.
- Findings cite `REQ-xx` / `A-xx` from `../REQUIREMENTS.md` and an evidence file.
- A `PASS` requires every blocker and major finding to be fixed or declined with recorded reasoning.
- Two rounds without improvement on the same finding escalate to the user; do not loop.

## Index

| Round | UTC | Commit | Mode | Graders | Verdict | Report |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |

## Rules

- Grade saved work, not intentions: capture evidence after saving the `.blend`.
- Run graders before the Partially Autonomous approval question.
- Commit each round's reports and manifest atomically; keep only previews ignored.
