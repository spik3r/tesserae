import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {articleNavigationAssets} from '../scripts/article-navigation.js';
import {themes, modes, densities} from '../common/options.js';

test('article navigation matrix preserves native navigation and skip-target contracts', () => {
  const assets = articleNavigationAssets();
  assert.equal(assets.size, themes.length * modes.length * densities.length * 2 + 1);
  assert.deepEqual(assets, articleNavigationAssets());
  for (const [name, html] of assets) {
    assert.equal(readFileSync(new URL(`../examples/generated/article-navigation/${name}`, import.meta.url), 'utf8'), html);
    assert.doesNotMatch(html, /<script\b|<button\b|role="menu|tabindex="[0-9]|https?:\/\//i);
    if (name === 'index.html') continue;
    assert.match(html, /<nav class="ts-article-nav" aria-label="[^"]+"><ul>/);
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
    assert.ok(html.includes(`href="${name}" aria-current="page"`));
    assert.match(html, /<main id="article" class="ts-article-main" tabindex="-1">/);
    const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(hrefs, ['#article', 'index.html', name, '#references', '#about']);
    for (const href of hrefs) {
      if (href.startsWith('#')) assert.equal(html.split(`id="${href.slice(1)}"`).length - 1, 1);
      else assert.ok(assets.has(href), `Broken local link: ${href}`);
    }
    assert.ok(html.indexOf('href="#article"') < html.indexOf('<nav'));
    assert.ok(html.indexOf('</nav>') < html.indexOf('<main'));
    assert.match(html, name.endsWith('-rtl.html') ? /lang="ar" dir="rtl"/ : /lang="en" dir="ltr"/);
    const [theme, mode, density] = name.split('-');
    assert.ok(html.includes(`data-theme="${theme}" data-mode="${mode}" data-density="${density}"`));
  }
});

test('navigation CSS permits wrapping without reordering or hiding links', () => {
  const css = readFileSync(new URL('../html/components.css', import.meta.url), 'utf8').split('/* Always-visible article navigation.')[1].split('/* Scoped typography')[0];
  assert.match(css, /display:flex;flex-wrap:wrap/);
  assert.match(css, /min-inline-size:0;max-inline-size:100%/);
  assert.match(css, /overflow-wrap:anywhere/);
  assert.match(css, /\[aria-current=page\].*font-weight:700.*border-block-end:2px solid currentColor/);
  assert.match(css, /:focus-visible.*outline:3px solid/);
  assert.doesNotMatch(css, /display:none|visibility:hidden|order:|row-reverse|position:absolute|\b(?:left|right):/);
});
