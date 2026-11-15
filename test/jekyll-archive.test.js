import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,copyFileSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
import {verifyJekyllArchive} from '../scripts/verify-jekyll-archive.js';

const prepare=fileURLToPath(new URL('../scripts/jekyll-archive-fixture.js',import.meta.url));
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
function recorded(scenario,baseurl,fn) {
  const directory=mkdtempSync(join(tmpdir(),'tesserae-archive-output-'));
  try {
    for(const name of ['index.html','trusted.html','boundaries.html']) {
      writeFileSync(join(directory,name),read(`test/fixtures/jekyll-archive/${scenario}/${name}`).replaceAll('/blog',baseurl));
    }
    // Only archive pages are recorded here. Destination stubs exercise link
    // inventory, not post/head/feed rendering (covered by real build checks).
    const destinations=['about.html','feed.xml'];
    if(scenario==='populated') destinations.push('2020/01/01/first.html','2020/01/02/synthetic-notes.html','2020/01/03/last.html');
    for(const name of destinations) {mkdirSync(join(directory,name,'..'),{recursive:true});writeFileSync(join(directory,name),'');}
    mkdirSync(join(directory,'assets'));
    for(const name of ['tesserae.css','prose-diagram.svg']) copyFileSync(new URL(name==='tesserae.css'?'../html/tesserae.css':'../html/assets/prose-diagram.svg',import.meta.url),join(directory,'assets',name));
    fn({directory,scenario,baseurl});
  } finally {rmSync(directory,{recursive:true,force:true});}
}

test('archive preparation composes isolated populated/empty examples with explicit opt-in',()=>{
  for(const scenario of ['populated','empty']) for(const stack of ['subset','pages']) {
    const directory=execFileSync(process.execPath,[prepare,'--scenario',scenario,'--stack',stack],{encoding:'utf8'}).trim();
    try {
      const get=path=>readFileSync(join(directory,path),'utf8');
      assert.equal(readdirSync(join(directory,'_posts')).length,scenario==='populated'?3:0);
      assert.equal(get('_includes/tesserae/archive.html'),read('jekyll/_includes/tesserae/archive.html'));
      assert.equal(get('_layouts/default.html'),read('jekyll/article-fixture/_layouts/default.html'));
      assert.equal(get('assets/tesserae.css'),read('html/tesserae.css'));
      assert.doesNotMatch(get('index.html'),/trusted_excerpts/);
      assert.match(get('trusted.html'),/^trusted_excerpts: true$/m);
      assert.match(get('boundaries.html'),/trusted_excerpts="true"/);
      if(scenario==='populated') {
        assert.match(get('_posts/2020-01-01-first.md'),/^excerpt: ""$/m);
        assert.doesNotMatch(get('_posts/2020-01-02-synthetic-notes.md'),/^description:/m);
      }
      assert.equal(get('Gemfile').includes('github-pages'),stack==='pages');
    } finally {rmSync(directory,{recursive:true,force:true});}
  }
  for(const args of [['--scenario','bad'],['--stack','bad'],['--destination','unused'],['--scenario','empty','--scenario','empty']]) {
    const r=spawnSync(process.execPath,[prepare,...args],{encoding:'utf8'});
    assert.notEqual(r.status,0);assert.equal(r.stdout,'');
  }
});

test('archive contracts accept recorded plain/trusted/empty outputs at root and subpath',()=>{
  for(const scenario of ['populated','empty']) for(const baseurl of ['','/blog']) recorded(scenario,baseurl,verifyJekyllArchive);
  const include=read('jekyll/_includes/tesserae/archive.html');
  assert.match(include,/include\.trusted_excerpts == true/);
  assert.match(include,/post\.description \| escape/);
  assert.doesNotMatch(include,/markdownify|strip_html/);
});

test('archive verifier rejects trust, heading, link, order and empty-state regressions',()=>{
  const rich='<div class="ts-prose"><p>Trusted <strong>fictional excerpt</strong> with <a href="/blog/about.html">local context</a>.</p></div>';
  for(const [file,before,after] of [
    ['index.html','Plain &lt;em&gt;last&lt;/em&gt; &amp; notes.','Plain <em>last</em> &amp; notes.'],
    ['index.html','<p class="ts-archive-description">Plain &lt;em&gt;last&lt;/em&gt; &amp; notes.</p>',rich],
    ['boundaries.html','<p class="ts-archive-description">Plain &lt;em&gt;last&lt;/em&gt; &amp; notes.</p>',rich],
    ['trusted.html',rich,rich.replace('<strong>','&lt;strong&gt;')],
    ['trusted.html','<p class="ts-archive-description">Fallback &lt;note&gt; &amp; text.</p>',rich],
    ['index.html','Read article: Last &quot;sample&quot; &amp; notes','Read article'],
    ['index.html','href="/blog/2020/01/03/last.html"','href="/2020/01/03/last.html"'],
    ['index.html','<h2>','<h3>'],
    ['boundaries.html','<h3>','<h2>'],
    ['index.html','2020-01-03T03:04:05+00:00','not-a-date'],
    ['index.html','Last &quot;sample&quot; &amp; notes','Last <sample> & notes']
  ]) recorded('populated','/blog',options=>{
    const path=join(options.directory,file),source=readFileSync(path,'utf8');
    assert.ok(source.includes(before),'Corruption must apply');
    writeFileSync(path,source.replace(before,after));
    assert.throws(()=>verifyJekyllArchive(options));
  });
  recorded('populated','/blog',options=>{
    const path=join(options.directory,'index.html'),source=readFileSync(path,'utf8');
    const cards=source.match(/<article class="ts-card ts-wide">[\s\S]*?<\/article>/g);
    let i=0;writeFileSync(path,source.replace(/<article class="ts-card ts-wide">[\s\S]*?<\/article>/g,()=>cards[2-i++]));
    assert.throws(()=>verifyJekyllArchive(options));
  });
  recorded('empty','',options=>{
    const path=join(options.directory,'index.html');writeFileSync(path,readFileSync(path,'utf8').replace('No articles yet.',''));
    assert.throws(()=>verifyJekyllArchive(options));
  });
});
