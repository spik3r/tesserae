import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync, symlinkSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyJekyllMetadata} from '../scripts/verify-jekyll-metadata.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const prepare = fileURLToPath(new URL('../scripts/jekyll-metadata-fixture.js', import.meta.url));
const verifier = fileURLToPath(new URL('../scripts/verify-jekyll-metadata.js', import.meta.url));
const postPath = '2020/01/02/synthetic-notes.html';
const permalinkPath = 'archive/fictional-note/index.html';
const analytics = '<!-- synthetic analytics hook; deliberately no provider code -->';

// Recorded plugin output at /blog in production; trailing whitespace and the
// feed build time were normalised. These tests check output, not Ruby execution.
function withOutput(scenario, baseurl, environment, fn) {
  const directory = mkdtempSync(join(tmpdir(), 'tesserae-metadata-output-'));
  try {
    const outputPost = scenario === 'permalink' ? permalinkPath : postPath;
    for (const [source, target] of [['index.html','index.html'], ['post.html',outputPost], ['feed.xml','feed.xml']]) {
      const path = join(directory, target);
      mkdirSync(join(path, '..'), {recursive:true});
      let content = read(`test/fixtures/jekyll-metadata/${scenario}/${source}`).replaceAll('/blog', baseurl);
      if (environment === 'development') content = content.replace(analytics, '');
      writeFileSync(path, content);
    }
    mkdirSync(join(directory, 'assets'));
    writeFileSync(join(directory, 'assets/tesserae.css'), read('html/tesserae.css'));
    fn({directory, scenario, baseurl, environment});
  } finally { rmSync(directory, {recursive:true, force:true}); }
}

test('metadata fixture preparation isolates sources, pins plugins and omits optional values', () => {
  for (const scenario of ['full','minimal','site-author','permalink']) {
    const directory = execFileSync(process.execPath, [prepare,'--scenario',scenario], {encoding:'utf8'}).trim();
    try {
      const get = file => readFileSync(join(directory, file), 'utf8');
      assert.equal(get('assets/tesserae.css'), read('html/tesserae.css'));
      assert.equal(get('Gemfile'), `${read('jekyll/fixture/Gemfile')}\ngem "jekyll-seo-tag", "= 2.8.0"\ngem "jekyll-feed", "= 0.17.0"\n`);
      assert.match(get('_config.yml'), /plugins:\n  - jekyll-seo-tag\n  - jekyll-feed/);
      assert.doesNotMatch(get('_config.yml'), /^(theme|permalink):/m);
      assert.equal(/^author: 'Fictional Site Editor & Team'$/m.test(get('_config.yml')), scenario !== 'minimal');
      const full = ['full','permalink'].includes(scenario);
      assert.equal(/^lang: en-AU$/m.test(get('_config.yml')), full);
      assert.equal(/^google_analytics:/m.test(get('_config.yml')), full);
      assert.equal(/^  date_format:/m.test(get('_config.yml')), full);
      const post = get('_posts/2020-01-02-synthetic-notes.md');
      assert.equal(/^author:/m.test(post), full);
      assert.equal(/^lang: en-GB$/m.test(post), full);
      assert.equal(/^permalink: \/archive\/fictional-note\/$/m.test(post), scenario === 'permalink');
      assert.ok(!existsSync(join(directory, '_site')));
      for (const file of ['_layouts/default.html','_layouts/post.html','_includes/head.html']) {
        assert.equal(get(file), read(`jekyll/metadata-fixture/${file}`));
      }
    } finally { rmSync(directory, {recursive:true, force:true}); }
  }
  for (const args of [['--scenario','empty'],['--output','/tmp'],['--scenario'],['extra']]) {
    assert.throws(() => execFileSync(process.execPath, [prepare,...args], {stdio:'pipe'}), /Usage:/);
  }
});

test('metadata verifier accepts sixteen recorded-output combinations (no Ruby execution)', () => {
  for (const scenario of ['full','minimal','site-author','permalink']) for (const baseurl of ['','/blog']) for (const environment of ['development','production']) {
    withOutput(scenario, baseurl, environment, verifyJekyllMetadata);
  }
});

