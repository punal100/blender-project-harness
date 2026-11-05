# Grader Report — spec

- Round: R04-20261105T154954Z
- Grader: spec
- Focus: requirement and acceptance fidelity, scope, deliverable completeness
- Model/variant: ocg/deepseek-v4.1-flash / Max
- Target: base a113404799ea8c9dd380c16fa4eec13efcdab9e2, saved scene SHA-256 1e18eb7f122687f0bd82abab0075a2113908aeb6fadddad97a0d75489aa3d0d4, project dirty
- Evidence key: 3da7d4c5e8cf259dd5b8d4abe989be05e29dafddcde5a98dca4e46a366cd2998
- Verdict: PASS
- Evidence inspected: renders/final/R04-20261105T154954Z.png (sha256 5f136bc0…), _evidence/scenes/Scene/camera.png (identical sha256), _evidence/scenes/Scene/scene-facts.json (sha256 b8f8f231…; scene.txt shares that hash)

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity | PASS | Only REQ-06 and REQ-08 were assessed for this room-shell milestone. REQ-06: camera.png shows warm evening practicals, a continuous amber-to-cream wall gradient, soft pendant shadows, muted sage-teal window trim as the accent, and no clipped white wall or ceiling areas; scene-facts.json confirms 1920x1080, AgX, Camera_Hero. REQ-08: the shell reads as one coherent room (floor/ceiling 6.2x5.2 m, walls to z=2.8), the window trim/glass/mullion align inside the wall opening, and every shell mesh reports 0 non-manifold edges, 0 loose vertices, 0 degenerate faces with no visible primitive seams or intersecting clutter. Machine, counter, seating and prop content is deferred, not absent. |
| 2. Composition and camera | not-assessed | Out of assigned focus. |
| 3. Lighting and exposure | not-assessed | Out of assigned focus; lighting was examined only as evidence for REQ-06 under dimension 1. |
| 4. Materials and colour | not-assessed | Out of assigned focus; palette was examined only as evidence for REQ-06 under dimension 1. |
| 5. Geometry and scale | not-assessed | Out of assigned focus; mesh/proportion checks were used only as evidence for REQ-08 under dimension 1. |
| 6. Detail and storytelling | not-assessed | Out of assigned focus; future milestone content. |
| 7. Technical readiness | not-assessed | Out of assigned focus; the shell render/camera settings look consistent, but the supplied facts carry no external-file or packing list. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | No new findings this round. | — |

## Re-review

- F-05 -> FIXED. scene-facts.json now places Light_Ceiling_1/2 at z=1.95, 0.345 m below the shade bottom rim (z=2.295) instead of 0.025 m, and the warm ceiling emission is raised. camera.png shows the previously dominant multi-metre cool ellipse and broad brown ceiling field are gone; only a single soft shade shadow about 0.9 m across remains directly above the right pendant, and the rest of the ceiling strip is clean warm cream. That remaining shadow is bounded, soft and physically consistent with the pendant, so the mottled-staining defect described in F-05 is resolved.

## Residual risks

- The right pendant still leaves a soft grey shade shadow at the top edge of frame; moving the bulbs back up or enlarging the shades would make it grow again.
- Window_Glass remains an opaque grey approximation with no evening exterior glimpse. This was accepted under REQ-07 in R03 and is not re-opened here; REQ-05 exterior content remains future work.
- External-file/packing integrity cannot be confirmed from scene-facts.json because it lists no image or linked-file paths; that check belongs to the full-spec review.
- Machines, counter, wire baskets, detergent props, noticeboard, seating and plant are absent by scope and must not be counted against this milestone.