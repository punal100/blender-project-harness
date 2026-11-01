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
    await assert.rejects(before(h, f.session, 'bash', { command }), /denied|literal|approval|scope|blender_workflow commit/);
  }
});

test('capabilities expose the harness-owned operation and bootstrap lists', async (t) => {
  const f = fixture(t), h = hooks(f);
  const result = JSON.parse(await h.tool.blender_workflow.execute({ action: 'capabilities', payload: '{}' }, { sessionID: f.session }));
  assert.ok(result.operations.includes('create_mesh'));
  assert.ok(result.primitives.includes('cube'));
  assert.ok(result.bootstrapDocuments.includes('Documents/Goals/<NN>-<slug>.md'));
  assert.ok(result.documentFormats.some((format) => format.id === 'goal' && format.sections.includes('Acceptance')));
  assert.ok(result.actions.some((action) => action.name === 'bootstrap-commit'));
  assert.match(result.commitPolicy, /manual project git/);
  assert.match(result.documentPolicy, /structured/);
  assert.equal(result.limits.appliesBeforeCheckpoint, 20);
  assert.equal(result.limits.hardApplyCap, 20);
  assert.equal(result.limits.minutesWithoutApply, 15);
});

test('document tool returns structured project reads', async (t) => {
  const f = fixture(t), h = hooks(f);
  const result = JSON.parse(await h.tool.blender_document.execute(
    { action: 'read', payload: JSON.stringify({ path: 'Documents/REQUIREMENTS.md' }) },
    { sessionID: f.session },
  ));
  assert.equal(result.content, undefined);
  assert.equal(result.fields.Status, 'Confirmed');
  assert.ok(result.sections.some((section) => section.heading === 'Confirmed requirements'));
  const section = JSON.parse(await h.tool.blender_document.execute(
    { action: 'read', payload: JSON.stringify({ path: 'Documents/REQUIREMENTS.md', section: 'Confirmed requirements' }) },
    { sessionID: f.session },
  ));
  assert.match(section.section.content, /Fixture confirmed requirements/);
  f.begin();
  f.harness.transaction((state) => state.projects[f.project].change.paths.push(`${f.project}/Documents/NEW.md`));
  await h.tool.blender_document.execute(
    { action: 'write', payload: JSON.stringify({ path: 'Documents/NEW.md', content: '# New document\n' }) },
    { sessionID: f.session },
  );
  assert.ok(fs.existsSync(path.join(f.root, f.project, 'Documents', 'NEW.md')));
  f.harness.transaction((state) => state.projects[f.project].change.paths.push(`${f.project}/Documents/REQUIREMENTS.md`));
  const requirements = fs.readFileSync(path.join(f.root, f.project, 'Documents', 'REQUIREMENTS.md'), 'utf8');
  await assert.rejects(
    h.tool.blender_document.execute(
      { action: 'write', payload: JSON.stringify({ path: 'Documents/REQUIREMENTS.md', content: requirements }) },
      { sessionID: f.session },
    ),
    /frozen/,
  );
});

test('production worker delegation requires valid read-only limits', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const worker = {
    agent: 'blender-worker',
    provider: 'fixture-provider',
    model: 'fixture-model',
    variant: 'fixture-variant',
    max_minutes: 10,
    max_steps: 18,
    max_failed_attempts: 2,
    max_parallel: 1,
  };
  f.write('config.json', JSON.stringify({ blender_subagents: { workers: worker } }));
  f.write('.kilo/agent/blender-worker.md', '---\nsteps: 20\n---\n');
  await before(h, f.session, 'task', { subagent_type: 'blender-worker', prompt: 'Inspect cube', background: false });
  await assert.rejects(
    before(h, f.session, 'task', { subagent_type: 'blender-worker', prompt: 'Inspect cube', background: true }),
    /foreground/,
  );
  f.write('config.json', JSON.stringify({ blender_subagents: { workers: { ...worker, max_parallel: 2 } } }));
  await assert.rejects(
    before(h, f.session, 'task', { subagent_type: 'blender-worker', prompt: 'Inspect cube', background: false }),
    /max_parallel/,
  );
  f.write('config.json', JSON.stringify({ blender_subagents: { workers: { ...worker, max_steps: 21 } } }));
  await assert.rejects(
    before(h, f.session, 'task', { subagent_type: 'blender-worker', prompt: 'Inspect cube', background: false }),
    /steps ceiling/,
  );
});

