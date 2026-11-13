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
    for (const file of ['header.html','post-summary.html']) assert.equal(readFileSync(join(path,'_includes/tesserae',file),'utf8'),read(`jekyll/_includes/tesserae/${file}`));
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
