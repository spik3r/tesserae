import {cpSync, mkdirSync, mkdtempSync, copyFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

// Prepare only a NEW disposable directory. Never mutate a user's existing site.
const source = fileURLToPath(new URL('../jekyll/fixture/', import.meta.url));
const target = mkdtempSync(join(tmpdir(), 'tesserae-jekyll-fixture-'));
cpSync(source, target, {recursive:true});
mkdirSync(join(target, '_includes'), {recursive:true});
cpSync(new URL('../jekyll/_includes/tesserae', import.meta.url), join(target, '_includes/tesserae'), {recursive:true});
mkdirSync(join(target, 'assets'), {recursive:true});
copyFileSync(new URL('../html/tesserae.css', import.meta.url), join(target, 'assets/tesserae.css'));
console.log(target);
