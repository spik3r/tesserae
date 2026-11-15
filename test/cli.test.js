import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, symlinkSync, mkdirSync, copyFileSync } from 'node:fs';
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

test('CLI locates recognized JSON syntax failures without printing source or parser text', t => {
  const cwd=directory(t);
  // Expected offsets are UTF-16 code units; lines/columns are one-based.
  const cases = [
    ['{',1,1,2], ['{"a" 1}',5,1,6], ['{"a":1 "b":2}',7,1,8],
    ['[1 2]',3,1,4], ['"abc',4,1,5], ['"a\n"',2,1,3],
    ['"\\x"',2,1,3], ['"\\uQ"',3,1,4], ['1.',2,1,3],
    ['1e',2,1,3], ['-',1,1,2], ['{} x',3,1,4],
    ['{"a":',5,1,6], ['',0,1,1],
    ['{\n"SENSITIVE": 1,\n}',18,3,1],
    ['{\r\n"a": 1,\r\n}',12,3,1], ['{\r"a": 1,\r}',10,3,1],
    ['{"é🌱": 1 "b": 2}',10,1,11],
    ['{\n"a":\n',7,3,1]
  ];
  for (const [source,offset,line,column] of cases) {
    const path=join(cwd,'SENSITIVE-input.json');writeFileSync(path,source);
    for (const result of [run([path]),run(['-'],source)]) {
      failure(result,1,/Input is not valid JSON/);
      assert.equal(result.stderr,`tesserae: Input is not valid JSON (UTF-8 without a BOM required). At line ${line}, column ${column} (UTF-16 offset ${offset}).\n`,JSON.stringify(source));
    }
    assert.equal(readFileSync(path,'utf8'),source);
  }
});

test('CLI leaves excerpt-bearing syntax errors generic, including position-like input', () => {
  for (const source of [
    'SENSITIVE', '[1,]', '\ufeff'+input,
    '{"SENSITIVE at position 1 (line 2 column 3)": }',
    '"SENSITIVE" unexpected at position 3 (line 4 column 5)'
  ]) {
    const result=run(['-'],source);
    failure(result,1,/Input is not valid JSON/);
    // The last case has a genuine engine-supplied trailing-data position. It
    // must use that offset, never position-like numbers later in caller text.
    if(source.startsWith('"SENSITIVE"')) assert.match(result.stderr,/At line 1, column 13 \(UTF-16 offset 12\)/);
    else assert.equal(result.stderr,'tesserae: Input is not valid JSON (UTF-8 without a BOM required).\n');
  }
});

test('CLI syntax locations stay bounded by the existing input-byte limit', t => {
  const cwd=directory(t),path=join(cwd,'model.json');
  const source=' '.repeat(limit-1)+'{';
  writeFileSync(path,source);
  for(const result of [run([path]),run(['-'],source)]) {
    failure(result,1,/Input is not valid JSON/);
    assert.match(result.stderr,new RegExp(`At line 1, column ${limit+1} \\(UTF-16 offset ${limit}\\)`));
    assert.ok(result.stderr.length<200);
  }
  failure(run(['-'],source+' '),1,/Input exceeds 1 MiB/);
});

test('CLI supplies safe model locations for file and stdin while leaving output empty', t => {
  const cwd = directory(t);
  const cases = [
    [{...model,theme:'SENSITIVE\n\u001b[31m'},'$.theme: Unsupported option; expected slate|sand'],
    [{...model,components:[{type:'table',title:'SENSITIVE',columns:['A'],rows:[['ok'],[false]]}]},'$.components[0].rows[1][0]: Expected plain-text cell'],
    [{...model,components:[{type:'grouped-table',title:'Groups',columns:['A'],groups:[{title:'SENSITIVE',rows:[[false]]}]}]},'$.components[0].groups[0].rows[0][0]: Expected plain-text cell'],
    [{...model,components:[{type:'recommendations',title:'Actions',items:[{title:'SENSITIVE',action:''}]}]},'$.components[0].items[0].action: Heading cannot be empty'],
    [null,'$: Expected tesserae/v1']
  ];
  for (const [invalid,diagnostic] of cases) {
    const source=JSON.stringify(invalid),path=join(cwd,'SENSITIVE-model.json');
    writeFileSync(path,source);
    for (const result of [run([path]),run(['-'],source)]) {
      failure(result,1,/Unable to render model/);
      assert.equal(result.stderr,`tesserae: Unable to render model. ${diagnostic}\n`);
    }
    assert.equal(readFileSync(path,'utf8'),source);
  }
});

