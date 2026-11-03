# Scenes — {{PROJECT_NAME}}

Save the main `.blend` at the project root as `{{PROJECT_SLUG}}.blend`. Multiple authored scenes
are supported inside that file. Use `create_scene`, `switch_scene`, `duplicate_scene`, and
`delete_scene`; `create_scene` supports `NEW`, `EMPTY` (Copy Settings), `LINK_COPY`, and
`FULL_COPY`. Existing operations accept an optional `scene` field. Declare exact scene names in
`begin`/`extend` or add them through scene operations, and give each shot scene its own camera.
A master Video Sequencer scene can use `scene_strip`. The harness seals and grades every declared
scene; a single-scene project may omit scene names and keeps the existing behavior. Linked `.blend`
libraries still use `link_library`. Use relative paths and document the primary scene.
