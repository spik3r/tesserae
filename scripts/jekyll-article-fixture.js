import {execFileSync} from 'node:child_process';
import {cpSync, copyFileSync, readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const options = {scenario:'sequence',stack:'subset'};
const args = process.argv.slice(2), seen = new Set();
const usage = 'Usage: node scripts/jekyll-article-fixture.js [--scenario sequence|single|empty] [--stack subset|pages]';
for (let i=0;i<args.length;i+=2) {
  if (!['--scenario','--stack'].includes(args[i]) || seen.has(args[i]) || args[i+1] === undefined) throw new TypeError(usage);
  seen.add(args[i]); options[args[i].slice(2)] = args[i+1];
}
if (!['sequence','single','empty'].includes(options.scenario) || !['subset','pages'].includes(options.stack)) throw new TypeError(usage);
// Compose existing main-only profiles into a NEW disposable site. No destination input.
const metadataCase = {sequence:'full',single:'site-author',empty:'minimal'}[options.scenario];
const target = execFileSync(process.execPath,[fileURLToPath(new URL('./jekyll-metadata-fixture.js',import.meta.url)),
  '--scenario',metadataCase,'--stack',options.stack],{encoding:'utf8'}).trim();
cpSync(new URL('../jekyll/article-fixture/',import.meta.url),target,{recursive:true});
cpSync(new URL('../jekyll/_includes/tesserae/',import.meta.url),join(target,'_includes/tesserae'),{recursive:true});
copyFileSync(new URL('../html/assets/prose-diagram.svg',import.meta.url),join(target,'assets/prose-diagram.svg'));
const post = join(target,'_posts/2020-01-02-synthetic-notes.md');
const source = readFileSync(post,'utf8') + '\n{% include article-body.md %}\n';
if (options.scenario === 'empty') unlinkSync(post);
else writeFileSync(post,source);
if (options.scenario === 'sequence') {
  for (const [day,name,title] of [['01','first','First <sample> & notes'],['03','last','Last "sample" & notes']]) {
    writeFileSync(join(target,`_posts/2020-01-${day}-${name}.md`),source
      .replace(/^title:.*$/m,`title: '${title}'`).replace('2020-01-02 03:04:05',`2020-01-${day} 03:04:05`));
  }
}
console.log(target);
