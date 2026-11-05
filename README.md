# Recipe Math Teacher

A gentle, offline web app that teaches kitchen math from scratch: no jargon, no shame, every answer comes with the worked steps written out — like a patient friend explaining it across the counter.

Built by **Asdale Dynamics, LLC** (Dylan Asdale's beginner-friendly AI and life-tools company), in the same plain-English spirit as The Massive AI Manual: clear, warm, and never condescending.

## What it does

1. **Double, halve, or scale a quantity** — one-tap ×½, ×1½, ×2, ×3 or any multiplier, with friendly kitchen fractions (1½ cups, ¾ tsp) and a tip for measuring in bigger units.
2. **Unit conversions with worked steps** — volume (tsp/tbsp/fl oz/cup/pint/quart/gallon/ml/L) and weight (oz/lb/g/kg). Every conversion is shown through its "bridge" unit, step by step. Volume stays volume and weight stays weight — the app refuses to pretend 1 cup of anything equals any number of grams.
3. **Pan-size swaps** — round vs. square/rectangular pan areas, batter multiplier, and a gentle warning about shallower or deeper bakes. (8-round to 9-round is ×1.27 of the recipe, ×1.266 exactly.)
4. **Batch cost per serving** — list what each ingredient actually cost you at the store, say how many servings, and get the per-serving number plus the division written out. Good enough beats exact.
5. **"Does this scale?" sanity checker** — for feeding a crowd: get your multiplier, honest advice about salt/spices/leavening on big jumps, a suggestion to bake in separate batches past ×4, and an optional pan-area cross-check that tells you when your recipe multiplier and your pan don't agree.
6. **Kitchen notes** — a scratchpad saved in your browser's localStorage. Nothing is uploaded, ever; there is no server, no account, and no network call in the entire app.

**Scope note:** this is arithmetic comfort only — no nutrition, diet, or medical claims or advice of any kind.

## How to run it

Open `index.html` in any modern browser (double-click it, or `file:///…/index.html` in the address bar). It is a single self-contained HTML file: no installs, no internet, no dependencies. Everything works offline from `file://`.

## Tests

Plain Node, zero dependencies:

```sh
node tests/test.js    # 44 checks on the conversion, scaling, pan, cost, and sanity math
node tests/smoke.js   # boots the app's UI in a stub DOM and clicks the main buttons
```

The unit tests read the exact math-core block out of `index.html` (between the `MATH-CORE-BEGIN/END` markers) and test the code that actually ships — so the page and the tests can never drift apart.

## Project

- `index.html` — the whole app (styles, math, UI)
- `tests/test.js` — math test suite
- `tests/smoke.js` — UI smoke test
- `STATUS.md` — build status, verification results, known gaps

## Related tools

Distinct from (and complementary to) `recipe-card-scaler-webapp`, which is a single quick-reference scaling sheet; this app teaches the math with worked steps instead of just handing you a table.

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Asdale Dynamics, LLC.
