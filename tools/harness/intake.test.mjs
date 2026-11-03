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
} from './intake.mjs';

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

test('plans generated references and copies them without treating them as assets', (t) => {
  const root = workspace(t);
  const source = write(root, 'downloads/mood board.png', Buffer.from('png'));
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
  assert.match(plan.entries[0].destination, /^Documents\/References\/mood-board-[a-f0-9]{8}\.png$/);
  const result = copyIntake({ projectRoot, plan, licenseText: plan.licenseText });
  assert.equal(result.copied.length, 1);
  assert.ok(fs.existsSync(path.join(projectRoot, result.copied[0].stored)));
  assert.equal(fs.existsSync(path.join(projectRoot, 'Documents', 'ASSETS.md')), false);
  assert.equal(source, path.join(root, 'downloads', 'mood board.png'));
});

test('requires an explicit licence for external assets and writes its verbatim copy', (t) => {
  const root = workspace(t);
  const source = write(root, 'downloads/chair.glb', Buffer.from('glb'));
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
  const source = write(root, 'downloads/ref.png', Buffer.from('same'));
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
  const model = write(root, 'downloads/chair.glb', Buffer.from('glb'));
  const projectOwned = planIntake({ root, projectName: 'Project', files: [model], kind: 'model', source: { external: false } });
  assert.equal(projectOwned.entries[0].destination, 'assets/models/chair.glb');
  const external = planIntake({ root, projectName: 'Project', files: [model], kind: 'model' });
  assert.equal(external.entries.length, 0);
  assert.match(external.rejected[0].reason, /source.license/);
});

test('accepts images as textures and scripts only as source', (t) => {
  const root = workspace(t);
  const image = write(root, 'downloads/wood.png', Buffer.from('png'));
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
