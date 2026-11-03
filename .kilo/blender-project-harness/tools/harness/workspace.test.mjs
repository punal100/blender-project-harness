import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { configPath, workspaceRoot } from './workspace.mjs';

test('workspace root resolves from the installed harness path', (t) => {
  const previous = process.env.BLENDER_WORKSPACE_ROOT;
  delete process.env.BLENDER_WORKSPACE_ROOT;
  t.after(() => {
    if (previous === undefined) delete process.env.BLENDER_WORKSPACE_ROOT;
    else process.env.BLENDER_WORKSPACE_ROOT = previous;
  });
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'blender-workspace-root-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const root = path.join(temp, 'workspace');
  fs.mkdirSync(path.join(root, '.kilo'), { recursive: true });
  fs.mkdirSync(path.join(root, 'Blender'), { recursive: true });
  const harness = path.join(root, '.kilo', 'blender-project-harness', 'tools', 'harness');
  fs.mkdirSync(harness, { recursive: true });
  assert.equal(workspaceRoot(harness), root);
});

test('config path is always the installed harness config', (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'blender-workspace-config-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const root = path.join(temp, 'workspace');
  fs.mkdirSync(root, { recursive: true });
  assert.equal(configPath(root), path.join(root, '.kilo', 'blender-project-harness', 'config.json'));
});
