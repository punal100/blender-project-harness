---
name: blender-subagents
description: Use when the orchestrator session delegates Blender work to bounded subagents. Defines the worker and grader model configs, one-task scope, time and step limits, design authority, and stop conditions.
---

# Blender Subagents

The current session is the orchestrator. It owns requirements, design, scope, acceptance, user
communication, and commits. A `blender-worker` subagent executes one specific task and returns.

Current harness operations are orchestrator-only under `AGENTS.md`. Workers perform read-only
inspection; `blender_execute_blender_code`, `blender_workflow`, and `blender_harness_execute` stay
denied. Delegated writes require explicit assignment plus reviewed tooling and narrowly scoped
permissions, not an ad hoc allow rule. Unsupported work returns `BLOCKED`; no arbitrary Python fallback.

Use `task` with `subagent_type="blender-worker"`. Do not create Agent Manager sessions or
worktrees for this work.

## Config

Read `config.json` at the workspace root before spawning. It is gitignored;
`config.example.json` is the tracked template. Both roles live under `blender_subagents`;
read worker settings from `blender_subagents.workers`:

```json
{
  "blender_subagents": {
    "workers": {
      "agent": "blender-worker",
      "provider": "provider-id",
      "model": "model-name",
      "variant": "reasoning-variant",
      "max_minutes": 10,
      "max_steps": 18,
      "max_failed_attempts": 2,
      "max_parallel": 1
    }
  }
}
```

- If `config.json` is missing, copy `config.example.json` without overwriting any local settings and
  stop delegation until the user confirms the values. Orchestrator work may continue without delegation.
- The examples show separate role sections of the same object. An absent `workers` section means
  worker delegation is unconfigured; do not infer defaults or borrow grader settings. Reject legacy
  flat or mixed layouts before delegation. When migrating an older local config, move its existing
  worker fields into `blender_subagents.workers` and its former top-level grader section into
  `blender_subagents.graders`, preserving values and leaving absent roles unconfigured.
- Validate `agent` is exactly `blender-worker`; provider, model, and variant must be non-empty
  strings. Limits must be positive integers; `max_parallel` must be `1` and
  `max_failed_attempts` must be `1` or `2`. Reject invalid values; do not silently rewrite them.
- Resolve the configured model, provider, and variant with `agent_manager_models` before use.
  A configured model is not permission to override tool-level model restrictions. Pass overrides
  only when the user explicitly requested them; otherwise use supported inheritance or keep work
  in the orchestrator. Never silently substitute a different model or worker.
- `max_steps` must not exceed the `steps` ceiling in `.kilo/agent/blender-worker.md`. Reject an
  oversized budget before spawning. Count steps as agentic tool-call rounds, including research,
  inspection, retries, saves, and verification, not as individual calls inside a parallel round.
- The agent `steps` ceiling forces a text-only response; it cannot interrupt a running tool or
  enforce `max_minutes`. The worker must check elapsed time before each new round, reserve time for
  saving/reporting, and report overruns. Do not describe this as an automatic wall-clock timeout.
- `max_parallel` must be `1` for Blender writes. Only one Blender writer may exist.
- Run the worker in the foreground and wait for it to return. Do not background a Blender writer.
- If `blender-worker` is not listed as a subagent, reload the Kilo window; do not silently
  substitute a general agent. Stop delegation until registration is verified. Static frontmatter
  validation does not prove runtime registration.
- File permissions and harness checks are same-user guards, not an OS sandbox. Never bypass them
  through Blender Python, another MCP, or external shell execution. Manual scene/shell edits invalidate
  captured evidence; agents must not edit external harness state.

## Graders

Independent review uses `blender-grader`, configured at `blender_subagents.graders` alongside workers:

```json
{
  "blender_subagents": {
    "graders": {
      "agent": "blender-grader",
      "enabled": true,
      "max_parallel": 1,
      "max_rounds": 2,
      "graders": [
        {
          "name": "visual",
          "focus": "composition, camera, lighting",
          "provider": "provider-id",
          "model": "model-name",
          "variant": "reasoning-variant",
          "max_minutes": 5,
          "max_steps": 10
        }
      ]
    }
  }
}
```

- Load `blender-project-grading` for modes, evidence, round folders, aggregation, and re-review.
- `blender_subagents.graders.enabled` is the machine kill switch; project `Documents/REVIEW.md` selects `Off`,
  `All`, or `Single`. Grade only when both allow it.
- Validate the array: unique slugs, non-empty focus, non-empty provider/model/variant, positive
  integer limits, `max_steps` at or below the grader agent's `steps`, `max_parallel` at most the
  grader count, `max_rounds` 1-3. Never drop a grader or substitute a model silently.
- Resolve each grader's model, provider, and variant with `agent_manager_models` before dispatch.
- Per-task model, provider, and variant overrides require the user's explicit request. If absent,
  verify supported inheritance matches the configured roster or stop grading; never silently use
  a different model. Apply this same restriction to resumed tasks.
- Graders are read-only and may run in parallel. Dispatch selected graders in batches no larger than
  `max_parallel`, using multiple `task` calls per batch. Each writes only its own
  `Documents/Reviews/<round>/<grader>/REPORT.md`.
- Retain each runtime-bound `task_id` without rewriting the sealed manifest; resume the same session
  for a re-review when model and focus are unchanged, with a fresh ticket and exact assigned path.
- Orchestrator calls `blender_workflow` `grader-ticket` with `{name}` after sealed-render inspection,
  then includes `HARNESS_GRADER:<token>` and the exact returned report path in the normal grader task.
  Plugin hooks bind the actual child by parent/task token and runtime model metadata, restrict writes
  to that report, and forbid peer report reads. Graders do not need `blender_workflow` permission.
