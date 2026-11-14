import {cpSync, mkdirSync, mkdtempSync, copyFileSync, readFileSync, writeFileSync, appendFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const args = process.argv.slice(2);
const options = {scenario:'full', stack:'subset'};
const seen = new Set();
const usage = 'Usage: node scripts/jekyll-metadata-fixture.js [--scenario full|minimal|site-author] [--stack subset|pages]';
for (let i = 0; i < args.length; i += 2) {
  const name = args[i].slice(2);
  if (!['--scenario','--stack'].includes(args[i]) || seen.has(name) || args[i + 1] === undefined) throw new TypeError(usage);
  options[name] = args[i + 1];
  seen.add(name);
}
const {scenario, stack} = options;
if (!['full','minimal','site-author'].includes(scenario) || !['subset','pages'].includes(stack)) throw new TypeError(usage);

// No target argument: preparation must never overwrite a real site.
const target = mkdtempSync(join(tmpdir(), 'tesserae-metadata-fixture-'));
cpSync(new URL('../jekyll/metadata-fixture/', import.meta.url), target, {recursive:true});
mkdirSync(join(target, 'assets'));
copyFileSync(new URL('../html/tesserae.css', import.meta.url), join(target, 'assets/tesserae.css'));
// Start with the rendering pins and the two explicit metadata plugins.
const gems = readFileSync(new URL('../jekyll/fixture/Gemfile', import.meta.url), 'utf8');
writeFileSync(join(target, 'Gemfile'), `${gems}\ngem "jekyll-seo-tag", "= 2.8.0"\ngem "jekyll-feed", "= 0.17.0"\n`);
if (stack === 'pages') {
  appendFileSync(join(target, 'Gemfile'), '\ngem "github-pages", "= 232", group: :jekyll_plugins\n');
  // Disable Pages' default theme and avoid discovery from any real Git remote.
  appendFileSync(join(target, '_config.yml'), '\ntheme: null\nrepository: fictional/fixture\n');
  writeFileSync(join(target, '.tesserae-pages-fixture'), 'v1\n');
}
if (scenario !== 'minimal') {
  appendFileSync(join(target, '_config.yml'), "\nauthor: 'Fictional Site Editor & Team'\n");
}
if (scenario === 'full') {
  appendFileSync(join(target, '_config.yml'), `
lang: en-AU
minima:
  date_format: "%Y/%m/%d"
google_analytics: fictional-hook-only
disqus:
  shortname: fictional-hook-only
`);
  const post = join(target, '_posts/2020-01-02-synthetic-notes.md');
  writeFileSync(post, readFileSync(post, 'utf8').replace('layout: post\n', `layout: post
lang: en-GB
author: 'Fictional Writer & Co'
`));
}
console.log(target);
