import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {articleNavigationAssets} from '../scripts/article-navigation.js';
import {themes, modes, densities} from '../common/options.js';

test('article navigation matrix preserves native navigation and skip-target contracts', () => {
  const assets = articleNavigationAssets();
  assert.equal(assets.size, themes.length * modes.length * densities.length * 2 * 3 + 1);
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
    assert.deepEqual(hrefs.slice(0, 5), ['#article', 'index.html', name, '#references', '#about']);
    for (const href of hrefs) {
      if (href.startsWith('#')) assert.equal(html.split(`id="${href.slice(1)}"`).length - 1, 1);
      else assert.ok(assets.has(href), `Broken local link: ${href}`);
    }
    assert.ok(html.indexOf('href="#article"') < html.indexOf('<nav'));
    assert.ok(html.indexOf('</nav>') < html.indexOf('<main'));
    assert.match(html, /-rtl(?:-first|-last)?\.html$/.test(name) ? /lang="ar" dir="rtl"/ : /lang="en" dir="ltr"/);
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


test('article footers form reciprocal sequences and omit missing neighbours', () => {
  const assets = articleNavigationAssets();
  for (const theme of themes) for (const mode of modes) for (const density of densities) for (const dir of ['ltr', 'rtl']) {
    const stem = `${theme}-${mode}-${density}-${dir}`;
    const names = [`${stem}-first.html`, `${stem}.html`, `${stem}-last.html`];
    for (const [position, name] of names.entries()) {
      const html = assets.get(name);
      const article = html.match(/<article>([\s\S]*?)<\/article>/)?.[1];
      assert.ok(article, name);
      const footer = article.match(/<footer>([\s\S]*?)<\/footer>/)?.[1];
      assert.ok(footer, `${name}: footer belongs to article`);
      assert.equal((html.match(/<footer>/g) ?? []).length, 2);
      assert.match(html, /<\/article><\/main>\s*<footer>/);
      const labels = [...html.matchAll(/<nav[^>]*aria-label="([^"]+)"/g)].map(m => m[1]);
      assert.equal(labels.length, 2);
      assert.equal(new Set(labels).size, 2, 'Navigation landmarks have distinct labels');
      assert.doesNotMatch(footer, /aria-current|aria-disabled|tabindex|role=/);
      const neighbours = [...footer.matchAll(/<a rel="(prev|next)" href="([^"]+)">([^<]+)<\/a>/g)];
      const expected = [];
      if (position > 0) expected.push(['prev', names[position - 1]]);
      if (position < 2) expected.push(['next', names[position + 1]]);
      assert.deepEqual(neighbours.map(m => [m[1], m[2]]), expected);
      assert.equal((footer.match(/<a /g) ?? []).length, expected.length);
      for (const [, relation, target, text] of neighbours) {
        const targetHtml = assets.get(target);
        const targetTitle = targetHtml.match(/<h1>([^<]+)<\/h1>/)[1];
        assert.ok(text.endsWith(`: ${targetTitle}`), 'Link names include destination title');
        assert.ok(targetHtml.includes(`rel="${relation === 'prev' ? 'next' : 'prev'}" href="${name}"`));
      }
    }
  }
});
