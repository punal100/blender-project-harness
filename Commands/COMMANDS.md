# Shell Command Approvals

| Command | Approved | Shell command | Reasoning |
|---|---|---|---|
| [6580a3dd-b3a1-4513-b465-563e0519c376](6580a3dd-b3a1-4513-b465-563e0519c376.md) | 2026-11-10T04:05:08.504Z | Get-Command kilo -ErrorAction SilentlyContinue \| Format-List *; Write-Output "---WHERE---"; where.exe kilo 2>&1; Write-Output "---OPENCODE---"; Get-Command ope | Read-only discovery of installed Kilo CLI executables and their paths; no files are written or changed. |
| [24f1acb8-55ba-42a3-b875-00abd3292263](24f1acb8-55ba-42a3-b875-00abd3292263.md) | 2026-11-10T04:05:28.703Z | npm ls -g --depth=0 2>&1 | Read-only listing of globally installed npm packages to identify a Kilo CLI package; writes nothing. |
