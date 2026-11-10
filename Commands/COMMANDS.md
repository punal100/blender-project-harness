# Shell Command Approvals

| Command | Approved | Shell command | Reasoning |
|---|---|---|---|
| [6580a3dd-b3a1-4513-b465-563e0519c376](6580a3dd-b3a1-4513-b465-563e0519c376.md) | 2026-11-10T04:05:08.504Z | Get-Command kilo -ErrorAction SilentlyContinue \| Format-List *; Write-Output "---WHERE---"; where.exe kilo 2>&1; Write-Output "---OPENCODE---"; Get-Command ope | Read-only discovery of installed Kilo CLI executables and their paths; no files are written or changed. |
