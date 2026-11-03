import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  appendAssetRow,
  appendIntakeRow,
  appendReferenceRow,
  classifyIntakeFile,
  copyIntake,
  createIntakeDocument,
  planIntake,
  sourceDocument,
} from './intake.mjs';

const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2ZQAAAABJRU5ErkJggg==', 'base64');
const GLB = Buffer.concat([Buffer.from('glTF'), Buffer.from([2, 0, 0, 0]), Buffer.alloc(8)]);

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kilo-intake-'));
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));
  return root;
}

function write(root, name, content) {
  const full = path.join(root, name);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return full;
}

test('classifies only supported intake files', () => {
  assert.equal(classifyIntakeFile('model.glb'), 'model');
  assert.equal(classifyIntakeFile('model.blend'), 'model');
  assert.equal(classifyIntakeFile('mood.png'), 'reference');
  assert.equal(classifyIntakeFile('studio.exr'), 'hdri');
  assert.equal(classifyIntakeFile('voice.wav'), 'audio');
  assert.equal(classifyIntakeFile('build.py'), 'script');
  assert.equal(classifyIntakeFile('notes.txt'), null);
  assert.equal(classifyIntakeFile('archive.zip'), null);
});

test('records adjacent licence candidates without accepting them', (t) => {
  const root = workspace(t);
  const asset = write(root, 'vendor/model.glb', GLB);
  write(root, 'vendor/LICENSE.txt', 'Example licence text\n');
  const plan = planIntake({ root, projectName: 'Project', files: [asset], kind: 'model', source: { license: 'MIT', licenseText: 'MIT' } });
  assert.deepEqual(plan.entries[0].licenseCandidates, ['LICENSE.txt']);
  const source = sourceDocument({ entry: { ...plan.entries[0], stored: 'assets/external/vendor/model.glb' }, source: {}, license: '' });
  assert.match(source, /Licence status: candidates only; not accepted/);
  assert.match(source, /Adjacent licence candidates: LICENSE\.txt/);
});

test('plans generated references and copies them without treating them as assets', (t) => {
  const root = workspace(t);
  const source = write(root, 'downloads/mood board.png', PNG_1X1);
  const projectRoot = path.join(root, 'project');
  const plan = planIntake({
    root,
    projectName: 'Project',
    files: ['downloads/mood board.png'],
    generated: { tool: 'media-mcp', model: 'image-model', prompt: 'cozy room', seed: '42', width: 1024, height: 768, c2pa: true },
  });
  assert.equal(plan.entries.length, 1);
  assert.equal(plan.entries[0].kind, 'reference');
  assert.equal(plan.entries[0].external, false);
  assert.equal(plan.entries[0].mime, 'image/png');
  assert.deepEqual([plan.entries[0].width, plan.entries[0].height], [1, 1]);
  assert.match(plan.entries[0].destination, /^Documents\/References\/mood-board-[a-f0-9]{8}\.png$/);
  const result = copyIntake({ projectRoot, plan, licenseText: plan.licenseText });
  assert.equal(result.copied.length, 1);
  assert.ok(fs.existsSync(path.join(projectRoot, result.copied[0].stored)));
  assert.equal(fs.existsSync(path.join(projectRoot, 'Documents', 'ASSETS.md')), false);
  assert.equal(source, path.join(root, 'downloads', 'mood board.png'));
});

test('requires an explicit licence for external assets and writes its verbatim copy', (t) => {
  const root = workspace(t);
  const source = write(root, 'downloads/chair.glb', GLB);
  const projectRoot = path.join(root, 'project');
  const missingText = planIntake({
    root,
    projectName: 'Project',
    files: [source],
    kind: 'model',
    source: { external: true, name: 'Desk chair', vendor: 'Example', license: 'CC0-1.0' },
  });
  assert.equal(missingText.entries.length, 0);
  assert.match(missingText.rejected[0].reason, /licenseText|licenseFile/);
  const plan = planIntake({
    root,
    projectName: 'Project',
    files: [source],
    kind: 'model',
    source: { external: true, name: 'Desk chair', vendor: 'Example', author: 'Example', license: 'CC0-1.0', licenseText: 'CC0 text' },
  });
  assert.equal(plan.entries[0].destination, 'assets/external/Example/Desk-chair/chair.glb');
  const result = copyIntake({ projectRoot, plan, licenseText: plan.licenseText });
  assert.equal(result.copied.length, 1);
  const license = path.join(projectRoot, 'assets', 'external', 'Example', 'Desk-chair', 'LICENSE.txt');
  assert.equal(fs.readFileSync(license, 'utf8'), 'CC0 text');
});

