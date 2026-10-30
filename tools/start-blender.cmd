@echo off
setlocal EnableExtensions DisableDelayedExpansion
set "TOOLS=%~dp0"

if /i "%~1"=="--batch" goto unsupported_batch
if defined KILO_BLENDER_FORCE_CMD goto unsupported_batch

where pwsh.exe >nul 2>nul
if not errorlevel 1 goto use_pwsh
where powershell.exe >nul 2>nul
if not errorlevel 1 goto use_windows_powershell

echo PowerShell is required for validated Blender launch. Install PowerShell 7 or enable Windows PowerShell.
exit /b 1

:use_pwsh
pwsh.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%TOOLS%start-blender.ps1" %*
exit /b %errorlevel%

:use_windows_powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%TOOLS%start-blender.ps1" %*
exit /b %errorlevel%

:unsupported_batch
echo Pure batch launch is unsupported because it bypasses project and instance validation. Omit --batch and KILO_BLENDER_FORCE_CMD.
exit /b 1
