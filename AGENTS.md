# AGENTS.md — Blender Project Collection

These rules are mandatory within their stated scope. Treat `must`, `required`, and `stop` literally. Do not bypass an unmet gate. Examples and reference values are not project requirements; confirmed user instructions control design and scope.

## Workspace

- Projects live under `Blender/<ProjectName>/`. Scaffold with `.\tools\new-blender-project.cmd`; do not invent another layout.
- Keep shared tooling in `tools/`; do not add scripts or project files at the workspace root.
- `.kilo/kilo.jsonc` owns the single MCP port. Do not create per-project Kilo configs.
- Only one Blender instance spawned by this workspace may run at a time. One writer per instance; parallel read-only inspection is allowed.
- Never launch `blender.exe` directly. Use `.\tools\start-blender.cmd "Blender\<Project>"`; it opens a log terminal and writes to the project's ignored `logs/` folder.

## Session and goal

- For Blender project work, read `.kilo/skills/blender-project-goal/SKILL.md`. Resume an existing goal before production work. If none exists, finish requirements, workflow, and scaffolding in ordinary chat first, then start the production goal. Goal tools end the current turn: after a successful start or resume, give a short response and continue when the goal resumes.
- Requirements confirmation, workflow selection, review-mode selection, and scaffolding are ordinary-chat steps that must precede the goal. Kilo removes `question` while a goal is active, so never start a goal to ask questions or run discovery.
- Before production changes, write `Blender/<Project>/Documents/Goals/NN-<slug>.md` and call `goal(action="start", objective=<the full filled prompt text>)`. The objective is the whole prompt, not the raw request. Resume an existing goal instead of duplicating it.
- During an active goal, `question` is unavailable in both autonomy modes. Before any required question, ask the user to run `/goal pause`, then ask and wait for answers. Resume only authorized work; Pause, cancellation, and pending manual edits leave the goal paused. If answers change scope, update the records and have the user replace the objective with `/goal <objective>`.
- Pure read-only questions and workspace maintenance (rules, skills, agents, config, templates, tooling, and their tests) do not require a Blender goal, project requirements, workflow selection, or a review render. Do not launch or modify Blender during maintenance unless separately requested.
- This is a design workspace: do not create `PLAN/`, plan-check, or verifier records. Tooling tests are allowed under `tools/`.

## Requirements and workflow

- Before scaffolding or any Blender work on a new project, read `.kilo/skills/blender-project-requirements/SKILL.md` and obtain explicit requirements confirmation. Select workflow and review modes, then scaffold and persist all three records with the user's actual responses. Do not launch Blender before these records are complete.
- During requirements, use web search when the domain, a term, a standard, a reference, or the user's request is ambiguous or open-ended. Combine research with user feedback, cite sources, and get explicit confirmation before turning findings into requirements.
- Requirements may be added or changed at any time only after explicit user confirmation; update `Documents/REQUIREMENTS.md` and its change log, then update the goal and docs.
- On every new project and every later return to a paused Blender project, read `.kilo/skills/blender-project-workflow/SKILL.md` and confirm the mode via `question`: Fully Autonomous or Partially Autonomous. Store it in `Documents/WORKFLOW.md`; the user may switch at any time. Ask before start/resume, never inside an active goal. Routine approval pauses within the same task do not require mode reselection.
- On every new project and every later return to a paused Blender project, read `.kilo/skills/blender-project-grading/SKILL.md` and ask the review mode via `question`: `Off`, `All`, or `Single`. Record it in `Documents/REVIEW.md`; `Unset` is invalid once production starts. Ask before start/resume. Routine approval pauses within the same task do not require mode reselection.
- In Partially Autonomous mode, after every meaningful change or addition, save, inspect with `look`, summarize and recommend, then ask approval via `question` before continuing. Pause the goal first, then ask, then resume. If the user wants to modify manually, prepare the scene and wait for them to finish; inspect and confirm afterward.
- Never record a confirmation, directive, or approval that the user did not give. If a question cannot be asked, pause or stop instead of self-authorizing.

## Reviews

- The controller's `look` inspection is mandatory. Independent graders supplement it; they never replace it and never make acceptance or design decisions.
- Run graders only when review mode is `All` or `Single` and `blender_subagents.graders.enabled` is true. `Off` means controller self-review only. If `All` or `Single` is selected but config is missing or disabled, stop production and resolve the mismatch; never silently skip required grading.
- In `All`/`Single`, grade every meaningful saved visual state. In Partially Autonomous mode, finish grading before asking approval or revision direction. Read reports and record every finding's disposition in `Documents/Reviews/<round>/REVIEW.md`. Prioritize blockers; grader-requested fixes still follow workflow approval gates before another meaningful change.
- Graders are read-only. They may write only their own `Documents/Reviews/<round>/<grader>/REPORT.md`. Only `_evidence/` and `tmp/` inside review rounds are gitignored.
- Dispatch graders in batches bounded by `max_parallel`, using the configured model, provider, variant, and budget per grader only when runtime override rules permit. Resume the same grader session with its `task_id` for a re-review when model and focus remain unchanged.
- Bounds are mandatory: one pass per grader per round, `max_rounds` 1-3, and per-grader time/step limits. Two rounds without improvement on the same finding escalate to the user.
- Commit each review round's `REVIEW.md`, `manifest.json`, reports, and index entry atomically. Never leave a completed round uncommitted.

