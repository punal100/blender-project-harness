import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { install, status } from './install.mjs';

function makePackage(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'blender-harness-package-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const packageRoot = path.join(temp, 'package');
  const write = (name, text) => {
    const file = path.join(packageRoot, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
    return file;
  };
  write('.kilo/blender-project-harness/tools/harness/server.mjs', '// server\n');
  write('.kilo/blender-project-harness/tools/harness/package.json', '{ "type": "module" }\n');
  write('.kilo/blender-project-harness/tools/harness/package-lock.json', '{}\n');
  write('.kilo/blender-project-harness/config.example.json', JSON.stringify({ blender_subagents: { graders: { enabled: true } } }) + '\n');
  write('AGENTS.md', '# Agent contract\n');
  write('README.md', '# Package readme\n');
  write('.kilo/skills/test-skill/SKILL.md', '# Skill\n');
  write('.kilo/agent/blender-worker.md', '---\nsteps: 10\n---\n');
  write('.kilo/plugins/blender-workflow.js', "import { server } from '../../.kilo/blender-project-harness/tools/harness/plugin.mjs';\n");
  write('Blender/README.md', '# Projects\n');
  return { temp, packageRoot };
}

function workspaceBackupFile(root, name) {
  const parent = path.join(root, '.temp', 'blender-project-harness-backups');
  for (const entry of fs.readdirSync(parent)) {
    if (!entry.endsWith('-workspace')) continue;
    const file = path.join(parent, entry, name);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

function makeWorkspace(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'blender-harness-workspace-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const root = path.join(temp, 'workspace');
  fs.mkdirSync(path.join(root, '.kilo'), { recursive: true });
  fs.writeFileSync(path.join(root, '.kilo', 'kilo.jsonc'), [
    '{',
    '  // keep this comment',
    '  "mcp": {',
    '    "blender": {',
    '      "type": "local",',
    '      "command": ["node", "tools/harness/server.mjs"],',
    '      "enabled": true,',
    '      "environment": { "BLENDER_PORT": "9877" }',
    '    }',
    '  }',
    '}',
    '',
  ].join('\n'));
  return { temp, root };
}

test('installs the harness, config, and workspace surfaces', (t) => {
  const { packageRoot } = makePackage(t);
  const { root } = makeWorkspace(t);
  const result = install({ root, packageRoot, version: '1.0.0', skipDeps: true });
  assert.equal(result.status, 'installed');
  assert.equal(result.dependencies, 'skipped');
  assert.equal(fs.readFileSync(path.join(root, '.kilo', 'blender-project-harness', 'VERSION'), 'utf8').trim(), '1.0.0');
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, '.kilo', 'blender-project-harness', 'config.json'), 'utf8')).blender_subagents.graders.enabled, true);
  assert.equal(fs.existsSync(path.join(root, '.kilo', 'blender-project-harness', 'tools', 'harness', 'server.mjs')), true);
  assert.equal(fs.readFileSync(path.join(root, '.kilo', 'blender-project-harness', 'AGENTS.md'), 'utf8'), '# Agent contract\n');
  assert.match(fs.readFileSync(path.join(root, '.kilo', 'kilo.jsonc'), 'utf8'), /keep this comment/);
  assert.match(fs.readFileSync(path.join(root, '.kilo', 'kilo.jsonc'), 'utf8'), /\.kilo\/blender-project-harness\/tools\/harness\/server\.mjs/);
  assert.match(fs.readFileSync(path.join(root, '.kilo', 'plugins', 'blender-workflow.js'), 'utf8'), /\.\.\/blender-project-harness\/tools\/harness\/plugin\.mjs/);
  assert.equal(fs.existsSync(path.join(root, 'AGENTS.md')), true);
  assert.equal(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), '# Package readme\n');
  assert.equal(fs.existsSync(path.join(root, '.kilo', 'skills', 'test-skill', 'SKILL.md')), true);
  assert.match(fs.readFileSync(path.join(root, '.gitignore'), 'utf8'), /\.kilo\/blender-project-harness\/config\.json/);
  assert.match(fs.readFileSync(path.join(root, '.gitignore'), 'utf8'), /\*\*\/logs\/\*\*/);
  assert.match(fs.readFileSync(path.join(root, '.gitignore'), 'utf8'), /\*\*\/Documents\/Reviews\/\*\*\/_evidence\//);
  assert.equal(status({ root }).installed, true);
});

test('updates to a new version, backs up the old tree, and preserves config', (t) => {
  const { packageRoot } = makePackage(t);
  const { root } = makeWorkspace(t);
  const config = path.join(root, '.kilo', 'blender-project-harness', 'config.json');
  fs.mkdirSync(path.dirname(config), { recursive: true });
  fs.writeFileSync(config, JSON.stringify({ custom: true }) + '\n');
  install({ root, packageRoot, version: '1.0.0', skipDeps: true });
  fs.writeFileSync(path.join(packageRoot, 'AGENTS.md'), '# Agent contract v2\n');
  const updated = install({ root, packageRoot, version: '2.0.0', skipDeps: true });
  assert.equal(updated.status, 'updated');
  assert.ok(updated.backup);
  assert.equal(fs.readFileSync(path.join(root, '.kilo', 'blender-project-harness', 'VERSION'), 'utf8').trim(), '2.0.0');
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, '.kilo', 'blender-project-harness', 'config.json'), 'utf8')).custom, true);
  assert.equal(fs.readFileSync(path.join(root, '.kilo', 'blender-project-harness', 'AGENTS.md'), 'utf8'), '# Agent contract v2\n');
  assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), '# Agent contract v2\n');
  assert.ok(updated.written.includes('AGENTS.md'));
  const agentsBackup = workspaceBackupFile(root, 'AGENTS.md');
  assert.equal(fs.readFileSync(agentsBackup, 'utf8'), '# Agent contract\n');
  assert.ok(updated.warnings.some((warning) => warning.includes('AGENTS.md')));
  assert.equal(fs.readFileSync(path.join(root, updated.backup, 'VERSION'), 'utf8').trim(), '1.0.0');
  assert.equal(fs.readFileSync(path.join(root, updated.backup, 'AGENTS.md'), 'utf8'), '# Agent contract\n');
});

