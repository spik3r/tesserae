#!/usr/bin/env node
import { constants, read } from 'node:fs';
import { open } from 'node:fs/promises';
import { promisify } from 'node:util';

const MAX_INPUT_BYTES = 1024 * 1024;
const readBytes = promisify(read);
const usage = `Usage: tesserae <file.json|->
       tesserae --help

Render one tesserae/v1 JSON model as standalone HTML on stdout.
Use - to read stdin; prefix option-like filenames with ./.
Input: at most 1 MiB (1,048,576 bytes), strict UTF-8, no BOM.
Output: at most 1 MiB of inert HTML, using the existing renderer.
No files are written; no network or browser is used.

From a checkout (Node 22+, no installation):
  node bin/tesserae.js examples/report.json > report.html
  node bin/tesserae.js - < examples/report.json > report.html

Exit codes: 0 success/help, 1 input/render/write failure, 2 usage error.
`;

function fail(message, code = 1) {
  process.exitCode = code;
  process.stderr.write(`tesserae: ${message}\n`);
}

// Stream errors may arrive after write() returns, including a closed pipeline.
process.stdout.on('error', error => {
  fail(error.code === 'EPIPE' ? 'Output pipe closed.' : 'Unable to write output.');
});
process.stderr.on('error', () => { process.exitCode = 1; });

async function readBounded(fd) {
  // Read at most the limit plus one byte, even if a file grows during reading.
  const buffer = Buffer.allocUnsafe(MAX_INPUT_BYTES + 1);
  let size = 0;
  while (size <= MAX_INPUT_BYTES) {
    const length = Math.min(64 * 1024, buffer.length - size);
    const { bytesRead } = await readBytes(fd, buffer, size, length, null);
    if (bytesRead === 0) return buffer.subarray(0, size);
    size += bytesRead;
  }
  throw new RangeError('Input exceeds 1 MiB (1,048,576 bytes).');
}

async function main(args) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    process.stdout.write(usage);
    return;
  }
  if (args.length !== 1 || !args[0] || (args[0] !== '-' && args[0].startsWith('-'))) {
    fail('Expected one JSON filepath or -. Run with --help for usage.', 2);
    return;
  }

  let bytes;
  try {
    if (args[0] === '-') {
      bytes = await readBounded(0);
    } else {
      // Nonblocking open lets us reject FIFOs without waiting for a writer.
      const file = await open(args[0], constants.O_RDONLY | constants.O_NONBLOCK);
      try {
        if (!(await file.stat()).isFile()) throw new Error('Expected regular file');
        bytes = await readBounded(file.fd);
      } finally {
        await file.close();
      }
    }
  } catch (error) {
    fail(error instanceof RangeError
      ? 'Input exceeds 1 MiB (1,048,576 bytes).'
      : 'Unable to read input. Use a readable regular file or - for stdin.');
    return;
  }

  let source;
  try {
    // Preserve a BOM so JSON.parse rejects it rather than silently removing it.
    source = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    fail('Input is not valid UTF-8.');
    return;
  }
  let model;
  try {
    model = JSON.parse(source);
  } catch {
    fail('Input is not valid JSON (UTF-8 without a BOM required).');
    return;
  }
  let html;
  try {
    const { renderPage } = await import('../html/index.js');
    html = renderPage(model);
  } catch {
    // Renderer and parser exceptions can contain caller data; never print them.
    fail('Unable to render model. Check the tesserae/v1 contract and renderer assets.');
    return;
  }
  process.stdout.write(html);
}

await main(process.argv.slice(2));
