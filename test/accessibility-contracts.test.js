import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderPage } from '../html/index.js';
import { galleryModel } from '../examples/gallery-model.js';

// Source-token contract, not a CSS cascade emulator or browser accessibility audit.
const css = readFileSync(new URL('../themes/tokens.css', import.meta.url), 'utf8');
function palette(selector) {
  const prefix = `${selector}{`;
  assert.equal(css.split(prefix).length, 2, `exactly one ${selector} declaration`);
  const body = css.split(prefix)[1].split('}')[0];
  return Object.fromEntries([...body.matchAll(/--ts-([a-z-]+):([^;}]+)/g)].map(([, key, value]) => [key, value]));
}
function luminance(hex) {
  assert.match(hex, /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i, 'contrast contract requires opaque hex colours');
  const digits = hex.length === 4 ? [...hex.slice(1)].map(x => x + x).join('') : hex.slice(1);
  return [0, 2, 4].map(i => parseInt(digits.slice(i, i + 2), 16) / 255)
    .map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)
    .reduce((sum, x, i) => sum + x * [0.2126, 0.7152, 0.0722][i], 0);
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('semantic text palettes meet 4.5:1 across declared light, dark and print surfaces', () => {
  assert.equal(contrast('#000', '#fff'), 21);
  assert.equal(contrast('#abc', '#aabbcc'), 1);
  const base = palette(':root');
  // These are the explicitly declared palette overlays, not computed styles.
  for (const [theme, skin] of [['slate', {}], ['sand', palette('[data-theme=sand]')]]) {
    for (const [mode, overlay] of [['light', {}], ['dark', palette('[data-mode=dark]')], ['auto-dark', palette('[data-mode=auto]')], ['print', palette(':root,[data-theme],[data-mode]')]]) {
      const tokens = {...base, ...skin, ...overlay};
      for (const foreground of ['text', 'muted', 'accent', 'positive', 'warning', 'negative']) {
        for (const background of ['bg', 'surface', 'soft']) {
          const ratio = contrast(tokens[foreground], tokens[background]);
          assert.ok(ratio >= 4.5, `${theme}/${mode}: ${foreground} on ${background} = ${ratio}`);
        }
      }
    }
  }
  assert.deepEqual(palette('[data-mode=auto]'), palette('[data-mode=dark]'));
});

const page = components => ({version:'tesserae/v1', title:'Synthetic example', components});
test('progress uses a native enclosing label at zero and completion', () => {
  for (const value of [0, 0.5, 1]) {
    const html = renderPage(page([{type:'progress', title:'Completion', label:'Reviewed <items>', value, max:1}]));
    assert.ok(html.includes(`<label>Reviewed &lt;items&gt;<progress max="1" value="${value}">${value} / 1</progress></label>`));
    assert.doesNotMatch(html, /role="progressbar"|aria-valuenow|aria-hidden/);
  }
  for (const [value, max] of [[-1,1],[2,1],[0,0],[0,-1],[NaN,1],[0,Infinity],['0',1],[0,'1']]) {
    assert.throws(() => renderPage(page([{type:'progress',title:'Completion',label:'Reviewed',value,max}])));
  }
});

test('metric absence states remain visible text distinct from numeric zero', () => {
  for (const [state, label] of [['missing','Missing'],['unknown','Unknown'],['not-applicable','Not applicable']]) {
    assert.match(renderPage(page([{type:'metric',title:'Measurement',state}])), new RegExp(`<p class="ts-value">${label}</p>`));
    assert.throws(() => renderPage(page([{type:'metric',title:'Measurement',state,value:0}])));
  }
  assert.match(renderPage(page([{type:'metric',title:'Measurement',value:0}])), /<p class="ts-value">0<\/p>/);
});

test('gallery tables expose named keyboard scroll regions in native table order', () => {
  // Markup contract only: focus movement, outlines and scrolling need a browser.
  const html = renderPage(galleryModel);
  const regions = [...html.matchAll(/<div\b([^>]*\bclass="ts-table-scroll"[^>]*)><table><caption>([^<]+).*?<\/table><\/div>/gs)];
  const titles = ['Fictional evidence', 'Invented group A', 'Reviewed empty group', 'Empty table'];
  assert.equal(regions.length, titles.length);
  assert.equal((html.match(/<table>/g) ?? []).length, titles.length);
  for (const [index, [region, attributes, caption]] of regions.entries()) {
    const title = titles[index];
    assert.match(attributes, /\srole="region"(?:\s|$)/);
    assert.match(attributes, /\stabindex="0"(?:\s|$)/);
    assert.doesNotMatch(attributes, /\saria-hidden=/);
    assert.equal(attributes.match(/\saria-label="([^"]+)"/)?.[1], title);
    assert.equal(caption.trim(), title);
    assert.match(region, /<th scope="col">/);
  }
});
