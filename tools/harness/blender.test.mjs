import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { findBlender, instanceFile, instanceStatus, isAlive, launchProject, readWorkspacePort, stopProject } from './blender.mjs';

const tempBase = path.join(os.tmpdir(), 'kilo');
fs.mkdirSync(tempBase, { recursive: true });

function workspace(t) {
  const root = fs.mkdtempSync(path.join(tempBase, 'blender-launch-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'Blender', 'Test Project'), { recursive: true });
  fs.mkdirSync(path.join(root, '.kilo'), { recursive: true });
  fs.writeFileSync(path.join(root, '.kilo', 'kilo.jsonc'), '{ "mcp": { "blender": { "environment": { "BLENDER_PORT": "19877" } } } }\n');
  const home = path.join(root, 'state');
  fs.mkdirSync(home, { recursive: true });
  return { root, home, project: 'Blender/Test Project' };
}

function writeInstance(home, instance) {
  fs.writeFileSync(instanceFile(home), JSON.stringify(instance, null, 2));
}

test('workspace port is read from jsonc and validated', (t) => {
  const f = workspace(t);
  assert.equal(readWorkspacePort(f.root), 19877);
  fs.writeFileSync(path.join(f.root, '.kilo', 'kilo.jsonc'), '// "BLENDER_PORT": "1"\n{ "mcp": { "blender": { "environment": { "BLENDER_PORT": "2222" } } } }\n');
  assert.equal(readWorkspacePort(f.root), 2222);
  fs.writeFileSync(path.join(f.root, '.kilo', 'kilo.jsonc'), '{ "environment": { "BLENDER_PORT": "80" } }\n');
  assert.throws(() => readWorkspacePort(f.root), /invalid BLENDER_PORT/);
  fs.writeFileSync(path.join(f.root, '.kilo', 'kilo.jsonc'), '{}\n');
  assert.throws(() => readWorkspacePort(f.root), /lacks BLENDER_PORT/);
});

test('BLENDER_EXE is honoured for discovery', (t) => {
  const f = workspace(t);
  const fake = path.join(f.root, 'fake-blender.exe');
  fs.writeFileSync(fake, 'fixture');
  const found = findBlender({ BLENDER_EXE: fake, PATH: '' });
  assert.equal(found, path.resolve(fake));
  assert.throws(() => findBlender({ PATH: '' }), /Blender not found/);
});

test('stale instance metadata is cleared', (t) => {
  const f = workspace(t);
  writeInstance(f.home, { pid: 2147483647, project: f.project, scene: `${f.project}/x.blend`, port: 19877 });
  const status = instanceStatus(f.home);
  assert.equal(status.running, false);
  assert.equal(fs.existsSync(instanceFile(f.home)), false);
});

test('stop terminates the recorded process and clears metadata', async (t) => {
  const f = workspace(t);
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  t.after(() => { try { process.kill(child.pid); } catch { /* already stopped */ } });
  writeInstance(f.home, { pid: child.pid, project: f.project, scene: `${f.project}/x.blend`, port: 19877 });
  const result = stopProject({ home: f.home, project: f.project });
  assert.equal(result.running, false);
  assert.equal(fs.existsSync(instanceFile(f.home)), false);
  for (let attempt = 0; attempt < 20 && isAlive(child.pid); attempt += 1) await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(isAlive(child.pid), false);
});

test('launch rejects a live instance for another project', async (t) => {
  const f = workspace(t);
  writeInstance(f.home, { pid: process.pid, project: 'Blender/Other', scene: 'Blender/Other/x.blend', port: 19877 });
  await assert.rejects(launchProject({ root: f.root, home: f.home, project: f.project, scene: `${f.project}/x.blend`, session: 'ses_test' }), /only one Blender instance/);
});

test('launch rejects when the MCP port is already in use', async (t) => {
  const f = workspace(t);
  const server = net.createServer();
  await new Promise((resolve) => server.listen(19877, '127.0.0.1', resolve));
  t.after(() => server.close());
  await assert.rejects(launchProject({ root: f.root, home: f.home, project: f.project, scene: `${f.project}/x.blend`, session: 'ses_test' }), /already in use/);
});

test('launch rejects projects outside the collection and scenes outside the project', async (t) => {
  const f = workspace(t);
  await assert.rejects(launchProject({ root: f.root, home: f.home, project: 'Other/Project', scene: 'Other/Project/x.blend', session: 'ses_test' }), /project must live under/);
  await assert.rejects(launchProject({ root: f.root, home: f.home, project: f.project, scene: 'Blender/Other/x.blend', session: 'ses_test' }), /scene must stay inside/);
});
