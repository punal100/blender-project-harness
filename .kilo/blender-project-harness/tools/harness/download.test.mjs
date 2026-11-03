import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { downloadFileName, downloadToStaging, validateDownloadUrl } from './download.mjs';

test('download rejects insecure and private URLs', () => {
  assert.throws(() => validateDownloadUrl('http://example.com/chair.glb'), /HTTPS/);
  assert.throws(() => validateDownloadUrl('https://localhost/chair.glb'), /private/);
  assert.throws(() => validateDownloadUrl('https://127.0.0.1/chair.glb'), /private/);
  assert.throws(() => validateDownloadUrl('https://10.1.2.3/chair.glb'), /private/);
  assert.throws(() => validateDownloadUrl('file:///C:/chair.glb'), /HTTPS/);
  assert.throws(() => validateDownloadUrl('https://user:secret@example.com/chair.glb'), /credentials/);
  assert.doesNotThrow(() => validateDownloadUrl('https://example.com/chair.glb'));
});

test('download names only supported files', () => {
  assert.equal(downloadFileName('https://example.com/files/mood%20board.png'), 'mood-board.png');
  assert.equal(downloadFileName('https://example.com/download', 'chair.glb'), 'chair.glb');
  assert.throws(() => downloadFileName('https://example.com/page.html'), /supported/);
});

test('download stages bytes with a hash and no project write', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kilo-download-'));
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(Buffer.from('glb-bytes'), {
    status: 200,
    headers: { 'content-type': 'application/octet-stream', 'content-length': '9' },
  });
  t.after(() => { globalThis.fetch = original; });
  const result = await downloadToStaging({
    root,
    project: 'Blender/Test',
    url: 'https://example.com/chair.glb',
    filename: 'chair.glb',
  });
  assert.equal(result.bytes, 9);
  assert.equal(result.sha256, '73b18949c3b005215fc7c63efc8c29d5b31ce0760ca9a2f60396cc41b12e970f');
  assert.match(result.relative, /^\.temp\/Intake\/Blender-Test\//);
  assert.equal(fs.readFileSync(result.path, 'utf8'), 'glb-bytes');
  assert.equal(fs.existsSync(path.join(root, 'Blender', 'Test')), false);
});

test('download refuses oversized responses before staging', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kilo-download-limit-'));
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(Buffer.from('glb-bytes'), {
    status: 200,
    headers: { 'content-type': 'application/octet-stream', 'content-length': '9' },
  });
  t.after(() => { globalThis.fetch = original; });
  await assert.rejects(downloadToStaging({
    root,
    project: 'Blender/Test',
    url: 'https://example.com/chair.glb',
    filename: 'chair.glb',
    maxBytes: 4,
  }), /maxBytes/);
  assert.equal(fs.existsSync(path.join(root, '.temp', 'Intake')), false);
});
