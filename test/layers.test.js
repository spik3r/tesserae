import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { renderPage as rootRender } from 'tesserae';
import { renderPage } from 'tesserae/html';
import { themes, modes, densities, layouts } from 'tesserae/common/options';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('shared vocabulary has no renderer or environment dependencies', () => {
  for (const values of [themes, modes, densities, layouts]) assert.ok(Object.isFrozen(values));
  assert.doesNotMatch(read('common/options.js'), /\bimport\s|\brequire\(|\bprocess\.|\bdocument\.|\bwindow\./);
  assert.doesNotMatch(read('themes/tokens.css'), /\.ts-card|\.ts-grid|<|https?:|url\(/);
  assert.doesNotMatch(read('html/components.css'), /#[0-9a-f]{3,8}\b/i);
});

test('HTML bundle deterministically combines shared tokens and adapter styles', () => {
  const css = `${read('themes/tokens.css')}\n${read('html/components.css')}`;
  assert.equal(read('html/tesserae.css'), css);
  assert.equal(rootRender, renderPage);
  for (const name of ['dashboard', 'report']) {
    const model = JSON.parse(read(`examples/${name}.json`));
    for (const theme of themes) {
      const html = renderPage({...model, theme});
      assert.ok(html.includes(`<style>${css}</style>`));
      assert.equal(read(`examples/generated/${name}-${theme}.html`), html);
    }
  }
});

test('CSS-only example loads an existing local bundle without scripts', () => {
  const html = read('html/example.html');
  assert.match(html, /href="\.\/tesserae\.css"/);
  assert.doesNotMatch(html, /<script|https?:\/\//);
  assert.equal((html.match(/<main\b/g) || []).length, 1);
  assert.match(html, /Synthetic demonstration/);
});

test('only implemented layers are exported; reserved adapters are honest', async () => {
  const pkg = JSON.parse(read('package.json'));
  for (const [name, target] of Object.entries(pkg.exports)) {
    assert.ok(existsSync(new URL(`../${target}`, import.meta.url)), `${name} resolves`);
  }
  for (const framework of ['react', 'solid', 'jekyll']) {
    assert.match(read(`${framework}/README.md`), /not implemented, exported or installable/);
    await assert.rejects(import(`tesserae/${framework}`), {code:'ERR_PACKAGE_PATH_NOT_EXPORTED'});
  }
});
