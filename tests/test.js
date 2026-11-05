'use strict';
/*
 * Tests for the Recipe Math Teacher app's core math.
 * Zero dependencies: reads index.html, extracts the MATH-CORE block,
 * evaluates it, and checks the conversion and scaling logic.
 * Run: node tests/test.js
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const BEGIN = '/* MATH-CORE-BEGIN */';
const END = '/* MATH-CORE-END */';
const bIdx = html.indexOf(BEGIN);
const eIdx = html.indexOf(END);
if (bIdx === -1 || eIdx === -1 || eIdx <= bIdx) {
  console.error('FAIL: math-core block markers not found in index.html');
  process.exit(1);
}
const core = html.slice(bIdx + BEGIN.length, eIdx);

let passed = 0, failed = 0;
const failures = [];
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok - ' + name);
  } catch (err) {
    failed++;
    failures.push(name);
    console.log('  FAIL - ' + name);
    console.log('       ' + (err && err.message ? err.message : err));
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}
function approx(actual, expected, relTol, label) {
  relTol = relTol == null ? 0.0015 : relTol;
  const ok = Math.abs(actual - expected) <= Math.abs(expected) * relTol + 1e-9;
  if (!ok) throw new Error(label || 'approx') + ': expected ~' + expected + ', got ' + actual;
}

/* Load the exact math core that ships inside index.html */
/* eslint-disable no-eval */
const api = (0, eval)(core.replace(/'use strict';/, '') + `
  ;({ roundToEighth, friendlyQty, friendlyCost, unitInfo, convertQty,
      conversionSteps, panAreaIn2, panFactor, costCalc, sanityCheck, fullSanityCheck });
`);

console.log('friendly number formatting');
test('1.5 formats as 1½', () => {
  assert(api.friendlyQty(1.5) === '1½', 'got ' + api.friendlyQty(1.5));
});
test('0.75 formats as ¾', () => {
  assert(api.friendlyQty(0.75) === '¾', 'got ' + api.friendlyQty(0.75));
});
test('2.125 formats as 2⅛', () => {
  assert(api.friendlyQty(2.125) === '2⅛', 'got ' + api.friendlyQty(2.125));
});
test('2 formats as 2', () => {
  assert(api.friendlyQty(2) === '2', 'got ' + api.friendlyQty(2));
});
test('0 formats as 0', () => {
  assert(api.friendlyQty(0) === '0', 'got ' + api.friendlyQty(0));
});
test('0.3 does not fake a fraction (falls back to decimal)', () => {
  const out = api.friendlyQty(0.3);
  assert(out === '0.3', 'got ' + out);
});
test('1.33 stays decimal (not fudged to ⅜)', () => {
  const out = api.friendlyQty(1.33);
  assert(out === '1.33', 'got ' + out);
});
test('negative 1.5 keeps its sign', () => {
  assert(api.friendlyQty(-1.5) === '−1½', 'got ' + api.friendlyQty(-1.5));
});
test('NaN is friendly, not crashy', () => {
  assert(api.friendlyQty(NaN) === '—', 'got ' + api.friendlyQty(NaN));
});
test('roundToEighth rounds 1.19 up to 1.25 and 1.18 down to 1.125', () => {
  assert(api.roundToEighth(1.19) === 1.25, 'got ' + api.roundToEighth(1.19));
  assert(api.roundToEighth(1.18) === 1.125, 'got ' + api.roundToEighth(1.18));
});

