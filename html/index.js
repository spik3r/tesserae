/** Static presentation primitives. Strings are text, never trusted markup. */
import { readFileSync } from 'node:fs';
import { themes, modes, densities, layouts } from '../common/options.js';
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
function list(value, max) {
  if (!Array.isArray(value) || value.length > max) throw new TypeError('Expected bounded list');
  for (let i = 0; i < value.length; i++) {
    if (!Object.hasOwn(value, i)) throw new TypeError('Expected dense list');
  }
  return value;
}
function heading(value) { if (typeof value !== 'string' || !value.trim()) throw new TypeError('Heading cannot be empty'); return text(value); }
function metric(c) {
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
  return `<section class="ts-card ts-metric"><h2>${heading(c.title)}</h2><p class="ts-value">${value}${state === 'value' && c.unit ? ` <small>${text(c.unit)}</small>` : ''}</p>${c.description ? `<p>${text(c.description)}</p>` : ''}</section>`;
}
function status(c) {
  const tone = choice(c.tone ?? 'neutral', ['neutral','positive','warning','negative']);
  return `<section class="ts-card"><h2>${heading(c.title)}</h2><p class="ts-status" data-tone="${tone}">${heading(c.label)}</p></section>`;
}
function progress(c) {
  if (!Number.isFinite(c.value) || !Number.isFinite(c.max) || c.max <= 0 || c.value < 0 || c.value > c.max) throw new TypeError('Invalid progress range');
  return `<section class="ts-card"><h2>${heading(c.title)}</h2><label>${heading(c.label)}<progress max="${c.max}" value="${c.value}">${c.value} / ${c.max}</progress></label><p>${c.value} / ${c.max}</p></section>`;
}
function table(c) {
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
  return `<section class="ts-card ts-wide"><div class="ts-table-scroll" role="region" tabindex="0" aria-label="${heading(c.title)}"><table><caption>${heading(c.title)}${c.description ? ` <span class="ts-table-description">${text(c.description)}</span>` : ''}</caption><thead><tr>${columns.map(col=>`<th scope="col">${heading(col)}</th>`).join('')}</tr></thead><tbody>${body || `<tr><td colspan="${columns.length}">No records</td></tr>`}</tbody></table></div></section>`;
}
function section(c) {
  return `<section class="ts-card ts-wide"><h2>${heading(c.title)}</h2>${list(c.paragraphs, 16).map(p=>`<p>${text(p)}</p>`).join('')}</section>`;
}
function callout(c) {
  return `<aside class="ts-card ts-callout ts-wide"><h2>${heading(c.title)}</h2><p>${text(c.text)}</p></aside>`;
}
const renderers = {metric,status,progress,table,section,callout};
/** Render a plain-text presentation model into a complete inert HTML document. */
export function renderPage(model) {
  if (!model || typeof model !== 'object' || model.version !== 'tesserae/v1') throw new TypeError('Expected tesserae/v1');
  const theme = choice(model.theme ?? 'slate', themes);
  const mode = choice(model.mode ?? 'auto', modes);
  const density = choice(model.density ?? 'comfortable', densities);
  const kind = choice(model.kind ?? 'dashboard', layouts);
  if (model.subtitle !== undefined) text(model.subtitle);
  let renderedBytes = 0;
  const components = list(model.components, 64).map(c => {
    if (!c || typeof c !== 'object' || !Object.hasOwn(renderers, c.type)) throw new TypeError('Unsupported component');
    const output = renderers[c.type](c);
    renderedBytes += Buffer.byteLength(output);
    if (renderedBytes > 1024 * 1024) throw new RangeError('Rendered page exceeds 1 MiB');
    return output;
  }).join('\n');
  const html = `<!doctype html><html lang="en" data-theme="${theme}" data-mode="${mode}" data-density="${density}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading(model.title)}</title><style>${css}</style></head><body><main class="ts-page ts-${kind}"><header class="ts-header"><p class="ts-eyebrow">${text(model.category ?? 'Synthetic demonstration')}</p><h1>${heading(model.title)}</h1>${model.subtitle ? `<p>${text(model.subtitle)}</p>` : ''}</header><div class="ts-grid">${components}</div><footer>${text(model.footer ?? 'Synthetic demonstration data. Not operational evidence.')}</footer></main></body></html>\n`;
  if (Buffer.byteLength(html) > 1024 * 1024) throw new RangeError('Rendered page exceeds 1 MiB');
  return html;
}
export const componentTypes = Object.freeze(Object.keys(renderers));
