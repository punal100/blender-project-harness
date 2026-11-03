# Scripts — {{PROJECT_NAME}}

Project-specific Blender Python source may live here. They are not the workspace harness and must
not hardcode machine-specific paths. Use relative paths from the project root or the `.blend` file.

The harness does **not** execute arbitrary project Python. A script must be run only through a
separately reviewed, sandboxed tooling operation; do not use raw Python or claim these files are
executed by the production workflow. Document each script's purpose and any approved future
invocation in this README.
