import {mkdirSync,writeFileSync} from 'node:fs';
import {renderPage} from '../html/index.js';
const metrics = [
 {type:'metric',title:'Example items',value:12},
 {type:'metric',title:'Open tasks',value:0},
 {type:'metric',title:'Historical baseline',state:'unknown'},
 {type:'status',title:'Review state',label:'Illustrative only',tone:'neutral'},
 {type:'progress',title:'Sample checklist',label:'Steps demonstrated',value:3,max:5},
 {type:'table',title:'Invented work items',columns:['Record','Description','State'],rows:[['DEMO-A','Review sample wording','Open'],['DEMO-B','Check fictional layout','Complete']]}
];
const report = [
 {type:'metadata',title:'Report context',entries:[{label:'Prepared by',value:'Example review team'},{label:'Edition',value:'Demonstration 1'},{label:'Audience',value:'Fictional engineering team'}]},
 {type:'section',title:'01 / Summary',paragraphs:['This invented handover demonstrates reusable presentation components. No operational conclusions are intended.']},
 {type:'callout',title:'Recommendation',text:'Use this as an example of layout, not as evidence of any real system.'},
 {type:'table',title:'Synthetic evidence',description:'Fictional comparison only. Observations are illustrative, not operational evidence.',rowHeaders:true,columns:['Record','Observation','Next step'],rows:[['SAMPLE-1','Example instructions are ambiguous','Clarify the invented wording'],['SAMPLE-2','Example glossary is complete','No change needed']]},
 {type:'grouped-table',title:'Grouped review observations',description:'Each group shares the same column meanings. These are invented records, not findings about a real product.',rowHeaders:true,columns:['Record','Observation','Next step'],groups:[{title:'Example documentation',rows:[['DEMO-A','Synthetic setup instructions need a label','Clarify the example'],['DEMO-B','Sample glossary entry is missing','Write an invented definition']]},{title:'Example packaging',description:'An explicitly reviewed empty demonstration group.',rows:[]}]},
 {type:'recommendations',title:'Suggested demonstration actions',items:[{title:'Clarify sample instructions',action:'Replace the invented ambiguous instruction with a labelled example.',rationale:'Distinguish demonstration content from operational evidence.',owner:'Fictional documentation team',status:'Proposed, not approved'},{title:'Review the fictional glossary',action:'Check example definitions before reusing this template.'}]},
 {type:'section',title:'02 / Method and limits',paragraphs:['All names, records and observations are invented. This renderer does not calculate the truth of a report or run any analysis.']}
];
mkdirSync('examples/generated',{recursive:true});
for (const [name,components,kind] of [['dashboard',metrics,'dashboard'],['report',report,'report']]) {
 const model={version:'tesserae/v1',title:`Fictional ${name}`,subtitle:'Reusable components, synthetic data',kind,components};
 writeFileSync(`examples/${name}.json`,JSON.stringify(model,null,2)+'\n');
 for(const theme of ['slate','sand']) writeFileSync(`examples/generated/${name}-${theme}.html`,renderPage({...model,theme}));
}
