import {mkdirSync,writeFileSync} from 'node:fs';
import {renderPage} from '../src/index.js';
const metrics = [
 {type:'metric',title:'Example items',value:12},
 {type:'metric',title:'Open tasks',value:0},
 {type:'metric',title:'Historical baseline',state:'unknown'},
 {type:'status',title:'Review state',label:'Illustrative only',tone:'neutral'},
 {type:'progress',title:'Sample checklist',label:'Steps demonstrated',value:3,max:5},
 {type:'table',title:'Invented work items',columns:['Record','Description','State'],rows:[['DEMO-A','Review sample wording','Open'],['DEMO-B','Check fictional layout','Complete']]}
];
const report = [
 {type:'section',title:'01 / Summary',paragraphs:['This invented handover demonstrates reusable presentation components. No operational conclusions are intended.']},
 {type:'callout',title:'Recommendation',text:'Use this as an example of layout, not as evidence of any real system.'},
 {type:'table',title:'Synthetic evidence',columns:['Record','Observation','Next step'],rows:[['SAMPLE-1','Example instructions are ambiguous','Clarify the invented wording'],['SAMPLE-2','Example glossary is complete','No change needed']]},
 {type:'section',title:'02 / Method and limits',paragraphs:['All names, records and observations are invented. This renderer does not calculate the truth of a report or run any analysis.']}
];
mkdirSync('examples/generated',{recursive:true});
for (const [name,components,kind] of [['dashboard',metrics,'dashboard'],['report',report,'report']]) {
 const model={version:'tesserae/v1',title:`Fictional ${name}`,subtitle:'Reusable components, synthetic data',kind,components};
 writeFileSync(`examples/${name}.json`,JSON.stringify(model,null,2)+'\n');
 for(const theme of ['slate','sand']) writeFileSync(`examples/generated/${name}-${theme}.html`,renderPage({...model,theme}));
}
