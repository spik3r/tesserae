import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderPage } from '../html/index.js';
import { directions, themes, modes, densities } from '../common/options.js';

const page = extra => ({version:'tesserae/v1', title:'Fictional example', components:[], ...extra});
const root = html => html.match(/<html\b[^>]*>/)[0];
const body = html => html.slice(html.indexOf('<body>'));

test('document language defaults to English and direction is opt-in and independent', () => {
  const original = renderPage(page());
  assert.equal(root(original), '<html lang="en" data-theme="slate" data-mode="auto" data-density="comfortable">');
  assert.equal(original, renderPage(page({lang:undefined, dir:undefined})));
  assert.equal(original, renderPage(page({lang:'en'})));
  for (const lang of ['en-GB', 'fr', 'ar', 'zh-Hant-TW', 'de-CH-1901', 'en-US-u-nu-latn', 'EN-us', 'iw']) {
    const html = renderPage(page({lang}));
    assert.match(root(html), new RegExp(`^<html lang="${lang}" data-theme=`));
    assert.doesNotMatch(root(html), / dir=/);
    for (const dir of directions) {
      const directed = renderPage(page({lang, dir}));
      assert.match(root(directed), new RegExp(`^<html lang="${lang}" dir="${dir}" data-theme=`));
      assert.equal(body(directed), body(html), 'direction must not reverse or rewrite supplied content');
    }
  }
  assert.match(root(renderPage(page({dir:'rtl'}))), /^<html lang="en" dir="rtl"/);
});

test('language and direction reject invalid types, injection and excessive tags', () => {
  for (const lang of ['', null, false, 0, {}, [], new String('en'), 'en_US', 'en US', ' en', 'en\n', 'en--US', 'x-private', 'i-klingon', 'en" onclick="x', 'en\u0000', 'é', 'a'.repeat(129)]) {
    assert.throws(() => renderPage(page({lang})), TypeError);
  }
  const boundary = 'en-x-' + Array(13).fill('abcdefgh').join('-') + '-abcdefg';
  assert.equal(boundary.length, 129);
  assert.doesNotThrow(() => renderPage(page({lang:boundary.slice(0, -1)})));
  assert.throws(() => renderPage(page({lang:boundary})), /bounded language tag/);
  for (const dir of ['', null, false, 0, {}, [], 'auto', 'RTL', 'rtl ', 'rtl" onclick="x']) {
    assert.throws(() => renderPage(page({dir})), TypeError);
  }
});

test('built-in English labels are marked without changing caller text language', () => {
  const components = [
    ...['missing','unknown','not-applicable'].map(state => ({type:'metric', title:'Mesure', state})),
    {type:'table', title:'Tableau', columns:['Valeur'], rows:[]},
    {type:'metadata', title:'Contexte', entries:[]},
    {type:'grouped-table', title:'Groupes', columns:['Valeur'], groups:[]},
    {type:'grouped-table', title:'Groupes', columns:['Valeur'], groups:[{title:'Groupe', rows:[]}]},
    {type:'recommendations', title:'Actions', items:[]},
    {type:'recommendations', title:'Actions', items:[{title:'Exemple', action:'Vérifier.', rationale:'Exemple fictif.', owner:'Équipe fictive', status:'Proposé'}]}
  ];
  for (const dir of [undefined, ...directions]) {
    const html = renderPage(page({lang:'fr', dir, components}));
    for (const label of ['Missing','Unknown','Not applicable','No records','No metadata','No groups','No recommendations supplied','Rationale:','Owner','Status','Synthetic demonstration','Synthetic demonstration data. Not operational evidence.']) {
      assert.ok(html.includes(`lang="en" dir="ltr">${label}<`), label);
    }
    assert.equal((html.match(/lang="en" dir="ltr">No records/g) || []).length, 2);
    assert.match(html, /<h2>Mesure<\/h2>/);
    assert.match(html, /<dd>Équipe fictive<\/dd>/);
    assert.match(html, /<strong lang="en" dir="ltr">Rationale:<\/strong> Exemple fictif\.<\/p>/);
    const supplied = renderPage(page({lang:'fr', dir, category:'Exemple fictif', footer:'Fin de l’exemple'}));
    assert.match(supplied, /<p class="ts-eyebrow">Exemple fictif<\/p>/);
    assert.match(supplied, /<footer>Fin de l’exemple<\/footer>/);
  }
  for (const lang of ['en', 'en-GB', 'EN-us']) {
    assert.doesNotMatch(body(renderPage(page({lang, components}))), /lang="en"/);
  }
});

test('RTL fixture retains native table and list order across every theme combination', () => {
  const model = JSON.parse(readFileSync(new URL('../examples/rtl-report.json', import.meta.url), 'utf8'));
  const expectedBody = body(renderPage(model));
  for (const theme of themes) for (const mode of modes) for (const density of densities) {
    const html = renderPage({...model, theme, mode, density});
    assert.match(root(html), /^<html lang="ar" dir="rtl"/);
    assert.equal(body(html), expectedBody);
    assert.match(html, /<th scope="col">العنصر<\/th><th scope="col">الوصف<\/th>/);
    assert.match(html, /<th scope="row">مثال أ<\/th><td>نص قصير<\/td>/);
    assert.match(html, /<ol class="ts-recommendations"><li><h3>مراجعة النص<\/h3>/);
    assert.match(html, /&lt;example&gt; &amp; DEMO-01/);
    assert.doesNotMatch(html, /<script\b|<iframe\b|https?:\/\//i);
  }
});

test('language and direction retain the complete UTF-8 output size bound', () => {
  const section = {type:'section', title:'X', paragraphs:Array(16).fill('é'.repeat(8000))};
  assert.throws(() => renderPage(page({lang:'ar', dir:'rtl', components:Array(5).fill(section)})), /1 MiB/);
  const components = Array.from({length:9}, () => ({type:'section', title:'X', paragraphs:Array(16).fill('')}));
  let remaining = 1024 * 1024 - Buffer.byteLength(renderPage(page({components})));
  for (const component of components) for (let i = 0; i < component.paragraphs.length; i++) {
    const length = Math.min(8000, remaining);
    component.paragraphs[i] = 'x'.repeat(length);
    remaining -= length;
  }
  assert.equal(remaining, 0);
  assert.equal(Buffer.byteLength(renderPage(page({components}))), 1024 * 1024);
  assert.throws(() => renderPage(page({components, lang:'ar', dir:'rtl'})), /1 MiB/);
});

test('CSS uses logical inline sides for callouts and table labels (source contract only)', () => {
  const css = readFileSync(new URL('../html/components.css', import.meta.url), 'utf8');
  assert.match(css, /\.ts-callout\{border-inline-start:\.4rem solid var\(--ts-accent\)/);
  assert.match(css, /caption\{text-align:start;/);
  assert.match(css, /th\{text-align:start;/);
  assert.doesNotMatch(css, /border-(?:left|right):|text-align:(?:left|right)/);
});
