# Documents — {{PROJECT_NAME}}

Project documentation lives here. Keep it current; the README and these documents are part of the
deliverable.

| Path | Purpose |
|---|---|
| `REQUIREMENTS.md` | Confirmed scope, acceptance criteria, research notes, and requirement change log. |
| `WORKFLOW.md` | Current autonomy mode and workflow switch history. |
| `REVIEW.md` | Review mode (`Off`, `All`, `Single`) and grader selection. |
| `Goals/` | Recorded design goal prompts. One file per goal; multiple goals per project. |
| `Reviews/` | Timestamped grader rounds: manifests, verdicts, findings, ignored evidence. |
| `ASSETS.md` | Register of external assets, sources, licences, and local paths. |
| `DECISIONS.md` | Design decisions and the reason for each change. |
| `References/` | Moodboards, screenshots, links, and visual references. |
| `../README.md` | Project purpose, requirements summary, scope, deliverables, and status. |

## Rules

- Confirm requirements, collect workflow and review answers, scaffold, then persist all three exact
  records. Fill and start the goal before launching Blender. Do not reask collected mode answers.
- Confirmation means `Status: Confirmed`, a `Confirmed: YYYY-MM-DD` date, and the exact
  `Confirmation:` response and scope in `REQUIREMENTS.md`.
- Before Blender work, ensure a goal is active, a workflow mode is selected, and the review mode is
  not `Unset`.
- Requirements may be added or changed at any time only after user confirmation; append the change
  log in `REQUIREMENTS.md`.
- Record sources used during requirements in `REQUIREMENTS.md`; user confirmation, not research,
  decides scope.
- In Partially Autonomous mode, seal, inspect, complete required grading, and obtain approval or
  revision direction after every reviewable change before its commit. Grader findings never bypass
  this gate.
- In either autonomy mode, the orchestrator follows `blender-project-goal` for required-input handoffs,
  questions, objective updates, and resume. Users provide inputs, never goal commands. Pause,
  cancellation, unanswered questions, and manual editing keep work stopped until continuation is
  authorized.
- Ask workflow and review modes before resuming a genuine later return; routine approval or manual
  pauses within the same active task retain modes without reasking.
- Grade saved work with the configured graders when review mode is `All` or `Single`; the harness
  commits each round's verdict, manifest, reports, and index with the reviewed change. Only
  `_evidence/` and `tmp/` under review rounds are ignored. Require final applicable `PASS` with no
  genuine unresolved blocker or major finding before completion; declining a genuine finding does
  not waive it.
- A goal prompt is a design brief, not a coding plan. Do not create `PLAN/` or planning records.
- Record every external asset and third-party derivative in `ASSETS.md` before or when it is added;
  keep `SOURCE.md` and verbatim `LICENSE.txt` in its external asset folder.
- Use relative paths from the `.blend` file; never commit machine-specific absolute paths. Packed or
  embedded third-party data in a tracked `.blend` still needs redistribution permission and an asset
  register entry.
- Update README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, `ASSETS.md`, and `DECISIONS.md`
  when scope, workflow, review mode, assets, or visual direction changes.
