import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPage, componentTypes} from '../html/index.js';
const page = components => ({version:'tesserae/v1',title:'Synthetic report',kind:'report',components});
const metadata = {type:'metadata',title:'Context',entries:[{label:'Prepared by',value:'Example team'},{label:'Version',value:'0'}]};
const table = {type:'grouped-table',title:'Evidence',columns:['Record','Note'],rowHeaders:true,groups:[{title:'Open',rows:[['DEMO-1','Fictional note']]},{title:'Reviewed',description:'Synthetic only',rows:[]}]};
test('report primitives preserve native relationships, order and explicit empty states', () => {
  assert.ok(componentTypes.includes('metadata'));
  assert.ok(componentTypes.includes('grouped-table'));
  const html=renderPage(page([metadata,table]));
  assert.match(html, /<dl class="ts-metadata"><div><dt>Prepared by<\/dt><dd>Example team<\/dd><\/div><div><dt>Version<\/dt><dd>0<\/dd>/);
  assert.ok(html.indexOf('<caption>Open</caption>') < html.indexOf('<caption>Reviewed '));
  assert.match(html, /<th scope="row">DEMO-1<\/th><td>Fictional note<\/td>/);
  assert.match(html, /<td colspan="2">No records<\/td>/);
  assert.equal((html.match(/<th scope="col">Record<\/th>/g)||[]).length,2);
  assert.match(renderPage(page([{...metadata,entries:[]},{...table,groups:[]}])), /No metadata/);
  assert.match(renderPage(page([{...table,groups:[]}])), /No groups/);
  assert.equal(html,renderPage(page([metadata,table])));
});
test('report text is escaped at every new boundary', () => {
 const x='<img src=x onerror="alert(1)">&';
 const html=renderPage(page([{...metadata,title:x,entries:[{label:x,value:x}]},{...table,title:x,description:x,columns:[x,x],groups:[{title:x,description:x,rows:[[x,x]]}]}]));
 assert.doesNotMatch(html,/<img/);
 assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;&amp;/);
});
test('metadata rejects absent, sparse, oversized and non-text entries', () => {
 for (const entries of [undefined,null,{},Array(1),Array(33).fill({label:'a',value:'b'}),[null],[{}],[{label:' ',value:'b'}],[{label:'a',value:''}],[{label:'a',value:0}],[{label:'a',value:'x'.repeat(8001)}]]) {
   assert.throws(()=>renderPage(page([{...metadata,entries}])));
 }
});
test('grouped tables validate shared contract, groups and cumulative bounds', () => {
 for (const patch of [{groups:undefined},{groups:Array(1)},{groups:Array(17).fill({title:'x',rows:[]})},{columns:[]},{columns:Array(1)},{rowHeaders:'yes'},{description:false},{groups:[null]},{groups:[{title:'',rows:[]}]},{groups:[{title:'x',rows:[['one']]}]},{groups:[{title:'x',rows:[['','value']]}]},{groups:[{title:'x',description:0,rows:[]}]}]) {
   assert.throws(()=>renderPage(page([{...table,...patch}])));
 }
 const rows=Array.from({length:100},(_,i)=>['R'+i,'x']);
 assert.doesNotThrow(()=>renderPage(page([{...table,groups:[{title:'a',rows},{title:'b',rows}]}])));
 assert.throws(()=>renderPage(page([{...table,groups:[{title:'a',rows},{title:'b',rows:[...rows,['extra','x']]}]}])),/200 rows/);
 const dense=Array.from({length:100},()=>['r','x'.repeat(1000)]);
 assert.throws(()=>renderPage(page([{...table,groups:[{title:'a',rows:dense},{title:'b',rows:dense}]}])),/text exceeds/);
});
