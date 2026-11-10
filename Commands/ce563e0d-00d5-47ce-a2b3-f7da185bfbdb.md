# Shell Command ce563e0d-00d5-47ce-a2b3-f7da185bfbdb

- Status: approved
- Scope: workspace
- Session: ses_e3915c853ffexxvThielRgM2HX
- Created: 2026-11-10T19:30:41.849Z
- Approved: 2026-11-10T19:30:48.646Z
- CWD: D:\Projects\_Templates\Blender

## Command

```powershell
$s = Get-Content -Raw -LiteralPath "C:\Users\Punal Manalan\.local\state\blender-workflow-harness\427a4ffb5740732cf70614ca69d92d8fe531f1ef8e39be6e08c6a87e6988454c\state.json" | ConvertFrom-Json; ($s.projects.PSObject.Properties.Name -join "; ")
```

## Reasoning

Read-only listing of registered project names to avoid another stale registration collision.