test('manual creation of new project documents is blocked', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  f.harness.transaction((s) => s.projects[f.project].change.paths.push(`${f.project}/Documents/NEW.md`));
  await assert.rejects(
    before(h, f.session, 'write', { filePath: `${f.project}/Documents/NEW.md`, content: '# New\n' }),
    /blender_document/,
  );
});

test('worker children stay read-only after delegation', async (t) => {
  const f = fixture(t);
  f.begin();
  const h = createHooks(f.harness, {
    session: {
      get: async ({ path: p }) => ({ data: { id: p.id, parentID: f.session, agent: 'blender-worker' } }),
      messages: async () => ({ data: [{ info: { role: 'user', agent: 'blender-worker' }, parts: [{ type: 'text', text: 'Inspect scene' }] }] }),
    },
  });
  await before(h, 'ses_worker', 'read', { filePath: path.join(f.root, f.project, 'README.md') });
  await before(h, 'ses_worker', 'blender_get_scene_info', {});
  await assert.rejects(
    before(h, 'ses_worker', 'write', { filePath: path.join(f.root, f.project, 'README.md'), content: 'edited' }),
    /read-only/,
  );
  await assert.rejects(before(h, 'ses_worker', 'blender_workflow', { action: 'status' }), /read-only/);
  await assert.rejects(
    before(h, 'ses_worker', 'blender_harness_execute', { action: 'status' }),
    /assigned apply operations only/,
  );
});

test('apply execution is delegated to worker children', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const ticket = f.harness.issue(f.session, 'apply', { retry: true });
  await assert.rejects(
    before(h, f.session, 'blender_harness_execute', ticket),
    /delegates apply operations/,
  );
  const worker = createHooks(f.harness, {
    session: {
      get: async ({ path: p }) => ({ data: { id: p.id, parentID: f.session, agent: 'blender-worker' } }),
      messages: async () => ({ data: [{ info: { role: 'user', agent: 'blender-worker' }, parts: [{ type: 'text', text: 'Apply assignment' }] }] }),
    },
  });
  await before(worker, 'ses_worker', 'blender_harness_execute', ticket);
  assert.equal(f.harness.transaction((s) => s.tickets[ticket.token].state), 'authorized');
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
  await assert.rejects(before(h, 'unregistered', 'write', { filePath: path.join(f.root, f.project, 'README.md'), content: 'bypass' }), /harness-owned/);
  await before(h, 'unregistered', 'write', { filePath: path.join(f.root, 'Blender', 'README.md'), content: 'collection docs' });
  await assert.rejects(before(h, 'unregistered', 'bash', { command: '.\\tools\\start-blender.cmd "Blender\\Test Project"' }), /retired/);
  await assert.rejects(before(h, 'unregistered', 'bash', { command: `git add -- "${f.project}/README.md"` }), /bootstrap-commit/);
  await before(h, 'unregistered', 'bash', { command: 'git status --short' });
});

test('unregistered sessions must create and commit scaffold documents through the harness', async (t) => {
  const f = fixture(t), h = hooks(f);
  const fresh = 'Blender/New Project';
  const freshRoot = path.join(f.root, fresh);
  fs.cpSync(path.join(f.root, f.project), freshRoot, { recursive: true });
  fs.rmSync(path.join(freshRoot, 'scene.blend'));
  await assert.rejects(
    before(h, 'unregistered', 'write', { filePath: path.join(freshRoot, 'README.md'), content: 'bypass' }),
    /harness-owned/,
  );
  await assert.rejects(
    h.tool.blender_workflow.execute(
      { action: 'bootstrap-document', payload: JSON.stringify({ project: fresh, path: 'Documents/References/note.md', content: 'No heading\n' }) },
      { sessionID: 'unregistered' },
    ),
    /level-1 heading/,
  );
  await h.tool.blender_workflow.execute(
    { action: 'bootstrap-document', payload: JSON.stringify({ project: fresh, path: 'Documents/References/note.md', content: '# Reference note\n' }) },
    { sessionID: 'unregistered' },
  );
  const committed = JSON.parse(await h.tool.blender_workflow.execute(
    { action: 'bootstrap-commit', payload: JSON.stringify({ project: fresh, message: 'docs: scaffold new project' }) },
    { sessionID: 'unregistered' },
  ));
  assert.match(committed.next, /prepare/);
  const status = JSON.parse(await h.tool.blender_workflow.execute(
    { action: 'status', payload: JSON.stringify({ project: fresh }) },
    { sessionID: 'unregistered' },
  ));
  assert.match(status.nextStep.command, /prepare/);
});

