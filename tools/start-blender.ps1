[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Project = "",

    [string]$BlendFile = "",

    [int]$Port = 0,

    [string]$BlenderExe = $env:BLENDER_EXE,

    [switch]$DryRun,

    [switch]$ListBlender
)

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path -Parent $PSScriptRoot

function Find-BlenderExecutables {
    $found = New-Object System.Collections.Generic.List[string]

    if ($env:BLENDER_EXE) { $found.Add($env:BLENDER_EXE) }

    $command = Get-Command blender.exe -ErrorAction SilentlyContinue
    if ($command -and $command.Source) { $found.Add($command.Source) }

    $uninstallRoots = @(
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
        "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"
    )
    foreach ($root in $uninstallRoots) {
        if (-not (Test-Path $root)) { continue }
        Get-ChildItem $root -ErrorAction SilentlyContinue | ForEach-Object {
            $props = Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue
            if (-not $props -or $props.DisplayName -notlike "Blender*") { return }

            if ($props.DisplayIcon) {
                $icon = ($props.DisplayIcon -replace ',\d+$', '').Trim('"')
                if ((Split-Path -Leaf $icon) -ieq "blender.exe" -and (Test-Path -LiteralPath $icon -PathType Leaf)) {
                    $found.Add($icon)
                }
            }
            if ($props.InstallLocation) {
                $candidate = Join-Path $props.InstallLocation "blender.exe"
                if (Test-Path -LiteralPath $candidate -PathType Leaf) { $found.Add($candidate) }
            }
        }
    }

    $foundationRoots = @(
        "HKLM:\SOFTWARE\BlenderFoundation\Blender",
        "HKCU:\SOFTWARE\BlenderFoundation\Blender"
    )
    foreach ($root in $foundationRoots) {
        if (-not (Test-Path $root)) { continue }
        Get-ChildItem $root -ErrorAction SilentlyContinue | ForEach-Object {
            $props = Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue
            if ($props -and $props.InstallDir) {
                $candidate = Join-Path $props.InstallDir "blender.exe"
                if (Test-Path -LiteralPath $candidate -PathType Leaf) { $found.Add($candidate) }
            }
        }
    }

    $commonRoots = @(
        "$env:ProgramFiles\Blender Foundation",
        "${env:ProgramFiles(x86)}\Blender Foundation",
        "$env:LOCALAPPDATA\Programs\Blender Foundation",
        "$env:ProgramFiles\Steam\steamapps\common\Blender",
        "${env:ProgramFiles(x86)}\Steam\steamapps\common\Blender",
        "$env:USERPROFILE\scoop\apps\blender\current",
        "$env:ProgramData\chocolatey\bin"
    )
    foreach ($root in $commonRoots) {
        if (-not $root -or -not (Test-Path $root)) { continue }
        Get-ChildItem -LiteralPath $root -Filter "blender.exe" -Recurse -File -ErrorAction SilentlyContinue |
            ForEach-Object { $found.Add($_.FullName) }
    }

    $unique = @()
    foreach ($path in $found) {
        if ([string]::IsNullOrWhiteSpace($path)) { continue }
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { continue }
        $full = [System.IO.Path]::GetFullPath($path)
        if ($unique -notcontains $full) { $unique += $full }
    }
    return $unique
}

function Get-BlenderCandidates {
    $candidates = @()
    foreach ($exe in (Find-BlenderExecutables)) {
        $version = $null
        try {
            $version = [version](Get-Item -LiteralPath $exe).VersionInfo.ProductVersion
        } catch {
            $version = $null
        }
        $candidates += [pscustomobject]@{
            Path = $exe
            Version = $version
        }
    }
    return $candidates | Sort-Object -Property `
        @{ Expression = { if ($_.Version) { $_.Version } else { [version]"0.0" } }; Descending = $true }, `
        Path
}

