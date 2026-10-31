import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import path from 'node:path';
import { createHooks } from './plugin.mjs';
import { git } from './engine.mjs';
import { fixture } from './test-fixture.mjs';

function hooks(f) {
  const client = { session: { get: async ({ path: p }) => ({ data: { id: p.id } }) } };
  return createHooks(f.harness, client);
}
const before = (h, session, tool, args) => h['tool.execute.before']({ sessionID: session, callID: 'call_test', tool }, { args });

test('plugin denies raw code and unsupported production escape routes', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  for (const tool of ['blender_execute_blender_code', 'blender_import_asset', 'blender_generate_3d', 'mediamcp_generate_video', 'background_process', 'agent_manager', 'use_mcp_tool']) {
    await assert.rejects(before(h, f.session, tool, {}), /disabled|unclassified/);
  }
  for (const command of ['python -c "print(1)"', 'git diff --output=scene.blend', 'git status; node bypass.mjs', 'git add -- .', 'git -c alias.x=anything x']) {
    await assert.rejects(before(h, f.session, 'bash', { command }), /denied|literal|approval|scope/);
  }
});

test('plugin allows recovery reads but rejects unscoped file writes', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  await before(h, f.session, 'read', { filePath: path.join(f.root, f.project, 'README.md') });
  await before(h, f.session, 'write', { filePath: path.join(f.root, f.project, 'README.md'), content: 'new docs' });
  await assert.rejects(before(h, f.session, 'write', { filePath: path.join(f.root, f.scene), content: 'forged' }), /runtime-owned/);
  await assert.rejects(before(h, f.session, 'apply_patch', { patchText: '*** Begin Patch\n*** Add File: tools/bypass.py\n+pass\n*** End Patch' }), /scope/);
});

test('unregistered sessions cannot write project files or run mutating shell commands', async (t) => {
  const f = fixture(t), h = hooks(f);
  await assert.rejects(before(h, 'unregistered', 'write', { filePath: path.join(f.root, f.project, 'README.md'), content: 'bypass' }), /registered project/);
  await assert.rejects(before(h, 'unregistered', 'bash', { command: '.\\tools\\start-blender.cmd "Blender\\Test Project"' }), /prepare/);
  await before(h, 'unregistered', 'bash', { command: 'git status --short' });
});

test('unregistered sessions may draft scaffold docs for a new project only', async (t) => {
  const f = fixture(t), h = hooks(f);
  const fresh = 'Blender/New Project';
  for (const name of ['README.md', 'Documents/REQUIREMENTS.md', 'Documents/WORKFLOW.md', 'Documents/REVIEW.md',
    'Documents/ASSETS.md', 'Documents/DECISIONS.md', 'Documents/Goals/01-brief.md', 'Documents/Reviews/README.md']) {
    await before(h, 'unregistered', 'write', { filePath: path.join(f.root, fresh, name), content: 'draft' });
  }
  for (const name of [`${fresh}/scene.blend`, `${fresh}/renders/final/hero.png`, `${fresh}/assets/models/chair.fbx`,
    `${fresh}/Documents/Reviews/R01-20261031T110000Z/visual/REPORT.md`]) {
    await assert.rejects(
      before(h, 'unregistered', 'write', { filePath: path.join(f.root, name), content: 'x' }),
      (error) => /registered project/.test(error.message) && /blender_workflow prepare/.test(error.message),
    );
  }
  await assert.rejects(before(h, 'unregistered', 'write', { filePath: path.join(f.root, f.project, 'Documents/REQUIREMENTS.md'), content: 'tamper' }), /registered project/);
});

test('plugin permits matching ticket once, blocks cross-session ticket', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const ticket = f.harness.issue(f.session, 'save', {});
  await assert.rejects(before(h, 'ses_other', 'blender_harness_execute', ticket), /forged/);
  await before(h, f.session, 'blender_harness_execute', ticket);
  await assert.rejects(before(h, f.session, 'blender_harness_execute', ticket), /replayed/);
});

test('blocked goal report requires committed project files', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  fs.appendFileSync(path.join(f.root, f.project, 'README.md'), 'uncommitted work\n');
  await assert.rejects(before(h, f.session, 'goal_report', { status: 'blocked', reason: 'waiting' }), /commit the exact project files/);
  git(f.root, ['add', '--', '.']);
  f.commit('test: commit pending readme');
  await before(h, f.session, 'goal_report', { status: 'blocked', reason: 'waiting' });
});

test('plugin blocks early completion, fake internal commands and wrong goal', async (t) => {
  const f = fixture(t), h = hooks(f);
  await assert.rejects(before(h, f.session, 'goal_report', { status: 'complete' }), /completion blocked/);
  await assert.rejects(before(h, f.session, 'goal', { action: 'start', objective: 'fake' }), /objective/);
  await assert.rejects(h.tool.blender_workflow.execute({ action: 'goal-active', payload: '{}' }, { sessionID: f.session }), /internal/);
  await before(h, f.session, 'goal', { action: 'start', objective: f.objective });
});

test('plugin injects compact durable recovery context', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const output = { context: [] };
  await h['experimental.session.compacting']({ sessionID: f.session }, output);
  assert.match(output.context[0], /Create fixture composition/);
  assert.match(output.context[0], /do not repeat goal start/);
});
