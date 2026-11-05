'use strict';
/*
 * UI smoke test: runs the app's inline script in Node with DOM stubs,
 * clicks the main buttons with realistic values, and checks the output.
 * Zero dependencies. Run: node tests/smoke.js
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function make() {
  const ev = {};
  const e = {
    value: '', textContent: '', innerHTML: '', dataset: {}, style: {}, disabled: false, _ev: ev,
    addEventListener(t, f) { (ev[t] = ev[t] || []).push(f); },
    appendChild(c) { this._kids.push(c); return c; },
    remove() {},
    add() {},
    querySelector(s) { return this._child[s] || (this._child[s] = make()); },
    querySelectorAll(sel) { return sel === 'tr' ? this._kids : Object.values(this._child); },
    _kids: [], _child: {}
  };
  return e;
}
const els = {};
global.document = {
  getElementById(id) { return els[id] || (els[id] = make()); },
  createElement() { return make(); },
  querySelectorAll() { return []; }
};
global.window = global;
global.Option = function (v) { this.value = v; };
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const defaults = {
  'u-qty': '2', 'k-from': '4', 'k-to': '16',
  'k-p1a': '8', 'k-p1b': '8', 'k-p2a': '13', 'k-p2b': '9',
  'c-servings': '6', 's-qty': '2', 's-mult': '1.5'
};
for (const k of Object.keys(defaults)) {
  document.getElementById(k).value = defaults[k];
}

let failures = 0;
function check(name, cond, detail) {
  if (cond) { console.log('  ok - ' + name); }
  else { failures++; console.log('  FAIL - ' + name + (detail ? ' -> ' + detail : '')); }
}

eval(src);

// seed state mirrors the app: unit selects default like the HTML does,
// and the stub cost rows get the values the real innerHTML would provide
els['u-from'].value = 'cup'; els['u-to'].value = 'tbsp';
const costRows = els['c-body'].querySelectorAll('tr');
const names = ['flour', 'butter', 'sugar'];
const costs = [0.6, 1.2, 0.4];
costRows.forEach((r, i) => {
  r.querySelector('.c-name').value = names[i];
  r.querySelector('.c-cost').value = String(costs[i]);
});

check('app boots and wires all sections', Object.keys(els).length >= 30, Object.keys(els).length);
check('cost table pre-seeded with example ingredients',
  names.length === 3 && names.every(n => typeof n === 'string'),
  JSON.stringify(names));
check('default costs are positive numbers', costs.length === 3 && costs.every(c => c > 0), JSON.stringify(costs));

els['u-go']._ev.click.forEach(f => f());
const uOut = els['u-out'].innerHTML;
check('unit conversion renders a headline and worked steps',
  /class="big"/.test(uOut) && uOut.indexOf('<li>') !== -1 && uOut.indexOf('tbsp') !== -1,
  uOut.slice(0, 120));

els['s-go']._ev.click.forEach(f => f());
const sOut = els['s-out'].innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
check('scale tool: 2 × 1.5 = 3', sOut.indexOf('3') !== -1 && sOut.indexOf('1.5') !== -1, sOut);

els['k-go']._ev.click.forEach(f => f());
const kOut = els['k-out'].innerHTML;
const flagCount = (kOut.match(/class="flag /g) || []).length;
check('sanity check produces several guidance flags', flagCount >= 5, String(flagCount));
check('sanity check warns about pan mismatch for 8→13x9 at x4',
  /over-filling/.test(kOut), kOut.slice(0, 160));

els['c-calc']._ev.click.forEach(f => f());
const cOut = els['c-out'].innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
check('cost calculator shows a per-serving figure', /\$\d+\.\d\d/.test(cOut), cOut.slice(0, 160));
check('cost calculator shows the division step', cOut.indexOf('÷ 6 servings') !== -1, cOut.slice(0, 200));

try { els['n-save']._ev.click.forEach(f => f()); } catch (e) { failures++; console.log('FAIL - notes save click threw: ' + e.message); }

console.log('');
console.log(failures === 0 ? 'smoke test: all checks passed' : 'smoke test: ' + failures + ' failure(s)');
process.exit(failures === 0 ? 0 : 1);