test('launch requires an active goal and shell Blender commands are retired', async (t) => {
  const f = fixture(t), h = hooks(f);
  await assert.rejects(h.tool.blender_workflow.execute({ action: 'launch', payload: '{}' }, { sessionID: f.session }), /active goal/);
  await assert.rejects(before(h, f.session, 'bash', { command: 'blender.exe scene.blend' }), /retired/);
});

test('bootstrap save can be staged and committed without review', async (t) => {
  const f = fixture(t), h = hooks(f);
  f.begin();
  f.harness.transaction((s) => {
    const change = s.projects[f.project].change;
    change.bootstrap = true;
    change.saved = true;
    change.operations = 0;
  });
  fs.appendFileSync(path.join(f.root, f.scene), 'bootstrap save\n');
  await assert.rejects(
    before(h, f.session, 'bash', { command: `git add -- "${f.scene}"` }),
    /blender_workflow commit/,
  );
  await assert.rejects(
    before(h, f.session, 'bash', { command: 'git commit -m "feat: bootstrap scene"' }),
    /blender_workflow commit/,
  );
  await h.tool.blender_workflow.execute(
    { action: 'commit', payload: JSON.stringify({ message: 'feat: bootstrap scene' }) },
    { sessionID: f.session },
  );
  await before(h, f.session, 'goal_report', { status: 'blocked', reason: 'waiting' });
});

test('plugin permits matching ticket once, blocks cross-session ticket', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const ticket = f.harness.issue(f.session, 'save', {});
  await assert.rejects(before(h, 'ses_other', 'blender_harness_execute', ticket), /forged/);
  await before(h, f.session, 'blender_harness_execute', ticket);
  await assert.rejects(before(h, f.session, 'blender_harness_execute', ticket), /replayed/);
});

test('blocked goal report does not require a commit', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  fs.appendFileSync(path.join(f.root, f.project, 'README.md'), 'uncommitted work\n');
  await before(h, f.session, 'goal_report', { status: 'blocked', reason: 'waiting' });
});

test('recover reopens a failed change through the tool', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  f.harness.transaction((state) => {
    const change = state.projects[f.project].change;
    change.failure = 'Cannot render, no camera';
    change.deadline = 0;
  });
  const result = JSON.parse(await h.tool.blender_workflow.execute(
    { action: 'recover', payload: JSON.stringify({ reopen: true }) },
    { sessionID: f.session },
  ));
  assert.equal(result.change.failure, false);
  assert.equal(result.change.reopen, true);
  assert.equal(result.nextStep.phase, 'apply');
});

test('plugin blocks early completion, fake internal commands and wrong goal', async (t) => {
  const f = fixture(t), h = hooks(f);
  await assert.rejects(before(h, f.session, 'goal_report', { status: 'complete' }), /completion blocked/);
  await assert.rejects(before(h, f.session, 'goal', { action: 'start', objective: 'fake' }), /objective/);
  await assert.rejects(h.tool.blender_workflow.execute({ action: 'goal-active', payload: '{}' }, { sessionID: f.session }), /internal/);
  await before(h, f.session, 'goal', { action: 'start', objective: f.objective.replace(/\n/g, '\r\n') + '\r\n' });
});

test('plugin injects compact durable recovery context', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const output = { context: [] };
  await h['experimental.session.compacting']({ sessionID: f.session }, output);
  assert.match(output.context[0], /Create fixture composition/);
  assert.match(output.context[0], /do not repeat goal start/);
});
