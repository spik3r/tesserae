import {readFileSync, existsSync, realpathSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const postPath = 'notes/2020/01/02/synthetic-notes/';
const cssPath = fileURLToPath(new URL('../html/tesserae.css', import.meta.url));
function contains(html, value) { assert.ok(html.includes(value), `Missing expected fixture output: ${value}`); }
function page(html, baseurl) {
  // Exact fixture contracts, not a general HTML parser, sanitizer or accessibility audit.
  assert.doesNotMatch(html, /{%|{{/, 'Unrendered Liquid in output');
  assert.doesNotMatch(html, /<script\b|<iframe\b|<seedling\b|<tag\b|<Garden\b/i, 'Unexpected fixture markup');
  contains(html, '<html lang="en"');
  contains(html, `href="${baseurl}/assets/tesserae.css"`);
  contains(html, 'Fictional &lt;Garden&gt; &amp; Notes');
}

/** Verify only the known synthetic fixture output; does not build or modify files. */
export function verifyJekyll({directory, scenario, baseurl}) {
  assert.ok(['full','minimal','empty'].includes(scenario), 'Expected full, minimal or empty scenario');
  assert.ok(['','/synthetic-preview','/blog'].includes(baseurl), 'Expected root, /synthetic-preview or /blog baseurl');
  const read = path => readFileSync(join(directory,path),'utf8');
  const index = read('index.html');
  page(index, baseurl);
  contains(index, '<h1>Synthetic &lt;Notes&gt; &amp; Updates</h1>');
  contains(index, 'Fictional examples only, not migrated blog content.');
  assert.equal(read('assets/tesserae.css'),readFileSync(cssPath,'utf8'), 'Built CSS differs from current Tesserae asset');
  assert.equal(read('assets/prose-diagram.svg'),readFileSync(new URL('../html/assets/prose-diagram.svg', import.meta.url),'utf8'), 'Built image differs from the synthetic asset');
  const articles = index.match(/<article\b[\s\S]*?<\/article>/g) ?? [];
  assert.equal(articles.length, scenario === 'empty' ? 0 : 1, 'Unexpected post count');
  if (scenario === 'empty') {
    contains(index,'No posts yet.');
    assert.ok(!existsSync(join(directory,postPath,'index.html')), 'Empty fixture retains stale post output');
    assert.doesNotMatch(index, /<time\b|aria-label="Tags"/);
    return;
  }
  assert.ok(!index.includes('No posts yet.'), 'Nonempty list shows empty state');
  const article = articles[0];
  const title = scenario === 'full' ? 'A fictional &lt;seedling&gt; &amp; its notes' : 'Minimal fictional post';
  contains(article, `<h2><a href="${baseurl}/${postPath}">${title}</a></h2>`);
  contains(article, '<time datetime="2020-01-02">January 2, 2020</time>');
  if (scenario === 'full') {
    contains(article,'Plain text only: &lt;script&gt;alert(&quot;fictional&quot;)&lt;/script&gt; &amp; &quot;quotes&quot; stay text.');
    contains(article,'<ul aria-label="Tags"><li>sample &lt;tag&gt;</li><li>fictional &amp; local</li></ul>');
  } else {
    assert.doesNotMatch(article, /aria-label="Tags"|Plain text only:|<ul\b/);
    assert.equal((article.match(/<p>/g) ?? []).length, 1, 'Minimal post has unexpected optional paragraphs');
  }
  const post = read(`${postPath}index.html`);
  page(post,baseurl);
  contains(post, `<title>${title} | Fictional &lt;Garden&gt; &amp; Notes</title>`);
  const proseArticles = post.match(/<article class="ts-prose">[\s\S]*?<\/article>/g) ?? [];
  assert.equal(proseArticles.length, 1, 'Expected one prose post article');
  const prose = proseArticles[0];
  contains(prose, scenario === 'full' ? 'No actual blog content or identifiers are reused.' : 'Synthetic content without optional description or tags.');
  if (scenario === 'full') {
    contains(prose, '<h2 id="sample-list">Sample list</h2>');
    contains(prose, '<blockquote>');
    contains(prose, '<ol>');
    contains(prose, '<li>A nested step.</li>');
    contains(prose, 'href="#sample-list"');
    contains(prose, 'demo &lt;tag&gt;</code>');
    contains(prose, '<pre class="highlight"><code>fictional &lt;seedling&gt; &amp; notes');
    contains(prose, 'demo/example/with/a/deliberately/long/unbroken/reference/for/checking/wrapping/without/introducing/a/horizontal/scroll/region');
    contains(prose, '<hr />');
    contains(prose, `<img src="${baseurl}/assets/prose-diagram.svg" alt="Three circles joined by a horizontal line." width="120" height="60" />`);
    contains(prose, `<figure>\n  <img src="${baseurl}/assets/prose-diagram.svg" width="1200" height="600" alt="Three circles joined by a horizontal line." />\n  <figcaption>Fictional diagram, not real data.</figcaption>\n</figure>`);
  }
}

function isEntrypoint() {
  // Imports from stdin/eval/embedded callers may have no real script filename.
  if (!process.argv[1]) return false;
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
if (isEntrypoint()) {
  const args=process.argv.slice(2);
  assert.ok(args.length === 6 && args[0] === '--directory' && args[2] === '--scenario' && args[4] === '--baseurl',
    'Usage: node scripts/verify-jekyll.js --directory PATH --scenario full|minimal|empty --baseurl ""|/synthetic-preview|/blog');
  verifyJekyll({directory:args[1],scenario:args[3],baseurl:args[5]});
  console.log('Synthetic Jekyll output contracts passed (not visual/print/AT verification).');
}
