import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync, symlinkSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {exampleAssets} from '../scripts/examples.js';
import {checkExamples} from '../scripts/check-examples.js';

function fixture(fn) {
  const root = mkdtempSync(join(tmpdir(),'tesserae-example-drift-'));
  try {
    for (const path of exampleAssets().keys()) {
      mkdirSync(dirname(join(root,path)),{recursive:true});
      copyFileSync(new URL(`../${path}`,import.meta.url),join(root,path));
    }
    fn(root);
  } finally { rmSync(root,{recursive:true,force:true}); }
}

test('read-only example gate accepts the complete committed manifest',()=>fixture(root=>checkExamples(root)));

test('example gate rejects missing, stale and unexpected matrix output without repairing it',()=>{
  const article = 'examples/generated/article-navigation/slate-auto-compact-ltr-last.html';
  fixture(root=>{
    rmSync(join(root,article));
    assert.throws(()=>checkExamples(root), /inventory differs/);
    assert.throws(()=>readFileSync(join(root,article)), /ENOENT/);
  });
  for (const path of [article,'examples/generated/gallery/sand-dark-compact.html','examples/generated/rtl-report-slate.html','examples/dashboard.json']) fixture(root=>{
    writeFileSync(join(root,path),'stale\n');
    assert.throws(()=>checkExamples(root), /Stale example:/);
    assert.equal(readFileSync(join(root,path),'utf8'),'stale\n');
  });
  // Include a git-ignored extension: inventory must not depend on git status.
  for (const extra of ['obsolete.html','article-navigation/obsolete.log']) fixture(root=>{
    const path = join(root,'examples/generated',extra);
    writeFileSync(path,'unexpected\n');
    assert.throws(()=>checkExamples(root), /inventory differs/);
    assert.equal(readFileSync(path,'utf8'),'unexpected\n');
  });
});

test('example gate rejects symlinks instead of following generated paths',()=>fixture(root=>{
  const path = join(root,'examples/generated/dashboard-slate.html');
  rmSync(path);
  symlinkSync('dashboard-sand.html',path);
  assert.throws(()=>checkExamples(root), /Expected regular generated file/);
}));