test('preserves modified root surfaces and refreshes identical ones', (t) => {
  const { packageRoot } = makePackage(t);
  const { root } = makeWorkspace(t);
  install({ root, packageRoot, version: '1.0.0', skipDeps: true });

  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Agent contract\n\nuser note\n');
  fs.writeFileSync(path.join(packageRoot, 'AGENTS.md'), '# Agent contract v2\n');
  fs.writeFileSync(path.join(packageRoot, 'README.md'), '# Package readme v2\n');

  const updated = install({ root, packageRoot, version: '2.0.0', skipDeps: true });
  assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), '# Agent contract\n\nuser note\n');
  assert.equal(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), '# Package readme v2\n');
  assert.ok(updated.warnings.some((warning) => warning.includes('AGENTS.md')));
  assert.ok(updated.written.includes('README.md'));
  assert.equal(fs.readFileSync(workspaceBackupFile(root, 'README.md'), 'utf8'), '# Package readme\n');

  fs.writeFileSync(path.join(root, 'README.md'), '# User readme\n');
  fs.writeFileSync(path.join(packageRoot, 'AGENTS.md'), '# Agent contract v3\n');
  fs.writeFileSync(path.join(packageRoot, 'README.md'), '# Package readme v3\n');

  const updatedAgain = install({ root, packageRoot, version: '3.0.0', skipDeps: true });
  assert.equal(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), '# User readme\n');
  assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), '# Agent contract\n\nuser note\n');
  assert.ok(updatedAgain.warnings.some((warning) => warning.includes('README.md')));
});

test('preserves root README when the previous install has no copy', (t) => {
  const { packageRoot } = makePackage(t);
  const { root } = makeWorkspace(t);
  install({ root, packageRoot, version: '1.0.0', skipDeps: true });
  fs.rmSync(path.join(root, '.kilo', 'blender-project-harness', 'README.md'));
  fs.writeFileSync(path.join(packageRoot, 'README.md'), '# Package readme v2\n');

  const updated = install({ root, packageRoot, version: '2.0.0', skipDeps: true });
  assert.equal(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), '# Package readme\n');
  assert.ok(updated.warnings.some((warning) => warning.includes('README.md')));
});

test('same version is idempotent unless forced', (t) => {
  const { packageRoot } = makePackage(t);
  const { root } = makeWorkspace(t);
  install({ root, packageRoot, version: '1.0.0', skipDeps: true });
  const current = install({ root, packageRoot, version: '1.0.0', skipDeps: true });
  assert.equal(current.status, 'current');
  const forced = install({ root, packageRoot, version: '1.0.0', skipDeps: true, force: true });
  assert.equal(forced.status, 'updated');
  assert.ok(forced.backup);
});

test('dry-run reports the plan without writing', (t) => {
  const { packageRoot } = makePackage(t);
  const { root } = makeWorkspace(t);
  const result = install({ root, packageRoot, version: '1.0.0', skipDeps: true, dryRun: true });
  assert.equal(result.dryRun, true);
  assert.equal(result.status, 'install');
  assert.equal(fs.existsSync(path.join(root, '.kilo', 'blender-project-harness')), false);
});

test('reset-config uses the package example', (t) => {
  const { packageRoot } = makePackage(t);
  const { root } = makeWorkspace(t);
  install({ root, packageRoot, version: '1.0.0', skipDeps: true });
  install({ root, packageRoot, version: '2.0.0', skipDeps: true, resetConfig: true });
  const config = JSON.parse(fs.readFileSync(path.join(root, '.kilo', 'blender-project-harness', 'config.json'), 'utf8'));
  assert.equal(config.custom, undefined);
  assert.equal(config.blender_subagents.graders.enabled, true);
});

test('CLI installs, reports status, and prints JSON', (t) => {
  const { root } = makeWorkspace(t);
  const bin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'blender-project-harness.mjs');
  const installResult = spawnSync(process.execPath, [bin, 'install', '--root', root, '--skip-deps', '--json'], { encoding: 'utf8' });
  assert.equal(installResult.status, 0, installResult.stderr);
  const installed = JSON.parse(installResult.stdout);
  assert.equal(installed.status, 'installed');
  assert.equal(fs.existsSync(path.join(root, '.kilo', 'blender-project-harness', 'VERSION')), true);
  const statusResult = spawnSync(process.execPath, [bin, 'status', '--root', root, '--json'], { encoding: 'utf8' });
  assert.equal(statusResult.status, 0, statusResult.stderr);
  assert.equal(JSON.parse(statusResult.stdout).installed, true);
});