## Subagents

- The current session is the controller. It owns requirements, design, scope, acceptance, user communication, and commits. Read `.kilo/skills/blender-subagents/SKILL.md` before delegating.
- Before production delegation, read and validate the gitignored `config.json` under `blender_subagents.workers` or `blender_subagents.graders` for the required providers, models, variants, and budgets. If missing, copy `config.example.json` without overwriting local settings and stop delegation until the user confirms it. Never guess or substitute a model; runtime tool restrictions still apply. Maintenance tasks may use `general`, or read-only `explore`, under bounded scopes without this roster; they must not access Blender or commit.
- Spawn `blender-worker` with `task`; do not create Agent Manager sessions. Allow one Blender writer at a time. Graders are read-only and may run in parallel when configured.
- Each task is one specific outcome with allowed objects/paths, acceptance checks, budget, stop conditions, and output contract. The worker never makes design decisions; it returns `BLOCKED` with options when one is needed.
- A worker must stop before starting more work at the configured time/step budget, configured failure limit (at most two), repeated API error, or scope/design/asset ambiguity. `steps` caps tool-call rounds; it does not interrupt running calls or enforce a wall-clock timeout. The controller independently inspects with `look`, decides, and obtains workflow approval when required.

## Working

- Save the authoritative `.blend` after every meaningful scene change and before risky work or handoff. Review git changes at each major milestone. Commit atomically and continuously: one logical, verified change per commit, staging only intended files after inspecting status, diff, and recent history. Commits are mandatory; never defer completed work into an end-of-task mega-commit.
- Visual verification is mandatory. After every scene, material, lighting, or camera change, inspect the result with `look`; code output alone is not proof. Do not report done until you have seen it.
- Keep `README.md`, `Documents/REQUIREMENTS.md`, `Documents/WORKFLOW.md`, `Documents/REVIEW.md`, `Documents/ASSETS.md`, and `Documents/DECISIONS.md` current.
- For Blender or library APIs, check Context7 and official docs first. If docs are missing, version-mismatched, or unclear, web-search official docs, source, and community reports; verify against the live Blender version with a minimal test. Never invent API behavior.
- Use relative paths from the `.blend` (`//assets/...`). Before committing or delivering a `.blend`, check embedded and packed third-party data too; ignored source binaries do not prevent them from being embedded in a tracked scene.
- Keep logs, backups, caches, WIP renders, and non-redistributable assets out of commits.

## Launch

- Verify with `blender_get_addon_status` and `blender_get_scene_info(fields=["settings"])` before editing. Stop on a connection, addon, or file mismatch. For a new unsaved scene, save it to the declared project `.blend` first, then verify that path before production edits.
- Never use `--background` or `--factory-startup`. Close the current Blender before switching projects.

## Skills

Read the matching `.kilo/skills/<skill>/SKILL.md` before planning or touching any Blender file or scene. Do not skip this because the task looks simple. The `skill` tool may not list workspace-local skills; if it does not, read the file directly.

| Skill | Load it for |
|---|---|
| `blender-project-goal` | Blender project goals, bootstrap order, start/resume lifecycle; excludes maintenance and read-only questions. |
| `blender-subagents` | Controller delegation to bounded Blender workers and graders, model config, time limits, and stop conditions. |
| `blender-project-grading` | Review modes, grader config, evidence capture, round folders, aggregation, and re-review. |
| `blender-project-requirements` | New-project requirements discussion, confirmation, and requirement changes. |
| `blender-project-workflow` | Autonomy mode selection, resume checks, and partial-mode approval gates. |
| `blender-project-scaffold` | Project structure and creating a new project under `Blender/`. |
| `blender-project-readme` | Creating or updating a project README. |
| `blender-assets` | Adding, importing, linking, packing, licensing, or delivering assets. |
| `blender-mcp` | Operating Blender through MCP: scene inspection, modeling, materials, rendering. |

## Done

For Blender production work, a goal is not complete until its acceptance checks pass, the scene is
saved, a review render exists and was inspected with `look`, requirements, workflow, and review mode
are current, all required grading has a final applicable `PASS` (or controller self-review is recorded
when mode is `Off`), no genuine blocker or major remains unresolved, docs are current, and the goal
prompt is recorded.

For workspace maintenance, run the relevant format, tooling, and diff checks. Report runtime checks
that could not run; do not invent scene verification or require a Blender project to review tooling.
