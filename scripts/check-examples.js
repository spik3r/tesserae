import assert from 'node:assert/strict';
import {readFileSync, readdirSync, lstatSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {exampleAssets} from './examples.js';

function files(directory, prefix = '') {
  return readdirSync(join(directory,prefix), {withFileTypes:true}).flatMap(entry => {
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory()) return files(directory,`${path}/`);
    assert.ok(entry.isFile(), `Expected regular generated file: ${path}`);
    return [path];
  });
}

/** Read-only: never rebuild, delete extras or follow generated symlinks. */
export function checkExamples(root = fileURLToPath(new URL('../', import.meta.url))) {
  const expected = exampleAssets();
  const prefix = 'examples/generated/';
  assert.ok(lstatSync(join(root,prefix)).isDirectory(), 'Expected regular generated directory');
  assert.deepEqual(files(join(root,prefix)).sort(),
    [...expected.keys()].filter(path => path.startsWith(prefix)).map(path => path.slice(prefix.length)).sort(),
    'Generated example inventory differs (missing or unexpected files)');
  for (const [path, content] of expected) {
    assert.ok(lstatSync(join(root,path)).isFile(), `Expected regular example file: ${path}`);
    assert.equal(readFileSync(join(root,path),'utf8'),content, `Stale example: ${path}`);
  }
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  checkExamples();
  console.log('Example inventory and bytes match; no files changed.');
}
