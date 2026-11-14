import assert from 'node:assert/strict';
import {readFileSync, readdirSync, realpathSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const date = '2020-01-02T03:04:05+00:00';
const title = 'Synthetic notes &amp; “quotes”';
const escapedTitle = 'Synthetic notes &amp; &quot;quotes&quot;';
const pageAuthor = 'Fictional Writer & Co';
const siteAuthor = 'Fictional Site Editor & Team';
const description = 'A fictional summary &amp; nothing personal.';
const analytics = '<!-- synthetic analytics hook; deliberately no provider code -->';
const comments = '<!-- synthetic comments hook; deliberately no provider code -->';
const css = new URL('../html/tesserae.css', import.meta.url);
function once(text, value) { assert.equal(text.split(value).length - 1, 1, `Expected exactly once: ${value}`); }
function files(directory, prefix = '') {
  return readdirSync(join(directory, prefix), {withFileTypes:true}).flatMap(entry =>
    entry.isDirectory() ? files(directory, `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`]);
}

/** Exact contracts for this anonymous fixture, not a general HTML/XML validator. */
export function verifyJekyllMetadata({directory, scenario, baseurl, environment}) {
  assert.ok(['full','minimal','site-author','permalink'].includes(scenario), 'Expected full, minimal, site-author or permalink scenario');
  assert.ok(['','/blog'].includes(baseurl), 'Expected root or /blog baseurl');
  assert.ok(['development','production'].includes(environment), 'Expected development or production environment');
  const postRoute = scenario === 'permalink' ? 'archive/fictional-note/' : '2020/01/02/synthetic-notes.html';
  const postPath = postRoute.endsWith('/') ? `${postRoute}index.html` : postRoute;
  assert.deepEqual(files(directory).sort(), ['assets/tesserae.css', 'feed.xml', 'index.html', postPath].sort(), 'Unexpected output routes/assets');
  const read = path => readFileSync(join(directory, path), 'utf8');
  assert.equal(read('assets/tesserae.css'), readFileSync(css, 'utf8'), 'CSS differs from current Tesserae asset');
  const full = ['full','permalink'].includes(scenario);
  const configuredSiteAuthor = scenario === 'minimal' ? undefined : siteAuthor;
  const postAuthor = full ? pageAuthor : configuredSiteAuthor;
  const origin = `https://example.invalid${baseurl}`;
  const postUrl = `${origin}/${postRoute}`;
  // Jekyll 3.10 derives post.id from the URL directory and original slug.
  // A permalink is not an Atom entry ID with its extension removed.
  const postId = `${origin}/${scenario === 'permalink' ? 'archive/synthetic-notes' : '2020/01/02/synthetic-notes'}`;
  const index = read('index.html');
  const post = read(postPath);
  const feed = read('feed.xml');

  for (const [html, isPost] of [[index, false], [post, true]]) {
    const url = isPost ? postUrl : `${origin}/`;
    const lang = full ? (isPost ? 'en-GB' : 'en-AU') : 'en';
    const locale = full ? lang.replace('-', '_') : 'en_US';
    once(html, `<html lang="${lang}">`);
    once(html, `<link rel="canonical" href="${url}" />`);
    assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
    once(html, `<meta property="og:url" content="${url}" />`);
    once(html, `<meta property="og:locale" content="${locale}" />`);
    once(html, `<meta property="og:title" content="${isPost ? title : 'Fictional index'}" />`);
    once(html, `<meta property="og:type" content="${isPost ? 'article' : 'website'}" />`);
    once(html, `<meta name="description" content="${isPost ? description : 'Synthetic metadata only.'}" />`);
    once(html, `<title>${isPost ? title : 'Fictional index'} | Fictional Metadata Notes</title>`);
    once(html, `<link rel="stylesheet" href="${baseurl}/assets/tesserae.css">`);
    assert.equal((html.match(/<link\b[^>]*\brel=["']stylesheet["']/gi) ?? []).length, 1, 'Expected one stylesheet owner');
    assert.doesNotMatch(html, /<style\b|\sstyle\s*=|<iframe\b|{%|{{/i);
    once(html, `<link type="application/atom+xml" rel="alternate" href="${origin}/feed.xml" title="Fictional Metadata Notes" />`);
    assert.equal(html.includes(analytics), full && environment === 'production', 'Analytics hook gate differs');

    const scripts = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)];
    assert.equal(scripts.length, 1, 'Only the SEO JSON-LD script is allowed');
    const match = scripts[0][0].match(/^<script type="application\/ld\+json">([\s\S]*?)<\/script>$/);
    assert.ok(match, 'Unexpected executable or external script');
    const data = JSON.parse(match[1]);
    assert.equal(data['@context'], 'https://schema.org');
    assert.equal(data['@type'], isPost ? 'BlogPosting' : 'WebSite');
    assert.equal(data.url, url);
    assert.equal(data.headline, isPost ? title : 'Fictional index');
    assert.equal(data.description, isPost ? description : 'Synthetic metadata only.');
    if (isPost) {
      assert.equal(data.datePublished, date);
      assert.equal(data.dateModified, date);
      assert.deepEqual(data.mainEntityOfPage, {'@type':'WebPage', '@id':postUrl});
      once(html, `<meta property="article:published_time" content="${date}" />`);
    }
    const expectedAuthor = isPost ? postAuthor : configuredSiteAuthor;
    assert.deepEqual(data.author, expectedAuthor ? {'@type':'Person', name:expectedAuthor} : undefined);
    if (expectedAuthor) once(html, `<meta name="author" content="${expectedAuthor}" />`);
    else assert.doesNotMatch(html, /name="author"/);
  }

  once(index, `<h2><a href="${baseurl}/${postRoute}">${escapedTitle}</a></h2>`);
  once(post, '<article class="post h-entry" itemscope itemtype="http://schema.org/BlogPosting">');
  once(post, `<h1 class="post-title p-name" itemprop="name headline">${escapedTitle}</h1>`);
  assert.match(post, new RegExp(`<time class="dt-published" datetime="${date.replaceAll('+','\\+')}" itemprop="datePublished">${full ? '2020/01/02' : 'Jan 2, 2020'}\\s*</time>`));
  once(post, `<a class="u-url" href="${baseurl}/${postRoute}" hidden></a>`);
  const prose = post.match(/<div class="post-content e-content ts-prose" itemprop="articleBody">([\s\S]*?)<\/div>/);
  assert.ok(prose, 'Missing prose/metadata boundary');
  once(prose[1], '<h2 id="fictional-section">Fictional section</h2>');
  once(prose[1], '<strong>native emphasis</strong>');
  once(prose[1], 'literal &lt;code&gt;</code>');
  assert.equal(post.includes(comments), full, 'Comments hook gate differs');
  assert.ok(!index.includes(comments), 'Comments hook leaked to index');
  if (postAuthor) {
    once(post, `<span itemprop="author" itemscope itemtype="http://schema.org/Person"><span class="p-author h-card" itemprop="name">${postAuthor.replaceAll('&', '&amp;')}</span></span>`);
  } else assert.doesNotMatch(post, /p-author|itemprop="author"|name="author"/);

  once(feed, 'xmlns="http://www.w3.org/2005/Atom"');
  once(feed, `<link href="${origin}/feed.xml" rel="self" type="application/atom+xml" />`);
  once(feed, `<id>${origin}/feed.xml</id>`);
  assert.equal((feed.match(/<entry\b/g) ?? []).length, 1);
  once(feed, `<title type="html">Synthetic notes &amp;amp; “quotes”</title>`);
  once(feed, `<link href="${postUrl}" rel="alternate" type="text/html" title="Synthetic notes &amp;amp; “quotes”" />`);
  once(feed, `<published>${date}</published>`);
  once(feed, `<id>${postId}</id>`);
  once(feed, `<content type="html" xml:base="${postUrl}"><![CDATA[${prose[1].trim()}]]></content>`);
  once(feed, '<summary type="html"><![CDATA[A fictional summary & nothing personal.]]></summary>');
  // Check feed and entry authors separately: a fallback repeats the same name.
  const feedHeader = feed.slice(0, feed.indexOf('<entry'));
  const entry = feed.match(/<entry\b[^>]*>([\s\S]*?)<\/entry>/)?.[1];
  assert.ok(entry, 'Missing feed entry');
  assert.equal((feedHeader.match(/<author>/g) ?? []).length, configuredSiteAuthor ? 1 : 0);
  if (configuredSiteAuthor) once(feedHeader, `<author><name>${configuredSiteAuthor.replaceAll('&', '&amp;')}</name></author>`);
  // Feed 0.17.0 emits an empty author name when neither page nor site supplies one.
  assert.equal((entry.match(/<author>/g) ?? []).length, 1);
  once(entry, `<author><name>${postAuthor?.replaceAll('&', '&amp;') ?? ''}</name></author>`);
  if (full) { once(feed, 'xml:lang="en-AU"'); once(feed, '<entry xml:lang="en-GB">'); }
  else assert.doesNotMatch(feed, /xml:lang=/);
}

function isEntrypoint() {
  if (!process.argv[1]) return false;
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
if (isEntrypoint()) {
  const args = process.argv.slice(2);
  assert.ok(args.length === 8 && args[0] === '--directory' && args[2] === '--scenario' && args[4] === '--baseurl' && args[6] === '--environment',
    'Usage: node scripts/verify-jekyll-metadata.js --directory PATH --scenario full|minimal|site-author|permalink --baseurl ""|/blog --environment development|production');
  verifyJekyllMetadata({directory:args[1], scenario:args[3], baseurl:args[5], environment:args[7]});
  console.log('Synthetic SEO/feed metadata contracts passed (not full Pages or presentation verification).');
}