console.log('unit conversion');
test('2 cups = 16 tbsp each = 32 tbsp', () => {
  approx(api.convertQty(2, 'cup', 'tbsp'), 32, 0.001);
});
test('1 tbsp = 3 tsp', () => {
  approx(api.convertQty(1, 'tbsp', 'tsp'), 3, 0.001);
});
test('1 quart = 0.25 gallon', () => {
  approx(api.convertQty(1, 'quart', 'gallon'), 0.25, 0.001);
});
test('1 cup ≈ 236.588 ml', () => {
  approx(api.convertQty(1, 'cup', 'ml'), 236.588, 0.001);
});
test('1 liter = 1000 ml (identity base unit ratio 1:1)', () => {
  approx(api.convertQty(1, 'liter', 'ml'), 1000, 0.001);
});
test('1 lb = 453.592 g', () => {
  approx(api.convertQty(1, 'lb', 'g'), 453.592, 0.001);
});
test('1 kg ≈ 35.274 oz', () => {
  approx(api.convertQty(1, 'kg', 'oz'), 35.27396, 0.001);
});
test('same unit converts to itself', () => {
  approx(api.convertQty(7, 'cup', 'cup'), 7, 0.001);
});
test('volume to weight is refused (different worlds)', () => {
  assert(api.convertQty(1, 'cup', 'g') === null, 'should be null');
  assert(api.convertQty(1, 'g', 'cup') === null, 'should be null');
});
test('unknown unit is refused', () => {
  assert(api.convertQty(1, 'smidgen', 'cup') === null, 'should be null');
});
test('conversionSteps writes out 4 readable steps for 2 cup → ml', () => {
  const out = api.conversionSteps(2, 'cup', 'ml');
  assert(Array.isArray(out.steps) && out.steps.length === 4, 'expected 4 steps, got ' + JSON.stringify(out.steps));
  assert(out.steps[0].indexOf('2 cups') !== -1, 'step 1 should mention "2 cups": ' + out.steps[0]);
  assert(out.steps[1].indexOf('1 cup =') !== -1, 'step 2 should state the bridge: ' + out.steps[1]);
  approx(out.result, 473.176, 0.001);
});
test('conversionSteps works for weight too (1 lb → g)', () => {
  const out = api.conversionSteps(1, 'lb', 'g');
  approx(out.result, 453.592, 0.001);
  assert(out.steps[out.steps.length - 1].indexOf('453.59') !== -1, 'last step should reach grams: ' + out.steps[out.steps.length - 1]);
});
test('conversionSteps refuses cross-kind pairs', () => {
  assert(api.conversionSteps(1, 'cup', 'g') === null, 'should be null');
});

console.log('pan math');
test('8-inch round pan is about 50.27 in²', () => {
  approx(api.panAreaIn2('round', 8), 50.2655, 0.001);
});
test('8x8 square pan is 64 in²', () => {
  approx(api.panAreaIn2('square', 8, 8), 64, 0.001);
});
test('13x9 rectangle is 117 in²', () => {
  approx(api.panAreaIn2('square', 13, 9), 117, 0.001);
});
test('square pan with no second side uses a x a', () => {
  approx(api.panAreaIn2('square', 9), 81, 0.001);
});
test('8-inch round to 9-inch round is ×1.266 (area ratio, not ratio of radii)', () => {
  const f = api.panFactor(api.panAreaIn2('round', 8), api.panAreaIn2('round', 9));
  approx(f, Math.pow(9 / 8, 2), 0.001);
});
test('panFactor with a zero-area pan is refused', () => {
  assert(api.panFactor(0, 100) === null, 'should be null');
});

console.log('cost per serving');
test('$10 + $2.40 across 6 servings = $2.07 per serving', () => {
  const out = api.costCalc([
    { name: 'rice', cost: 10 },
    { name: 'beans', cost: 2.4 }
  ], 6);
  approx(out.total, 12.4, 0.001);
  approx(out.per, 12.4 / 6, 0.001);
  assert(out.steps.length === 4, 'expected 4 worked steps (2 items + sum + per-serving), got ' + out.steps.length);
  assert(out.steps[3].indexOf('$12.40') !== -1 && out.steps[3].indexOf('$2.07') !== -1,
    'final step should show total ÷ servings: ' + out.steps[3]);
});
test('zero and blank costs are left out of the batch', () => {
  const out = api.costCalc([
    { name: 'salt', cost: 0 },
    { name: 'olive oil', cost: '' },
    { name: 'pasta', cost: 4 }
  ], 2);
  approx(out.total, 4, 0.001);
  approx(out.per, 2, 0.001);
});
test('bad servings (0) gives no per-serving figure', () => {
  const out = api.costCalc([{ name: 'a', cost: 5 }], 0);
  assert(out.per === null, 'per should be null, got ' + out.per);
});

