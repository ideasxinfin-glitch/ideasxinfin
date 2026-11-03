import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/motion.js', import.meta.url), 'utf8');

// Browser boundary doubles let the real controller receive preference, visibility,
// and pointer events without making these tests depend on a browser installation.
function setup({ saved = null, reduce = false, hidden = false } = {}) {
  function element() {
    const events = new Map(), classes = new Set(), styles = new Map(), attributes = new Map();
    return {
      dataset: {}, children: [], style: { setProperty: (k, v) => styles.set(k, v), getPropertyValue: k => styles.get(k) },
      classList: { toggle(k, force) { const on = force ?? !classes.has(k); if (on) classes.add(k); else classes.delete(k); }, remove: k => classes.delete(k), add: k => classes.add(k), contains: k => classes.has(k) },
      setAttribute: (k, v) => attributes.set(k, v), getAttribute: k => attributes.get(k), removeAttribute: k => attributes.delete(k),
      addEventListener: (k, f) => events.set(k, f), fire: (k, v = {}) => events.get(k)?.(v),
      querySelector: () => null, querySelectorAll: () => [],
      getBoundingClientRect: () => ({ top: 0, left: 0, width: 1000, height: 700, bottom: 700 }), matches: () => true,
    };
  }
  const root = element(), button = element(), hero = element(), header = element(), form = element(), panel = element();
  const icon = element(); button.querySelector = () => icon;
  const nodes = [element(), element(), element()];
  panel.querySelectorAll = () => nodes;
  const reduced = element(), fine = element(); reduced.matches = reduce; fine.matches = true;
  const frames = new Map(), timers = new Map(), observers = [], storage = new Map();
  const doc = element(); doc.documentElement = root; doc.body = element(); doc.hidden = hidden;
  const singles = { '.motion-toggle': button, '.header': header, '.hero': hero, '.contact-form': form, '#contact-form': form, '.workflow-panel': panel };
  doc.querySelector = selector => singles[selector] ?? null;
  doc.querySelectorAll = selector => selector === '.workflow-node' ? nodes : [];
  let sequence = 0;
  const context = { document: doc, matchMedia: query => query.includes('reduced') ? reduced : fine,
    localStorage: { getItem: () => saved, setItem: (k, v) => storage.set(k, v) }, scrollY: 0, innerHeight: 900,
    requestAnimationFrame: fn => { frames.set(++sequence, fn); return sequence; }, cancelAnimationFrame: id => frames.delete(id),
    setTimeout: fn => { timers.set(++sequence, fn); return sequence; }, clearTimeout: id => timers.delete(id),
    addEventListener() {}, IntersectionObserver: class {
      constructor(callback) { this.callback = callback; this.targets = []; observers.push(this); }
      observe(target) { this.targets.push(target); } unobserve() {} disconnect() { this.targets = []; }
    },
  };
  context.window = context;
  vm.runInNewContext(source, context);
  return { root, button, hero, doc, fine, reduced, frames, timers, storage, nodes,
    showWorkflow() { observers.filter(o => o.targets.includes(panel)).forEach(o => o.callback([{ target: panel, isIntersecting: true }])); },
  };
}

test('OS reduced motion overrides a previously saved on preference', () => {
  const page = setup({ saved: 'on', reduce: true });
  assert.equal(page.root.classList.contains('motion-on'), false);

});

test('animations default on even with an old saved pause preference', () => {
  const page = setup({ saved: 'off' });
  assert.equal(page.root.classList.contains('motion-on'), true);
  page.reduced.matches = true; page.reduced.fire('change');
  assert.equal(page.root.classList.contains('motion-on'), false);
  page.reduced.matches = false; page.reduced.fire('change');
  assert.equal(page.root.classList.contains('motion-on'), true);
});

test('an initially hidden page suspends motion immediately', () => {
  const page = setup({ hidden: true });
  assert.equal(page.root.classList.contains('motion-suspended'), true);
  assert.equal(page.frames.size, 0);
  assert.equal(page.timers.size, 0);
});

test('workflow advances only while visible and stops on reduced motion', () => {
  const page = setup();
  assert.equal(page.timers.size, 0);
  page.showWorkflow();
  assert.equal(page.nodes[0].classList.contains('is-active'), true);
  assert.equal(page.timers.size, 1);
  const [id, tick] = [...page.timers][0]; page.timers.delete(id); tick();
  assert.equal(page.nodes[1].classList.contains('is-active'), true);
  page.reduced.matches = true; page.reduced.fire('change');
  assert.equal(page.timers.size, 0);
  assert.equal(page.nodes.some(node => node.classList.contains('is-active')), false);
});

test('pointer capability changes cancel pending parallax and clear device offsets', () => {
  const page = setup();
  page.hero.fire('pointermove', { clientX: 900, clientY: 100 });
  assert.equal(page.frames.size, 1);
  page.fine.matches = false; page.fine.fire('change');
  assert.equal(page.frames.size, 0);
  assert.equal(page.root.style.getPropertyValue('--device-x'), '0px');
  assert.equal(page.root.style.getPropertyValue('--device-y'), '0px');
});

test('hidden tabs stop workflow and becoming visible respects reduced motion', () => {
  const page = setup(); page.showWorkflow();
  page.doc.hidden = true; page.doc.fire('visibilitychange');
  assert.equal(page.timers.size, 0);
  page.doc.hidden = false; page.doc.fire('visibilitychange');
  assert.equal(page.timers.size, 1);
  page.reduced.matches = true; page.reduced.fire('change');
  page.doc.hidden = true; page.doc.fire('visibilitychange');
  page.doc.hidden = false; page.doc.fire('visibilitychange');
  assert.equal(page.timers.size, 0);
});
