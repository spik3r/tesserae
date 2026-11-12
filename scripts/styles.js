import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const css = ['themes/tokens.css', 'html/components.css']
  .map(path => readFileSync(new URL(path, root), 'utf8')).join('\n');
const output = new URL('html/tesserae.css', root);
if (process.argv.includes('--check')) {
  if (readFileSync(output, 'utf8') !== css) throw new Error('Stylesheet is stale; run npm run build:styles');
} else writeFileSync(output, css);
