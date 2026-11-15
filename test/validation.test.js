import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPage} from '../html/index.js';
import {validationDiagnostic} from '../html/validation.js';

const page = (components = [], extra = {}) => ({version:'tesserae/v1',title:'Fictional',components,...extra});
const table = {type:'table',title:'Table',columns:['Name','Value'],rows:[['A','1']]};
const group = {type:'grouped-table',title:'Groups',columns:['Name','Value'],groups:[{title:'Group',rows:[['A','1']]}]};
const recommendations = {type:'recommendations',title:'Actions',items:[{title:'Item',action:'Act'}]};
function rejects(model, path, ErrorType = TypeError) {
  assert.throws(() => renderPage(model), error => {
    assert.ok(error instanceof ErrorType);
    assert.equal(error.code,'ERR_TESSERAE_VALIDATION');
    assert.equal(error.path,path);
    assert.match(error.path,/^\$(?:\.[a-zA-Z]+|\[\d+\])*$/);
    assert.equal(validationDiagnostic(error),`${path}: ${error.message}`);
    assert.doesNotMatch(error.message,/SENSITIVE|\n|undefined/);
    assert.throws(() => { error.path = 'spoofed'; },TypeError);
    return true;
  });
}

test('document diagnostics identify fixed fields without interpolating input', () => {
  rejects(null,'$');
  rejects(page([], {version:'SENSITIVE'}),'$.version');
  for (const key of ['title','subtitle','category','footer']) rejects(page([], {[key]:42}),`$.${key}`);
  for (const key of ['theme','mode','density','kind','dir','lang']) rejects(page([], {[key]:'SENSITIVE\n"'}),`$.${key}`);
  rejects(page(null),'$.components');
  rejects(page(Array(65).fill({})),'$.components');
  rejects(page([null]),'$.components[0]');
  for (const type of ['SENSITIVE', ['metric'], {}, '__proto__']) rejects(page([{type}]),'$.components[0].type');
});

test('every component reports field and nested collection locations at nonzero indices', () => {
  const cases = [
    [{type:'metric',title:'M',value:null},'value'],
    [{type:'metric',title:'M',value:0,unit:false},'unit'],
    [{type:'metric',title:'M',state:'missing',value:0},'value'],
    [{type:'metric',title:'M',state:'SENSITIVE'},'state'],
    [{type:'metric',title:'M',value:0,description:[]},'description'],
    [{type:'status',title:'S',label:'Ready',tone:'SENSITIVE'},'tone'],
    [{type:'status',title:'S',label:''},'label'],
    [{type:'progress',title:'P',label:'P',value:0,max:0},'max'],
    [{type:'progress',title:'P',label:'P',value:2,max:1},'value'],
    [{...table,columns:['Name','']},'columns[1]'],
    [{...table,columns:[]},'columns'],
    [{...table,rowHeaders:'true'},'rowHeaders'],
    [{...table,rows:[['A','1'],['B',null]]},'rows[1][1]'],
    [{...table,rows:[['A','1'],['B']]},'rows[1]'],
    [{...table,rowHeaders:true,rows:[['','1']]},'rows[0][0]'],
    [{type:'section',title:'Text',paragraphs:['ok',false]},'paragraphs[1]'],
    [{type:'callout',title:'Note',text:[]},'text'],
    [{type:'metadata',title:'Meta',entries:[{label:'A',value:'B'},null]},'entries[1]'],
    [{type:'metadata',title:'Meta',entries:[{label:'A',value:''}]},'entries[0].value'],
    [{...group,columns:['A','']},'columns[1]'],
    [{...group,groups:[group.groups[0],null]},'groups[1]'],
    [{...group,groups:[group.groups[0],{title:'G',rows:[['A',false]]}]},'groups[1].rows[0][1]'],
    [{...group,groups:[{title:'G',rows:[['A']]}]},'groups[0].rows[0]'],
    [{...group,groups:[{title:'',rows:[]}]},'groups[0].title'],
    [{...group,groups:[{title:'G',description:false,rows:[]}]},'groups[0].description'],
    [{...recommendations,items:[recommendations.items[0],null]},'items[1]'],
    ...['title','action','rationale','owner','status'].map(key => [
      {...recommendations,items:[recommendations.items[0],{...recommendations.items[0],[key]:false}]},`items[1].${key}`
    ])
  ];
  for (const [component, field] of cases) rejects(page([{type:'callout',title:'Valid',text:'Valid'},component]),`$.components[1].${field}`);
});

test('sparse lists identify the absent element rather than silently losing it', () => {
  rejects(page([,]),'$.components[0]');
  for (const [component,path] of [
    [{...table,columns:['Name',,]},'columns[1]'],
    [{...table,rows:[,]},'rows[0]'],
    [{...table,rows:[['A',,]]},'rows[0][1]'],
    [{...group,groups:[,]},'groups[0]'],
    [{...group,groups:[{title:'G',rows:[['A',,]]}]},'groups[0].rows[0][1]'],
    [{type:'metadata',title:'M',entries:[,]},'entries[0]'],
    [{type:'section',title:'S',paragraphs:[,]},'paragraphs[0]'],
    [{...recommendations,items:[,]},'items[0]']
  ]) rejects(page([component]),`$.components[0].${path}`);
});

test('aggregate limits identify their owning collection or document', () => {
  const rows=Array.from({length:26},()=>['x'.repeat(8000),'x']);
  rejects(page([{...table,rows}]),'$.components[0].rows',RangeError);
  rejects(page([{...group,groups:[{title:'G',rows}]}]),'$.components[0].groups',RangeError);
  rejects(page([{...group,groups:[{title:'A',rows:Array(101).fill(['a','b'])},{title:'B',rows:Array(100).fill(['a','b'])}]}]),'$.components[0].groups',RangeError);
  rejects(page([{...recommendations,items:Array.from({length:13},()=>({title:'Item',action:'x'.repeat(8000)}))}]),'$.components[0]',RangeError);
  rejects(page(Array.from({length:32},()=>({type:'callout',title:'C',text:'&'.repeat(8000)}))),'$',RangeError);
  rejects(page([{type:'callout',title:'C',text:'SENSITIVE'+'x'.repeat(8000)}]),'$.components[0].text');
});

test('unexpected exceptions cannot impersonate safe validation diagnostics', () => {
  for (const error of [null,undefined,'SENSITIVE',new TypeError('SENSITIVE'),{code:'ERR_TESSERAE_VALIDATION',path:'$.title',message:'SENSITIVE'}]) {
    assert.equal(validationDiagnostic(error),undefined);
  }
  const error = new Error('SENSITIVE');
  const model = page();
  Object.defineProperty(model,'title',{get(){throw error;}});
  assert.throws(()=>renderPage(model),e=>e===error);
  assert.equal(validationDiagnostic(error),undefined);
  // A successful call after any error has no retained path/context state.
  assert.match(renderPage(page([{type:'metric',title:'Count',value:0}])),/class="ts-value">0</);
});
