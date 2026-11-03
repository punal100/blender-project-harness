# Scripts — {{PROJECT_NAME}}

Project-specific Blender Python source may live here. It is source-only: the harness never executes
it. Use relative paths from the project root or the `.blend` file and never hardcode machine-specific
paths.

Use `blender_workflow {action:"intake"}` with `kind:"script"` to copy `.py`/`.pyw` source here. The
harness accepts these files only under `scripts/` and records them in `Documents/INTAKE.md`.

Workspace automation scripts are a separate category. They may run only through the existing shell
command approval path, with the exact command, working directory, script SHA-256, reason, approval,
and outcome recorded. They are not a sandbox.

Any Blender Python execution requires a separately reviewed OS/VM isolation design. Do not use raw
Python, `--python`, `exec()`, or a hidden runner. Document each script's purpose and any approved
future invocation in this README.
