import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPage,componentTypes} from '../html/index.js';
const page=(components,extra={})=>({version:'tesserae/v1',title:'Demo',components,...extra});
test('all supported components render inert, deterministic semantic HTML',()=>{
 const model=page([{type:'metric',title:'Zero',value:0},{type:'metric',title:'Data',state:'unknown'},{type:'status',title:'Status',label:'Needs review',tone:'warning'},{type:'progress',title:'Progress',label:'Items',value:2,max:3},{type:'table',title:'Rows',columns:['A'],rows:[]},{type:'section',title:'Narrative',paragraphs:['Fictional.']},{type:'callout',title:'Note',text:'Example'}]);
 const html=renderPage(model);assert.equal(html,renderPage(model));assert.equal((html.match(/<main /g)||[]).length,1);assert.match(html,/>0<\/p>/);assert.match(html,/Unknown/);assert.match(html,/No records/);assert.match(html,/scope="col"/);assert.match(html,/aria-label="Rows"/);assert.doesNotMatch(html,/<script|<iframe|<link|<img|onclick=/);assert.equal(componentTypes.length,6);
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