- One pass per grader per round. Stop at the grader's `max_minutes`/`max_steps`, the round cap, or a
  missing spec/evidence. A failed or missing report records `BLOCKED` and permits reissuing
  `grader-ticket` for the same grader before `review`; after aggregation, retry only in a new round.
  Graders never loop or ask the user.
- A single blocker fails the round regardless of other PASS verdicts. The orchestrator, not a vote
  count, records the final verdict and every finding's disposition.

Workspace-maintenance tasks may use `general`, or read-only `explore`, without the Blender worker/grader
roster. Assign bounded, non-overlapping scopes; forbid Blender access and commits. Do not treat this
exception as permission to substitute these agents for production workers or graders.

## Design authority

The orchestrator decides and owns:

- requirements, visual direction, composition, camera, lighting, materials, colour, scale, naming,
  file layout, scope, and acceptance;
- whether a worker result is accepted, revised, or taken over;
- all user questions, workflow approvals, and documentation changes;
- commits and final verification.

In Partially Autonomous mode, each task must contain exactly one meaningful change. The orchestrator
must obtain approval before dispatching the next change; a worker task cannot bypass this gate.
`question` is unavailable during an active goal; the orchestrator follows `blender-project-goal` for
the required-input handoff and subsequent questions/resume. Users provide decisions, not goal commands.
Never self-approve or continue because a question could not be asked.

A worker may:

- inspect the exact assigned scene task with read-only Blender MCP;
- inspect with `get_scene_info` and `look`;
- return exact facts and bounded options to the orchestrator without editing or saving;
- choose only implementation mechanics that do not change the visible result, structure, scope, or
  acceptance.

A worker must not:

- start or resume a goal, spawn subagents, ask the user, or commit;
- edit `AGENTS.md`, skills, config, project `Documents/`, or project `README.md`;
- change requirements, design, acceptance criteria, task scope, or the active goal;
- work outside the assigned objects, collections, files, or paths;
- generate images, video, or 3D models, spend credits, or choose an external asset. The orchestrator
  must select assets and perform authorized generation itself.

If a design or scope decision is needed, the worker stops and returns `BLOCKED` with 2-3 concrete
options. The orchestrator decides and may resume the same worker with its `task_id` for a narrow
correction. Include budget already used and the remaining deadline; resuming must not silently reset
limits. Start a fresh bounded task when the outcome or scope changes.

## Task prompt

Every worker prompt is self-contained and one outcome only:

```text
Task ID:
Project:
Orchestrator goal:
User prompt: verbatim user words for Blender MCP user_prompt
Outcome: one read-only inspection result; current worker harness does not support writes
Allowed: exact objects, collections, files, paths
Authoritative .blend: exact save path, already open and verified
Inputs: project docs and references by path
Preflight: confirmed requirement status, workflow/review modes, orchestrator-validated grader config status
Decisions: exact dimensions, transforms, names, materials, camera, and assets needed for this task
Acceptance: observable checks
Commands / views: exact checks, including `look` views
Budget: {max_minutes} minutes, {max_steps} steps, {max_failed_attempts} failed attempts
Deadline / budget already used: timestamp and cumulative rounds for resumed tasks
Stop if: design decision, scope change, missing asset/licence, unclear acceptance, path outside allowed
Output: DONE|PARTIAL|BLOCKED + evidence, <= 12 lines
```

Do not ask a worker to "make it look good", "finish the scene", or choose a style. Split that into
specific changes or decide it in the orchestrator first.

## Time and stop limits

The worker stops at the first of:

- the configured `max_minutes` budget;
- the configured `max_steps` budget, or the agent `steps` ceiling;
- `max_failed_attempts` at the same step (never more than two);
- the same tool or API error twice;
- a needed design, scope, naming, asset, licence, or acceptance decision;
- a required file or object outside the allowed set;
- a missing input or an acceptance check that cannot be run.

On stop, it leaves the scene unchanged and returns `PARTIAL` or `BLOCKED`. It does
not start another task or continue exploring. The orchestrator decides whether to resume, narrow,
replace the worker, or take over.

## Verification and handoff

The worker returns at most 12 lines:

```text
DONE|PARTIAL|BLOCKED
Task ID:
Changed objects/files:
Checks and results:
Saved scene / review evidence:
Budget used / overrun:
Blockers/options:
Remaining work:
```

The orchestrator independently inspects `blender_get_scene_info`, runs `look`, and checks the working
tree. The orchestrator runs required grading; workers never dispatch graders or interpret the roster.
In Partially Autonomous mode, the orchestrator asks the user for approval after each meaningful
worker task that leads to an orchestrator change; the worker never asks. The orchestrator owns ticketed
save/seal, returned-render `blender_look`, review receipts, and required runtime approval. Inspect
status/diff/log, stage exact paths, commit atomically, and run `checkpoint` before another `begin`.
Failed rounds commit before bounded `revision:true` fixes. Workers never commit or edit harness state.

## Format references

Agent definitions must use Markdown with YAML frontmatter in `.kilo/agent/`. `mode: subagent`,
`hidden: true`, and a positive integer `steps` are required for this worker. Permission maps are
ordered: broad defaults first, exceptions after, and protected-path denials last.

- [Custom subagents](https://kilo.ai/docs/customize/custom-subagents)
- [Agent permissions](https://kilo.ai/docs/customize/agent-permissions)
- [Agent Skills specification](https://agentskills.io/specification)
