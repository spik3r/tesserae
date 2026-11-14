import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderPage} from '../html/index.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const css = read('html/components.css');
const prose = css.slice(css.indexOf('.ts-prose{'));

test('article typography remains scoped and uses existing semantic colours',()=>{
  assert.ok(prose);
  // Selector/declaration contracts only; these assertions do not compute CSS.
  for (const [, selector, declarations] of prose.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const part of selector.split(/,(?![^()]*\))/)) assert.ok(part.trim().startsWith('.ts-prose'), selector);
    assert.doesNotMatch(declarations, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
  }
  assert.match(prose, /\.ts-prose a\{color:var\(--ts-accent\);text-decoration:underline/);
  assert.match(prose, /\.ts-prose a:visited\{color:var\(--ts-muted\)/);
  assert.match(prose, /\.ts-prose a:focus-visible\{outline:3px solid var\(--ts-accent\)/);
  assert.match(prose, /border-inline-start:\.25rem solid var\(--ts-accent\)/);
  assert.doesNotMatch(prose, /(?:margin|padding|border)-(?:left|right)|text-align:(?:left|right)|outline:none|display:none/);
});

test('code can wrap on screen and print without hiding text or adding scroll controls',()=>{
  assert.match(prose, /\.ts-prose pre\{[^}]*white-space:pre-wrap;overflow-wrap:anywhere/);
  assert.match(prose, /\.ts-prose pre code\{[^}]*font-size:inherit;white-space:inherit/);
  assert.match(prose, /@media print\{[\s\S]*\.ts-prose :where\(pre,blockquote\)\{break-inside:auto\}/);
  assert.doesNotMatch(prose, /overflow(?:-x|-y)?:hidden|text-overflow|line-clamp|[;{](?:max-)?height:/);
});

test('authored example has native prose, escaped code and a local stylesheet and link',()=>{
  const html = read('html/prose-example.html');
  assert.match(html, /<article class="ts-prose">/);
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  for (const tag of ['h2','h3','p','ul','ol','blockquote','pre','code','hr','figure','figcaption']) assert.match(html, new RegExp(`<${tag}\\b`));
  assert.match(html, /href="\.\/tesserae.css"/);
  assert.match(html, /href="#sample-list"/);
  assert.match(html, /id="sample-list"/);
  assert.match(html, /fictional &lt;seedling&gt; &amp; notes/);
  assert.doesNotMatch(html, /<script\b|<iframe\b|https?:\/\/|tabindex=|contenteditable=/i);
  assert.match(html, /src="\.\/assets\/prose-diagram.svg" width="1200" height="600" alt="Three circles joined by a horizontal line\."/);
  assert.match(html, /src="\.\/assets\/prose-diagram.svg" width="120" height="60"/);
  const image = read('html/assets/prose-diagram.svg');
  assert.match(image, /width="1200" height="600" viewBox="0 0 1200 600"/);
  assert.doesNotMatch(image, /<script\b|<foreignObject\b|\bon\w+=|(?:href|src)=/i);
});

test('prose images have a size cap without forced upscaling or cropping',()=>{
  // Declaration checks only; no browser layout or image decoding is claimed.
  assert.match(prose, /\.ts-prose img\{max-inline-size:100%;block-size:auto\}/);
  assert.match(prose, /\.ts-prose figure\{margin-inline:0\}/);
  assert.match(prose, /\.ts-prose figcaption\{[^}]*color:var\(--ts-muted\)/);
  assert.doesNotMatch(prose, /object-fit:cover|(?:^|[;{])inline-size:100%/);
});

test('prose styling does not introduce rich HTML into the JSON presentation model',()=>{
  const html = renderPage({version:'tesserae/v1', title:'Synthetic', components:[{type:'section',title:'Literal content',paragraphs:['<a href="https://example.invalid">sample</a>']} ]});
  assert.match(html, /&lt;a href=&quot;https:\/\/example.invalid&quot;&gt;sample&lt;\/a&gt;/);
  assert.doesNotMatch(html, /<article class="ts-prose"|<a href=/);
});

test('simple prose tables override dashboard minimum width and keep native semantics',()=>{
  // CSS contracts, not a computed browser layout or accessibility tree.
  assert.match(css, /table\{[^}]*min-width:30rem/);
  assert.match(prose, /\.ts-prose table\{width:100%;min-width:0;table-layout:fixed\}/);
  assert.match(css, /th,td\{[^}]*overflow-wrap:anywhere/);
  const html = read('html/prose-example.html');
  const table = html.match(/<table>([\s\S]*?)<\/table>/)?.[1];
  assert.ok(table, 'Expected a native article table');
  assert.match(table, /<caption>Fictional specimen notes<\/caption>/);
  assert.equal((table.match(/scope="col"/g) ?? []).length, 2);
  assert.equal((table.match(/scope="row"/g) ?? []).length, 2);
  assert.match(table, /fictional_reference_with_no_spaces_for_checking_narrow_article_table_wrapping/);
  assert.match(table, /<code>demo &lt;tag&gt;<\/code>/);
  assert.doesNotMatch(table, /tabindex|role=|style=|aria-hidden/);
  const rules = prose.match(/\.ts-prose (?:table|th|td)\{[^}]*\}/g) ?? [];
  assert.doesNotMatch(rules.join(''), /display:|overflow:hidden|white-space:nowrap|text-overflow|line-clamp/);
});
