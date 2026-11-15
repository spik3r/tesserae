import {execFileSync} from 'node:child_process';
import {cpSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const options={scenario:'populated',stack:'subset'}, seen=new Set(), args=process.argv.slice(2);
const usage='Usage: node scripts/jekyll-archive-fixture.js [--scenario populated|empty] [--stack subset|pages]';
for(let i=0;i<args.length;i+=2) {
  if(!['--scenario','--stack'].includes(args[i]) || seen.has(args[i]) || args[i+1]===undefined) throw new TypeError(usage);
  seen.add(args[i]);options[args[i].slice(2)]=args[i+1];
}
if(!['populated','empty'].includes(options.scenario) || !['subset','pages'].includes(options.stack)) throw new TypeError(usage);
// Reuse the existing shell and frozen profiles in a NEW disposable directory.
const target=execFileSync(process.execPath,[fileURLToPath(new URL('./jekyll-article-fixture.js',import.meta.url)),
  '--scenario',options.scenario==='populated'?'sequence':'empty','--stack',options.stack],{encoding:'utf8'}).trim();
cpSync(new URL('../jekyll/archive-fixture/',import.meta.url),target,{recursive:true});
if(options.scenario==='populated') {
  for(const [name,description,excerpt] of [
    ['2020-01-01-first',"'Fallback <note> & text.'",'""'],
    ['2020-01-02-synthetic-notes',null,null],
    ['2020-01-03-last',"'Plain <em>last</em> & notes.'",null]
  ]) {
    const path=join(target,`_posts/${name}.md`);
    let source=readFileSync(path,'utf8').replace(/^description:.*\n/m,'');
    if(description) source=source.replace('layout: post\n',`layout: post\ndescription: ${description}\n`);
    if(excerpt!==null) source=source.replace('layout: post\n',`layout: post\nexcerpt: ${excerpt}\n`);
    const boundary=source.indexOf('\n---\n')+5;
    source=source.slice(0,boundary)+`\nTrusted **fictional excerpt** with [local context]({{ '/about.html' | relative_url }}).\n\n`+source.slice(boundary);
    writeFileSync(path,source);
  }
}
console.log(target);
