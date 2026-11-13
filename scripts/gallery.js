import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {renderPage} from '../html/index.js';
import {themes,modes,densities} from '../common/options.js';
import {galleryModel} from '../examples/gallery-model.js';

/** Deterministic local gallery assets. Links are fixed vocabulary, never input URLs. */
export function galleryAssets() {
  const assets = new Map();
  const links = [];
  for (const theme of themes) for (const mode of modes) for (const density of densities) {
    const name = `${theme}-${mode}-${density}.html`;
    assets.set(name, renderPage({...galleryModel,theme,mode,density}));
    links.push(`<li><a href="${name}">${theme} / ${mode} / ${density}</a></li>`);
  }
  assets.set('index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tesserae gallery variants</title><link rel="stylesheet" href="../../../html/tesserae.css"></head><body><main class="ts-page ts-report"><header class="ts-header"><h1>Tesserae gallery variants</h1><p>Entirely fictional content. These files are manual-review fixtures, not evidence of completed visual or accessibility QA.</p></header><section class="ts-card"><h2>Choose a variant</h2><p>Auto follows the browser's preferred colour scheme. Each link contains the same components and data; only theme, mode and density change.</p><ul>${links.join('')}</ul></section><footer>No browser scripting, remote assets or operational data.</footer></main></body></html>\n`);
  return assets;
}
export function writeGallery() {
  const directory = new URL('../examples/generated/gallery/', import.meta.url);
  mkdirSync(directory,{recursive:true});
  for (const [name, html] of galleryAssets()) writeFileSync(new URL(name,directory),html);
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) writeGallery();
