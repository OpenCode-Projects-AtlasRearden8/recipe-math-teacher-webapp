# STATUS — Recipe Math Teacher

Last updated: 2026-11-05

## What was built

A single self-contained HTML file (`index.html`, no dependencies, works from `file://`) that teaches kitchen math step by step:

1. **Halve / double / multiplier tool** — ×½, ×1½, ×2, ×3 buttons plus any custom multiplier; results shown in friendly kitchen fractions (e.g. `1½`, `¾`) with each multiplication step written out and a tip about measuring in bigger units.
2. **Unit conversions with worked steps** — volume (tsp, tbsp, fl oz, cup, pint, quart, gallon, ml, liter) and weight (oz, lb, g, kg), each conversion explained through its bridge unit (ml or g). Volume→weight conversions are deliberately refused.
3. **Pan-size conversions** — round and square/rectangular pan areas, batter scale factor with worked area steps, and depth/bake-time warnings when a swap makes the batter much shallower or deeper.
4. **Batch cost per serving calculator** — itemized ingredient costs (what you actually paid), batch total, and per-serving figure with the division shown as a worked step.
5. **"Does this scale?" sanity checker** — multiplier guidance for larger gatherings: reassuring for ×1–×2, seasoning/caution advice for ×2–×4 (don't multiply salt, spices, or leavening fully), "make separate batches" for anything bigger, plus an optional pan-area cross-check that flags when the pan multiplier and the recipe multiplier disagree by more than ~25%.
6. **localStorage-only notes** — a kitchen scratchpad; there are no network calls anywhere in the app (verified by test).

No nutrition, diet, or medical claims or advice of any kind (this is checked by a test too).

## How to run it

Open `index.html` in any modern browser — double-click the file or point the browser at `file:///path/to/recipe-math-teacher-webapp/index.html`. Everything is offline and local.

## Verification results (all passing)

Run with plain Node (no dependencies):

- `node tests/test.js` — **44/44 passed**. Covers:
  - fraction formatting (`1.5 → 1½`, `2.125 → 2⅛`, negatives, NaN, decimals not fudged to fake fractions)
  - unit conversions (2 cups = 32 tbsp, 1 tbsp = 3 tsp, 1 lb = 453.592 g, 1 kg ≈ 35.274 oz, cross-kind and unknown units refused, worked-step text checked)
  - pan math (8" round ≈ 50.27 in², areas, ×1.266 factor for 8"→9" round, zero-area refused)
  - cost math ($12.40 ÷ 6 = $2.07 per serving, zero-cost items skipped, bad servings handled)
  - sanity checker (×4 flags seasoning caution; ×10 suggests separate batches; ×1 stays reassuring; halving advice; pan agreement and over-filling warnings; invalid input handled)
  - hygiene (self-contained file, disclaimers-only nutrition/medical mentions, localStorage-only notes, no network calls)
- `node tests/smoke.js` — **9/9 passed**. Boots the app's inline script in a stub DOM, seeds realistic values, clicks the main buttons, and checks rendered output (conversion steps, sanity flags, pan-mismatch warning, per-serving figure).
- `node --check` on the full inline script — **Syntax OK**.
- Unicode hygiene scan (no stray characters in any source file) — clean.

## Known gaps / notes

- Conversions go through ml/g as the bridge unit and use rounded values in the displayed steps (the math itself uses full precision); very exotic units aren't supported.
- The sanity checker is heuristic guidance, not a recipe-development tool — deep metric like dough hydration or sourdough starter timing isn't covered.
- Edge cases: multi-pan baking (two different pans at once) is handled by making the recipe twice, which the checker suggests, but there is no split-batter calculator.
- The smoke test runs the UI in a minimal DOM stub; some real-browser behaviors (select dropdown artwork, actual localStorage persistence across sessions) are verified only by manual use, though the storage code path is straightforward.
- No dark mode; the design is a single warm light theme.

## Integrity

The unit tests extract the `MATH-CORE-BEGIN/END` marker block from `index.html` and test that exact code, so the shipped page and the test suite cannot drift apart.

— Built and tested by Asdale Dynamics, LLC · MIT licensed
