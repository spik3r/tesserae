import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const posts=[
  ['2020/01/03/last.html','Last &quot;sample&quot; &amp; notes','Plain &lt;em&gt;last&lt;/em&gt; &amp; notes.'],
  ['2020/01/02/synthetic-notes.html','Synthetic notes &amp; &quot;quotes&quot;',null],
  ['2020/01/01/first.html','First &lt;sample&gt; &amp; notes','Fallback &lt;note&gt; &amp; text.']
];
const compact=value=>value.replace(/>\s+</g,'><').trim();
function files(directory,prefix='') {
  return readdirSync(join(directory,prefix),{withFileTypes:true}).flatMap(entry=>{
    assert.ok(entry.isFile() || entry.isDirectory(),'Unexpected non-regular output');
    return entry.isDirectory()?files(directory,`${prefix}${entry.name}/`):[`${prefix}${entry.name}`];
  });
}

// Exact anonymous archive contracts, NOT an HTML sanitizer or accessibility audit.
export function verifyJekyllArchive({directory,scenario,baseurl}) {
  assert.ok(['populated','empty'].includes(scenario),'Invalid scenario');
  assert.ok(['','/blog'].includes(baseurl),'Invalid base path');
  const selected=scenario==='populated'?posts:[];
  const inventory=['index.html','trusted.html','boundaries.html','about.html','feed.xml',
    'assets/tesserae.css','assets/prose-diagram.svg',...selected.map(p=>p[0])];
  assert.deepEqual(files(directory).sort(),inventory.sort(),'Unexpected output inventory');
  const read=path=>readFileSync(join(directory,path),'utf8');
  assert.equal(read('assets/tesserae.css'),readFileSync(new URL('../html/tesserae.css',import.meta.url),'utf8'));
  function archive(body,{trusted=false,heading='h2'}={}) {
    const cards=[...body.matchAll(/<article class="ts-card ts-wide">([\s\S]*?)<\/article>/g)].map(m=>compact(m[1]));
    assert.equal(cards.length,selected.length,'Unexpected article count');
    assert.equal((body.match(/<article\b/g)??[]).length,cards.length);
    assert.equal((body.match(/No articles yet\./g)??[]).length,selected.length?0:1);
    assert.equal((body.match(new RegExp(`<${heading}\\b`,'g'))??[]).length,cards.length,'Unexpected heading count');
    for(const [i,[path,title,description]] of selected.entries()) {
      const href=`${baseurl}/${path}`, date=path.slice(0,10).replaceAll('/','-');
      const excerpt=trusted && i<2
        ? `<div class="ts-prose"><p>Trusted <strong>fictional excerpt</strong> with <a href="${baseurl}/about.html">local context</a>.</p></div>`
        : description ? `<p class="ts-archive-description">${description}</p>` : '';
      assert.equal(cards[i],`<${heading}><a href="${href}">${title}</a></${heading}><p><time datetime="${date}T03:04:05+00:00">${path.slice(0,10)}</time></p>${excerpt}<p><a href="${href}">Read article: ${title}</a></p>`,'Archive content/order/trust contract differs');
    }
    if(!trusted) assert.doesNotMatch(body,/Trusted|class="ts-prose"|<strong>/);
    assert.doesNotMatch(body,/<script\b|<iframe\b|<em>|<note>|<sample>|<button\b|aria-label="Read|tabindex=/i);
  }
  for(const name of ['index.html','trusted.html','boundaries.html']) {
    const html=read(name), body=html.match(/<main id="main-content" class="ts-article-main" tabindex="-1">([\s\S]*?)<\/main>/)?.[1];
    assert.ok(body,'Missing main');
    assert.equal((html.match(/<main\b/g)??[]).length,1);
    assert.equal((body.match(/<h1\b/g)??[]).length,1);
    assert.equal((html.match(/rel="stylesheet"/g)??[]).length,1);
    assert.ok(html.includes(`<link rel="stylesheet" href="${baseurl}/assets/tesserae.css">`));
    assert.ok(html.includes('<a class="ts-skip-link" href="#main-content">Skip to content</a>'));
    for(const [,href] of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
      if(href.startsWith('#')) assert.ok(html.includes(`id="${href.slice(1)}"`));
      else {
        assert.ok(href.startsWith(`${baseurl}/`),'Wrong base path');
        assert.ok(inventory.includes(href.slice(baseurl.length+1)||'index.html'),'Missing local destination');
      }
    }
    if(name==='boundaries.html') {
      const sections=[...body.matchAll(/<section id="(false|string|number|missing)">([\s\S]*?)<\/section>/g)];
      assert.deepEqual(sections.map(m=>m[1]),['false','string','number','missing']);
      for(const [, ,section] of sections) archive(section,{heading:'h3'});
    } else archive(body,{trusted:name==='trusted.html'});
  }
}
if(process.argv[1] && pathToFileURL(process.argv[1]).href===import.meta.url) {
  const args=process.argv.slice(2);
  assert.ok(args.length===6 && args[0]==='--directory' && args[2]==='--scenario' && args[4]==='--baseurl',
    'Usage: node scripts/verify-jekyll-archive.js --directory PATH --scenario populated|empty --baseurl ""|/blog');
  verifyJekyllArchive({directory:args[1],scenario:args[3],baseurl:args[5]});
  console.log('Anonymous archive contracts passed; browser and migration acceptance remain unverified.');
}
