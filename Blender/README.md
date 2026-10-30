# Blender Projects

Blender projects live under this folder. Each subfolder is one project with its own README,
Documents, Goals, assets, renders, exports, scenes, scripts, and backups.

Do not put a Blender project directly at the workspace root. Use this folder as the collection.

## Create a project

From the workspace root:

```powershell
.\new-blender-project.cmd -Name "ProjectName" -Description "What it is" -Goal "First design request"
```

## Open a project

Only one Blender project spawned by this workspace may be open at a time.

```powershell
.\start-blender.cmd "Blender\ProjectName"
```

The MCP port comes from the workspace root `.kilo/kilo.jsonc`; project folders do not have their own
Kilo config. Close the current Blender before opening another project.
