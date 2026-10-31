# AGENTS.md — Blender Project Collection

These rules are mandatory within their stated scope. Treat `must`, `required`, and `stop` literally. Do not bypass an unmet gate. Examples and reference values are not project requirements; confirmed user instructions control design and scope.

## Workspace

- Projects live under `Blender/<ProjectName>/`. Scaffold with `.\tools\new-blender-project.cmd`; do not invent another layout.
- Keep shared tooling in `tools/`; do not add scripts or project files at the workspace root.
- `.kilo/kilo.jsonc` owns the single MCP port. Do not create per-project Kilo configs.
- Only one Blender instance spawned by this workspace may run at a time. One writer per instance; parallel read-only inspection is allowed.
- Never launch `blender.exe` directly. Use `.\tools\start-blender.cmd "Blender\<Project>"`; it opens a log terminal and writes to the project's ignored `logs/` folder.
- Workflow state lives outside the repository at `~/.local/state/blender-workflow-harness/<workspace-hash>` and is not editable through an agent. The harness is a same-user guard, not an OS sandbox; manual Blender or external-shell edits invalidate captured evidence, and unrestricted same-user execution can bypass these controls.

## Session and goal

- For Blender project work, read `.kilo/skills/blender-project-goal/SKILL.md`. Resume an existing goal before production work. If none exists, finish requirements, workflow, and scaffolding in ordinary chat first, then start the production goal. Goal tools end the current turn: after a successful start or resume, give a short response and continue when the goal resumes.
- Requirements confirmation, workflow selection, review-mode selection, and scaffolding are ordinary-chat steps that must precede the goal. Kilo removes `question` while a goal is active, so never start a goal to ask questions or run discovery.
- Before production changes, write `Blender/<Project>/Documents/Goals/NN-<slug>.md` and call `goal(action="start", objective=<the full filled prompt text>)`. The objective is the whole prompt, not the raw request. Resume an existing goal instead of duplicating it.
- The orchestrator owns goal creation, required-input handoffs, objective changes, and resume through supported tools. Users provide requirements, decisions, and approvals in ordinary chat; never ask them to run goal commands. During an active goal, `question` is unavailable in both autonomy modes; follow `blender-project-goal` for a blocked-input handoff and subsequent runtime questions before orchestrator-owned resume. If already stopped or paused, do not repeat the stop procedure. Pause, cancellation, and pending manual edits never authorize continuation.
- Pure read-only questions and workspace maintenance (rules, skills, agents, config, templates, tooling, and their tests) do not require a Blender goal, project requirements, workflow selection, or a review render. Do not launch or modify Blender during maintenance unless separately requested.
- This is a design workspace: do not create `PLAN/`, plan-check, or verifier records. Tooling tests are allowed under `tools/`.

## Requirements and workflow

- Before scaffolding or any Blender work on a new project, read `.kilo/skills/blender-project-requirements/SKILL.md` and obtain explicit requirements confirmation. Select workflow and review modes, then scaffold and persist all three records with the user's actual responses. Do not launch Blender before these records are complete.
- During requirements, use web search when the domain, a term, a standard, a reference, or the user's request is ambiguous or open-ended. Combine research with user feedback, cite sources, and get explicit confirmation before turning findings into requirements.
- Requirements may be added or changed at any time only after explicit user confirmation; update `Documents/REQUIREMENTS.md` and its change log, then update the goal and docs.
- On every new project and every later return to a paused Blender project, read `.kilo/skills/blender-project-workflow/SKILL.md` and confirm the mode via `question`: Fully Autonomous or Partially Autonomous. Store it in `Documents/WORKFLOW.md`; the user may switch at any time. Ask before start/resume, never inside an active goal. Routine approval pauses within the same task do not require mode reselection.
- On every new project and every later return to a paused Blender project, read `.kilo/skills/blender-project-grading/SKILL.md` and ask the review mode via `question`: `Off`, `All`, or `Single`. Record it in `Documents/REVIEW.md`; `Unset` is invalid once production starts. Ask before start/resume. Routine approval pauses within the same task do not require mode reselection.
- In Partially Autonomous mode, after every meaningful change or addition, save, inspect with `look`, summarize and recommend, then obtain approval via `question` before continuing. Follow the orchestrator-owned input handoff in `blender-project-goal`; the orchestrator resumes only after required answers. If the user wants to modify manually, wait for them to finish; inspect and confirm afterward.
- Never record a confirmation, directive, or approval that the user did not give. If a question cannot be asked, pause or stop instead of self-authorizing.

## Workflow harness

