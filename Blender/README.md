# Blender Projects

Each subfolder is one project with its own README, Documents, Goals, assets, renders, exports,
scenes, scripts, ignored logs, and backups.

Do not put a Blender project at the workspace root.

## Create

Confirm requirements and collect workflow and review answers before scaffolding. Then run:

```powershell
node .kilo/blender-project-harness/tools/harness/cli.mjs scaffold --name "ProjectName" --description "What it is" --goal "First design request"
```

Fill the records through the harness `bootstrap-document` action, commit the exact scaffold through
`bootstrap-commit`, call `prepare`, answer its registration question, start the goal, then launch.

## Open

Only one Blender instance spawned by this workspace may run. Use the harness, never the shell:

```json
{"action":"launch"}
```

Stop with `{"action":"stop"}`. The harness reads the single MCP port from `.kilo/kilo.jsonc`, writes
the run log under the project's ignored `logs/`, and rejects conflicting instances.

The harness is the only supported launcher. Do not invoke Blender or legacy scripts directly.
