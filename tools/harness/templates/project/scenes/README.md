# Scenes — {{PROJECT_NAME}}

Save the main `.blend` at the project root as `{{PROJECT_SLUG}}.blend`. Linked `.blend` libraries can
be brought into the main scene with the reviewed `link_library` operation. Additional authored
`.blend` scene files may live here, but the harness manages only the registered main scene for save,
seal, render, and review. Use relative paths and document which file is the authoritative scene.
