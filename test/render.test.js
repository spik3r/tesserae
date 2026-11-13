import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPage,componentTypes} from '../html/index.js';
const page=(components,extra={})=>({version:'tesserae/v1',title:'Demo',components,...extra});
test('all supported components render inert, deterministic semantic HTML',()=>{
 const model=page([{type:'metric',title:'Zero',value:0},{type:'metric',title:'Data',state:'unknown'},{type:'status',title:'Status',label:'Needs review',tone:'warning'},{type:'progress',title:'Progress',label:'Items',value:2,max:3},{type:'table',title:'Rows',columns:['A'],rows:[]},{type:'section',title:'Narrative',paragraphs:['Fictional.']},{type:'callout',title:'Note',text:'Example'},{type:'metadata',title:'Context',entries:[]},{type:'grouped-table',title:'Groups',columns:['A'],groups:[]},{type:'recommendations',title:'Actions',items:[]}]);
 const html=renderPage(model);assert.equal(html,renderPage(model));assert.equal((html.match(/<main /g)||[]).length,1);assert.match(html,/>0<\/p>/);assert.match(html,/Unknown/);assert.match(html,/No records/);assert.match(html,/scope="col"/);assert.match(html,/aria-label="Rows"/);assert.doesNotMatch(html,/<script|<iframe|<link|<img|onclick=/);assert.deepEqual(componentTypes,['metric','status','progress','table','section','callout','metadata','grouped-table','recommendations']);
});
test('text and attributes cannot introduce markup',()=>{
 const x='</style><script>alert("x")</script>&';const html=renderPage(page([{type:'table',title:x,columns:[x],rows:[[x]]}],{title:x}));assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);assert.match(html,/&quot;/);
});
test('reject unsupported configuration and invalid component inputs',()=>{
 for(const extra of [{theme:'" onclick="x'},{density:'dense'},{mode:'blue'},{kind:'widget'},{version:'v2'}])assert.throws(()=>renderPage(page([],extra)));
 for(const c of [{type:'__proto__'},{type:'metric',title:'A',value:NaN},{type:'metric',title:'A',state:'missing',value:0},{type:'progress',title:'A',label:'X',value:3,max:2},{type:'table',title:'A',columns:[],rows:[]},{type:'table',title:'A',columns:['A'],rows:[['A','B']]},{type:'section',title:' ',paragraphs:[]}])assert.throws(()=>renderPage(page([c])));
});
test('bounded text, lists and final UTF8 output',()=>{
 assert.throws(()=>renderPage(page([],{title:'x'.repeat(8001)})));assert.throws(()=>renderPage(page(Array(65).fill({}))));assert.throws(()=>renderPage(page([],{title:'bad\x00'})));
 const table={type:'table',title:'A',columns:Array(8).fill('Col'),rows:Array.from({length:200},()=>Array(8).fill('é'.repeat(1000)))};assert.throws(()=>renderPage(page([table])),/bounded budget/);
 const section={type:'section',title:'A',paragraphs:Array(16).fill('é'.repeat(8000))};assert.throws(()=>renderPage(page(Array(5).fill(section))),/1 MiB/);
});
test('themes/density/mode do not change content contract',()=>{
 const model=page([{type:'metric',title:'Count',value:12,unit:'items'}]);for(const theme of ['slate','sand'])for(const mode of ['auto','dark','light'])for(const density of ['compact','comfortable'])assert.match(renderPage({...model,theme,mode,density}),/12 <small>items<\/small>/);
});

test('reject sparse lists instead of silently dropping content or headers',()=>{
 const table={type:'table',title:'Rows',columns:['A'],rows:[]};
 for(const components of [Array(1),[{...table,columns:Array(1)}],[{...table,rows:Array(1)}],[{...table,rows:[Array(1)]}],[{type:'section',title:'Text',paragraphs:Array(1)}]]) assert.throws(()=>renderPage(page(components)));
 const inherited=Array(1); Object.setPrototypeOf(inherited,{0:'Inherited',__proto__:Array.prototype});
 assert.throws(()=>renderPage(page([{...table,columns:inherited}])),/dense list/);
});

