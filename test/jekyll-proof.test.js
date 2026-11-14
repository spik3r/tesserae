import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const read = path => readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('Liquid source escapes text and uses baseurl-aware internal links (structural only)',()=>{
  const header = read('jekyll/_includes/tesserae/header.html');
  const summary = read('jekyll/_includes/tesserae/post-summary.html');
  const layout = read('jekyll/fixture/_layouts/default.html');
  for (const field of ['title','description']) assert.ok(header.includes(`include.${field} | escape`));
  for (const field of ['title','description']) assert.ok(summary.includes(`include.post.${field} | escape`));
  assert.ok(summary.includes('tag | escape'));
  assert.ok(summary.includes('include.post.url | relative_url | escape'));
  assert.ok(layout.includes("'/assets/tesserae.css' | relative_url | escape"));
  assert.doesNotMatch(header+summary+layout, /<script\b|<iframe\b|\|\s*markdownify/);
});

test('preparation creates a fresh synthetic fixture with exact current CSS and includes',()=>{
  const path = execFileSync(process.execPath,[fileURLToPath(new URL('../scripts/jekyll-fixture.js',import.meta.url))],{encoding:'utf8'}).trim();
  try {
    assert.equal(readFileSync(join(path,'assets/tesserae.css'),'utf8'),read('html/tesserae.css'));
    assert.equal(readFileSync(join(path,'assets/prose-diagram.svg'),'utf8'),read('html/assets/prose-diagram.svg'));
    for (const file of ['header.html','post-summary.html']) assert.equal(readFileSync(join(path,'_includes/tesserae',file),'utf8'),read(`jekyll/_includes/tesserae/${file}`));
    assert.equal(readFileSync(join(path,'_layouts/post.html'),'utf8'),read('jekyll/fixture/_layouts/post.html'));
    const gemfile = readFileSync(join(path,'Gemfile'),'utf8');
    for (const [name,version] of [['jekyll','3.10.0'],['liquid','4.0.4'],['kramdown','2.4.0'],['kramdown-parser-gfm','1.1.0'],['rouge','3.30.0']]) {
      assert.ok(gemfile.includes(`gem "${name}", "= ${version}"`), `${name} matches the inspected rendering subset`);
    }
    assert.ok(existsSync(join(path,'_posts/2020-01-02-synthetic-notes.md')));
    assert.ok(!existsSync(join(path,'_site')),'preparation must not imply a Jekyll build');
    assert.match(readFileSync(join(path,'_config.yml'),'utf8'), /baseurl: \/synthetic-preview/);
  } finally { rmSync(path,{recursive:true,force:true}); }
});


test('optional fixture scenarios exercise absent post metadata and the empty post list (preparation only)',()=>{
  const script = fileURLToPath(new URL('../scripts/jekyll-fixture.js',import.meta.url));
  for (const scenario of ['full', 'minimal', 'empty']) {
    const path = execFileSync(process.execPath,[script,'--scenario',scenario],{encoding:'utf8'}).trim();
    try {
      const post = join(path,'_posts/2020-01-02-synthetic-notes.md');
      assert.equal(existsSync(post), scenario !== 'empty');
      if (scenario !== 'empty') {
        const source = readFileSync(post,'utf8');
        assert.match(source, /^layout: post$/m);
        assert.equal(/^description:/m.test(source),scenario === 'full');
        assert.equal(/^tags:/m.test(source),scenario === 'full');
      }
      assert.ok(!existsSync(join(path,'_site')));
      assert.equal(readFileSync(join(path,'assets/tesserae.css'),'utf8'),read('html/tesserae.css'));
    } finally { rmSync(path,{recursive:true,force:true}); }
  }
  for (const args of [['--scenario'],['--scenario','unknown'],['--output','/tmp'],['--scenario','empty','extra']]) {
    assert.throws(()=>execFileSync(process.execPath,[script,...args],{stdio:'pipe'}), /Usage:/);
  }
});

test('prose post layout wraps trusted Jekyll content without changing the document shell',()=>{
  const layout = read('jekyll/fixture/_layouts/post.html');
  assert.match(layout, /^---\nlayout: default\n---/);
  assert.match(layout, /<article class="ts-prose">{{ content }}<\/article>/);
  assert.doesNotMatch(layout, /markdownify|escape|<h1|<script/);
  const post = read('jekyll/fixture/_posts/2020-01-02-synthetic-notes.md');
  assert.match(post, /^## Sample list$/m);
  assert.match(post, /^> This quotation is invented/m);
  assert.match(post, /```text\nfictional <seedling> & notes/);
});

test('summary heading composition selects fixed h2/h3 tags, never caller markup',()=>{
  const summary=read('jekyll/_includes/tesserae/post-summary.html');
  assert.match(summary, /assign tesserae_heading_tag = "h2"/);
  assert.match(summary, /include.heading_level == 3 or include.heading_level == "3"/);
  assert.match(summary, /assign tesserae_heading_tag = "h3"/);
  assert.equal((summary.match(/assign tesserae_heading_tag/g)||[]).length,2);
  assert.doesNotMatch(summary, /{{\s*include.heading_level/);
  const source=read('jekyll/fixture/heading-levels.html');
  for(const option of ['heading_level=3','heading_level="3"','heading_level=6',`heading_level='3 onclick="example"'`]) assert.ok(source.includes(option));
  assert.match(source, /<h2 id="nested-heading">/);
});
