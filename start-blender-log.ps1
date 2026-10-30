[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BlenderExe,

    [Parameter(Mandatory = $true)]
    [string]$ProjectRoot,

    [Parameter(Mandatory = $true)]
    [string]$LogPath,

    [Parameter(Mandatory = $true)]
    [string]$Bootstrap,

    [string]$BlendPath = ""
)

$ErrorActionPreference = "Stop"

$logDir = Split-Path -Parent $LogPath
if (-not (Test-Path -LiteralPath $logDir)) {
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
}

try {
    $Host.UI.RawUI.WindowTitle = "Blender - $(Split-Path -Leaf $ProjectRoot)"
} catch {
}

$arguments = @()
if ($BlendPath) { $arguments += $BlendPath }
$arguments += "--log"
$arguments += "*"
$arguments += "--python"
$arguments += $Bootstrap

$exitCode = 0
Push-Location -LiteralPath $ProjectRoot
try {
    "Blender log: $(Get-Date -Format o)" | Tee-Object -FilePath $LogPath
    "Blender: $BlenderExe" | Tee-Object -FilePath $LogPath -Append
    "Project: $ProjectRoot" | Tee-Object -FilePath $LogPath -Append
    "Port: $env:BLENDER_PORT" | Tee-Object -FilePath $LogPath -Append
    "Log: $LogPath" | Tee-Object -FilePath $LogPath -Append
    "------------------------------------------------------------" | Tee-Object -FilePath $LogPath -Append

    & $BlenderExe @arguments 2>&1 | Tee-Object -FilePath $LogPath -Append
    if ($null -ne $LASTEXITCODE) { $exitCode = [int]$LASTEXITCODE }

    "Blender exited with code $exitCode." | Tee-Object -FilePath $LogPath -Append
} catch {
    "Blender log host failed: $($_.Exception.Message)" | Tee-Object -FilePath $LogPath -Append
    $exitCode = 1
} finally {
    Pop-Location
}

exit $exitCode
