@echo off
setlocal EnableExtensions DisableDelayedExpansion
set "TOOLS=%~dp0"
where pwsh.exe >nul 2>nul
if errorlevel 1 goto use_windows_powershell

pwsh.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%TOOLS%new-blender-project.ps1" %*
goto done

:use_windows_powershell
where powershell.exe >nul 2>nul
if errorlevel 1 goto missing_powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%TOOLS%new-blender-project.ps1" %*
goto done

:missing_powershell
echo PowerShell is required to scaffold Blender projects.
exit /b 1

:done
exit /b %errorlevel%
