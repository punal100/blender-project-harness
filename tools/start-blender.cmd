@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "TOOLS=%~dp0"
pushd "%TOOLS%.."

if /i "%~1"=="--batch" (
    shift
    goto batch_fallback
)
if defined KILO_BLENDER_FORCE_CMD goto batch_fallback

where pwsh.exe >nul 2>nul
if not errorlevel 1 (
    pwsh.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%TOOLS%start-blender.ps1" %*
    exit /b %errorlevel%
)

where powershell.exe >nul 2>nul
if not errorlevel 1 (
    powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%TOOLS%start-blender.ps1" %*
    exit /b %errorlevel%
)

echo PowerShell is unavailable. Using the basic batch launcher.

:batch_fallback
set "ROOT=%CD%\"
set "PROJECT=%~1"
if "%PROJECT%"=="" (
    echo Usage: .\tools\start-blender.cmd Blender\ProjectName
    exit /b 1
)

if not exist "%PROJECT%\" (
    echo Project folder not found: %PROJECT%
    exit /b 1
)

for %%I in ("%PROJECT%") do set "PROJECTFULL=%%~fI"
set "PREFIX=%ROOT%Blender\"
set "REL=!PROJECTFULL:%PREFIX%=!"
if /i "!REL!"=="!PROJECTFULL!" (
    echo Blender projects must live under %ROOT%Blender.
    exit /b 1
)
set "PROJECT=!PROJECTFULL!"

set "BLENDFILE=%~2"
if not "%BLENDFILE%"=="" (
    if not exist "%BLENDFILE%" if exist "%PROJECT%\%BLENDFILE%" set "BLENDFILE=%PROJECT%\%BLENDFILE%"
    if not exist "%BLENDFILE%" (
        echo Blend file not found: %BLENDFILE%
        exit /b 1
    )
) else (
    for %%F in ("%PROJECT%\*.blend") do (
        if exist "%%~fF" (
            if defined BLENDFILE (
                echo Multiple .blend files in %PROJECT%. Pass the .blend path as the second argument.
                exit /b 1
            )
            set "BLENDFILE=%%~fF"
        )
    )
)

set "PORT="
if exist "%ROOT%\.kilo\kilo.jsonc" (
    set "PORTLINE="
    for /f "delims=" %%L in ('findstr /r /c:"BLENDER_PORT" "%ROOT%\.kilo\kilo.jsonc"') do set "PORTLINE=%%L"
    if defined PORTLINE (
        set "PORTTAIL=!PORTLINE:*BLENDER_PORT=!"
        for /f "tokens=2 delims=:" %%P in ("!PORTTAIL!") do set "PORT=%%P"
        set "PORT=!PORT: =!"
        set PORT=!PORT:"=!
        set "PORT=!PORT:,=!"
        set "PORT=!PORT:}=!"
        set "PORT=!PORT:{=!"
    )
)
if not defined PORT if exist "%ROOT%\.kilo\blender-port" set /p PORT=<"%ROOT%\.kilo\blender-port"
if not defined PORT (
    echo No BLENDER_PORT found in the workspace root .kilo\kilo.jsonc.
    echo Add mcp.blender.environment.BLENDER_PORT to the root config.
    exit /b 1
)
set "PORT=%PORT: =%"
set "PORT=%PORT:"=%"
set "PORT=%PORT:,=%"
echo %PORT%| findstr /r "^[0-9][0-9]*$" >nul
if errorlevel 1 (
    echo Invalid port: %PORT%
    exit /b 1
)

netstat -ano | findstr /r /c:":%PORT% .*LISTENING" >nul
if not errorlevel 1 (
    echo Port %PORT% is already in use. Only one Blender instance may run from this workspace.
    exit /b 1
)

set "FOUND="
if defined BLENDER_EXE if exist "%BLENDER_EXE%" set "FOUND=%BLENDER_EXE%"
if not defined FOUND for %%B in (blender.exe) do if not "%%~$PATH:B"=="" set "FOUND=%%~$PATH:B"
if not defined FOUND call :find_blender_root "%ProgramFiles%\Blender Foundation"
if not defined FOUND call :find_blender_root "%ProgramFiles(x86)%\Blender Foundation"
if not defined FOUND call :find_blender_root "%LOCALAPPDATA%\Programs\Blender Foundation"
if not defined FOUND call :find_blender_root "%ProgramFiles%\Steam\steamapps\common"
if not defined FOUND call :find_blender_root "%ProgramFiles(x86)%\Steam\steamapps\common"
if not defined FOUND if exist "%USERPROFILE%\scoop\apps\blender\current\blender.exe" set "FOUND=%USERPROFILE%\scoop\apps\blender\current\blender.exe"
if not defined FOUND if exist "%ProgramData%\chocolatey\bin\blender.exe" set "FOUND=%ProgramData%\chocolatey\bin\blender.exe"
if not defined FOUND (
    echo Blender not found. Set BLENDER_EXE to the full blender.exe path.
    exit /b 1
)

set "LOGDIR=%PROJECT%\logs"
set "STAMP=%DATE%_%TIME%"
set "STAMP=%STAMP:/=-%"
set "STAMP=%STAMP::=-%"
set "STAMP=%STAMP: =0%"
set "STAMP=%STAMP:,=-%"
set "LOG=%LOGDIR%\blender-%STAMP%.log"

set "BLENDER_PORT=%PORT%"
set "ARGS=-con --log "*" --log-file "%LOG%" --python "%TOOLS%start_blender_mcp.py""
if defined BLENDFILE set "ARGS="%BLENDFILE%" !ARGS!"

if defined KILO_BLENDER_CMD_DRYRUN (
    echo Blender: %FOUND%
    echo Project: %PROJECT%
    echo Port: %PORT%
    if defined BLENDFILE (echo Blend: %BLENDFILE%) else (echo Blend: startup scene)
    echo Log: %LOG%
    echo Args: !ARGS!
    exit /b 0
)

if not exist "%LOGDIR%" mkdir "%LOGDIR%"

start "" "%FOUND%" !ARGS!
if errorlevel 1 (
    echo Failed to start Blender.
    exit /b 1
)
echo Started Blender for %PROJECT% on port %PORT%.
echo Log: %LOG%
exit /b 0

:find_blender_root
if not exist "%~1" exit /b 1
for /f "delims=" %%D in ('dir /b /ad /o-n "%~1\Blender*" 2^>nul') do (
    if exist "%~1\%%D\blender.exe" (
        set "FOUND=%~1\%%D\blender.exe"
        exit /b 0
    )
)
if exist "%~1\Blender\blender.exe" (
    set "FOUND=%~1\Blender\blender.exe"
    exit /b 0
)
if exist "%~1\blender.exe" (
    set "FOUND=%~1\blender.exe"
    exit /b 0
)
exit /b 1