function Get-WorkspacePort {
    $config = Join-Path $workspaceRoot ".kilo\kilo.jsonc"
    if (-not (Test-Path -LiteralPath $config -PathType Leaf)) {
        throw "Workspace MCP config not found: $config"
    }
    $text = [System.IO.File]::ReadAllText($config)
    $text = [regex]::Replace($text, '"(?:\\.|[^"\\])*"|//[^\r\n]*|/\*[\s\S]*?\*/', {
        param($token)
        if ($token.Value.StartsWith('"')) { return $token.Value }
        return " "
    })
    $text = [regex]::Replace($text, '"(?:\\.|[^"\\])*"|,\s*(?=[}\]])', {
        param($token)
        if ($token.Value.StartsWith('"')) { return $token.Value }
        return ""
    })
    $configData = $text | ConvertFrom-Json
    $value = [string]$configData.mcp.blender.environment.BLENDER_PORT
    if ($value -notmatch '^\d{4,5}$' -or [int]$value -lt 1024 -or [int]$value -gt 65535) {
        throw "Invalid BLENDER_PORT in $config. Set mcp.blender.environment.BLENDER_PORT to 1024-65535."
    }
    return [int]$value
}

function Assert-NoProjectReparsePoint {
    param([string]$Path, [string]$Boundary)

    $current = Get-Item -LiteralPath $Path -Force
    while ($current) {
        if (($current.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw "Project paths must not use symbolic links or junctions: $($current.FullName)"
        }
        if ($current.FullName.TrimEnd('\') -ieq $Boundary.TrimEnd('\')) { break }
        if ($current.PSIsContainer) { $current = $current.Parent } else { $current = $current.Directory }
    }
}

function Get-RecordField {
    param([string]$Text, [string]$Name)

    $recordMatches = [regex]::Matches($Text, ('(?m)^{0}:[ \t]*([^\r\n]*)\r?$' -f [regex]::Escape($Name)))
    if ($recordMatches.Count -ne 1) { return "" }
    return $recordMatches[0].Groups[1].Value.Trim()
}

function Test-RecordDate {
    param([string]$Value)

    $parsedDate = [datetime]::MinValue
    return [datetime]::TryParseExact($Value, "yyyy-MM-dd", [System.Globalization.CultureInfo]::InvariantCulture,
        [System.Globalization.DateTimeStyles]::None, [ref]$parsedDate)
}

function Assert-ProjectReady {
    param([string]$Root)

    $requirementsPath = Join-Path $Root "Documents\REQUIREMENTS.md"
    $workflowPath = Join-Path $Root "Documents\WORKFLOW.md"
    $reviewPath = Join-Path $Root "Documents\REVIEW.md"
    if (-not (Test-Path -LiteralPath $requirementsPath -PathType Leaf) -or
        -not (Test-Path -LiteralPath $workflowPath -PathType Leaf) -or
        -not (Test-Path -LiteralPath $reviewPath -PathType Leaf)) {
        throw "Project requirements, workflow, or review records are missing. Complete Documents\REQUIREMENTS.md, Documents\WORKFLOW.md, and Documents\REVIEW.md before launch."
    }
    Assert-NoProjectReparsePoint -Path $requirementsPath -Boundary $Root
    Assert-NoProjectReparsePoint -Path $workflowPath -Boundary $Root
    Assert-NoProjectReparsePoint -Path $reviewPath -Boundary $Root
    $requirements = [System.IO.File]::ReadAllText($requirementsPath)
    $workflow = [System.IO.File]::ReadAllText($workflowPath)
    $review = [System.IO.File]::ReadAllText($reviewPath)
    $confirmation = Get-RecordField -Text $requirements -Name "Confirmation"
    if ((Get-RecordField -Text $requirements -Name "Status") -cne "Confirmed" -or
        -not (Test-RecordDate (Get-RecordField -Text $requirements -Name "Confirmed")) -or
        $confirmation -notmatch '[\p{L}\p{N}]' -or $confirmation -match '^(TBD|Pending|Unset|<.*>)$') {
        throw "Requirements are not confirmed. Record Status: Confirmed, Confirmed: YYYY-MM-DD, and Confirmation: <exact response and scope> in Documents\REQUIREMENTS.md."
    }
    if ((Get-RecordField -Text $workflow -Name "Mode") -cnotin @("Fully Autonomous", "Partially Autonomous") -or
        -not (Test-RecordDate (Get-RecordField -Text $workflow -Name "Selected"))) {
        throw "Workflow is not selected. Record Mode: Fully Autonomous or Mode: Partially Autonomous and Selected: YYYY-MM-DD in Documents\WORKFLOW.md."
    }
    $reviewMode = Get-RecordField -Text $review -Name "Mode"
    if ($reviewMode -cnotin @("Off", "All", "Single") -or
        -not (Test-RecordDate (Get-RecordField -Text $review -Name "Selected"))) {
        throw "Review mode is not selected. Record Mode: Off, All, or Single and Selected: YYYY-MM-DD in Documents\REVIEW.md."
    }
    if ($reviewMode -ceq "Single") {
        $singleGrader = Get-RecordField -Text $review -Name "Single grader"
        if ($singleGrader -cnotmatch '^[a-z0-9]+(?:-[a-z0-9]+)*$' -or
            $singleGrader -match '^(TBD|Pending|Unset)$') {
            throw "Single review mode requires Single grader: <configured lowercase grader name> in Documents\REVIEW.md."
        }
    }
}

function Test-PortListening {
    param([int]$LocalPort)
    $endpoints = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners()
    return @($endpoints | Where-Object { $_.Port -eq $LocalPort }).Count -gt 0
}

if ($ListBlender) {
    $candidates = @(Get-BlenderCandidates)
    if ($candidates.Count -eq 0) {
        Write-Host "No Blender installation found."
        exit 1
    }
    foreach ($candidate in $candidates) {
        Write-Host ("{0}  {1}" -f $candidate.Version, $candidate.Path)
    }
    exit 0
}

if (-not $Project) {
    throw "Usage: .\tools\start-blender.ps1 -Project Blender\<ProjectName>"
}
if (-not [System.IO.Path]::IsPathRooted($Project)) {
    $Project = Join-Path $workspaceRoot $Project
}

if (-not (Test-Path -LiteralPath $Project)) {
    throw "Project path not found: $Project"
}
$projectItem = Get-Item -LiteralPath $Project
if ($projectItem.PSIsContainer) {
    $projectRoot = $projectItem.FullName
} else {
    $projectRoot = $projectItem.Directory.FullName
    $BlendFile = $projectItem.FullName
}

$projectsRoot = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot "Blender")).TrimEnd('\')
$projectRootFull = [System.IO.Path]::GetFullPath($projectRoot).TrimEnd('\')
if ((Split-Path -Parent $projectRootFull) -ine $projectsRoot) {
    throw "Blender projects must live under $projectsRoot. Create one with .\tools\new-blender-project.cmd."
}

Assert-NoProjectReparsePoint -Path $projectRootFull -Boundary $projectsRoot
Assert-ProjectReady -Root $projectRootFull

if ($BlendFile -and -not [System.IO.Path]::IsPathRooted($BlendFile)) {
    $BlendFile = Join-Path $projectRoot $BlendFile
}

if ($BlendFile) {
    if (-not (Test-Path -LiteralPath $BlendFile -PathType Leaf)) {
        throw "Blend file not found: $BlendFile"
    }
    if ([System.IO.Path]::GetExtension($BlendFile) -ne ".blend") {
        throw "Not a .blend file: $BlendFile"
    }
    $blendPath = [System.IO.Path]::GetFullPath($BlendFile)
    if (-not $blendPath.StartsWith($projectRootFull + "\", [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Blend file must stay inside the selected project: $projectRootFull"
    }
    Assert-NoProjectReparsePoint -Path $blendPath -Boundary $projectRootFull
} else {
    $blends = @(Get-ChildItem -LiteralPath $projectRoot -Filter "*.blend" -File -ErrorAction SilentlyContinue)
    if ($blends.Count -eq 1) {
        $blendPath = $blends[0].FullName
        Assert-NoProjectReparsePoint -Path $blendPath -Boundary $projectRootFull
    } elseif ($blends.Count -gt 1) {
        throw "Multiple .blend files in $projectRoot. Pass -BlendFile explicitly."
    } else {
        $blendPath = ""
    }
}

$effectivePort = Get-WorkspacePort
if ($Port -ne 0 -and $Port -ne $effectivePort) {
    throw "Port override $Port differs from workspace BLENDER_PORT $effectivePort. Change .kilo\kilo.jsonc so the launcher and MCP use the same port."
}

if ($BlenderExe) {
    $resolved = Get-Command $BlenderExe -ErrorAction SilentlyContinue
    if ($resolved -and $resolved.Source) { $BlenderExe = $resolved.Source }
    if (-not (Test-Path -LiteralPath $BlenderExe -PathType Leaf)) {
        throw "Blender executable not found: $BlenderExe"
    }
    $selectedBlender = Get-Item -LiteralPath $BlenderExe
} else {
    $candidates = @(Get-BlenderCandidates)
    if ($candidates.Count -eq 0) {
        throw "Blender not found. Install Blender, add it to PATH, or set BLENDER_EXE to the full blender.exe path."
    }
    $selectedBlender = Get-Item -LiteralPath $candidates[0].Path
}

$logsRoot = Join-Path $projectRoot "logs"
if (Test-Path -LiteralPath $logsRoot) {
    if (-not (Test-Path -LiteralPath $logsRoot -PathType Container)) {
        throw "Project logs path must be a directory: $logsRoot"
    }
    Assert-NoProjectReparsePoint -Path $logsRoot -Boundary $projectRootFull
}
$logPath = Join-Path $logsRoot ("blender-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss-fff"))

$lockPath = Join-Path $workspaceRoot ".kilo\blender.lock.json"

function Invoke-WorkspaceBlenderLaunch {

if (Test-Path -LiteralPath $lockPath -PathType Leaf) {
    $lock = $null
    try {
        $lock = Get-Content -LiteralPath $lockPath -Raw | ConvertFrom-Json
    } catch {
        $lock = $null
    }
    $lockProcessId = 0
    if ($lock -and [int]::TryParse([string]$lock.pid, [ref]$lockProcessId) -and $lockProcessId -gt 0) {
        $existing = Get-Process -Id $lockProcessId -ErrorAction SilentlyContinue
        $expectedName = if ($lock.processName) { [string]$lock.processName } else { "blender" }
        $sameStart = $false
        if ($existing) {
            if (-not $lock.processStartedAt) {
                $sameStart = $true
            } else {
                $recordedStart = [datetime]::MinValue
                if ($lock.processStartedAt -is [datetime]) {
                    $recordedStart = $lock.processStartedAt
                    $validStart = $true
                } else {
                    $validStart = [datetime]::TryParseExact([string]$lock.processStartedAt, "o",
                        [System.Globalization.CultureInfo]::InvariantCulture,
                        [System.Globalization.DateTimeStyles]::RoundtripKind, [ref]$recordedStart)
                }
                $sameStart = $validStart -and $existing.StartTime.ToUniversalTime() -eq $recordedStart.ToUniversalTime()
            }
        }
        if ($sameStart -and $existing.ProcessName -ieq $expectedName) {
            if ($lock.project -ieq $projectRoot) {
                $lockPort = 0
                if ($lock.blend -ine $blendPath -or
                    -not [int]::TryParse([string]$lock.port, [ref]$lockPort) -or $lockPort -ne $effectivePort) {
                    throw "This project is already running with a different scene or port. Close it before changing either."
                }
                Write-Host "Already running: PID $($lock.pid), port $($lock.port), project $($lock.project)."
                if ($lock.log) { Write-Host "Log: $($lock.log)" }
                return
            }
            throw "Only one Blender instance may run from this workspace. PID $($lock.pid) is already using project '$($lock.project)' on port $($lock.port). Close it first."
        }
    }
    if (-not $DryRun) { Remove-Item -LiteralPath $lockPath -Force }
}

$bootstrap = Join-Path $PSScriptRoot "start_blender_mcp.py"
$workspaceBlenders = @(Get-CimInstance Win32_Process -Filter "Name = 'blender.exe'" -ErrorAction Stop |
    Where-Object { $_.CommandLine -and $_.CommandLine.IndexOf($bootstrap, [System.StringComparison]::OrdinalIgnoreCase) -ge 0 })
if ($workspaceBlenders.Count -gt 0) {
    throw "A Blender process from this workspace is still running. Close it before launching another project."
}
if (Test-PortListening -LocalPort $effectivePort) {
    throw "Port $effectivePort is already in use. Only one Blender instance may run from this workspace."
}

if ($DryRun) {
    Write-Host "Blender: $($selectedBlender.FullName)"
    Write-Host "Project: $projectRoot"
    Write-Host "Port: $effectivePort"
    Write-Host "Blend: $(if ($blendPath) { $blendPath } else { '(startup scene)' })"
    Write-Host "Log: $logPath"
    return
}

if (-not (Test-Path -LiteralPath $bootstrap -PathType Leaf)) {
    throw "Missing bootstrap script: $bootstrap"
}

$logHost = Join-Path $PSScriptRoot "start-blender-log.ps1"
if (-not (Test-Path -LiteralPath $logHost -PathType Leaf)) {
    throw "Missing log host script: $logHost"
}

if (-not (Test-Path -LiteralPath $logsRoot)) {
    New-Item -ItemType Directory -Force -Path $logsRoot | Out-Null
}

$powershellExe = (Get-Process -Id $PID).Path
if (-not $powershellExe) {
    throw "Unable to resolve the PowerShell executable for the log terminal."
}

$hostArguments = @(
    "-NoLogo",
    "-NoProfile",
    "-ExecutionPolicy Bypass",
    "-File `"$logHost`"",
    "-BlenderExe `"$($selectedBlender.FullName)`"",
    "-ProjectRoot `"$projectRoot`"",
    "-LogPath `"$logPath`"",
    "-Bootstrap `"$bootstrap`""
)
if ($blendPath) { $hostArguments += "-BlendPath `"$blendPath`"" }
$hostArgumentString = $hostArguments -join " "

$env:BLENDER_PORT = [string]$effectivePort
$process = Start-Process -FilePath $powershellExe `
    -ArgumentList $hostArgumentString `
    -WorkingDirectory $projectRoot `
    -WindowStyle Normal `
    -PassThru

Start-Sleep -Milliseconds 1200
$process.Refresh()
if ($process.HasExited) {
    throw "Blender log host exited during startup with code $($process.ExitCode). See $logPath."
}

$lock = [pscustomobject]@{
    pid = $process.Id
    processName = $process.ProcessName
    processStartedAt = $process.StartTime.ToUniversalTime().ToString("o")
    port = $effectivePort
    project = $projectRoot
    blend = $blendPath
    blender = $selectedBlender.FullName
    log = $logPath
    startedAt = (Get-Date).ToString("o")
}
$lock | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $lockPath -Encoding UTF8

$listening = $false
$deadline = (Get-Date).AddSeconds(25)
while (-not $listening -and (Get-Date) -lt $deadline) {
    $process.Refresh()
    if ($process.HasExited) {
        Remove-Item -LiteralPath $lockPath -Force
        throw "Blender log host exited during startup with code $($process.ExitCode). See $logPath."
    }
    if (Test-PortListening -LocalPort $effectivePort) {
        $listening = $true
        break
    }
    Start-Sleep -Milliseconds 500
}

if ($listening) {
    Write-Host "Started Blender for $projectRoot on port $effectivePort (log host PID $($process.Id))."
    Write-Host "MCP addon socket is listening."
    Write-Host "Log: $logPath"
} else {
    Write-Warning "Blender is running (log host PID $($process.Id)), but the MCP addon is not listening on port $effectivePort. Check the log terminal and that the addon is enabled. Log: $logPath"
}
}

$hash = [System.Security.Cryptography.SHA256]::Create()
try {
    $workspaceKey = [System.BitConverter]::ToString($hash.ComputeHash(
        [System.Text.Encoding]::UTF8.GetBytes($workspaceRoot.ToLowerInvariant()))).Replace("-", "")
} finally {
    $hash.Dispose()
}
$launchMutex = New-Object System.Threading.Mutex($false, "Local\KiloBlender-$workspaceKey")
$ownsMutex = $false
try {
    try {
        $ownsMutex = $launchMutex.WaitOne(0)
    } catch [System.Threading.AbandonedMutexException] {
        $ownsMutex = $true
    }
    if (-not $ownsMutex) { throw "Another Blender launch from this workspace is in progress. Wait for it to finish." }
    Invoke-WorkspaceBlenderLaunch
} finally {
    if ($ownsMutex) { $launchMutex.ReleaseMutex() }
    $launchMutex.Dispose()
}
