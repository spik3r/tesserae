import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {verifyJekyll} from '../scripts/verify-jekyll.js';
const postPath='notes/2020/01/02/synthetic-notes/';
function fixture(scenario,baseurl) {
 const directory=mkdtempSync(join(tmpdir(),'tesserae-output-contract-'));
 const frame=body=>`<html lang="en"><title>${scenario==='full'?'A fictional &lt;seedling&gt; &amp; its notes':'Minimal fictional post'} | Fictional &lt;Garden&gt; &amp; Notes</title><link href="${baseurl}/assets/tesserae.css">${body}</html>`;
 const title=scenario==='full'?'A fictional &lt;seedling&gt; &amp; its notes':'Minimal fictional post';
 const optional=scenario==='full'?'<p>Plain text only: &lt;script&gt;alert(&quot;fictional&quot;)&lt;/script&gt; &amp; &quot;quotes&quot; stay text.</p><ul aria-label="Tags"><li>sample &lt;tag&gt;</li><li>fictional &amp; local</li></ul>':'';
 const article=`<article class="ts-card"><h2><a href="${baseurl}/${postPath}">${title}</a></h2><p><time datetime="2020-01-02">January 2, 2020</time></p>${optional}</article>`;
 const index=frame('<h1>Synthetic &lt;Notes&gt; &amp; Updates</h1>Fictional examples only, not migrated blog content.'+(scenario==='empty'?'No posts yet.':article));
 mkdirSync(join(directory,'assets'));
 writeFileSync(join(directory,'assets/tesserae.css'),readFileSync(new URL('../html/tesserae.css',import.meta.url)));
 writeFileSync(join(directory,'index.html'),index);
 if(scenario!=='empty') {
   mkdirSync(join(directory,postPath),{recursive:true});
   writeFileSync(join(directory,postPath,'index.html'),frame(scenario==='full'?'No actual blog content or identifiers are reused.':'Synthetic content without optional description or tags.'));
 }
 return {directory,scenario,baseurl};
}
function withFixture(scenario,baseurl,fn) { const f=fixture(scenario,baseurl); try {fn(f);} finally {rmSync(f.directory,{recursive:true,force:true});} }
test('verifier accepts six hand-authored output contracts (not real Jekyll execution)',()=>{
 for(const scenario of ['full','minimal','empty']) for(const baseurl of ['','/synthetic-preview']) withFixture(scenario,baseurl,verifyJekyll);
});
test('verifier catches escaping, link, date, metadata, CSS and stale-output regressions',()=>{
 const corruptions=[
  ['&lt;script&gt;','<script>'],
  ['&lt;tag&gt;','<tag>'],
  ['/synthetic-preview/notes/','/notes/'],
  ['2020-01-02','2020-01-03'],
  ['January 2, 2020','January 3, 2020'],
  ['<h2>','<h3>'],
  ['Fictional examples only,',''],
  ['</article>','</article>{{ unresolved }}'],
 ];
 for(const [before,after] of corruptions) withFixture('full','/synthetic-preview',f=>{
  const path=join(f.directory,'index.html');writeFileSync(path,readFileSync(path,'utf8').replace(before,after));
  assert.throws(()=>verifyJekyll(f));
 });
 withFixture('full','',f=>{writeFileSync(join(f.directory,'assets/tesserae.css'),'stale');assert.throws(()=>verifyJekyll(f),/CSS differs/);});
 withFixture('minimal','',f=>{const path=join(f.directory,'index.html');writeFileSync(path,readFileSync(path,'utf8').replace('</article>','<p>Unexpected description</p></article>'));assert.throws(()=>verifyJekyll(f));});
 withFixture('empty','',f=>{mkdirSync(join(f.directory,postPath),{recursive:true});writeFileSync(join(f.directory,postPath,'index.html'),'stale');assert.throws(()=>verifyJekyll(f),/stale/);});
 withFixture('full','',f=>{rmSync(join(f.directory,postPath,'index.html'));assert.throws(()=>verifyJekyll(f));});
});
test('verifier rejects invalid contract and CLI arguments',()=>{
 assert.throws(()=>verifyJekyll({scenario:'other',baseurl:''}),/scenario/);
 assert.throws(()=>verifyJekyll({scenario:'full',baseurl:'https://external.invalid'}),/baseurl/);
 assert.throws(()=>execFileSync(process.execPath,['scripts/verify-jekyll.js','--directory','x'],{stdio:'pipe'}),/Usage:/);
 withFixture('empty','',f=>assert.match(execFileSync(process.execPath,['scripts/verify-jekyll.js','--directory',f.directory,'--scenario','empty','--baseurl',''],{encoding:'utf8'}),/not visual/));
});
