import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderPage} from '../html/index.js';
const load=name=>JSON.parse(readFileSync(new URL(`./fixtures/foundry/${name}.json`,import.meta.url),'utf8'));
const names=['dashboard-metrics-table','dashboard-empty-table'];
// Keys export.go emitted at the pinned commit (see fixtures README); subtitle is omitted when empty.
const required=['category','components','footer','kind','title','version'];
const optional=['subtitle'];

test('Foundry fixtures have the pinned top-level keys',()=>{
 for(const name of names){
  const keys=Object.keys(load(name)).sort();
  assert.deepEqual(keys.filter(k=>!optional.includes(k)),required,name);
  assert.ok(keys.every(k=>required.includes(k)||optional.includes(k)),name);
 }
 assert.ok('subtitle' in load('dashboard-metrics-table'));
});

test('Foundry export renders, escapes content and keeps component order',()=>{
 const model=load('dashboard-metrics-table');
 const html=renderPage(model);
 assert.equal(html,renderPage(model));
 assert.doesNotMatch(html,/<script/);
 assert.match(html,/&lt;script&gt;not markup&lt;\/script&gt;/);
 assert.match(html,/Synthetic &lt;example&gt; dashboard/);
 const at=['<caption>Records<','<h2>Count</h2>','<h2>Ratio</h2>'].map(s=>html.indexOf(s));
 assert.ok(at.every(i=>i>=0),String(at));
 assert.deepEqual([...at].sort((a,b)=>a-b),at);
});

test('Foundry empty-rows table renders the empty state',()=>{
 assert.match(renderPage(load('dashboard-empty-table')),/No records/);
});

test('renderer rejects a component type Foundry does not export',()=>{
 const model=load('dashboard-empty-table');
 model.components=[{type:'bar',title:'Chart'}];
 assert.throws(()=>renderPage(model),{code:'ERR_TESSERAE_VALIDATION',path:'$.components[0].type'});
});
