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
    param(
        [int]$ExplicitPort
    )

    if ($ExplicitPort -gt 0) { return $ExplicitPort }

    $configs = @(
        (Join-Path $PSScriptRoot ".kilo\kilo.jsonc"),
        (Join-Path $PSScriptRoot ".kilo\kilo.json")
    )
    foreach ($config in $configs) {
        if (-not (Test-Path -LiteralPath $config -PathType Leaf)) { continue }
        $text = Get-Content -LiteralPath $config -Raw
        $match = [regex]::Match($text, '"BLENDER_PORT"\s*:\s*"?(\d{2,5})"?')
        if ($match.Success) { return [int]$match.Groups[1].Value }
    }

    $portFile = Join-Path $PSScriptRoot ".kilo\blender-port"
    if (Test-Path -LiteralPath $portFile -PathType Leaf) {
        $text = (Get-Content -LiteralPath $portFile -Raw).Trim()
        if ($text -match '^\d{2,5}$') { return [int]$text }
    }

    return 0
}

$candidates = @(Get-BlenderCandidates)
if ($ListBlender) {
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
    throw "Usage: .\start-blender.ps1 -Project Blender\<ProjectName>"
}
if (-not [System.IO.Path]::IsPathRooted($Project)) {
    $Project = Join-Path $PSScriptRoot $Project
}

if ($BlenderExe) {
    $resolved = Get-Command $BlenderExe -ErrorAction SilentlyContinue
    if ($resolved -and $resolved.Source) { $BlenderExe = $resolved.Source }
    if (-not (Test-Path -LiteralPath $BlenderExe -PathType Leaf)) {
        throw "Blender executable not found: $BlenderExe"
    }
    $selectedBlender = Get-Item -LiteralPath $BlenderExe
} else {
    if ($candidates.Count -eq 0) {
        throw "Blender not found. Install Blender, add it to PATH, or set BLENDER_EXE to the full blender.exe path."
    }
    $selectedBlender = Get-Item -LiteralPath $candidates[0].Path
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

$projectsRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "Blender")).TrimEnd('\')
$projectRootFull = [System.IO.Path]::GetFullPath($projectRoot).TrimEnd('\')
if (-not $projectRootFull.StartsWith($projectsRoot + "\", [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Blender projects must live under $projectsRoot. Create one with .\new-blender-project.cmd."
}

if ($BlendFile -and -not [System.IO.Path]::IsPathRooted($BlendFile) -and -not (Test-Path -LiteralPath $BlendFile)) {
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
} else {
    $blends = @(Get-ChildItem -LiteralPath $projectRoot -Filter "*.blend" -File -ErrorAction SilentlyContinue)
    if ($blends.Count -eq 1) {
        $blendPath = $blends[0].FullName
    } elseif ($blends.Count -gt 1) {
        throw "Multiple .blend files in $projectRoot. Pass -BlendFile explicitly."
    } else {
        $blendPath = ""
    }
}

$configPort = Get-WorkspacePort -ExplicitPort 0
$effectivePort = Get-WorkspacePort -ExplicitPort $Port
if ($Port -gt 0 -and $configPort -gt 0 -and $configPort -ne $Port) {
    Write-Warning "Explicit port $Port differs from the workspace port $configPort in .kilo\kilo.jsonc. The Kilo MCP must use the same port."
}
if ($effectivePort -eq 0) {
    throw "No BLENDER_PORT found in the workspace root .kilo\kilo.jsonc. Add mcp.blender.environment.BLENDER_PORT, or pass -Port."
}
if ($effectivePort -lt 1024 -or $effectivePort -gt 65535) {
    throw "Invalid port: $effectivePort. Use 1024-65535."
}

$lockDir = Join-Path $PSScriptRoot ".kilo"
if (-not (Test-Path -LiteralPath $lockDir)) {
    New-Item -ItemType Directory -Path $lockDir | Out-Null
}
$lockPath = Join-Path $lockDir "blender.lock.json"

if (Test-Path -LiteralPath $lockPath -PathType Leaf) {
    $lock = $null
    try {
        $lock = Get-Content -LiteralPath $lockPath -Raw | ConvertFrom-Json
    } catch {
        $lock = $null
    }
    if ($lock -and $lock.pid) {
        $existing = Get-Process -Id ([int]$lock.pid) -ErrorAction SilentlyContinue
        if ($existing -and $existing.ProcessName -eq "blender") {
            if ($lock.project -ieq $projectRoot) {
                Write-Host "Already running: PID $($lock.pid), port $($lock.port), project $($lock.project)."
                exit 0
            }
            throw "Only one Blender instance may run from this workspace. PID $($lock.pid) is already using project '$($lock.project)' on port $($lock.port). Close it first."
        }
    }
    Remove-Item -LiteralPath $lockPath -Force
}

$listener = Get-NetTCPConnection -State Listen -LocalPort $effectivePort -ErrorAction SilentlyContinue |
    Select-Object -First 1
if ($listener) {
    throw "Port $effectivePort is already in use by PID $($listener.OwningProcess). Only one Blender instance may run from this workspace."
}

if ($DryRun) {
    Write-Host "Blender: $($selectedBlender.FullName)"
    Write-Host "Project: $projectRoot"
    Write-Host "Port: $effectivePort"
    Write-Host "Blend: $(if ($blendPath) { $blendPath } else { '(startup scene)' })"
    exit 0
}

$bootstrap = Join-Path $PSScriptRoot "start_blender_mcp.py"
if (-not (Test-Path -LiteralPath $bootstrap -PathType Leaf)) {
    throw "Missing bootstrap script: $bootstrap"
}

$arguments = @()
if ($blendPath) { $arguments += "`"$blendPath`"" }
$arguments += "--python"
$arguments += "`"$bootstrap`""
$argumentString = $arguments -join " "

$env:BLENDER_PORT = [string]$effectivePort
$process = Start-Process -FilePath $selectedBlender.FullName `
    -ArgumentList $argumentString `
    -WorkingDirectory $projectRoot `
    -PassThru

Start-Sleep -Milliseconds 1200
$process.Refresh()
if ($process.HasExited) {
    throw "Blender exited during startup with code $($process.ExitCode)."
}

$lock = [pscustomobject]@{
    pid = $process.Id
    port = $effectivePort
    project = $projectRoot
    blend = $blendPath
    blender = $selectedBlender.FullName
    startedAt = (Get-Date).ToString("o")
}
$lock | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $lockPath -Encoding UTF8

$listening = $false
$deadline = (Get-Date).AddSeconds(25)
while (-not $listening -and (Get-Date) -lt $deadline) {
    if ($process.HasExited) { break }
    $listener = Get-NetTCPConnection -State Listen -LocalPort $effectivePort -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($listener) {
        $listening = $true
        break
    }
    Start-Sleep -Milliseconds 500
}

if ($listening) {
    Write-Host "Started Blender PID $($process.Id) for $projectRoot on port $effectivePort."
    Write-Host "MCP addon socket is listening."
} else {
    Write-Warning "Blender PID $($process.Id) started, but the MCP addon is not listening on port $effectivePort. Check that the addon is enabled."
}
