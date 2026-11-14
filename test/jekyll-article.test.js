import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,cpSync,copyFileSync,readFileSync,writeFileSync,mkdirSync,rmSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
import {verifyJekyllArticle} from '../scripts/verify-jekyll-article.js';

const prepare=fileURLToPath(new URL('../scripts/jekyll-article-fixture.js',import.meta.url));
const post='2020/01/02/synthetic-notes.html';
const analytics='<!-- synthetic analytics hook; deliberately no provider code -->';
function walk(directory) {
  return readdirSync(directory,{withFileTypes:true}).flatMap(e=>e.isDirectory() ? walk(join(directory,e.name)) : [join(directory,e.name)]);
}
function recorded(scenario,baseurl,environment,fn) {
  const directory=mkdtempSync(join(tmpdir(),'tesserae-article-output-'));
  try {
    cpSync(new URL(`./fixtures/jekyll-article/${scenario}/`,import.meta.url),directory,{recursive:true});
    for(const file of walk(directory)) {
      let source=readFileSync(file,'utf8').replaceAll('/blog',baseurl);
      if(environment==='development') source=source.replaceAll(analytics,'');
      writeFileSync(file,source);
    }
    mkdirSync(join(directory,'assets'));
    copyFileSync(new URL('../html/tesserae.css',import.meta.url),join(directory,'assets/tesserae.css'));
    copyFileSync(new URL('../html/assets/prose-diagram.svg',import.meta.url),join(directory,'assets/prose-diagram.svg'));
    fn({directory,scenario,baseurl,environment});
  } finally {rmSync(directory,{recursive:true,force:true});}
}

test('article preparation isolates three cases and composes unchanged pinned profiles',()=>{
  const targets=new Set();
  for(const scenario of ['sequence','single','empty']) for(const stack of ['subset','pages']) {
    const directory=execFileSync(process.execPath,[prepare,'--scenario',scenario,'--stack',stack],{encoding:'utf8'}).trim();
    try {
      assert.ok(!targets.has(directory));targets.add(directory);
      const read=path=>readFileSync(join(directory,path),'utf8');
      assert.equal(readdirSync(join(directory,'_posts')).length,scenario==='sequence'?3:scenario==='single'?1:0);
      assert.equal(read('_includes/head.html'),readFileSync(new URL('../jekyll/metadata-fixture/_includes/head.html',import.meta.url),'utf8'));
      assert.equal(read('assets/tesserae.css'),readFileSync(new URL('../html/tesserae.css',import.meta.url),'utf8'));
      assert.match(read('_layouts/default.html'),/where_exp: 'item', 'item.nav_order' \| sort: 'nav_order'/);
      assert.match(read('_layouts/post.html'),/articleBody">{{ content }}<\/div><!-- article-body-end -->/);
      assert.match(read('_layouts/post.html'),/page.author \| default: site.author/);
      assert.doesNotMatch(read('_config.yml'),/^permalink:/m);
      if(stack==='pages') {
        assert.match(read('Gemfile'),/gem "github-pages", "= 232", group: :jekyll_plugins/);
        assert.equal(read('.tesserae-pages-fixture'),'v1\n');
        assert.match(read('_config.yml'),/theme: null/);
      } else assert.doesNotMatch(read('Gemfile'),/github-pages/);
      if(scenario!=='empty') assert.match(read('_posts/2020-01-02-synthetic-notes.md'),/{% include article-body.md %}/);
    } finally {rmSync(directory,{recursive:true,force:true});}
  }
  for(const args of [['--destination','unused'],['--scenario','unknown'],['--stack','unknown'],['--scenario','single','--scenario','empty']]) {
    const result=spawnSync(process.execPath,[prepare,...args],{encoding:'utf8'});
    assert.notEqual(result.status,0);assert.equal(result.stdout,'');
  }
});

test('article verifier accepts recorded contracts across cases, paths and hook environments',()=>{
  for(const scenario of ['sequence','single','empty']) for(const baseurl of ['','/blog']) for(const environment of ['production','development']) {
    recorded(scenario,baseurl,environment,verifyJekyllArticle);
  }
});

test('article verifier rejects shell, neighbours, metadata, content and asset regressions',()=>{
  for(const [file,before,after] of [
    ['index.html','href="#main-content"','href="#missing"'],
    ['index.html','tabindex="-1"','tabindex="0"'],
    ['index.html',' aria-current="page"',''],
    ['about.html','About &lt;fiction&gt; &amp; notes','About <fiction> & notes'],
    [post,'aria-label="Adjacent articles"','aria-label="Site navigation"'],
    [post,'rel="prev" href="/blog/2020/01/01/first.html"','rel="prev" href="/blog/2020/01/03/last.html"'],
    [post,'rel="next" href="/blog/2020/01/03/last.html"','rel="next" href="/2020/01/03/last.html"'],
    [post,'<!-- article-body-end -->',''],
    [post,'<footer class="ts-article-footer">','<div class="ts-article-footer">'],
    [post,'<time class="dt-published" datetime="2020-01-02T03:04:05+00:00"','<time class="dt-published" datetime="2021-01-02T03:04:05+00:00"'],
    [post,'"name":"Fictional Writer & Co"','"name":"Fictional Site Editor & Team"'],
    [post,'literal &lt;sample&gt; &amp; code','literal <sample> & code'],
    [post,'scope="row"','scope="col"'],
    [post,'src="/blog/assets/prose-diagram.svg"','src="/blog/missing.svg"'],
    [post,analytics,''],
    [post,'<!-- synthetic comments hook; deliberately no provider code -->',''],
    [post,'rel="canonical" href="https://example.invalid/blog/','rel="canonical" href="https://example.invalid/blog/blog/'],
    [post,'type="application/ld+json"','type="text/javascript"'],
    ['feed.xml','<id>https://example.invalid/blog/2020/01/02/synthetic-notes</id>','<id>https://example.invalid/blog/wrong</id>'],
    ['assets/tesserae.css',':root','bad-root']
  ]) recorded('sequence','/blog','production',options=>{
    const path=join(options.directory,file), source=readFileSync(path,'utf8');
    assert.ok(source.includes(before),`Invalid corruption: ${before}`);
    writeFileSync(path,source.replace(before,after));
    assert.throws(()=>verifyJekyllArticle(options),`${file}: ${before}`);
  });
  recorded('single','/blog','production',options=>{
    const path=join(options.directory,post);
    writeFileSync(path,readFileSync(path,'utf8').replace('<footer class="ts-article-footer">','<footer class="ts-article-footer"><nav class="ts-article-nav" aria-label="Adjacent articles"><ul></ul></nav>'));
    assert.throws(()=>verifyJekyllArticle(options),/navigation landmark/);
  });
  recorded('empty','','production',options=>{
    writeFileSync(join(options.directory,'stale.html'),'stale post');
    assert.throws(()=>verifyJekyllArticle(options),/inventory/);
  });
});
