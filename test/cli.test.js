import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { renderPage } from '../html/index.js';

const cli = fileURLToPath(new URL('../bin/tesserae.js', import.meta.url));
const limit = 1024 * 1024;
const model = { version: 'tesserae/v1', title: 'Fictional café 🌱 <script>', components: [] };
const input = JSON.stringify(model);
const expected = renderPage(model);
function run(args, input, options = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    input, encoding: 'utf8', timeout: 10000, maxBuffer: 2 * limit, ...options
  });
}
function success(result, output) {
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.equal(result.stdout, output);
}
function failure(result, status, message) {
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.equal(result.status, status);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, message);
  assert.doesNotMatch(result.stderr, /SENSITIVE|\bat .*:\d+:\d+/);
  assert.equal(result.stderr.trim().split('\n').length, 1);
}
function directory(t) {
  const path = mkdtempSync(join(tmpdir(), 'tesserae-cli-'));
  t.after(() => rmSync(path, { recursive: true, force: true }));
  return path;
}

test('CLI renders file and stdin exactly like renderPage without installation', t => {
  const cwd = directory(t);
  writeFileSync(join(cwd, 'model.json'), input);
  success(run(['model.json'], undefined, { cwd }), expected);
  success(run(['-'], input, { cwd }), expected);
  assert.equal(readFileSync(join(cwd, 'model.json'), 'utf8'), input);
  assert.match(expected, /&lt;script&gt;/);
  assert.doesNotMatch(expected, /<script|<link|<img/);
  for (const name of ['report', 'dashboard', 'rtl-report']) {
    const path = fileURLToPath(new URL(`../examples/${name}.json`, import.meta.url));
    const json = readFileSync(path, 'utf8');
    success(run([path]), renderPage(JSON.parse(json)));
    success(run(['-'], json), renderPage(JSON.parse(json)));
  }
});

test('CLI help and argument errors are explicit and never render', () => {
  const help = run(['--help']);
  assert.match(help.stdout, /Usage: tesserae/);
  assert.match(help.stdout, /1,048,576 bytes/);
  success(help, help.stdout);
  success(run(['-h']), help.stdout);
  for (const args of [[], [''], ['--output', 'SENSITIVE'], ['--unknown'], ['a', 'b'], ['-', '-'], ['--help', '-'], ['--', 'model.json']]) {
    failure(run(args, input), 2, /Expected one JSON filepath/);
  }
});

test('CLI accepts relative option-like names and symlinked inputs and entrypoints', t => {
  const cwd = directory(t);
  writeFileSync(join(cwd, '-model.json'), input);
  symlinkSync(join(cwd, '-model.json'), join(cwd, 'input-link'));
  success(run(['./-model.json'], undefined, { cwd }), expected);
  success(run(['input-link'], undefined, { cwd }), expected);
  for (const name of ['alias.js', 'tesserae']) {
    const alias = join(cwd, name);
    symlinkSync(cli, alias);
    success(spawnSync(process.execPath, [alias, '-'], { input, encoding: 'utf8', cwd, timeout: 10000 }), expected);
    failure(spawnSync(process.execPath, [alias], { encoding: 'utf8', cwd, timeout: 10000 }), 2, /Expected one/);
    if (process.platform !== 'win32') {
      success(spawnSync(alias, ['-'], { input, encoding: 'utf8', cwd, timeout: 10000 }), expected);
    }
  }
});

test('CLI rejects unreadable paths and special files without disclosing paths', t => {
  const cwd = directory(t);
  failure(run([join(cwd, 'SENSITIVE-missing.json')]), 1, /Unable to read input/);
  failure(run([cwd]), 1, /Unable to read input/);
  if (process.platform !== 'win32') {
    const fifo = join(cwd, 'SENSITIVE-fifo');
    const created = spawnSync('mkfifo', [fifo]);
    assert.equal(created.status, 0);
    failure(run([fifo]), 1, /Unable to read input/);
  }
});

test('CLI enforces byte limits on files and stdin before parsing', t => {
  const cwd = directory(t);
  const padded = input + ' '.repeat(limit - Buffer.byteLength(input));
  assert.equal(Buffer.byteLength(padded), limit);
  for (const [contents, accepted] of [[padded, true], [padded + ' ', false], ['SENSITIVE' + ' '.repeat(limit - 8), false]]) {
    const path = join(cwd, 'model.json');
    writeFileSync(path, contents);
    for (const result of [run([path]), run(['-'], contents)]) {
      if (accepted) success(result, expected);
      else failure(result, 1, /Input exceeds 1 MiB/);
    }
  }
});