test('optional text fields reject supplied non-text values including falsy ones',()=>{
 for(const invalid of [false,0,NaN,null,{},[]]) {
  for(const field of ['unit','description']) assert.throws(()=>renderPage(page([{type:'metric',title:'Metric',value:0,[field]:invalid}])));
  assert.throws(()=>renderPage(page([],{subtitle:invalid})));
 }
 assert.doesNotThrow(()=>renderPage(page([{type:'metric',title:'Metric',value:0,unit:'',description:''}],{subtitle:''})));
 assert.throws(()=>renderPage(page([{type:'metric',title:'Metric',state:'unknown',unit:'x'.repeat(8001)}])));
});

test('opt-in row headers identify rows without replacing column headers or data cells',()=>{
 const table={type:'table',title:'Synthetic inventory',rowHeaders:true,columns:['Item','Quantity'],rows:[['Sample A','0'],['Sample B','2']]};
 const html=renderPage(page([table]));
 assert.match(html,/<thead><tr><th scope="col">Item<\/th><th scope="col">Quantity<\/th><\/tr><\/thead>/);
 assert.match(html,/<tbody><tr><th scope="row">Sample A<\/th><td>0<\/td><\/tr><tr><th scope="row">Sample B<\/th><td>2<\/td><\/tr><\/tbody>/);
 assert.match(html,/<caption>Synthetic inventory<\/caption>/);
 for(const rowHeaders of [undefined,false]) {
  const ordinary=renderPage(page([{...table,rowHeaders}]));
  assert.doesNotMatch(ordinary,/scope="row"/);
  assert.match(ordinary,/<tr><td>Sample A<\/td><td>0<\/td><\/tr>/);
 }
 const empty=renderPage(page([{...table,rows:[]}]));
 assert.match(empty,/<tbody><tr><td colspan="2">No records<\/td><\/tr><\/tbody>/);
 assert.doesNotMatch(empty,/scope="row"/);
});

test('row header labels stay plain text and the option is strictly boolean',()=>{
 const table={type:'table',title:'Rows',columns:['Item','Value'],rows:[['<script>"&','']]};
 const html=renderPage(page([{...table,rowHeaders:true}]));
 assert.match(html,/<th scope="row">&lt;script&gt;&quot;&amp;<\/th><td><\/td>/);
 assert.doesNotMatch(html,/<script>/);
 for(const rowHeaders of [null,0,1,'true','false',{},[]]) assert.throws(()=>renderPage(page([{...table,rowHeaders}])),/rowHeaders must be boolean/);
 for(const label of ['', ' \t', '\x00', 'x'.repeat(8001)]) assert.throws(()=>renderPage(page([{...table,rowHeaders:true,rows:[[label,'1']]}])));
 assert.doesNotThrow(()=>renderPage(page([{...table,rows:[['','1']]}])));
 assert.match(renderPage(page([{...table,rowHeaders:true,columns:['Item'],rows:[['Sample']]}])),/<tbody><tr><th scope="row">Sample<\/th><\/tr><\/tbody>/);
});


test('table descriptions remain in the native caption without changing the region label',()=>{
 const table={type:'table',title:'Synthetic inventory',columns:['Item'],rows:[['Sample']],description:'Counts in units. Empty means not reported.'};
 const html=renderPage(page([table]));
 assert.match(html,/<caption>Synthetic inventory <span class="ts-table-description">Counts in units. Empty means not reported.<\/span><\/caption>/);
 assert.match(html,/aria-label="Synthetic inventory"/);
 for(const description of [undefined,'']) assert.match(renderPage(page([{...table,description}])),/<caption>Synthetic inventory<\/caption>/);
 assert.match(renderPage(page([{...table,rows:[]}])),/Counts in units/);
 assert.match(renderPage(page([{...table,description:'<script>"&'}])),/&lt;script&gt;&quot;&amp;<\/span>/);
 for(const description of [null,false,0,NaN,{},[], 'x'.repeat(8001),'bad\x00']) assert.throws(()=>renderPage(page([{...table,description}])));
 assert.equal(html,renderPage(page([table])));
});
