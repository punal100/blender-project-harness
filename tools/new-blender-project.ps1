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

if ($Start) {
    throw "-Start is not supported for a new scaffold. Record confirmed requirements and workflow, then use .\tools\start-blender.cmd separately."
}
if (-not (Test-Path -LiteralPath $projectsRoot -PathType Container)) {
    throw "Project collection not found: $projectsRoot"
}
if (-not (Test-Path -LiteralPath $template -PathType Container)) {
    throw "Project template not found: $template"
}
if ($Name -notmatch '^[A-Za-z0-9](?:[A-Za-z0-9 _-]*[A-Za-z0-9_-])?$' -or
    $Name -match '^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$') {
    throw "Invalid project name. Use letters, numbers, internal spaces, hyphens, or underscores; avoid Windows device names."
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

New-Item -ItemType Directory -Path $destination | Out-Null
Get-ChildItem -LiteralPath $template -Force | Copy-Item -Destination $destination -Recurse

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
    $text = [regex]::Replace($text, '\{\{[A-Z_]+\}\}', {
        param($token)
        if (-not $replacements.ContainsKey($token.Value)) {
            throw "Unknown template token $($token.Value) in $($_.FullName)"
        }
        return [string]$replacements[$token.Value]
    })
    [System.IO.File]::WriteAllText($_.FullName, $text, (New-Object System.Text.UTF8Encoding($false)))
}

Write-Host "Created Blender project: $destination"
Write-Host ""
Write-Host "Next:"
Write-Host "1. Write confirmed requirements and confirmation evidence to Documents\REQUIREMENTS.md."
Write-Host "2. Ask the workflow mode and write Documents\WORKFLOW.md."
Write-Host "3. Fill README.md and Documents\Goals\01-project-brief.md; start the recorded goal."
Write-Host "4. From the workspace root: .\tools\start-blender.cmd `"Blender\$Name`""
Write-Host "5. Save the main scene as $slug.blend in the project root."
Write-Host "6. Only one Blender project spawned by this workspace may be open at a time."
