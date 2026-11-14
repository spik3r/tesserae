import {cpSync, mkdirSync, mkdtempSync, copyFileSync, readFileSync, writeFileSync, appendFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const args = process.argv.slice(2);
const scenario = args.length === 0 ? 'full' : args.length === 2 && args[0] === '--scenario' ? args[1] : undefined;
if (!['full', 'minimal'].includes(scenario)) {
  throw new TypeError('Usage: node scripts/jekyll-metadata-fixture.js [--scenario full|minimal]');
}

// No target argument: preparation must never overwrite a real site.
const target = mkdtempSync(join(tmpdir(), 'tesserae-metadata-fixture-'));
cpSync(new URL('../jekyll/metadata-fixture/', import.meta.url), target, {recursive:true});
mkdirSync(join(target, 'assets'));
copyFileSync(new URL('../html/tesserae.css', import.meta.url), join(target, 'assets/tesserae.css'));
// Share rendering pins with the original proof; add only the two inspected plugins.
const gems = readFileSync(new URL('../jekyll/fixture/Gemfile', import.meta.url), 'utf8');
writeFileSync(join(target, 'Gemfile'), `${gems}\ngem "jekyll-seo-tag", "= 2.8.0"\ngem "jekyll-feed", "= 0.17.0"\n`);
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
