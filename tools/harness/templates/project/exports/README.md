# Exports — {{PROJECT_NAME}}

Final interchange files (GLB, glTF, FBX, USD, OBJ) and other delivery outputs live here. Create them
with the reviewed `export_scene` operation inside a declared scene change, with the output path under
`exports/`. Record the export preset, scale, axis convention, and any known limitations in the project
README. Sidecar files such as OBJ `.mtl` or separate glTF buffers follow the same ownership and
licence rules as the main export.

Every export produces a harness receipt with format, project-relative path, bytes, SHA-256, source
scene, and signature check. Completion is denied for a missing or changed export. This validation is
separate from `check_assets`.