- Production orchestrator uses custom tool `blender_workflow` with `{action: string, payload: JSON string}`. `prepare` accepts only `{project:"Blender/Name",goal:"Documents/Goals/NN-slug.md",scene:"name.blend"}` and requires scaffold documents committed first. It returns the exact registration question, labels, and details. Pass that question and labels unchanged to `question` with `custom:false` and `multiple:false`; genuine runtime answers grant registration. Never create approved JSON or self-confirm registration.
- Bootstrap write window: before registration, the write gate permits only scaffold documentation for the new project under `Blender/<Name>/` — `README.md`, `Documents/README.md`, `Documents/REQUIREMENTS.md`, `Documents/WORKFLOW.md`, `Documents/REVIEW.md`, `Documents/ASSETS.md`, `Documents/DECISIONS.md`, `Documents/Goals/<NN>-<slug>.md`, and the document `README.md` indexes. Scene, asset, render, evidence, and manifest paths stay blocked, and documents of an already-registered project stay blocked. Complete and commit those files, then run `prepare` and finish registration. Never bypass a denial with shell redirection, temp-file copies, or direct edits; a denial means a lifecycle step is missing.
- After registration and an active goal, use `begin` with `{outcome,objects:[exact names],paths:[exact project-relative files],revision?:bool}`. Keep one bounded logical change open, at most 40 operations and 15 minutes. Recovery `save` and `seal` remain allowed after the apply budget.
- Issue `ticket` with `{operation:"apply"|"save"|"seal",payload:<operation JSON for apply or {} for save/seal>}`. Pass returned `token` to server tool `blender_harness_execute` (`harness_execute`) with `{token,operation,payload,user_prompt:<verbatim user goal>}`. Supported operations only: `create_mesh` (`cube`, `uv_sphere`, `plane`, `cylinder`), `transform`, `material`, `create_light`, `create_camera`, `set_camera`, `render_settings`, `delete_object`. Unsupported operations stop work until tooling is reviewed and extended. Raw `execute_blender_code`, `import_asset`, and `generate_3d` calls are blocked; no arbitrary Python loophole.
- `seal` saves the authoritative scene, captures immutable review evidence, final PNG render, and manifest. Then call mandatory `blender_look(image=<returned absolute render path>)`; the hook records successful inspection.
- `Off` uses `self-review` with `{notes}`. `All` or `Single` uses `grader-ticket` with `{name}`; pass its unique token, exact report path, and `HARNESS_GRADER:<token>` marker to the normal `blender-grader` task. The plugin binds the actual child by parent/task token and runtime model metadata. Grader writes only its assigned report and never reads peer reports. `review` validates all report receipts plus aggregate `REVIEW.md` hash, verdict, and finding dispositions.
- Partially Autonomous mode requires the goal stopped before `approval`; follow `blender-project-goal`, without delegating goal controls to the user. Use the exact returned question and labels `Approve change`, `Request revision`, `Pause`; only the actual runtime answer counts. Forged approval JSON is ignored.
- Before each next `begin`, inspect status, `git diff`, and recent log; stage only scoped paths; commit one exact scoped change; run `checkpoint`. Checkpoint verifies exactly one scoped commit, clean project state, and hash match. Failed rounds commit their review artifacts before fixes. `revision:true` stays within the configured `max_rounds` cap; exhausting the cap needs explicit user escalation and re-registration handling. Never silently override the cap.
- After a capped review, call `escalate` with a bounded reason, then complete the exact registration question again. Escalation preserves prior history and does not silently reset review state.
- `status` is the recovery entry point after compaction or restart. Goal completion hook blocks until a clean checkpoint and final applicable `PASS` with inspected render exist.

## Reviews

- The orchestrator's `look` inspection is mandatory. Independent graders supplement it; they never replace it and never make acceptance or design decisions.
- Run graders only when review mode is `All` or `Single` and `blender_subagents.graders.enabled` is true. `Off` means orchestrator self-review only. If `All` or `Single` is selected but config is missing or disabled, stop production and resolve the mismatch; never silently skip required grading.
- In `All`/`Single`, grade every meaningful saved visual state. In Partially Autonomous mode, finish grading before asking approval or revision direction. Read reports and record every finding's disposition in `Documents/Reviews/<round>/REVIEW.md`. Prioritize blockers; grader-requested fixes still follow workflow approval gates before another meaningful change.
- Graders are read-only. Runtime assignment permits each grader to write only its exact
  `Documents/Reviews/<round>/<grader>/REPORT.md`; peer reports are forbidden. Only `_evidence/` and
  `tmp/` inside review rounds are gitignored.