test('CLI rejects malformed JSON, invalid models and excessive output without leaking content', t => {
  const cwd = directory(t);
  const largeModel = { ...model, components: Array.from({ length: 32 }, () => ({
    type: 'callout', title: 'Fictional', text: '&'.repeat(8000)
  })) };
  const cases = [
    ['', /not valid JSON/], ['{"SENSITIVE":', /not valid JSON/],
    ['\ufeff' + input, /not valid JSON/], ['{} {}', /not valid JSON/],
    ['null', /Unable to render model/], ['[]', /Unable to render model/],
    [JSON.stringify({ ...model, theme: 'SENSITIVE' }), /Unable to render model/],
    [JSON.stringify({ ...model, lang: 'SENSITIVE" onclick="x' }), /Unable to render model/],
    [JSON.stringify({ ...model, dir: 'SENSITIVE' }), /Unable to render model/],
    [JSON.stringify({ ...model, components: [{ type: 'SENSITIVE' }] }), /Unable to render model/],
    [JSON.stringify({ ...model, components: [{ type: ['metric'], title: 'SENSITIVE', value: 0 }] }), /Unable to render model/],
    [JSON.stringify({ ...model, components: [{ type: [['metric']], title: 'SENSITIVE', value: 0 }] }), /Unable to render model/],
    [JSON.stringify(largeModel), /Unable to render model/]
  ];
  for (const [contents, message] of cases) {
    const path = join(cwd, 'model.json');
    writeFileSync(path, contents);
    failure(run([path]), 1, message);
    failure(run(['-'], contents), 1, message);
  }
});

test('CLI uses fatal UTF-8 decoding for files and stdin', t => {
  const cwd = directory(t);
  for (const invalid of [[0xff], [0xc3], [0xc0, 0xaf], [0xed, 0xa0, 0x80], [0xf4, 0x90, 0x80, 0x80]]) {
    const bytes = Buffer.concat([Buffer.from('{"SENSITIVE":"'), Buffer.from(invalid), Buffer.from('"}')]);
    const path = join(cwd, 'model.json');
    writeFileSync(path, bytes);
    failure(run([path]), 1, /not valid UTF-8/);
    failure(run(['-'], bytes), 1, /not valid UTF-8/);
  }
});

test('CLI preserves JSON.parse and renderer semantics for duplicate and extra fields', () => {
  const contents = `{"title":"ignored",${input.slice(1, -1)},"extra":"ignored"}`;
  success(run(['-'], contents), expected);
});

function childProcess(t) {
  const child = spawn(process.execPath, [cli, '-'], { stdio: ['pipe', 'pipe', 'pipe'] });
  t.after(() => { if (child.exitCode === null) child.kill(); });
  // Early input rejection may close the read side before the producer finishes.
  child.stdin.on('error', error => { assert.equal(error.code, 'EPIPE'); });
  let stdout = '', stderr = '';
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });
  return { child, result: async () => {
    const [status, signal] = await once(child, 'close');
    return { status, signal, stdout, stderr };
  } };
}

test('CLI rejects oversized stdin without waiting for producer EOF', { timeout: 10000 }, async t => {
  const { child, result } = childProcess(t);
  const closed = result();
  child.stdin.write(Buffer.alloc(2 * limit, 0x20));
  // Deliberately leave stdin open; the byte bound must end the process.
  failure(await closed, 1, /Input exceeds 1 MiB/);
});

test('CLI decodes UTF-8 across separate stdin writes', { timeout: 10000 }, async t => {
  const { child, result } = childProcess(t);
  const closed = result();
  const bytes = Buffer.from(input);
  const split = bytes.indexOf(Buffer.from('🌱')) + 1;
  await new Promise((resolve, reject) => child.stdin.write(bytes.subarray(0, split), error => error ? reject(error) : resolve()));
  child.stdin.end(bytes.subarray(split));
  success(await closed, expected);
});

test('CLI reports a broken output pipe without an unhandled stack trace', { timeout: 10000 }, async t => {
  const { child, result } = childProcess(t);
  const closed = result();
  child.stdout.destroy();
  child.stdin.end(input);
  failure(await closed, 1, /Output pipe closed/);
});
