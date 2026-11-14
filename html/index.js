/** Static presentation primitives. Strings are text, never trusted markup. */
import { readFileSync } from 'node:fs';
import { themes, modes, densities, layouts, directions } from '../common/options.js';
const css = readFileSync(new URL('./tesserae.css', import.meta.url), 'utf8');
const MAX_TEXT = 8000;
function text(value) {
  if (typeof value !== 'string' || value.length > MAX_TEXT || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) throw new TypeError('Expected bounded plain text');
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function choice(value, values) {
  if (!values.includes(value)) throw new TypeError(`Unsupported option: ${value}`);
  return value;
}
function language(value) {
  if (typeof value !== 'string' || value.length > 128) throw new TypeError('Expected bounded language tag');
  try { Intl.getCanonicalLocales(value); }
  catch { throw new TypeError('Expected Unicode language tag'); }
  // Validate syntax without changing the caller's spelling through ICU aliases.
  return value;
}
function list(value, max) {
  if (!Array.isArray(value) || value.length > max) throw new TypeError('Expected bounded list');
  for (let i = 0; i < value.length; i++) {
    if (!Object.hasOwn(value, i)) throw new TypeError('Expected dense list');
  }
  return value;
}
function heading(value) { if (typeof value !== 'string' || !value.trim()) throw new TypeError('Heading cannot be empty'); return text(value); }
function metric(c, english = '') {
  const state = choice(c.state ?? 'value', ['value','missing','unknown','not-applicable']);
  if (c.unit !== undefined) text(c.unit);
  if (c.description !== undefined) text(c.description);
  let value;
  if (state === 'value') {
    if (typeof c.value !== 'number' || !Number.isFinite(c.value)) throw new TypeError('Metric needs finite numeric value');
    value = String(c.value);
  } else {
    if (c.value !== undefined) throw new TypeError('Non-value metric cannot carry a value');
    value = {'missing':'Missing','unknown':'Unknown','not-applicable':'Not applicable'}[state];
  }
  return `<section class="ts-card ts-metric"><h2>${heading(c.title)}</h2><p class="ts-value"${state === 'value' ? '' : english}>${value}${state === 'value' && c.unit ? ` <small>${text(c.unit)}</small>` : ''}</p>${c.description ? `<p>${text(c.description)}</p>` : ''}</section>`;
}
function status(c) {
  const tone = choice(c.tone ?? 'neutral', ['neutral','positive','warning','negative']);
  return `<section class="ts-card"><h2>${heading(c.title)}</h2><p class="ts-status" data-tone="${tone}">${heading(c.label)}</p></section>`;
}
function progress(c) {
  if (!Number.isFinite(c.value) || !Number.isFinite(c.max) || c.max <= 0 || c.value < 0 || c.value > c.max) throw new TypeError('Invalid progress range');
  return `<section class="ts-card"><h2>${heading(c.title)}</h2><label>${heading(c.label)}<progress max="${c.max}" value="${c.value}">${c.value} / ${c.max}</progress></label><p>${c.value} / ${c.max}</p></section>`;
}
function table(c, english = '') {
  if (c.description !== undefined) text(c.description);
  const columns = list(c.columns, 8);
  if (!columns.length) throw new TypeError('Table needs columns');
  const rows = list(c.rows, 200);
  const rowHeaders = c.rowHeaders === undefined ? false : c.rowHeaders;
  if (typeof rowHeaders !== 'boolean') throw new TypeError('rowHeaders must be boolean');
  let cellUnits = 0;
  for (const row of rows) {
    if (list(row, 8).length !== columns.length) throw new TypeError('Table row width mismatch');
    for (const cell of row) {
      if (typeof cell !== 'string') throw new TypeError('Expected plain-text cell');
      cellUnits += cell.length;
      if (cellUnits > 200000) throw new RangeError('Table text exceeds bounded budget');
    }
  }
  const body = rows.map(row => {
    if (list(row, 8).length !== columns.length) throw new TypeError('Table row width mismatch');
    return `<tr>${row.map((cell, index) => rowHeaders && index === 0
      ? `<th scope="row">${heading(cell)}</th>`
      : `<td>${text(cell)}</td>`).join('')}</tr>`;
  }).join('');
  return `<section class="ts-card ts-wide"><div class="ts-table-scroll" role="region" tabindex="0" aria-label="${heading(c.title)}"><table><caption>${heading(c.title)}${c.description ? ` <span class="ts-table-description">${text(c.description)}</span>` : ''}</caption><thead><tr>${columns.map(col=>`<th scope="col">${heading(col)}</th>`).join('')}</tr></thead><tbody>${body || `<tr><td colspan="${columns.length}"${english}>No records</td></tr>`}</tbody></table></div></section>`;
}
function metadata(c, english = '') {
  const entries = list(c.entries, 32);
  return `<section class="ts-card ts-wide"><h2>${heading(c.title)}</h2><dl class="ts-metadata">${entries.map(entry => {
    if (!entry || typeof entry !== 'object') throw new TypeError('Expected metadata entry');
    return `<div><dt>${heading(entry.label)}</dt><dd>${heading(entry.value)}</dd></div>`;
  }).join('')}</dl>${entries.length ? '' : `<p${english}>No metadata</p>`}</section>`;
}
function groupedTable(c, english = '') {
  const groups = list(c.groups, 16);
  // One component has one shared budget, not a multiplied per-group allowance.
  let totalRows = 0, totalText = 0;
  // Validate the shared table contract even when there are no groups.
  table({...c, rows: []});
  const rendered = groups.map(group => {
    if (!group || typeof group !== 'object') throw new TypeError('Expected table group');
    const rows = list(group.rows, 200);
    totalRows += rows.length;
    if (totalRows > 200) throw new RangeError('Grouped table exceeds 200 rows');
    for (const row of rows) {
      for (const cell of list(row, 8)) {
        if (typeof cell !== 'string') throw new TypeError('Expected plain-text cell');
        totalText += cell.length;
        if (totalText > 200000) throw new RangeError('Grouped table text exceeds bounded budget');
      }
    }
    return table({title: group.title, description: group.description, columns: c.columns, rows, rowHeaders: c.rowHeaders}, english);
  }).join('');
  return `<section class="ts-card ts-wide ts-table-group"><h2>${heading(c.title)}</h2>${c.description ? `<p>${text(c.description)}</p>` : ''}${rendered || `<p${english}>No groups</p>`}</section>`;
}
function section(c) {
  return `<section class="ts-card ts-wide"><h2>${heading(c.title)}</h2>${list(c.paragraphs, 16).map(p=>`<p>${text(p)}</p>`).join('')}</section>`;
}
function callout(c) {
  return `<aside class="ts-card ts-callout ts-wide"><h2>${heading(c.title)}</h2><p>${text(c.text)}</p></aside>`;
}
function recommendations(c, english = '') {
  const items = list(c.items, 32);
  let units = 0;
  const bounded = value => {
    const escaped = heading(value);
    units += value.length;
    if (units > 100000) throw new RangeError('Recommendation text exceeds bounded budget');
    return escaped;
  };
  const title = bounded(c.title);
  const body = items.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new TypeError('Expected recommendation item');
    const title = bounded(item.title);
    const action = bounded(item.action);
    const rationale = item.rationale === undefined ? '' : `<p><strong${english}>Rationale:</strong> ${bounded(item.rationale)}</p>`;
    const details = ['owner', 'status'].filter(key => item[key] !== undefined).map(key =>
      `<div><dt${english}>${key === 'owner' ? 'Owner' : 'Status'}</dt><dd>${bounded(item[key])}</dd></div>`).join('');
    return `<li><h3>${title}</h3><p>${action}</p>${rationale}${details ? `<dl class="ts-metadata">${details}</dl>` : ''}</li>`;
  }).join('');
  return `<section class="ts-card ts-wide"><h2>${title}</h2>${items.length ? `<ol class="ts-recommendations">${body}</ol>` : `<p${english}>No recommendations supplied</p>`}</section>`;
}
const renderers = {metric,status,progress,table,section,callout,metadata,'grouped-table':groupedTable,recommendations};
/** Render a plain-text presentation model into a complete inert HTML document. */
export function renderPage(model) {
  if (!model || typeof model !== 'object' || model.version !== 'tesserae/v1') throw new TypeError('Expected tesserae/v1');
  const theme = choice(model.theme ?? 'slate', themes);
  const mode = choice(model.mode ?? 'auto', modes);
  const density = choice(model.density ?? 'comfortable', densities);
  const kind = choice(model.kind ?? 'dashboard', layouts);
  const lang = language(model.lang === undefined ? 'en' : model.lang);
  const dir = model.dir === undefined ? '' : ` dir="${choice(model.dir, directions)}"`;
  // Built-in labels remain English; caller text inherits the document language.
  const english = /^en(?:-|$)/i.test(lang) ? '' : ' lang="en" dir="ltr"';
  if (model.subtitle !== undefined) text(model.subtitle);
  let renderedBytes = 0;
  const components = list(model.components, 64).map(c => {
    if (!c || typeof c !== 'object' || typeof c.type !== 'string' || !Object.hasOwn(renderers, c.type)) throw new TypeError('Unsupported component');
    const output = renderers[c.type](c, english);
    renderedBytes += Buffer.byteLength(output);
    if (renderedBytes > 1024 * 1024) throw new RangeError('Rendered page exceeds 1 MiB');
    return output;
  }).join('\n');
  const html = `<!doctype html><html lang="${lang}"${dir} data-theme="${theme}" data-mode="${mode}" data-density="${density}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading(model.title)}</title><style>${css}</style></head><body><main class="ts-page ts-${kind}"><header class="ts-header"><p class="ts-eyebrow"${model.category == null ? english : ''}>${text(model.category ?? 'Synthetic demonstration')}</p><h1>${heading(model.title)}</h1>${model.subtitle ? `<p>${text(model.subtitle)}</p>` : ''}</header><div class="ts-grid">${components}</div><footer${model.footer == null ? english : ''}>${text(model.footer ?? 'Synthetic demonstration data. Not operational evidence.')}</footer></main></body></html>\n`;
  if (Buffer.byteLength(html) > 1024 * 1024) throw new RangeError('Rendered page exceeds 1 MiB');
  return html;
}
export const componentTypes = Object.freeze(Object.keys(renderers));