console.log('scaling sanity checker');
test('4 → 16 servings is ×4 exactly', () => {
  const out = api.sanityCheck(4, 16);
  approx(out.mult, 4, 0.0001);
});
test('4 → 16 flags salt/spice caution (mult in 2..4 range)', () => {
  const out = api.sanityCheck(4, 16);
  const kinds = out.flags.map(f => f.level);
  assert(kinds.indexOf('care') !== -1, 'expected at least one care flag, got ' + kinds);
  const spiceFlag = out.flags.find(f => /salt and spices/i.test(f.text));
  assert(!!spiceFlag, 'expected a seasoning caution, got: ' + JSON.stringify(out.flags));
});
test('huge jump (×10) recommends separate batches', () => {
  const out = api.sanityCheck(2, 20);
  const marathon = out.flags.find(f => /separate/i.test(f.text));
  assert(!!marathon, 'expected a "separate batches" suggestion, got: ' + JSON.stringify(out.flags));
});
test('gentle stretch (×1) stays reassuring', () => {
  const out = api.sanityCheck(4, 4);
  const nice = out.flags.find(f => /usually works exactly as written/i.test(f.text));
  assert(!!nice, 'expected reassurance for ×1, got: ' + JSON.stringify(out.flags));
});
test('halving (×0.5) mentions smaller pan, no spice marathon', () => {
  const out = api.sanityCheck(8, 4);
  const pan = out.flags.find(f => /smaller pan/i.test(f.text));
  assert(!!pan, 'expected smaller-pan advice, got: ' + JSON.stringify(out.flags));
});
test('invalid servings produce a caution and no multiplier', () => {
  const out = api.sanityCheck(0, 10);
  assert(out.mult === null, 'mult should be null');
  assert(out.flags.length > 0 && out.flags[0].level === 'care', 'expected a care flag');
});

console.log('sanity checker with pans');
test('matching pan area ratio (×2.25 pans, ×2.25 servings) lines up', () => {
  const out = api.fullSanityCheck(4, 9, { shape: 'square', a: 8, b: 8 }, { shape: 'square', a: 12, b: 12 });
  approx(out.pan.factor, 2.25, 0.001);
  const ok = out.flags.find(f => /line up nicely/i.test(f.text));
  assert(!!ok, 'expected pan approval, got: ' + JSON.stringify(out.flags));
});
test('mismatched pans (servings ×2.25, pan ×1.27) triggers a caution', () => {
  const out = api.fullSanityCheck(4, 9, { shape: 'round', a: 8 }, { shape: 'round', a: 9 });
  approx(out.pan.factor, Math.pow(9 / 8, 2), 0.001);
  const warn = out.flags.find(f => /over-filling/i.test(f.text));
  assert(!!warn, 'expected over-fill caution, got: ' + JSON.stringify(out.flags));
});
test('no pans given: still gives the plain sanity check', () => {
  const out = api.fullSanityCheck(4, 8, null, null);
  approx(out.mult, 2, 0.0001);
  assert(out.pan === undefined, 'pan info should be absent');
});

console.log('app file hygiene');
test('index.html is self-contained (no external scripts, links, or imports)', () => {
  assert(!/<script[^>]+src=/i.test(html), 'found external script tag');
  assert(!/<link\b/i.test(html), 'found external link tag');
  assert(!/@import/i.test(html), 'found @import');
});
test('nutrition/medical mentions are disclaimers only, never claims', () => {
  assert(!/nutrition facts|supplement benefits|heals?\b|cures?\b/i.test(html), 'found claim-like language');
  const sentences = html.match(/[^.]*\b(nutrition|medical)[^.]*\.?/gi) || [];
  assert(sentences.length > 0, 'expected the education-only disclaimer to exist');
  sentences.forEach(s => {
    assert(/no |not |never|only/i.test(s), 'non-disclaimer nutrition/medical mention: ' + s);
  });
});
test('notes feature keeps data in localStorage only', () => {
  assert(/localStorage\.setItem/.test(html), 'expected localStorage use');
  assert(!/fetch\(|XMLHttpRequest|WebSocket/i.test(html), 'found network call in a local-first app');
});

console.log('');
console.log('passed: ' + passed + ', failed: ' + failed);
if (failed > 0) {
  console.log('failing tests:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
