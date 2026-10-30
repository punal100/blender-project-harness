@echo off
setlocal
pushd "%~dp0"
where pwsh.exe >nul 2>nul
if errorlevel 1 goto use_windows_powershell

pwsh.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0new-blender-project.ps1" %*
goto done

:use_windows_powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0new-blender-project.ps1" %*

:done
exit /b %errorlevel%