test('Pages profile adds a pinned plugin group and disables the default theme without building', () => {
  for (const args of [['--stack','pages'],['--stack','pages','--scenario','site-author'],['--scenario','minimal','--stack','pages'],['--scenario','permalink','--stack','pages']]) {
    const directory = execFileSync(process.execPath,[prepare,...args],{encoding:'utf8'}).trim();
    try {
      const get = path => readFileSync(join(directory,path),'utf8');
      assert.match(get('Gemfile'), /gem "github-pages", "= 232", group: :jekyll_plugins/);
      assert.match(get('_config.yml'), /^theme: null$/m);
      assert.match(get('_config.yml'), /^repository: fictional\/fixture$/m);
      assert.equal(get('.tesserae-pages-fixture'), 'v1\n');
      assert.equal(get('assets/tesserae.css'), read('html/tesserae.css'));
      assert.ok(!existsSync(join(directory,'Gemfile.lock')));
      assert.ok(!existsSync(join(directory,'_site')));
    } finally { rmSync(directory,{recursive:true,force:true}); }
  }
  for (const args of [['--stack'],['--stack','other'],['--stack','pages','--stack','pages'],['--scenario','full','--scenario','minimal']]) {
    assert.throws(() => execFileSync(process.execPath,[prepare,...args],{stdio:'pipe'}), /Usage:/);
  }
  const directory = execFileSync(process.execPath,[prepare,'--stack','subset'],{encoding:'utf8'}).trim();
  try {
    assert.doesNotMatch(readFileSync(join(directory,'Gemfile'),'utf8'), /github-pages/);
    assert.ok(!existsSync(join(directory,'.tesserae-pages-fixture')));
  } finally { rmSync(directory,{recursive:true,force:true}); }
});

test('author checks distinguish site fallback, page precedence and absent names', () => {
  for (const [scenario,file,before,after] of [
    ['full',postPath,'"name":"Fictional Writer & Co"','"name":"Fictional Site Editor & Team"'],
    ['full',postPath,'>Fictional Writer &amp; Co</span>','>Fictional Site Editor &amp; Team</span>'],
    ['full','feed.xml','<name>Fictional Writer &amp; Co</name>','<name>Fictional Site Editor &amp; Team</name>'],
    ['site-author',postPath,'"name":"Fictional Site Editor & Team"','"name":"Fictional Writer & Co"'],
    ['site-author',postPath,'>Fictional Site Editor &amp; Team</span>','></span>'],
    ['site-author','index.html','content="Fictional Site Editor & Team"','content=""'],
    ['site-author','feed.xml','<name>Fictional Site Editor &amp; Team</name>','<name></name>'],
    ['minimal','feed.xml','<name></name>','<name>Invented Author</name>'],
    ['minimal',postPath,'</header>','<span class="p-author h-card">Invented Author</span></header>']
  ]) withOutput(scenario,'/blog','production', options => {
    const path = join(options.directory,file);
    const source = readFileSync(path,'utf8');
    assert.ok(source.includes(before), `Invalid author corruption setup: ${before}`);
    writeFileSync(path,source.replace(before,after));
    assert.throws(() => verifyJekyllMetadata(options), `${scenario}: ${file}`);
  });
  withOutput('site-author','/blog','production', options => {
    const path = join(options.directory,'feed.xml');
    const source = readFileSync(path,'utf8');
    const changed = source.replace(/(<entry\b[\s\S]*?<name>)[^<]*(<\/name>)/, '$1Wrong Entry Author$2');
    assert.notEqual(changed,source);
    writeFileSync(path,changed);
    assert.throws(() => verifyJekyllMetadata(options));
  });
});

test('custom permalinks keep output files, public URLs and Atom IDs distinct', () => {
  const url = 'https://example.invalid/blog/archive/fictional-note/';
  const oldUrl = `https://example.invalid/blog/${postPath}`;
  for (const [file,before,after] of [
    ['index.html','href="/blog/archive/fictional-note/"',`href="/blog/${postPath}"`],
    [permalinkPath,`rel="canonical" href="${url}"`,`rel="canonical" href="${oldUrl}"`],
    [permalinkPath,`property="og:url" content="${url}"`,`property="og:url" content="${url}index.html"`],
    [permalinkPath,`"url":"${url}"`,`"url":"${oldUrl}"`],
    [permalinkPath,`"@id":"${url}"`,`"@id":"${oldUrl}"`],
    [permalinkPath,'class="u-url" href="/blog/archive/','class="u-url" href="/archive/'],
    ['feed.xml',`href="${url}" rel="alternate"`,`href="${oldUrl}" rel="alternate"`],
    ['feed.xml',`xml:base="${url}"`,`xml:base="${oldUrl}"`],
    ['feed.xml','<id>https://example.invalid/blog/archive/synthetic-notes</id>',`<id>${url}</id>`],
    ['feed.xml','<id>https://example.invalid/blog/archive/synthetic-notes</id>','<id>https://example.invalid/blog/2020/01/02/synthetic-notes</id>']
  ]) withOutput('permalink','/blog','production', options => {
    const path = join(options.directory,file);
    const source = readFileSync(path,'utf8');
    assert.ok(source.includes(before), `Invalid permalink corruption setup: ${before}`);
    writeFileSync(path,source.replace(before,after));
    assert.throws(() => verifyJekyllMetadata(options), `${file}: ${before}`);
  });
  withOutput('permalink','/blog','production', options => {
    const stale = join(options.directory,postPath);
    mkdirSync(join(stale,'..'),{recursive:true});
    writeFileSync(stale,readFileSync(join(options.directory,permalinkPath)));
    assert.throws(() => verifyJekyllMetadata(options), /routes\/assets/);
  });
});

