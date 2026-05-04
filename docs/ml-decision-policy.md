# ML Decision Policy

This document closes the Phase 4 policy questions for how ML readiness estimates and threshold safety signals should coexist.

## Target Direction

- Near term: keep the deployed API contract classification-based for compatibility.
- Next prototype target: add a continuous readiness score behind the scenes and map it back to readiness bands for the UI.
- Safety decision: keep hard safety guardrails outside the score model so dangerous sensor states never depend on regression smoothness.

## Hybrid Policy

The final decision stack should work in this order:

1. Threshold and OOD guardrails determine trust and safety state.
2. The ML model estimates readiness as either a label or a continuous score.
3. The UI shows both the guarded readiness result and the reason trust was reduced.

Recommended score bands:

- `< 0.35` -> `not_ready`
- `0.35` to `< 0.60` -> `approaching`
- `0.60` to `< 0.80` -> `nearly_ready`
- `>= 0.80` -> `ready`

## Business Rules

- Critical threshold states must never be visually hidden by a favorable ML result.
- A `ready` recommendation only survives when the reading is in-distribution and no critical threshold conflict is active.
- Warning thresholds should keep the readiness estimate visible, but the UX should downgrade trust and change the call-to-action from harvest confidence to operator review.
- Out-of-distribution readings should surface as suspicious even when the model confidence score is numerically high.
- Threshold analysis explains safety; ML explains readiness trend. They should not masquerade as the same signal.

## UX Guidance

- Show `safety state` and `readiness estimate` as separate blocks.
- Use threshold severity for alert color and urgency.
- Use the readiness score or readiness band for harvest-planning context.
- When guardrails modify the ML result, show both raw and guarded outcomes in debug or admin views.
- When a reading is both critical and OOD, the primary CTA should be inspection, not harvest.
