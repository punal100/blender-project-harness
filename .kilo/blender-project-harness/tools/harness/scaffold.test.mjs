import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { DEFAULT_TEMPLATE_ROOT, scaffold } from './scaffold.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TEMPLATE = path.join(ROOT, 'tools', 'harness', 'templates', 'project');
const tempBase = path.join(os.tmpdir(), 'kilo');
fs.mkdirSync(tempBase, { recursive: true });

function workspace(t) {
  const root = fs.mkdtempSync(path.join(tempBase, 'scaffold-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'Blender'), { recursive: true });
  return root;
}

function templateCopy(t) {
  const root = fs.mkdtempSync(path.join(tempBase, 'scaffold-template-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const template = path.join(root, 'project');
  fs.cpSync(TEMPLATE, template, { recursive: true });
  return template;
}

test('scaffold template is owned by the harness', () => {
  assert.equal(DEFAULT_TEMPLATE_ROOT, TEMPLATE);
  assert.ok(fs.existsSync(path.join(TEMPLATE, 'README.md')));
});

test('scaffold renders tokens, hidden files, and binaries', (t) => {
  const root = workspace(t);
  const result = scaffold(root, { name: 'Cozy Room', description: 'A room.', goal: 'Build it.', goalTitle: 'Brief', date: new Date(2026, 9, 31) });
  const project = path.join(root, 'Blender', 'Cozy Room');
  assert.equal(result.destination, project);
  assert.equal(result.slug, 'cozy-room');
  const readme = fs.readFileSync(path.join(project, 'README.md'), 'utf8');
  assert.match(readme, /Cozy Room/);
  assert.match(readme, /2026-10-31/);
  assert.doesNotMatch(readme, /\{\{/);
  assert.ok(fs.existsSync(path.join(project, '.gitignore')));
  assert.ok(fs.existsSync(path.join(project, 'Documents', 'TASKSTRACKER.md')));
  assert.ok(fs.existsSync(path.join(project, 'Documents', 'Tasks', 'README.md')));
  assert.ok(fs.existsSync(path.join(project, 'Documents', 'INTAKE.md')));
  assert.match(fs.readFileSync(path.join(project, 'Documents', 'INTAKE.md'), 'utf8'), /Intake — Cozy Room/);
  assert.equal(fs.existsSync(path.join(project, 'Documents', 'TASKS.md')), false);
  assert.ok(fs.existsSync(path.join(project, 'exports', '.gitkeep')));
  assert.equal(fs.readdirSync(path.join(root, 'Blender')).some((name) => name.startsWith('.scaffold-')), false);
});

test('scaffold dry run writes nothing', (t) => {
  const root = workspace(t);
  const result = scaffold(root, { name: 'Dry Run', dryRun: true });
  assert.equal(result.dryRun, true);
  assert.equal(fs.existsSync(path.join(root, 'Blender', 'Dry Run')), false);
  assert.ok(result.files.includes('README.md'));
});

test('scaffold rejects invalid names, duplicates, and unknown tokens', (t) => {
  const root = workspace(t);
  const template = templateCopy(t);
  assert.throws(() => scaffold(root, { name: 'CON' }), /invalid project name/);
  assert.throws(() => scaffold(root, { name: 'Trailing ' }), /invalid project name/);
  scaffold(root, { name: 'Existing' });
  assert.throws(() => scaffold(root, { name: 'Existing' }), /already exists/);
  const templateFile = path.join(template, 'Documents', 'ASSETS.md');
  fs.writeFileSync(templateFile, '{{UNKNOWN_TOKEN}}\n');
  assert.throws(() => scaffold(root, { name: 'Broken', templateRoot: template }), /unknown template token/);
  assert.equal(fs.existsSync(path.join(root, 'Blender', 'Broken')), false);
  assert.equal(fs.readdirSync(path.join(root, 'Blender')).some((name) => name.startsWith('.scaffold-')), false);
});
