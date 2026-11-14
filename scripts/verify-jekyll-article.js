import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const analytics = '<!-- synthetic analytics hook; deliberately no provider code -->';
const comments = '<!-- synthetic comments hook; deliberately no provider code -->';
const siteAuthor = 'Fictional Site Editor & Team', pageAuthor = 'Fictional Writer & Co';
const posts = [
  ['2020/01/01/first.html','First &lt;sample&gt; &amp; notes','First &amp; notes'],
  ['2020/01/02/synthetic-notes.html','Synthetic notes &amp; &quot;quotes&quot;','Synthetic notes &amp; “quotes”'],
  ['2020/01/03/last.html','Last &quot;sample&quot; &amp; notes','Last “sample” &amp; notes']
];
function once(html,value) { assert.equal(html.split(value).length-1,1,`Expected once: ${value}`); }
function files(directory,prefix='') {
  return readdirSync(join(directory,prefix),{withFileTypes:true}).flatMap(entry=> {
    assert.ok(entry.isDirectory() || entry.isFile(),'Unexpected non-regular output');
    return entry.isDirectory() ? files(directory,`${prefix}${entry.name}/`) : [`${prefix}${entry.name}`];
  });
}
const compact = html => html.replace(/>\s+</g,'><').trim();

/** Known anonymous fixture only; not a general HTML/XML or accessibility validator. */
export function verifyJekyllArticle({directory,scenario,baseurl,environment}) {
  assert.ok(['sequence','single','empty'].includes(scenario),'Invalid scenario');
  assert.ok(['','/blog'].includes(baseurl),'Invalid baseurl');
  assert.ok(['production','development'].includes(environment),'Invalid environment');
  const selected = scenario === 'sequence' ? posts : scenario === 'single' ? [posts[1]] : [];
  const paths = ['index.html','about.html',...selected.map(p=>p[0])];
  assert.deepEqual(files(directory).sort(),[...paths,'feed.xml','assets/tesserae.css','assets/prose-diagram.svg'].sort(),'Unexpected output inventory');
  const read = path=>readFileSync(join(directory,path),'utf8');
  for (const [output,source] of [['assets/tesserae.css','../html/tesserae.css'],['assets/prose-diagram.svg','../html/assets/prose-diagram.svg']]) {
    assert.equal(read(output),readFileSync(new URL(source,import.meta.url),'utf8'),`Asset bytes differ: ${output}`);
  }
  const origin = `https://example.invalid${baseurl}`, full = scenario === 'sequence';
  const feed = read('feed.xml');
  const entries = [...feed.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/g)].map(m=>m[1]);
  assert.equal(entries.length,selected.length,'Unexpected feed entry count');
  once(feed,`<id>${origin}/feed.xml</id>`);
  once(feed,`<link href="${origin}/feed.xml" rel="self" type="application/atom+xml" />`);
  const feedHeader = feed.split('<entry')[0];
  assert.equal((feedHeader.match(/<author>/g) ?? []).length,scenario === 'empty' ? 0 : 1);
  if (scenario !== 'empty') once(feedHeader,'<author><name>Fictional Site Editor &amp; Team</name></author>');
  const bodies = new Map();
  for (const path of paths) {
    const html = read(path), item = selected.find(p=>p[0] === path), isPost = Boolean(item);
    const route = path === 'index.html' ? '/' : `/${path}`, url = `${origin}${route}`;
    const title = item?.[1] ?? (path === 'index.html' ? 'Fictional index' : 'About &lt;fiction&gt; &amp; notes');
    const seoTitle = item?.[2] ?? (path === 'index.html' ? 'Fictional index' : 'About &amp; notes');
    const author = scenario === 'empty' ? undefined : full && isPost ? pageAuthor : siteAuthor;
    const lang = full ? isPost ? 'en-GB' : 'en-AU' : 'en';
    once(html,`<html lang="${lang}" data-theme="slate" data-mode="auto" data-density="comfortable">`);
    assert.equal((html.match(/<main\b/g) ?? []).length,1);
    once(html,'<main id="main-content" class="ts-article-main" tabindex="-1">');
    once(html,'id="main-content"');
    once(html,'<a class="ts-skip-link" href="#main-content">Skip to content</a>');
    assert.ok(html.indexOf('class="ts-skip-link"') < html.indexOf('<nav'));
    assert.equal((html.match(/<h1\b/g) ?? []).length,1,'One document title');
    once(html,isPost ? `<h1 class="post-title p-name" itemprop="name headline">${title}</h1>` : `<h1>${title}</h1>`);
    assert.doesNotMatch(html,/<style\b|\sstyle=|<iframe\b|<sample\b|<fiction\b|{%|{{|role="menu|<input\b|<button\b|tabindex="[0-9]/i);
    once(html,`<link rel="stylesheet" href="${baseurl}/assets/tesserae.css">`);
    assert.equal((html.match(/rel="stylesheet"/g) ?? []).length,1);
    const navs = [...html.matchAll(/<nav class="ts-article-nav" aria-label="([^"]+)">([\s\S]*?)<\/nav>/g)];
    assert.equal(navs.length,full && isPost ? 2 : 1,'Unexpected navigation landmark');
    assert.equal((html.match(/<nav\b/g) ?? []).length,navs.length,'Unrecognised navigation landmark');
    assert.equal((html.match(/<footer\b/g) ?? []).length,isPost ? 2 : 1,'Unexpected footer count');
    assert.equal(navs[0][1],'Site navigation');
    const navLink=(route,label)=>`<li><a href="${baseurl}${route}"${url === `${origin}${route}` ? ' aria-current="page"' : ''}>${label}</a></li>`;
    assert.equal(compact(navs[0][2]),`<ul>${navLink('/','Fictional index')}${navLink('/about.html','About &lt;fiction&gt; &amp; notes')}</ul>`);
    assert.equal((html.match(/aria-current="page"/g) ?? []).length,isPost ? 0 : 1);
    once(html,'<footer class="ts-site-footer">Anonymous site fixture. No real blog content.</footer>');
    assert.ok(html.indexOf('class="ts-site-footer"') > html.indexOf('</main>'));
    assert.equal(html.includes(analytics),full && environment === 'production','Analytics gate');
    assert.equal(html.includes(comments),full && isPost,'Comments gate');
    once(html,`<link rel="canonical" href="${url}" />`);
    assert.equal((html.match(/rel="canonical"/g) ?? []).length,1);
    once(html,`<meta property="og:url" content="${url}" />`);
    once(html,`<meta property="og:title" content="${seoTitle}" />`);
    once(html,`<meta property="og:type" content="${isPost ? 'article' : 'website'}" />`);
    once(html,`<meta property="og:locale" content="${full ? lang.replace('-', '_') : 'en_US'}" />`);
    once(html,`<title>${seoTitle} | Fictional Metadata Notes</title>`);
    once(html,`<link type="application/atom+xml" rel="alternate" href="${origin}/feed.xml" title="Fictional Metadata Notes" />`);
    const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
    assert.equal(scripts.length,1,'Only SEO JSON-LD allowed');
    assert.ok(scripts[0][0].startsWith('<script type="application/ld+json">'));
    const data=JSON.parse(scripts[0][1]);
    assert.equal(data['@context'],'https://schema.org');
    assert.equal(data['@type'],isPost ? 'BlogPosting' : path === 'index.html' ? 'WebSite' : 'WebPage');
    assert.equal(data.url,url);assert.equal(data.headline,seoTitle);
    const description=isPost ? 'A fictional summary &amp; nothing personal.' : 'Synthetic metadata only.';
    assert.equal(data.description,description);
    once(html,`<meta name="description" content="${description}" />`);
    assert.deepEqual(data.author,author ? {'@type':'Person',name:author} : undefined);
    if(author) once(html,`<meta name="author" content="${author}" />`);
    else assert.doesNotMatch(html,/name="author"/);
    // Every authored link/image must resolve within this exact output inventory.
    for (const [,href] of html.matchAll(/<(?:a|img)\b[^>]*(?:href|src)="([^"]+)"/g)) {
      if(href.startsWith('#')) once(html,`id="${href.slice(1)}"`);
      else {
        assert.ok(href.startsWith(`${baseurl}/`),`Wrong base path: ${href}`);
        const target=href.slice(baseurl.length+1) || 'index.html';
        assert.ok([...paths,'assets/prose-diagram.svg'].includes(target),`Broken local destination: ${href}`);
      }
    }
    if (!isPost) {
      assert.doesNotMatch(html,/ts-article-footer|rel="prev"|rel="next"|class="dt-published"/);
      continue;
    }
    once(html,'<article class="post h-entry" itemscope itemtype="http://schema.org/BlogPosting">');
    const date=`${path.slice(0,10).replaceAll('/','-')}T03:04:05+00:00`;
    assert.equal(data.datePublished,date);assert.equal(data.dateModified,date);
    assert.deepEqual(data.mainEntityOfPage,{'@type':'WebPage','@id':url});
    once(html,`<meta property="article:published_time" content="${date}" />`);
    const day=Number(path.slice(8,10));
    once(html,`<time class="dt-published" datetime="${date}" itemprop="datePublished">${full ? path.slice(0,10) : `Jan ${day}, 2020`}`);
    once(html,`<span itemprop="author" itemscope itemtype="http://schema.org/Person"><span class="p-author h-card" itemprop="name">${author.replaceAll('&','&amp;')}</span></span>`);
    once(html,`<a class="u-url" href="${baseurl}/${path}" hidden></a>`);
    const prose=html.match(/<div class="post-content e-content ts-prose" itemprop="articleBody">([\s\S]*?)<\/div><!-- article-body-end -->/)?.[1];
    assert.ok(prose,'Missing prose body boundary');bodies.set(path,prose.trim());
    assert.doesNotMatch(prose,/<nav\b|<footer\b|synthetic comments hook/);
    for(const value of ['<h2 id="fictional-section">','<strong>native emphasis</strong>','<pre class="highlight"><code>literal &lt;sample&gt; &amp; code','<caption>Fictional specimen notes</caption>','<th scope="row">Sample A</th>','<th scope="col">Specimen</th>',`<img src="${baseurl}/assets/prose-diagram.svg" width="1200" height="600" alt="Three circles joined by a horizontal line." />`]) once(prose,value);
    const footer=html.match(/<footer class="ts-article-footer">([\s\S]*?)<\/footer>/)?.[1];
    assert.ok(footer,'Missing article footer');
    assert.ok(html.indexOf('class="ts-article-footer"') > html.indexOf('<!-- article-body-end -->'));
    assert.ok(html.indexOf('class="ts-article-footer"') < html.indexOf('</article>'));
    const position=selected.indexOf(item), expected=[];
    if(position>0) expected.push(['prev',selected[position-1],'Previous article']);
    if(position<selected.length-1) expected.push(['next',selected[position+1],'Next article']);
    assert.deepEqual([...footer.matchAll(/<a rel="(prev|next)" href="([^"]+)">([^<]+)<\/a>/g)].map(m=>m.slice(1)),expected.map(([rel,p,label])=>[rel,`${baseurl}/${p[0]}`,`${label}: ${p[1]}`]));
    assert.equal((footer.match(/<a\b/g) ?? []).length,expected.length);
    if(expected.length) assert.equal(navs[1][1],'Adjacent articles');
    else assert.doesNotMatch(footer,/<nav\b/);
  }
  const index=read('index.html');
  assert.equal(index.includes('No posts yet.'),scenario === 'empty');
  assert.deepEqual([...index.matchAll(/<h2><a href="([^"]+)">([^<]+)<\/a><\/h2>/g)].map(m=>m.slice(1)),[...selected].reverse().map(p=>[`${baseurl}/${p[0]}`,p[1]]));
  for(const [i,entry] of entries.entries()) {
    const item=[...selected].reverse()[i], url=`${origin}/${item[0]}`;
    once(entry,`<id>${url.slice(0,-5)}</id>`); // Default dated routes only; no custom-permalink claim.
    once(entry,`<link href="${url}" rel="alternate" type="text/html" title="${item[2].replaceAll('&amp;','&amp;amp;')}" />`);
    once(entry,`<content type="html" xml:base="${url}"><![CDATA[${bodies.get(item[0])}]]></content>`);
    once(entry,`<author><name>${(full ? pageAuthor : siteAuthor).replaceAll('&','&amp;')}</name></author>`);
    once(entry,`<published>${item[0].slice(0,10).replaceAll('/','-')}T03:04:05+00:00</published>`);
  }
}
if(process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const args=process.argv.slice(2);
  assert.ok(args.length === 8 && args[0] === '--directory' && args[2] === '--scenario' && args[4] === '--baseurl' && args[6] === '--environment',
    'Usage: node scripts/verify-jekyll-article.js --directory PATH --scenario sequence|single|empty --baseurl ""|/blog --environment production|development');
  verifyJekyllArticle({directory:args[1],scenario:args[3],baseurl:args[5],environment:args[7]});
  console.log('Anonymous article output contracts passed; browser/migration acceptance remains unverified.');
}
