---
title: Animation
summary: Keyframing from Python across Blender versions, easing, cycles, NLA, cameras, and checking motion with frame strips.
---

# Animation

## Keyframes

Keyframe supported animatable properties directly rather than relying on UI operators. Verify the
property and keyframe result in the active version:

```python
scene = bpy.context.scene
scene.frame_start, scene.frame_end = 1, 120
scene.render.fps = 24

obj.location = (0, 0, 0); obj.keyframe_insert("location", frame=1)
obj.location = (0, 0, 2); obj.keyframe_insert("location", frame=24)
obj.rotation_euler.z = 3.1416; obj.keyframe_insert("rotation_euler", index=2, frame=48)
```

Pose bones: `pb = arm.pose.bones["hand.L"]; pb.rotation_mode = "XYZ"`, then
`pb.keyframe_insert("rotation_euler", frame=f)`. Bone keys use pose-space values, not world space.

## Reaching fcurves

Blender 4.4 added slotted actions and 5.0 removed `Action.fcurves`. This helper returns the first
channelbag for the assigned slot; inspect every layer/strip explicitly when handling complex actions.
MUST check for an assigned slot before calling the helper: Blender 4.4 does not accept `None` here.
An assigned action can legitimately have no assigned slot; inspection MUST NOT guess or assign one:

```python
def fcurves(obj):
    ad = obj.animation_data
    if not ad or not ad.action:
        return []
    if getattr(ad.action, "is_action_layered", False):
        if ad.action_slot is None:
            return []
        from bpy_extras import anim_utils
        cb = anim_utils.action_get_channelbag_for_slot(ad.action, ad.action_slot)
        return list(cb.fcurves) if cb else []
    return list(ad.action.fcurves)
```

Read supported interpolation enums before assigning. `BEZIER` uses handle shapes; `LINEAR` suits
constant motion and `CONSTANT` suits stepped blocking. `kp.easing` applies to easing-equation
interpolation modes, not ordinary Bezier handles.

## Making it feel alive

- Timing and spacing matter more than poses. Ease in and out of holds; keep linear for constant
  motion (wheels, conveyors).
- Anticipation before big moves, overshoot and settle after them, follow-through on
  secondary parts (antennae, tails, cloth) offset by 2–4 frames.
- Arcs: limbs and thrown objects travel on curves, not straight lines.
- Loops: make the first and last key identical and add a Cycles modifier
  (`fc.modifiers.new("CYCLES")`), or set the frame range to exclude the duplicate last frame.
- Procedural motion: drivers (`obj.driver_add("rotation_euler", 2).driver.expression = "frame * 0.1"`)
  or noise modifiers on fcurves. Auto-run restrictions may block scripted drivers; never disable
  safety settings to work around that restriction.

## Organizing

- Push finished actions to NLA strips (`track = ad.nla_tracks.new(); track.strips.new(name, start, action)`)
  to layer or sequence clips (walk, then wave).
- Name actions `Character_Walk`, `Door_Open`; game engines import them by name.
- Cameras: animate the camera or a parent empty; use a Track To constraint on a target empty for
  smooth follow shots. Keep focal-length changes slow.

## Checking motion

A single screenshot can't show motion. Use `look(mode="frames")` to see a strip of evenly spaced
frames (or pass `frames=[...]` for specific ones, `view="camera"` to see them through the camera).
Check for popping, interpenetration, feet sliding on the ground, and the loop seam.

## Sources

- https://developer.blender.org/docs/release_notes/4.4/upgrading/slotted_actions/
- https://developer.blender.org/docs/release_notes/5.0/python_api/#animation-rigging
- https://docs.blender.org/api/current/bpy_extras.anim_utils.html
- https://raw.githubusercontent.com/blender/blender/v4.4.0/scripts/modules/bpy_extras/anim_utils.py
