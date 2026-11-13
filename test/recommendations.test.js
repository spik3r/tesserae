import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPage} from '../html/index.js';
const item={title:'Clarify example',action:'Rewrite the fictional instruction.',rationale:'Reduce ambiguity.',owner:'Example team',status:'Proposed'};
const component={type:'recommendations',title:'Next steps',items:[item,{title:'Review',action:'Check the sample.'}]};
const render=c=>renderPage({version:'tesserae/v1',title:'Synthetic',components:[c]});
test('recommendations retain native order, heading hierarchy and explicit context',()=>{
 const html=render(component);
 assert.match(html,/<h2>Next steps<\/h2><ol class="ts-recommendations"><li><h3>Clarify example<\/h3>/);
 assert.match(html,/<strong>Rationale:<\/strong> Reduce ambiguity/);
 assert.match(html,/<dt>Owner<\/dt><dd>Example team<\/dd>/);
 assert.match(html,/<dt>Status<\/dt><dd>Proposed<\/dd>/);
 assert.ok(html.indexOf('<h3>Clarify')<html.indexOf('<h3>Review'));
 assert.equal(html,render(component));
 assert.doesNotMatch(render({...component,items:[{title:'x',action:'y'}]}),/<dt>Owner|<dt>Status|Rationale:/);
 assert.match(render({...component,items:[]}),/No recommendations supplied/);
});
test('all recommendation strings are escaped, never HTML or URL actions',()=>{
 const x='<img src=x onerror="x">&';
 const html=render({type:'recommendations',title:x,items:[Object.fromEntries(Object.keys(item).map(k=>[k,x]))]});
 assert.doesNotMatch(html,/<img|<script|<a /);
 assert.equal(html.split('&lt;img src=x onerror=&quot;x&quot;&gt;&amp;').length-1,6);
});
test('recommendations reject malformed and oversized input at every field',()=>{
 for(const items of [undefined,null,{},Array(1),Array(33).fill(item),[null],[[]],[{}]]) assert.throws(()=>render({...component,items}));
 for(const key of Object.keys(item)) for(const value of [null,0,{},'',' ', 'x'.repeat(8001),'bad\u0000']) assert.throws(()=>render({...component,items:[{...item,[key]:value}]}));
 assert.doesNotThrow(()=>render({...component,items:Array(32).fill({title:'x',action:'y'})}));
 const big={title:'x',action:'a'.repeat(8000),rationale:'b'.repeat(8000)};
 assert.throws(()=>render({...component,items:Array(7).fill(big)}),/bounded budget/);
});
