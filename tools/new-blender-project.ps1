[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Name,

    [string]$Description = "TBD - replace with the project purpose.",

    [string]$Goal = "TBD - replace with the first design request.",

    [string]$GoalTitle = "Project Brief",

    [switch]$Start,

    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path -Parent $PSScriptRoot
$projectsRoot = Join-Path $workspaceRoot "Blender"
$template = Join-Path $workspaceRoot ".kilo\skills\blender-project-scaffold\templates\project"

if (-not (Test-Path -LiteralPath $template -PathType Container)) {
    throw "Project template not found: $template"
}
if ($Name -notmatch '^[A-Za-z0-9][A-Za-z0-9 _-]*$') {
    throw "Invalid project name. Use letters, numbers, spaces, hyphens, or underscores."
}

$slug = ($Name.ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-')
if (-not $slug) { throw "Project name must contain at least one letter or number." }

$destination = Join-Path $projectsRoot $Name
if (Test-Path -LiteralPath $destination) {
    throw "Project already exists: $destination"
}

if ($DryRun) {
    Write-Host "Project: $destination"
    Write-Host "Slug: $slug"
    Write-Host "Template: $template"
    exit 0
}

New-Item -ItemType Directory -Force -Path $projectsRoot | Out-Null
Copy-Item -LiteralPath $template -Destination $destination -Recurse -Force

$date = Get-Date -Format "yyyy-MM-dd"
$replacements = @{
    "{{PROJECT_NAME}}" = $Name
    "{{PROJECT_SLUG}}" = $slug
    "{{DATE}}" = $date
    "{{DESCRIPTION}}" = $Description
    "{{GOAL}}" = $Goal
    "{{GOAL_TITLE}}" = $GoalTitle
}

Get-ChildItem -Recurse -File -Force -LiteralPath $destination | ForEach-Object {
    $extension = $_.Extension.ToLowerInvariant()
    $isText = $_.Name -eq ".gitignore" -or @(".md", ".jsonc", ".json", ".txt", ".py", ".ps1", ".cmd", ".gitkeep") -contains $extension
    if (-not $isText) { return }

    $text = [System.IO.File]::ReadAllText($_.FullName)
    foreach ($key in $replacements.Keys) {
        $text = $text.Replace($key, $replacements[$key])
    }
    [System.IO.File]::WriteAllText($_.FullName, $text, (New-Object System.Text.UTF8Encoding($false)))
}

$leftover = Get-ChildItem -Recurse -File -Force -LiteralPath $destination |
    Select-String -Pattern '\{\{[A-Z_]+\}\}' -ErrorAction SilentlyContinue
if ($leftover) {
    Write-Warning "Unresolved template tokens remain. Check the new project files."
}

Write-Host "Created Blender project: $destination"
Write-Host ""
Write-Host "Next:"
Write-Host "1. Write confirmed requirements to Documents\REQUIREMENTS.md."
Write-Host "2. Ask the workflow mode and write Documents\WORKFLOW.md."
Write-Host "3. Fill README.md and Documents\Goals\01-project-brief.md."
Write-Host "4. From the workspace root: .\tools\start-blender.cmd `"Blender\$Name`""
Write-Host "5. Save the main scene as $slug.blend in the project root."
Write-Host "6. Only one Blender project spawned by this workspace may be open at a time."

if ($Start) {
    $requirementsPath = Join-Path $destination "Documents\REQUIREMENTS.md"
    $workflowPath = Join-Path $destination "Documents\WORKFLOW.md"
    $requirementsReady = (Test-Path -LiteralPath $requirementsPath -PathType Leaf) -and
        ((Get-Content -LiteralPath $requirementsPath -Raw) -match '(?m)^Status:\s*Confirmed\s*$')
    $workflowReady = (Test-Path -LiteralPath $workflowPath -PathType Leaf) -and
        ((Get-Content -LiteralPath $workflowPath -Raw) -match '(?m)^Mode:\s*(Fully Autonomous|Partially Autonomous)\s*$')
    if (-not $requirementsReady -or -not $workflowReady) {
        throw "Requirements and workflow are not confirmed. Complete Documents\REQUIREMENTS.md and Documents\WORKFLOW.md before using -Start."
    }
    & (Join-Path $PSScriptRoot "start-blender.ps1") -Project $destination
}
