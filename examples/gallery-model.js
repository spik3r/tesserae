/** Fictional shared fixture; no operational records or private reference material. */
export const galleryModel = {
  version: 'tesserae/v1', kind: 'report', title: 'Tesserae component gallery',
  subtitle: 'Fictional content and edge cases for manual review, not a visual certification.',
  components: [
    {type:'metadata',title:'Gallery context',entries:[{label:'Dataset',value:'Entirely invented'},{label:'Purpose',value:'Component contract and manual QA reference'}]},
    {type:'section',title:'01 / Narrative and wrapping',paragraphs:[
      'A long fictional paragraph checks how a report carries explanatory context without introducing an application framework. This gallery exercises the same semantic content across skins, colour modes and density settings. Its generated files do not prove that a browser lays out or prints them correctly.',
      'Literal text must stay literal: <example> & "quoted" content. Unicode examples: café, 日本語, and 🌱.',
      'An invented long reference for wrapping checks: demo/documentation/platform-and-package-compatibility/very-long-fictional-component-reference.md'
    ]},
    {type:'metric',title:'A real numeric zero',value:0,unit:'items'},
    {type:'metric',title:'Missing measurement',state:'missing'},
    {type:'metric',title:'Unknown measurement',state:'unknown'},
    {type:'metric',title:'Inapplicable measurement',state:'not-applicable'},
    ...['neutral','positive','warning','negative'].map(tone=>({type:'status',title:`${tone} status`,tone,label:`Fictional ${tone} example`})),
    {type:'progress',title:'Not started',label:'Invented checklist at zero',value:0,max:4},
    {type:'progress',title:'In progress',label:'Invented checklist part-way',value:1.5,max:4},
    {type:'progress',title:'Completed',label:'Invented checklist complete',value:4,max:4},
    {type:'callout',title:'Review limitation',text:'Screen, print and assistive-technology behaviour must be checked separately. No result in this gallery describes a real system.'},
    {type:'table',title:'Fictional evidence',description:'Values are text. This table deliberately mixes short, long and Unicode content.',rowHeaders:true,columns:['Record','Context','Next step'],rows:[['DEMO-ALPHA','An invented description long enough to exercise wrapping at narrow widths. No real finding or repository is represented.','Review the sample wording'],['DEMO-BETA','日本語 / café / 🌱','Keep text readable'],['DEMO-GAMMA','<tag> & literal text','Do not interpret markup']]},
    {type:'grouped-table',title:'Grouped sample evidence',description:'Group order is supplied explicitly.',rowHeaders:true,columns:['Record','Observation'],groups:[{title:'Invented group A',rows:[['DEMO-DELTA','Synthetic observation']]},{title:'Reviewed empty group',description:'An empty group is not missing data.',rows:[]}]},
    {type:'recommendations',title:'Example recommendations',items:[{title:'Check explanatory text',action:'Review this fictional report at narrow and wide viewport sizes.',rationale:'The same data should remain understandable at both sizes.',owner:'Example review team',status:'Illustrative, not approved'},{title:'Check output on paper',action:'Inspect a print preview when a permitted browser workflow is available.'}]},
    {type:'section',title:'02 / Explicit empty states',paragraphs:['These empty collections are intentionally supplied. Missing or invalid required input is a validation error, not an empty result.']},
    {type:'metadata',title:'Empty metadata',entries:[]},
    {type:'table',title:'Empty table',columns:['Record','Value'],rows:[]},
    {type:'grouped-table',title:'No table groups',columns:['Record','Value'],groups:[]},
    {type:'recommendations',title:'No recommendations',items:[]}
  ]
};
