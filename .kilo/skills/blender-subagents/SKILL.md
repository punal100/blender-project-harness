---
name: blender-subagents
description: Use when the controller session delegates Blender work to bounded subagents. Defines the worker model config, one-task scope, time and step limits, design authority, and stop conditions.
---

# Blender Subagents

The current session is the controller. It owns requirements, design, scope, acceptance, user
communication, and commits. A `blender-worker` subagent executes one specific task and returns.

Use `task` with `subagent_type="blender-worker"`. Do not create Agent Manager sessions or
worktrees for this work.

## Config

Read `config.json` at the workspace root before spawning. It is gitignored;
`config.example.json` is the tracked template.

```json
{
  "blender_subagents": {
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
```

- If `config.json` is missing, copy `config.example.json` and stop; do not guess a model.
- Resolve uncertain model, provider, or variant names with `agent_manager_models`.
- Pass the exact `model`, `provider`, and `variant` to `task`. Never silently downgrade.
- `max_steps` must not exceed the `steps` ceiling in `.kilo/agent/blender-worker.md`; lower it if
  configured. The agent `steps` value is the hard automatic stop. Treat `max_minutes` as the
  wall-clock budget checked before each new step.
- `max_parallel` must be `1` for Blender writes. Only one Blender writer may exist.
- Run the worker in the foreground and wait for it to return. Do not background a Blender writer.
- If `blender-worker` is not listed as a subagent, reload the Kilo window; do not silently
  substitute a general agent.

## Design authority

The controller decides and owns:

- requirements, visual direction, composition, camera, lighting, materials, colour, scale, naming,
  file layout, scope, and acceptance;
- whether a worker result is accepted, revised, or taken over;
- all user questions, workflow approvals, and documentation changes;
- commits and final verification.

A worker may:

- implement the exact assigned task with Blender MCP;
- inspect with `get_scene_info` and `look`;
- save the `.blend` when the task changed the scene;
- choose only implementation mechanics that do not change the visible result, structure, scope, or
  acceptance.

A worker must not:

- start or resume a goal, spawn subagents, ask the user, or commit;
- edit `AGENTS.md`, skills, config, project `Documents/`, or project `README.md`;
- change requirements, design, acceptance criteria, task scope, or the active goal;
- work outside the assigned objects, collections, files, or paths;
- spend generation credits or choose an external asset without a controller decision.

If a design or scope decision is needed, the worker stops and returns `BLOCKED` with 2-3 concrete
options. The controller decides and may resume the same worker with its `task_id` for a narrow
correction; start a fresh worker when the task or scope changes.

## Task prompt

Every worker prompt is self-contained and one outcome only:

```text
Task ID:
Project:
Controller goal:
Outcome: one visible or technical result
Allowed: exact objects, collections, files, paths
Inputs: project docs and references by path
Acceptance: observable checks
Commands / views: exact checks, including `look` views
Budget: {max_minutes} minutes, {max_steps} steps, {max_failed_attempts} failed attempts
Stop if: design decision, scope change, missing asset/licence, unclear acceptance, path outside allowed
Output: DONE|PARTIAL|BLOCKED + evidence, <= 12 lines
```

Do not ask a worker to "make it look good", "finish the scene", or choose a style. Split that into
specific changes or decide it in the controller first.

## Time and stop limits

The worker stops at the first of:

- the configured `max_minutes` budget;
- the configured `max_steps` budget, or the agent `steps` ceiling;
- two failed attempts at the same step;
- the same tool or API error twice;
- a needed design, scope, naming, asset, licence, or acceptance decision;
- a required file or object outside the allowed set;
- a missing input or an acceptance check that cannot be run.

On stop, it saves if safe, leaves the scene consistent, and returns `PARTIAL` or `BLOCKED`. It does
not start another task or continue exploring. The controller decides whether to resume, narrow,
replace the worker, or take over.

## Verification and handoff

The worker returns at most 12 lines:

```text
DONE|PARTIAL|BLOCKED
Task ID:
Changed objects/files:
Checks and results:
Blockers/options:
Remaining work:
```

The controller independently inspects `blender_get_scene_info`, runs `look`, and checks the working
tree. In Partially Autonomous mode, the controller asks the user for approval after each meaningful
worker task; the worker never asks. The controller updates the documents and commits only after
acceptance.
