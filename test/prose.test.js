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
  for (const tag of ['h2','h3','p','ul','ol','blockquote','pre','code','hr']) assert.match(html, new RegExp(`<${tag}\\b`));
  assert.match(html, /href="\.\/tesserae.css"/);
  assert.match(html, /href="#sample-list"/);
  assert.match(html, /id="sample-list"/);
  assert.match(html, /fictional &lt;seedling&gt; &amp; notes/);
  assert.doesNotMatch(html, /<script\b|<iframe\b|<img\b|https?:\/\/|tabindex=|contenteditable=/i);
});

test('prose styling does not introduce rich HTML into the JSON presentation model',()=>{
  const html = renderPage({version:'tesserae/v1', title:'Synthetic', components:[{type:'section',title:'Literal content',paragraphs:['<a href="https://example.invalid">sample</a>']} ]});
  assert.match(html, /&lt;a href=&quot;https:\/\/example.invalid&quot;&gt;sample&lt;\/a&gt;/);
  assert.doesNotMatch(html, /<article class="ts-prose"|<a href=/);
});
