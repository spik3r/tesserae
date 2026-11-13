import {cpSync, mkdirSync, mkdtempSync, copyFileSync, unlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

// Scenarios change only our known synthetic post, never an existing user site.
const args = process.argv.slice(2);
const scenario = args.length === 0 ? 'full' : args.length === 2 && args[0] === '--scenario' ? args[1] : undefined;
if (!['full', 'empty', 'minimal'].includes(scenario)) {
  throw new TypeError('Usage: node scripts/jekyll-fixture.js [--scenario full|empty|minimal]');
}

// Prepare only a NEW disposable directory. Never mutate a user's existing site.
const source = fileURLToPath(new URL('../jekyll/fixture/', import.meta.url));
const target = mkdtempSync(join(tmpdir(), 'tesserae-jekyll-fixture-'));
cpSync(source, target, {recursive:true});
mkdirSync(join(target, '_includes'), {recursive:true});
cpSync(new URL('../jekyll/_includes/tesserae', import.meta.url), join(target, '_includes/tesserae'), {recursive:true});
mkdirSync(join(target, 'assets'), {recursive:true});
copyFileSync(new URL('../html/tesserae.css', import.meta.url), join(target, 'assets/tesserae.css'));
const post = join(target, '_posts/2020-01-02-synthetic-notes.md');
if (scenario === 'empty') unlinkSync(post);
if (scenario === 'minimal') writeFileSync(post, `---
layout: default
title: 'Minimal fictional post'
---
# Minimal fictional post

Synthetic content without optional description or tags.
`);
console.log(target);
