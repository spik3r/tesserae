/** Static presentation primitives. Strings are text, never trusted markup. */
import { readFileSync } from 'node:fs';
import { invalid } from './validation.js';
import { themes, modes, densities, layouts, directions } from '../common/options.js';
const css = readFileSync(new URL('./tesserae.css', import.meta.url), 'utf8');
const MAX_TEXT = 8000;
function text(value, path) {
  if (typeof value !== 'string' || value.length > MAX_TEXT || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) invalid(TypeError, 'Expected bounded plain text', path);
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function choice(value, values, path) {
  if (!values.includes(value)) invalid(TypeError, `Unsupported option; expected ${values.join('|')}`, path);
  return value;
}
function language(value, path) {
  if (typeof value !== 'string' || value.length > 128) invalid(TypeError, 'Expected bounded language tag', path);
  try { Intl.getCanonicalLocales(value); }
  catch { invalid(TypeError, 'Expected Unicode language tag', path); }
  // Validate syntax without changing the caller's spelling through ICU aliases.
  return value;
}
function list(value, max, path) {
  if (!Array.isArray(value) || value.length > max) invalid(TypeError, 'Expected bounded list', path);
  for (let i = 0; i < value.length; i++) {
    if (!Object.hasOwn(value, i)) invalid(TypeError, 'Expected dense list', `${path}[${i}]`);
  }
  return value;
}
function heading(value, path) { if (typeof value !== 'string' || !value.trim()) invalid(TypeError, 'Heading cannot be empty', path); return text(value, path); }
function metric(c, english = '', path) {
  const state = choice(c.state ?? 'value', ['value','missing','unknown','not-applicable'], `${path}.state`);
  if (c.unit !== undefined) text(c.unit, `${path}.unit`);
  if (c.description !== undefined) text(c.description, `${path}.description`);
  let value;
  if (state === 'value') {
    if (typeof c.value !== 'number' || !Number.isFinite(c.value)) invalid(TypeError, 'Metric needs finite numeric value', `${path}.value`);
    value = String(c.value);
  } else {
    if (c.value !== undefined) invalid(TypeError, 'Non-value metric cannot carry a value', `${path}.value`);
    value = {'missing':'Missing','unknown':'Unknown','not-applicable':'Not applicable'}[state];
  }
  return `<section class="ts-card ts-metric"><h2>${heading(c.title, `${path}.title`)}</h2><p class="ts-value"${state === 'value' ? '' : english}>${value}${state === 'value' && c.unit ? ` <small>${text(c.unit, `${path}.unit`)}</small>` : ''}</p>${c.description ? `<p>${text(c.description, `${path}.description`)}</p>` : ''}</section>`;
}
function status(c, english = '', path) {
  const tone = choice(c.tone ?? 'neutral', ['neutral','positive','warning','negative'], `${path}.tone`);
  return `<section class="ts-card"><h2>${heading(c.title, `${path}.title`)}</h2><p class="ts-status" data-tone="${tone}">${heading(c.label, `${path}.label`)}</p></section>`;
}
function progress(c, english = '', path) {
  if (!Number.isFinite(c.max) || c.max <= 0) invalid(TypeError, 'Invalid progress range; max must be positive and finite', `${path}.max`);
  if (!Number.isFinite(c.value) || c.value < 0 || c.value > c.max) invalid(TypeError, 'Invalid progress range; value must be finite and between 0 and max', `${path}.value`);
  return `<section class="ts-card"><h2>${heading(c.title, `${path}.title`)}</h2><label>${heading(c.label, `${path}.label`)}<progress max="${c.max}" value="${c.value}">${c.value} / ${c.max}</progress></label><p>${c.value} / ${c.max}</p></section>`;
}
function table(c, english = '', path) {
  if (c.description !== undefined) text(c.description, `${path}.description`);
  const columns = list(c.columns, 8, `${path}.columns`);
  if (!columns.length) invalid(TypeError, 'Table needs columns', `${path}.columns`);
  const rows = list(c.rows, 200, `${path}.rows`);
  const rowHeaders = c.rowHeaders === undefined ? false : c.rowHeaders;
  if (typeof rowHeaders !== 'boolean') invalid(TypeError, 'rowHeaders must be boolean', `${path}.rowHeaders`);
  let cellUnits = 0;
  for (const [rowIndex, row] of rows.entries()) {
    if (list(row, 8, `${path}.rows[${rowIndex}]`).length !== columns.length) invalid(TypeError, 'Table row width mismatch', `${path}.rows[${rowIndex}]`);
    for (const [cellIndex, cell] of row.entries()) {
      if (typeof cell !== 'string') invalid(TypeError, 'Expected plain-text cell', `${path}.rows[${rowIndex}][${cellIndex}]`);
      cellUnits += cell.length;
      if (cellUnits > 200000) invalid(RangeError, 'Table text exceeds bounded budget', `${path}.rows`);
    }
  }
  const body = rows.map((row, rowIndex) => {
    if (list(row, 8, `${path}.rows[${rowIndex}]`).length !== columns.length) invalid(TypeError, 'Table row width mismatch', `${path}.rows[${rowIndex}]`);
    return `<tr>${row.map((cell, index) => rowHeaders && index === 0
      ? `<th scope="row">${heading(cell, `${path}.rows[${rowIndex}][${index}]`)}</th>`
      : `<td>${text(cell, `${path}.rows[${rowIndex}][${index}]`)}</td>`).join('')}</tr>`;
  }).join('');
  return `<section class="ts-card ts-wide"><div class="ts-table-scroll" role="region" tabindex="0" aria-label="${heading(c.title, `${path}.title`)}"><table><caption>${heading(c.title, `${path}.title`)}${c.description ? ` <span class="ts-table-description">${text(c.description, `${path}.description`)}</span>` : ''}</caption><thead><tr>${columns.map((col, index)=>`<th scope="col">${heading(col, `${path}.columns[${index}]`)}</th>`).join('')}</tr></thead><tbody>${body || `<tr><td colspan="${columns.length}"${english}>No records</td></tr>`}</tbody></table></div></section>`;
}
function metadata(c, english = '', path) {
  const entries = list(c.entries, 32, `${path}.entries`);
  return `<section class="ts-card ts-wide"><h2>${heading(c.title, `${path}.title`)}</h2><dl class="ts-metadata">${entries.map((entry, index) => {
    if (!entry || typeof entry !== 'object') invalid(TypeError, 'Expected metadata entry', `${path}.entries[${index}]`);
    return `<div><dt>${heading(entry.label, `${path}.entries[${index}].label`)}</dt><dd>${heading(entry.value, `${path}.entries[${index}].value`)}</dd></div>`;
  }).join('')}</dl>${entries.length ? '' : `<p${english}>No metadata</p>`}</section>`;
}
function groupedTable(c, english = '', path) {
  const groups = list(c.groups, 16, `${path}.groups`);
  // One component has one shared budget, not a multiplied per-group allowance.
  let totalRows = 0, totalText = 0;
  // Validate the shared table contract even when there are no groups.
  table({...c, rows: []}, english, path);
  const rendered = groups.map((group, groupIndex) => {
    const groupPath = `${path}.groups[${groupIndex}]`;
    if (!group || typeof group !== 'object') invalid(TypeError, 'Expected table group', groupPath);
    const rows = list(group.rows, 200, `${groupPath}.rows`);
    totalRows += rows.length;
    if (totalRows > 200) invalid(RangeError, 'Grouped table exceeds 200 rows', `${path}.groups`);
    for (const [rowIndex, row] of rows.entries()) {
      for (const [cellIndex, cell] of list(row, 8, `${groupPath}.rows[${rowIndex}]`).entries()) {
        if (typeof cell !== 'string') invalid(TypeError, 'Expected plain-text cell', `${groupPath}.rows[${rowIndex}][${cellIndex}]`);
        totalText += cell.length;
        if (totalText > 200000) invalid(RangeError, 'Grouped table text exceeds bounded budget', `${path}.groups`);
      }
    }
    return table({title: group.title, description: group.description, columns: c.columns, rows, rowHeaders: c.rowHeaders}, english, groupPath);
  }).join('');
  return `<section class="ts-card ts-wide ts-table-group"><h2>${heading(c.title, `${path}.title`)}</h2>${c.description ? `<p>${text(c.description, `${path}.description`)}</p>` : ''}${rendered || `<p${english}>No groups</p>`}</section>`;
}
function section(c, english = '', path) {
  return `<section class="ts-card ts-wide"><h2>${heading(c.title, `${path}.title`)}</h2>${list(c.paragraphs, 16, `${path}.paragraphs`).map((p, index)=>`<p>${text(p, `${path}.paragraphs[${index}]`)}</p>`).join('')}</section>`;
}
function callout(c, english = '', path) {
  return `<aside class="ts-card ts-callout ts-wide"><h2>${heading(c.title, `${path}.title`)}</h2><p>${text(c.text, `${path}.text`)}</p></aside>`;
}
function recommendations(c, english = '', path) {
  const items = list(c.items, 32, `${path}.items`);
  let units = 0;
  const bounded = (value, fieldPath) => {
    const escaped = heading(value, fieldPath);
    units += value.length;
    if (units > 100000) invalid(RangeError, 'Recommendation text exceeds bounded budget', path);
    return escaped;
  };
  const title = bounded(c.title, `${path}.title`);
  const body = items.map((item, index) => {
    const itemPath = `${path}.items[${index}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) invalid(TypeError, 'Expected recommendation item', itemPath);
    const title = bounded(item.title, `${itemPath}.title`);
    const action = bounded(item.action, `${itemPath}.action`);
    const rationale = item.rationale === undefined ? '' : `<p><strong${english}>Rationale:</strong> ${bounded(item.rationale, `${itemPath}.rationale`)}</p>`;
    const details = ['owner', 'status'].filter(key => item[key] !== undefined).map(key =>
      `<div><dt${english}>${key === 'owner' ? 'Owner' : 'Status'}</dt><dd>${bounded(item[key], `${itemPath}.${key}`)}</dd></div>`).join('');
    return `<li><h3>${title}</h3><p>${action}</p>${rationale}${details ? `<dl class="ts-metadata">${details}</dl>` : ''}</li>`;
  }).join('');
  return `<section class="ts-card ts-wide"><h2>${title}</h2>${items.length ? `<ol class="ts-recommendations">${body}</ol>` : `<p${english}>No recommendations supplied</p>`}</section>`;
}
const renderers = {metric,status,progress,table,section,callout,metadata,'grouped-table':groupedTable,recommendations};
/** Render a plain-text presentation model into a complete inert HTML document. */
export function renderPage(model) {
  if (!model || typeof model !== 'object') invalid(TypeError, 'Expected tesserae/v1', '$');
  if (model.version !== 'tesserae/v1') invalid(TypeError, 'Expected tesserae/v1', '$.version');
  const theme = choice(model.theme ?? 'slate', themes, '$.theme');
  const mode = choice(model.mode ?? 'auto', modes, '$.mode');
  const density = choice(model.density ?? 'comfortable', densities, '$.density');
  const kind = choice(model.kind ?? 'dashboard', layouts, '$.kind');
  const lang = language(model.lang === undefined ? 'en' : model.lang, '$.lang');
  const dir = model.dir === undefined ? '' : ` dir="${choice(model.dir, directions, '$.dir')}"`;
  // Built-in labels remain English; caller text inherits the document language.
  const english = /^en(?:-|$)/i.test(lang) ? '' : ' lang="en" dir="ltr"';
  if (model.subtitle !== undefined) text(model.subtitle, '$.subtitle');
  let renderedBytes = 0;
  const components = list(model.components, 64, '$.components').map((c, index) => {
    const path = `$.components[${index}]`;
    if (!c || typeof c !== 'object') invalid(TypeError, 'Unsupported component', path);
    if (typeof c.type !== 'string' || !Object.hasOwn(renderers, c.type)) invalid(TypeError, 'Unsupported component', `${path}.type`);
    const output = renderers[c.type](c, english, path);
    renderedBytes += Buffer.byteLength(output);
    if (renderedBytes > 1024 * 1024) invalid(RangeError, 'Rendered page exceeds 1 MiB', '$');
    return output;
  }).join('\n');
  const html = `<!doctype html><html lang="${lang}"${dir} data-theme="${theme}" data-mode="${mode}" data-density="${density}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading(model.title, '$.title')}</title><style>${css}</style></head><body><main class="ts-page ts-${kind}"><header class="ts-header"><p class="ts-eyebrow"${model.category == null ? english : ''}>${text(model.category ?? 'Synthetic demonstration', '$.category')}</p><h1>${heading(model.title, '$.title')}</h1>${model.subtitle ? `<p>${text(model.subtitle, '$.subtitle')}</p>` : ''}</header><div class="ts-grid">${components}</div><footer${model.footer == null ? english : ''}>${text(model.footer ?? 'Synthetic demonstration data. Not operational evidence.', '$.footer')}</footer></main></body></html>\n`;
  if (Buffer.byteLength(html) > 1024 * 1024) invalid(RangeError, 'Rendered page exceeds 1 MiB', '$');
  return html;
}
export const componentTypes = Object.freeze(Object.keys(renderers));