test('deduplicates identical content and suffixes name collisions', (t) => {
  const root = workspace(t);
  const source = write(root, 'downloads/ref.png', PNG_1X1);
  const projectRoot = path.join(root, 'project');
  const plan = planIntake({ root, projectName: 'Project', files: [source], kind: 'reference' });
  const first = copyIntake({ projectRoot, plan, licenseText: plan.licenseText });
  const second = copyIntake({ projectRoot, plan, licenseText: plan.licenseText });
  assert.equal(first.copied.length, 1);
  assert.equal(second.copied.length, 0);
  assert.equal(second.duplicates.length, 1);
  fs.writeFileSync(first.copied[0].target, 'different');
  const third = copyIntake({ projectRoot, plan, licenseText: plan.licenseText });
  assert.equal(third.copied.length, 1);
  assert.match(third.copied[0].stored, /-2\.png$/);
});

test('rejects files whose signature does not match the extension', (t) => {
  const root = workspace(t);
  const fake = write(root, 'downloads/fake.png', Buffer.from('not a png'));
  const plan = planIntake({ root, projectName: 'Project', files: [fake] });
  assert.equal(plan.entries.length, 0);
  assert.match(plan.rejected[0].reason, /signature does not match PNG/);
});

test('rejects unsupported files and symlinks without copying', (t) => {
  const root = workspace(t);
  const unsupported = write(root, 'downloads/notes.txt', 'notes');
  const plan = planIntake({ root, projectName: 'Project', files: [unsupported] });
  assert.equal(plan.entries.length, 0);
  assert.match(plan.rejected[0].reason, /unsupported/);
  if (process.platform !== 'win32') {
    const linked = path.join(root, 'downloads', 'linked.png');
    fs.symlinkSync(unsupported, linked);
    const linkedPlan = planIntake({ root, projectName: 'Project', files: [linked] });
    assert.equal(linkedPlan.entries.length, 0);
    assert.match(linkedPlan.rejected[0].reason, /symlink/);
  }
});

test('project-owned models bypass third-party metadata only when declared', (t) => {
  const root = workspace(t);
  const model = write(root, 'downloads/chair.glb', GLB);
  const projectOwned = planIntake({ root, projectName: 'Project', files: [model], kind: 'model', source: { external: false } });
  assert.equal(projectOwned.entries[0].destination, 'assets/models/chair.glb');
  const external = planIntake({ root, projectName: 'Project', files: [model], kind: 'model' });
  assert.equal(external.entries.length, 0);
  assert.match(external.rejected[0].reason, /source.license/);
});

test('accepts images as textures and scripts only as source', (t) => {
  const root = workspace(t);
  const image = write(root, 'downloads/wood.png', PNG_1X1);
  const script = write(root, 'downloads/build.py', 'print("hello")\n');
  const texture = planIntake({ root, projectName: 'Project', files: [image], kind: 'texture' });
  assert.equal(texture.entries[0].kind, 'texture');
  assert.equal(texture.entries[0].destination, 'assets/textures/wood.png');
  const source = planIntake({ root, projectName: 'Project', files: [script], kind: 'script' });
  assert.equal(source.entries[0].kind, 'script');
  assert.equal(source.entries[0].destination, 'scripts/build.py');
});

test('document helpers create valid tables without duplicating paths', () => {
  const assets = '# Assets\n\n## Rules\n\nRules.\n';
  const withAsset = appendAssetRow(assets, {
    asset: 'Chair', sourceUrl: 'https://example.invalid', author: 'Example', license: 'CC0-1.0',
    localPath: 'assets/external/Example/Chair/chair.glb', packaging: 'packed', redistributable: 'yes', notes: '',
  });
  assert.match(withAsset, /## Rules/);
  assert.match(withAsset, /Chair/);
  assert.equal(appendAssetRow(withAsset, {
    asset: 'Chair', sourceUrl: '', author: '', license: '', localPath: 'assets/external/Example/Chair/chair.glb', packaging: '', redistributable: '', notes: '',
  }), withAsset);
  const references = '# References\n\n## Index\n\n| Reference | Source | What it informs | Notes |\n|---|---|---|---|\n';
  assert.match(appendReferenceRow(references, { reference: 'mood.png', source: 'user', informs: 'mood', notes: '' }), /mood\.png/);
  const intake = createIntakeDocument('Project');
  assert.match(appendIntakeRow(intake, { time: 'now', kind: 'reference', stored: 'Documents/References/mood.png', sha256: 'a', source: 'user', license: '', status: 'copied' }), /mood\.png/);
});