test('metadata verifier rejects route, SEO, feed, semantic and stylesheet regressions', () => {
  const corruptions = [
    ['index.html','href="/blog/2020/','href="/2020/'],
    ['index.html','<html lang="en-AU">','<html lang="en">'],
    [postPath,'<html lang="en-GB">','<html lang="en-AU">'],
    [postPath,'rel="canonical" href="https://example.invalid/blog/','rel="canonical" href="https://example.invalid/blog/blog/'],
    [postPath,'property="og:url"','property="wrong:url"'],
    [postPath,'"@type":"BlogPosting"','"@type":"WebSite"'],
    [postPath,'"datePublished":"2020-01-02','"datePublished":"2021-01-02'],
    [postPath,'"@id":"https://example.invalid/blog/','"@id":"https://example.invalid/'],
    [postPath,'application/ld+json','text/javascript'],
    [postPath,'"@context":','not-json:'],
    [postPath,'post h-entry','post'],
    [postPath,'p-name','wrong-name'],
    [postPath,'dt-published','wrong-date'],
    [postPath,'2020/01/02\n','January 2, 2020\n'],
    [postPath,'p-author h-card','p-author'],
    [postPath,'Fictional Writer &amp; Co','Fictional Writer & Co'],
    [postPath,'post-content e-content ts-prose','post-content e-content'],
    [postPath,'<strong>native emphasis</strong>','&lt;strong&gt;native emphasis&lt;/strong&gt;'],
    [postPath,'class="u-url" href="/blog/','class="u-url" href="/'],
    [postPath,'href="/blog/assets/','href="/assets/'],
    [postPath,'</head>','<link rel="stylesheet" href="/assets/minima.css"></head>'],
    [postPath,'</head>','<script src="https://example.invalid/script.js"></script></head>'],
    [postPath,analytics,''],
    [postPath,'synthetic comments hook','missing comments hook'],
    [postPath,'href="https://example.invalid/blog/feed.xml"','href="https://example.invalid/feed.xml"'],
    ['feed.xml','href="https://example.invalid/blog/feed.xml"','href="https://example.invalid/feed.xml"'],
    ['feed.xml','href="https://example.invalid/blog/2020/','href="https://example.invalid/2020/'],
    ['feed.xml','<published>2020-01-02','<published>2021-01-02'],
    ['feed.xml','Fictional Writer &amp; Co','Wrong Writer'],
    ['feed.xml','xml:lang="en-GB"','xml:lang="en-AU"'],
    ['feed.xml','<strong>native emphasis</strong>','Lost content'],
    ['assets/tesserae.css',':root',':wrong-root']
  ];
  for (const [file, before, after] of corruptions) withOutput('full','/blog','production', options => {
    const path = join(options.directory, file);
    const source = readFileSync(path, 'utf8');
    assert.ok(source.includes(before), `Invalid corruption setup: ${before}`);
    writeFileSync(path, source.replace(before, after));
    assert.throws(() => verifyJekyllMetadata(options), `${file}: ${before}`);
  });
  withOutput('full','/blog','production', options => {
    writeFileSync(join(options.directory, 'stale-route.html'), '<p>stale</p>');
    assert.throws(() => verifyJekyllMetadata(options), /routes\/assets/);
  });
  withOutput('minimal','','development', options => {
    const path = join(options.directory, postPath);
    writeFileSync(path, readFileSync(path, 'utf8').replace('</head>', `${analytics}</head>`));
    assert.throws(() => verifyJekyllMetadata(options), /Analytics hook/);
  });
});

test('metadata verifier CLI validates options and runs through a symlink', () => {
  withOutput('minimal','','development', options => {
    for (const patch of [{scenario:'empty'}, {baseurl:'/blog/'}, {baseurl:'https://example.invalid'}, {environment:'other'}]) {
      assert.throws(() => verifyJekyllMetadata({...options, ...patch}));
    }
    const aliasDir = mkdtempSync(join(tmpdir(), 'tesserae-metadata-cli-'));
    try {
      const alias = join(aliasDir, 'verify.js');
      symlinkSync(verifier, alias);
      const args = ['--directory',options.directory,'--scenario','minimal','--baseurl','','--environment','development'];
      assert.match(execFileSync(process.execPath, [alias,...args], {encoding:'utf8'}), /metadata contracts passed/);
      assert.throws(() => execFileSync(process.execPath, [alias,...args,'extra'], {stdio:'pipe'}), /Usage:/);
    } finally { rmSync(aliasDir, {recursive:true, force:true}); }
  });
});
