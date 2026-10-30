# Documents — {{PROJECT_NAME}}

Project documentation lives here. Keep it current; the README and these documents are part of the
deliverable.

| Path | Purpose |
|---|---|
| `REQUIREMENTS.md` | Confirmed scope, acceptance criteria, research notes, and requirement change log. |
| `WORKFLOW.md` | Current autonomy mode and workflow switch history. |
| `Goals/` | `/goal` prompts for design work. One file per goal; multiple goals per project. |
| `ASSETS.md` | Register of external assets, sources, licences, and local paths. |
| `DECISIONS.md` | Design decisions and the reason for each change. |
| `References/` | Moodboards, screenshots, links, and visual references. |
| `../README.md` | Project purpose, requirements summary, scope, deliverables, and status. |

## Rules

- Do not scaffold or launch Blender until requirements are confirmed.
- Confirmation means `Status: Confirmed`, a `Confirmed: YYYY-MM-DD` date, and the exact
  `Confirmation:` response and scope in `REQUIREMENTS.md`.
- Before Blender work, ensure a goal is active and a workflow mode is selected.
- Requirements may be added or changed at any time only after user confirmation; append the change
  log in `REQUIREMENTS.md`.
- Record sources used during requirements in `REQUIREMENTS.md`; user confirmation, not research,
  decides scope.
- In Partially Autonomous mode, ask for approval after every meaningful change or addition.
- A goal prompt is a design brief, not a coding plan. Do not create `PLAN/` or planning records.
- Record every external asset in `ASSETS.md` before or when it is added.
- Use relative paths from the `.blend` file; never commit machine-specific absolute paths. Packed or
  embedded third-party data in a tracked `.blend` still needs redistribution permission and an asset
  register entry.
- Update the README, `REQUIREMENTS.md`, `WORKFLOW.md`, and `DECISIONS.md` when scope, workflow,
  assets, or visual direction changes.