test('CLI keeps missing assets and unexpected renderer exceptions generic', t => {
  const cwd=directory(t);
  writeFileSync(join(cwd,'package.json'),'{"type":"module"}');
  for (const part of ['bin','html','common']) mkdirSync(join(cwd,part));
  for (const path of ['bin/tesserae.js','html/index.js','html/validation.js','html/tesserae.css','common/options.js']) {
    copyFileSync(new URL(`../${path}`,import.meta.url),join(cwd,path));
  }
  const invoke=()=>spawnSync(process.execPath,[join(cwd,'bin/tesserae.js'),'-'],{input,encoding:'utf8',timeout:10000});
  success(invoke(),expected);
  const generic='tesserae: Unable to render model. Check the tesserae/v1 contract and renderer assets.\n';
  rmSync(join(cwd,'html/tesserae.css'));
  let result=invoke();failure(result,1,/Unable to render model/);assert.equal(result.stderr,generic);
  writeFileSync(join(cwd,'html/index.js'),`export function renderPage(){throw Object.assign(new TypeError('SENSITIVE'),{code:'ERR_TESSERAE_VALIDATION',path:'$.SENSITIVE'});}`);
  result=invoke();failure(result,1,/Unable to render model/);assert.equal(result.stderr,generic);
  rmSync(join(cwd,'html/validation.js'));
  result=invoke();failure(result,1,/Unable to render model/);assert.equal(result.stderr,generic);
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

test('CLI handles controlled writable callbacks without claiming success after output failure', t => {
  const cwd = directory(t);
  const file = join(cwd, 'model.json');
  writeFileSync(file, input);
  const help = run(['--help']).stdout;
  // A child-local preload replaces only stdout with a real Node Writable.
  // Its _write callback triggers the normal error event; no disk is filled.
  for (const scenario of [
    {code:'EPIPE', deferred:false, prefix:0},
    {code:'ENOSPC', deferred:true, prefix:0},
    {code:'ENOSPC', deferred:true, prefix:32},
    {code:null, deferred:true, prefix:0}
  ]) {
    const preload = `
      import {Writable} from 'node:stream';
      const original = process.stdout;
      const scenario = ${JSON.stringify(scenario)};
      const output = new Writable({write(chunk, encoding, done) {
        const complete = () => {
          if (!scenario.code) return original.write(chunk, encoding, done);
          const error = Object.assign(new Error('SENSITIVE injected output failure'), {code:scenario.code});
          if (scenario.prefix) original.write(chunk.subarray(0,scenario.prefix), () => done(error));
          else done(error);
        };
        if (scenario.deferred) setImmediate(complete);
        else complete();
      }});
      Object.defineProperty(process, 'stdout', {value:output});
    `;
    for (const [args, source, output] of [[[file],undefined,expected], [['-'],input,expected], [['--help'],undefined,help]]) {
      const result = spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(preload)}`, cli, ...args], {
        input:source, encoding:'utf8', cwd, timeout:10000, maxBuffer:2*limit
      });
      if (!scenario.code) success(result,output);
      else {
        // Partial output is permitted on write failure, but exit must fail.
        assert.equal(result.stdout,Buffer.from(output).subarray(0,scenario.prefix).toString('utf8'));
        failure({...result,stdout:''},1,scenario.code === 'EPIPE' ? /Output pipe closed/ : /Unable to write output/);
      }
    }
  }
  assert.equal(readFileSync(file,'utf8'),input);
});