- Dispatch graders in batches bounded by `max_parallel`, using the configured model, provider, variant, and budget per grader only when runtime override rules permit. Resume the same grader session with its `task_id` for a re-review when model and focus remain unchanged.
- Bounds are mandatory: one pass per grader per round, configured `max_rounds` 1-3, and per-grader time/step limits. Runtime enforces the configured `max_rounds`; exhausting it without improvement on the same finding requires user escalation and re-registration handling.
- Commit each review round's `REVIEW.md`, `manifest.json`, reports, and index entry atomically. Never leave a completed round uncommitted.

## Subagents

- The current session is the orchestrator. It owns requirements, design, scope, acceptance, user communication, harness operations, and commits. Read `.kilo/skills/blender-subagents/SKILL.md` before delegating.
- Before production delegation, read and validate the gitignored `config.json` under `blender_subagents.workers` or `blender_subagents.graders` for the required providers, models, variants, and budgets. If missing, copy `config.example.json` without overwriting local settings and stop delegation until the user confirms it. Never guess or substitute a model; runtime tool restrictions still apply. Maintenance tasks may use `general`, or read-only `explore`, under bounded scopes without this roster; they must not access Blender or commit.
- Spawn `blender-worker` with `task`; do not create Agent Manager sessions. Current workers inspect only: raw execution, `blender_workflow`, and `blender_harness_execute` are denied. Delegated writes require an explicit assignment and reviewed harness support, not broader permissions alone. Allow one Blender writer at a time. Graders are read-only and may run in parallel when configured.
- Each task is one specific outcome with allowed objects/paths, acceptance checks, budget, stop conditions, and output contract. The worker never makes design decisions; it returns `BLOCKED` with options when one is needed.
- A worker must stop before starting more work at the configured time/step budget, configured failure limit (at most two), repeated API error, or scope/design/asset ambiguity. `steps` caps tool-call rounds; it does not interrupt running calls or enforce a wall-clock timeout. The orchestrator independently inspects with `look`, decides, and obtains workflow approval when required.

## Working

- Save the authoritative `.blend` through ticketed `save` after every meaningful scene change and before risky work or handoff. Seal and review each bounded change, obtain required approval, then inspect status, diff, and recent history. Commit atomically and continuously: one exact scoped change per commit, followed by `checkpoint` before the next `begin`. Failed review artifacts commit before fixes; never defer work into an end-of-task mega-commit.
- Visual verification is mandatory. After every scene, material, lighting, or camera change, inspect the result with `look`; code output alone is not proof. Do not report done until you have seen it.
- Keep `README.md`, `Documents/REQUIREMENTS.md`, `Documents/WORKFLOW.md`, `Documents/REVIEW.md`, `Documents/ASSETS.md`, and `Documents/DECISIONS.md` current.
- For Blender or library APIs, check Context7 and official docs first. If docs are missing, version-mismatched, or unclear, web-search official docs, source, and community reports; verify against the live Blender version with a minimal test. Never invent API behavior.
- Use relative paths from the `.blend` (`//assets/...`). Before committing or delivering a `.blend`, check embedded and packed third-party data too; ignored source binaries do not prevent them from being embedded in a tracked scene.
- Keep logs, backups, caches, WIP renders, and non-redistributable assets out of commits.

## Launch

- Before launch, commit completed scaffold documents and goal, finish `prepare` registration in ordinary chat, start/resume the registered goal, and inspect harness `status`. Verify with `blender_get_addon_status` and `blender_get_scene_info(fields=["settings"])` before editing. Stop on a connection, addon, or file mismatch. For a new unsaved scene, open a bounded `begin`, use ticketed `save` to the declared project `.blend`, then verify that path before production edits.
- Never use `--background` or `--factory-startup`. Close the current Blender before switching projects.

## Skills

Read the matching `.kilo/skills/<skill>/SKILL.md` before planning or touching any Blender file or scene. Do not skip this because the task looks simple. The `skill` tool may not list workspace-local skills; if it does not, read the file directly.

| Skill | Load it for |
|---|---|
| `blender-project-goal` | Blender project goals, bootstrap order, start/resume lifecycle; excludes maintenance and read-only questions. |
| `blender-subagents` | Orchestrator delegation to bounded Blender workers and graders, model config, time limits, and stop conditions. |
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
are current, all required grading has a final applicable `PASS` (or orchestrator self-review is recorded
when mode is `Off`), no genuine blocker or major remains unresolved, docs are current, and the goal
prompt is recorded. The completion hook also requires a clean `checkpoint`, final applicable `PASS`,
and the sealed render's successful `blender_look` receipt.

For workspace maintenance, run the relevant format, tooling, and diff checks. Report runtime checks
that could not run; do not invent scene verification or require a Blender project to review tooling.
