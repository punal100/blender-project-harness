import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import path from 'node:path';
import { createHooks } from './plugin.mjs';
import { OPERATION_NAMES } from './blender-operations.mjs';
import { git, Harness } from './engine.mjs';
import { fixture } from './test-fixture.mjs';

function hooks(f, metadata, overrides = {}) {
  const client = {
    ...overrides,
    session: {
      get: async ({ path: p }) => ({ data: { id: p.id, ...(metadata ? { metadata } : {}) } }),
      ...(overrides.session ?? {}),
    },
  };
  return createHooks(f.harness, client);
}
const before = (h, session, tool, args) => h['tool.execute.before']({ sessionID: session, callID: 'call_test', tool }, { args });
const GRADER_TOKEN = '33333333-3333-3333-3333-333333333333';
function graderState(f, { hardDeadline = Date.now() + 30_000, child = 'ses_grader' } = {}) {
  f.begin();
  const round = 'R00-20261031T100000Z';
  const report = `${f.project}/Documents/Reviews/${round}/visual/REPORT.md`;
  f.harness.transaction((s) => {
    const p = s.projects[f.project];
    p.change.inspected = true;
    p.change.sealed = true;
    p.change.sceneHash = f.harness.hash(f.scene);
    p.change.evidence = {};
    p.change.evidenceKey = 'e'.repeat(64);
    p.change.round = round;
    p.change.graders.visual = {
      token: GRADER_TOKEN,
      report,
      child,
      deadline: Date.now() + 30_000,
      hardDeadline,
      attempt: 1,
      steps: 0,
    };
  });
  return { round, report };
}
function graderHooks(f, aborted = []) {
  return createHooks(f.harness, {
    session: {
      get: async ({ path: p }) => ({ data: { id: p.id, ...(p.id === 'ses_grader' ? { parentID: f.session } : {}), agent: 'blender-grader' } }),
      messages: async () => ({ data: [
        { info: { role: 'user', agent: 'blender-grader' }, parts: [{ type: 'text', text: `HARNESS_GRADER:${GRADER_TOKEN}` }] },
        { info: { role: 'assistant', providerID: 'test', modelID: 'test-model', variant: 'test-variant' }, parts: [] },
      ] }),
      abort: async ({ path: p }) => aborted.push(p.id),
    },
    experimental: {
      session: {
        list: async () => ({ data: [{ id: 'ses_grader', parentID: f.session, agent: 'blender-grader' }] }),
      },
    },
  });
}
async function approveShell(h, session, command, reason = 'Inspect the workspace for a bounded diagnosis.') {
  let warning;
  try { await before(h, session, 'bash', { command }); } catch (error) { warning = error; }
  assert.ok(warning, 'first shell call must warn');
  const id = warning.message.match(/HARNESS_SHELL:([a-f0-9-]{36})/)?.[1];
  assert.ok(id, warning.message);
  await before(h, session, 'bash', { command, description: `Reason: ${reason} [HARNESS_SHELL:${id}]` });
  return id;
}

test('cancel_wakeup is classified as an orchestrator scheduling tool', async (t) => {
  const f = fixture(t), h = hooks(f);
  await assert.doesNotReject(before(h, f.session, 'cancel_wakeup', { action: 'list' }));
  await assert.doesNotReject(before(h, f.session, 'cancel_wakeup', { action: 'cancel', id: 'wake_1' }));
});

test('plugin denies raw code and unsupported production escape routes', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  for (const tool of ['blender_execute_blender_code', 'blender_import_asset', 'blender_generate_3d', 'mediamcp_generate_video', 'use_mcp_tool']) {
    await assert.rejects(before(h, f.session, tool, {}), /disabled|unclassified|media-request/);
  }
  await assert.doesNotReject(before(h, f.session, 'agent_manager', { mode: 'local', versions: false, tasks: [], action: null }));
  await assert.doesNotReject(before(h, f.session, 'background_process', { command: 'node .kilo/blender-project-harness/tools/harness/cli.mjs doctor' }));
  for (const command of ['python -c "print(1)"', 'git diff --output=scene.blend', 'git status; node bypass.mjs', 'git add -- .', 'git -c alias.x=anything x']) {
    await assert.rejects(before(h, f.session, 'bash', { command }), /denied|literal|approval|scope|blender_workflow commit/);
  }
});

test('unregistered tooling commit messages may mention the engine name', async (t) => {
  const f = fixture(t);
  const harness = new Harness(f.root, { stateRoot: path.join(path.dirname(f.root), 'unregistered-state') });
  const h = hooks({ harness });
  await approveShell(h, 'ses_unregistered', 'git commit -m "docs: Blender harness notes"');
  await assert.rejects(before(h, 'ses_unregistered', 'bash', {
    command: 'C:\\Program Files\\Blender Foundation\\Blender\\blender.exe --background',
  }), /launch and stop Blender/);
  await assert.rejects(before(h, 'ses_unregistered', 'bash', {
    command: 'echo ready; C:\\Program Files\\Blender Foundation\\Blender\\blender.exe --background',
  }), /launch and stop Blender/);
  await assert.rejects(before(h, 'ses_unregistered', 'bash', {
    command: 'C:\\Program Files\\Blender Foundation\\Blender\\blender.exe --background --version',
  }), /launch and stop Blender/);
  await assert.doesNotReject(before(h, 'ses_unregistered', 'bash', {
    command: 'C:\\Program Files\\Blender Foundation\\Blender\\blender.exe --version',
  }));
  await approveShell(h, 'ses_unregistered', 'git commit -m "docs: Blender/harness notes"');
  await assert.rejects(before(h, 'ses_unregistered', 'bash', {
    command: 'git commit -am "docs: Blender harness notes"',
  }), /bootstrap-commit/);
});

test('media generation requires a registered project and an open media request', async (t) => {
  const f = fixture(t), h = hooks(f);
  await assert.rejects(before(h, f.session, 'mediamcp_generate_image', {}), /media-request|registered project/);
  f.begin();
  await assert.rejects(before(h, f.session, 'mediamcp_generate_image', {}), /media-request/);
  await assert.doesNotReject(before(h, f.session, 'mediamcp_list_models', {}));
  const requested = JSON.parse(await h.tool.blender_workflow.execute({
    action: 'media-request',
    payload: {
      purpose: 'Generated concept reference',
      kind: 'image',
      tool: 'mediamcp_generate_image',
      model: 'test-model',
      prompt: 'A warm reading corner',
      seed: 7,
    },
  }, { sessionID: f.session }));
  assert.equal(requested.media.open.status, 'requested');
  await assert.doesNotReject(before(h, f.session, 'mediamcp_generate_image', {}));
  await assert.rejects(before(h, f.session, 'mediamcp_generate_image', {}), /media-request|requires/);
  await assert.rejects(before(h, f.session, 'mediamcp_generate_video', {}), /requires/);
  await assert.doesNotReject(before(h, f.session, 'mediamcp_check_config', {}));
});

test('capabilities expose the harness-owned operation and bootstrap lists', async (t) => {
  const f = fixture(t), h = hooks(f);
  const result = JSON.parse(await h.tool.blender_workflow.execute({ action: 'capabilities', payload: '{}' }, { sessionID: f.session }));
  assert.ok(result.operations.includes('create_mesh'));
  assert.ok(result.operations.includes('import_asset'));
  assert.equal(result.stateMachines.version, 1);
  assert.ok(result.stateMachines.names.includes('workflow'));
  assert.ok(result.stateMachines.names.includes('ticket'));
  assert.ok(result.stateMachines.machines.ticket.transitions.issued.includes('authorized'));
  assert.ok(result.operations.includes('export_scene'));
  assert.deepEqual([...result.operations].sort(), [...OPERATION_NAMES].sort());
  assert.ok(result.actions.some((action) => action.name === 'intake'));
  assert.ok(result.actions.some((action) => action.name === 'download'));
  assert.ok(result.actions.some((action) => action.name === 'media-request'));
  assert.match(result.mediaPolicy, /media-request/);
  assert.equal(result.toolExposure.mode, 'smart');
  assert.ok(result.toolExposure.modes.includes('unsafe'));
  assert.match(result.toolCatalog.detail, /tool_search.*tool_inspect.*tool_invoke/);
  assert.match(result.capabilityBoundary.harness, /reviewed operations/);
  assert.deepEqual(result.operationLimits.modifiers.unsupported, []);
  assert.ok(result.operationLimits.modifiers.supported.includes('BOOLEAN'));
  assert.ok(result.operationLimits.material.supported.includes('transmission'));
  assert.ok(result.primitives.includes('cube'));
  assert.ok(result.bootstrapDocuments.includes('Documents/Goals/<NN>-<slug>.md'));
  assert.ok(result.bootstrapDocuments.includes('Documents/TASKSTRACKER.md'));
  assert.ok(result.bootstrapDocuments.includes('Documents/INTAKE.md'));
  assert.ok(result.documentFormats.some((format) => format.path === 'Documents/TASKSTRACKER.md'));
  assert.equal(result.bootstrapDocuments.includes('Documents/TASKS.md'), false);
  assert.equal(result.documentFormats.some((format) => format.path === 'Documents/TASKS.md'), false);
  assert.ok(result.documentFormats.some((format) => format.id === 'goal' && format.sections.includes('Acceptance')));
  assert.ok(result.actions.some((action) => action.name === 'bootstrap-commit'));
  assert.ok(result.actions.some((action) => action.name === 'reregister'));
  assert.ok(result.actions.some((action) => action.name.includes('grader-fail')));
  assert.match(result.commitPolicy, /manual project git/i);
  assert.match(result.documentPolicy, /structured/);
  assert.equal(result.limits.appliesBeforeCheckpoint, 20);
  assert.equal(result.limits.hardApplyCap, 20);
  assert.equal(result.limits.minutesWithoutApply, 15);
  assert.equal(result.limits.batchOperations, 10);
});

test('document ledger returns harness-owned task rows without tokens', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const ticket = f.harness.issue(f.session, 'apply', { operation: 'delete_object', name: 'Cube' });
  const result = JSON.parse(await h.tool.blender_document.execute(
    { action: 'ledger', payload: '{}' },
    { sessionID: f.session },
  ));
  assert.equal(result.tasks.length, 1);
  assert.equal(result.tasks[0].id, 'T001');
  assert.equal(result.tasks[0].state, 'issued');
  assert.equal(result.tasks[0].token, undefined);
  assert.equal(result.tasks[0].tokenHash.length, 12);
  assert.ok(result.tasks[0].id);
  assert.notEqual(ticket.token, result.tasks[0].tokenHash);
});

test('ticket accepts apply batches up to ten operations and rejects more', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const operation = { operation: 'delete_object', name: 'Cube' };
  const issued = JSON.parse(await h.tool.blender_workflow.execute(
    { action: 'ticket', payload: JSON.stringify({ operation: 'apply', payload: { operations: [operation, operation] } }) },
    { sessionID: f.session },
  ));
  assert.equal(issued.operation, 'apply');
  await assert.rejects(
    h.tool.blender_workflow.execute(
      { action: 'ticket', payload: JSON.stringify({ operation: 'apply', payload: { operations: Array.from({ length: 11 }, () => operation) } }) },
      { sessionID: f.session },
    ),
    /1-10/,
  );
});

test('document tool returns structured project reads', async (t) => {
  const f = fixture(t), h = hooks(f);
  const result = JSON.parse(await h.tool.blender_document.execute(
    { action: 'read', payload: JSON.stringify({ path: 'Documents/REQUIREMENTS.md' }) },
    { sessionID: f.session },
  ));
  assert.equal(result.content, undefined);
  assert.equal(result.fields.Status, 'Confirmed');
  const objectPayload = JSON.parse(await h.tool.blender_document.execute(
    { action: 'read', payload: { path: 'Documents/REQUIREMENTS.md' } },
    { sessionID: f.session },
  ));
  assert.equal(objectPayload.fields.Status, 'Confirmed');
  const workflowObject = JSON.parse(await h.tool.blender_workflow.execute(
    { action: 'status', payload: { project: f.project } },
    { sessionID: f.session },
  ));
  assert.equal(workflowObject.project, f.project);
  await assert.rejects(
    h.tool.blender_workflow.execute({ action: 'status', payload: ['not', 'an', 'object'] }, { sessionID: f.session }),
    /payload/,
  );
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

test('direct writes cannot bypass frozen documents or review artifacts', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  f.harness.transaction((state) => state.projects[f.project].change.paths.push(
    `${f.project}/Documents/REQUIREMENTS.md`,
    `${f.project}/Documents/Reviews/README.md`,
  ));
  await assert.rejects(before(h, f.session, 'write', {
    filePath: path.join(f.root, f.project, 'Documents', 'REQUIREMENTS.md'),
    content: 'changed\n',
  }), /frozen/);
  await assert.rejects(before(h, f.session, 'write', {
    filePath: path.join(f.root, f.project, 'Documents', 'Reviews', 'README.md'),
    content: 'changed\n',
  }), /review artifacts/);
});

test('production worker delegation requires valid read-only limits', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const worker = {
    agent: 'blender-worker',
    provider: 'fixture-provider',
    model: 'fixture-model',
    variant: 'fixture-variant',
    backup: { provider: 'backup-provider', model: 'backup-model', variant: 'backup-variant' },
    max_minutes: 10,
    max_steps: 18,
    max_failed_attempts: 2,
    max_parallel: 1,
  };
  f.write('.kilo/blender-project-harness/config.json', JSON.stringify({ blender_subagents: { workers: worker } }));
  f.write('.kilo/agent/blender-worker.md', '---\nsteps: 20\n---\n');
  const primaryArgs = { subagent_type: 'blender-worker', prompt: 'Inspect cube', background: false };
  await before(h, f.session, 'task', primaryArgs);
  assert.equal(primaryArgs.provider, 'fixture-provider');
  assert.equal(primaryArgs.model, 'fixture-model');
  assert.equal(primaryArgs.variant, 'fixture-variant');
  await assert.rejects(
    before(h, f.session, 'task', { subagent_type: 'blender-worker', prompt: 'Inspect cube', background: true }),
    /foreground/,
  );
  f.write('.kilo/blender-project-harness/config.json', JSON.stringify({ blender_subagents: { workers: { ...worker, max_parallel: 2 } } }));
  await assert.rejects(
    before(h, f.session, 'task', { subagent_type: 'blender-worker', prompt: 'Inspect cube', background: false }),
    /max_parallel/,
  );
  f.write('.kilo/blender-project-harness/config.json', JSON.stringify({ blender_subagents: { workers: { ...worker, max_steps: 21 } } }));
  await assert.rejects(
    before(h, f.session, 'task', { subagent_type: 'blender-worker', prompt: 'Inspect cube', background: false }),
    /steps ceiling/,
  );
});

test('worker model chain advances from primary to backup to global fallback', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const worker = {
    agent: 'blender-worker',
    provider: 'fixture-provider',
    model: 'fixture-model',
    variant: 'fixture-variant',
    backup: { provider: 'backup-provider', model: 'backup-model', variant: 'backup-variant' },
    max_minutes: 10,
    max_steps: 18,
    max_failed_attempts: 2,
    max_parallel: 1,
  };
  const globalFallback = { provider: 'global-provider', model: 'global-model', variant: 'global-variant' };
  f.write('.kilo/blender-project-harness/config.json', JSON.stringify({ blender_subagents: { workers: worker, global_fallback: globalFallback } }));
  f.write('.kilo/agent/blender-worker.md', '---\nsteps: 20\n---\n');
  const attempt = () => {
    const args = { subagent_type: 'blender-worker', prompt: 'Inspect cube', background: false };
    return before(h, f.session, 'task', args).then(() => args);
  };
  const failStart = () => h['tool.execute.after'](
    { sessionID: f.session, callID: 'call_test', tool: 'task' },
    { isError: true, output: 'model unavailable' },
  );
  let args = await attempt();
  assert.equal(args.model, 'fixture-model');
  await failStart();
  args = await attempt();
  assert.equal(args.model, 'backup-model');
  await failStart();
  args = await attempt();
  assert.equal(args.model, 'global-model');
  await failStart();
  args = await attempt();
  assert.equal(args.model, undefined);
  assert.equal(args.provider, undefined);
});

test('worker dispatch requires the exact scene and task document', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const issued = f.harness.issue(f.session, 'apply', { index: 1 });
  assert.ok(issued.payloadPath);
  assert.ok(fs.existsSync(path.join(f.root, issued.payloadPath)));
  assert.match(issued.workerPrompt, /Payload file:/);
  assert.doesNotMatch(issued.workerPrompt, /"operations"/);
  await assert.rejects(
    before(h, f.session, 'task', { subagent_type: 'blender-worker', prompt: `Ticket: ${issued.token}`, background: false }),
    /authoritative scene.*task document|worker prompt is missing/i,
  );
  await assert.doesNotReject(
    before(h, f.session, 'task', { subagent_type: 'blender-worker', prompt: issued.workerPrompt, background: false }),
  );
});

test('worker dispatch pins one child for ten turns and rotates after the limit', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const issued = f.harness.issue(f.session, 'apply', { index: 1 });
  f.harness.transaction((s) => {
    s.tickets[issued.token].state = 'done';
    Object.values(s.projects)[0].change.pending = null;
  });
  const first = { subagent_type: 'blender-worker', prompt: issued.workerPrompt, background: false };
  await before(h, f.session, 'task', first);
  await h['tool.execute.after'](
    { sessionID: f.session, callID: 'call_test', tool: 'task', args: first },
    { output: 'applied', metadata: { sessionId: 'ses_worker_shared' } },
  );
  let status = f.harness.command(f.session, 'status');
  assert.equal(status.worker.child, 'ses_worker_shared');
  assert.equal(status.worker.turns, 1);

  f.harness.transaction((s) => {
    const project = Object.values(s.projects)[0];
    s.tickets[issued.token].state = 'done';
    project.change.pending = null;
  });
  const secondIssued = f.harness.issue(f.session, 'apply', { index: 2 });
  f.harness.transaction((s) => {
    s.tickets[secondIssued.token].state = 'done';
    Object.values(s.projects)[0].change.pending = null;
  });
  const second = { subagent_type: 'blender-worker', prompt: secondIssued.workerPrompt, background: false };
  await before(h, f.session, 'task', second);
  assert.equal(second.task_id, 'ses_worker_shared');
  await h['tool.execute.after'](
    { sessionID: f.session, callID: 'call_test', tool: 'task', args: second },
    { output: 'applied', metadata: { sessionId: 'ses_worker_shared' } },
  );
  status = f.harness.command(f.session, 'status');
  assert.equal(status.worker.turns, 2);

  await assert.rejects(
    before(h, f.session, 'task', { subagent_type: 'blender-worker', prompt: secondIssued.workerPrompt, background: false, task_id: 'ses_other' }),
    /pinned/,
  );

  f.harness.transaction((s) => {
    const project = Object.values(s.projects)[0];
    project.worker.turns = 10;
    project.worker.maxTurns = 10;
  });
  const third = { subagent_type: 'blender-worker', prompt: secondIssued.workerPrompt, background: false };
  await before(h, f.session, 'task', third);
  assert.equal(third.task_id, undefined);
  status = f.harness.command(f.session, 'status');
  assert.equal(status.worker, null);
  assert.match(status.workerRetired.reason, /turn limit/);
});

test('a worker BLOCKED result releases the unused apply ticket', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const issued = f.harness.issue(f.session, 'apply', { index: 1 });
  const args = { subagent_type: 'blender-worker', prompt: issued.workerPrompt, background: false };
  await before(h, f.session, 'task', args);
  await h['tool.execute.after'](
    { sessionID: f.session, callID: 'call_test', tool: 'task', args },
    { output: 'BLOCKED: authoritative scene path missing', metadata: { sessionId: 'ses_worker_blocked' } },
  );
  assert.equal(f.harness.transaction((s) => s.tickets[issued.token].state), 'released');
  assert.equal(f.harness.command(f.session, 'status').change.pending, null);
  assert.equal(f.harness.command(f.session, 'status').worker, null);
  assert.match(f.harness.command(f.session, 'status').workerRetired.reason, /BLOCKED/);
});

test('a worker PARTIAL result releases the unused apply ticket', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const issued = f.harness.issue(f.session, 'apply', { index: 1 });
  const args = { subagent_type: 'blender-worker', prompt: issued.workerPrompt, background: false };
  await before(h, f.session, 'task', args);
  await h['tool.execute.after'](
    { sessionID: f.session, callID: 'call_test', tool: 'task', args },
    { output: 'PARTIAL: scene changed before the ticket executed', metadata: { sessionId: 'ses_worker_partial' } },
  );
  assert.equal(f.harness.transaction((s) => s.tickets[issued.token].state), 'released');
  assert.equal(f.harness.command(f.session, 'status').change.pending, null);
});

test('a worker that returns without executing releases the ticket and commits partial state', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const issued = f.harness.issue(f.session, 'apply', { index: 1 });
  const args = { subagent_type: 'blender-worker', prompt: issued.workerPrompt, background: false };
  await before(h, f.session, 'task', args);
  const output = { output: 'Scene matches. Executing the apply payload.', metadata: { sessionId: 'ses_worker_noop' } };
  await h['tool.execute.after'](
    { sessionID: f.session, callID: 'call_test', tool: 'task', args },
    output,
  );
  assert.equal(f.harness.transaction((s) => s.tickets[issued.token].state), 'released');
  assert.equal(f.harness.command(f.session, 'status').change.pending, null);
  assert.equal(f.harness.command(f.session, 'status').worker, null);
  assert.match(output.output, /PARTIAL: worker returned without calling/);
  const task = f.harness.transaction((s) => Object.values(s.projects)[0].tasks.find((item) => item.token === issued.token));
  assert.equal(task.state, 'failed');
  assert.equal(git(f.root, ['status', '--porcelain', '--', f.project]).trim(), '');
});

test('background process starts a wait and stop clears it', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const args = { command: 'node .kilo/blender-project-harness/tools/harness/cli.mjs doctor', action: 'start' };
  await before(h, f.session, 'background_process', args);
  await h['tool.execute.after'](
    { sessionID: f.session, callID: 'call_test', tool: 'background_process', args },
    { output: 'started process proc_fixture', metadata: { id: 'proc_fixture' } },
  );
  let status = JSON.parse(await h.tool.blender_workflow.execute({ action: 'status', payload: '{}' }, { sessionID: f.session }));
  assert.equal(status.wait.kind, 'process');
  assert.equal(status.nextStep.phase, 'wait');

  const stop = { action: 'stop', id: 'proc_fixture' };
  await before(h, f.session, 'background_process', stop);
  await h['tool.execute.after'](
    { sessionID: f.session, callID: 'call_test', tool: 'background_process', args: stop },
    { output: 'stopped process proc_fixture' },
  );
  status = JSON.parse(await h.tool.blender_workflow.execute({ action: 'status', payload: '{}' }, { sessionID: f.session }));
  assert.equal(status.wait, null);
});

test('unsafe tools require the session allowlist, not Development Mode', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const config = '.kilo/blender-project-harness/config.json';
  f.write(config, JSON.stringify({ tool_exposure: { mode: 'unsafe', unsafe: { enabled: true, sessions: [f.session] } } }));
  await assert.doesNotReject(before(h, f.session, 'blender_tool_invoke', { name: 'execute_blender_code', arguments: { code: 'print(1)' } }));
  await assert.doesNotReject(before(h, f.session, 'blender_execute_blender_code', { code: 'print(1)' }));
  f.write(config, JSON.stringify({ tool_exposure: { mode: 'unsafe', unsafe: { enabled: true, sessions: [] } } }));
  await assert.rejects(before(h, f.session, 'blender_tool_invoke', { name: 'execute_blender_code', arguments: { code: 'print(1)' } }), /unsafe\.sessions|unsafe tool mode/i);
  await assert.rejects(before(h, f.session, 'blender_execute_blender_code', { code: 'print(1)' }), /raw Blender mutation|unsafe/i);
});

test('grader delegation requires the exact ticket evidence key and scene hash', async (t) => {

  const f = fixture(t, { review: 'Single' }), h = hooks(f); f.begin();
  const token = '11111111-1111-1111-1111-111111111111';
  f.harness.transaction((s) => {
    const change = s.projects[f.project].change;
    change.inspected = true;
    change.graders.visual = { token };
  });
  await assert.rejects(
    before(h, f.session, 'task', { subagent_type: 'blender-grader', prompt: `HARNESS_GRADER:${token}\nhand-written prompt without evidence`, background: false }),
    /saved scene SHA-256/,
  );
  await assert.rejects(
    before(h, f.session, 'task', {
      subagent_type: 'blender-grader',
      task_id: 'ses_previous_grader',
      prompt: `HARNESS_GRADER:${token}\nsaved scene SHA-256 ${'a'.repeat(64)}\nEvidence key: ${'b'.repeat(64)}`,
      background: false,
    }),
    /fresh task.*omit task_id/i,
  );
});

test('graders may read their own prior report but not a peer report', async (t) => {
  const f = fixture(t, { review: 'Single' });
  const { round } = graderState(f);
  const h = graderHooks(f);
  const prior = `${f.project}/Documents/Reviews/${round}/visual/REPORT.md`;
  f.write(prior, '# Prior visual report\n');
  const peer = `${f.project}/Documents/Reviews/${round}/technical/REPORT.md`;
  f.write(peer, '# Peer report\n');
  await assert.doesNotReject(before(h, 'ses_grader', 'read', { filePath: path.join(f.root, prior) }));
  await assert.rejects(before(h, 'ses_grader', 'read', { filePath: path.join(f.root, peer) }), /outside frozen assignment|peer report/);
});

test('a bound grader is aborted at its hard deadline', async (t) => {
  const f = fixture(t, { review: 'Single' });
  const aborted = [];
  graderState(f, { hardDeadline: Date.now() + 5 });
  const h = graderHooks(f, aborted);
  await assert.doesNotReject(before(h, 'ses_grader', 'read', { filePath: 'AGENTS.md' }));
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.deepEqual(aborted, ['ses_grader']);
  const grader = f.harness.transaction((s) => s.projects[f.project].change.graders.visual);
  assert.ok(grader.timedOut);
  assert.match(grader.error, /hard deadline/);
});

test('a grader with no child tool is still aborted at its hard deadline', async (t) => {
  const f = fixture(t, { review: 'Single' });
  const aborted = [];
  graderState(f, { hardDeadline: Date.now() + 5, child: '' });
  const h = graderHooks(f, aborted);
  const prompt = `HARNESS_GRADER:${GRADER_TOKEN}\nsaved scene SHA-256 ${f.harness.hash(f.scene)}\nEvidence key: ${'e'.repeat(64)}`;
  await assert.doesNotReject(before(h, f.session, 'task', { subagent_type: 'blender-grader', prompt, background: false }));
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.deepEqual(aborted, ['ses_grader']);
  const grader = f.harness.transaction((s) => s.projects[f.project].change.graders.visual);
  assert.ok(grader.timedOut);
  assert.equal(grader.child, 'ses_grader');
  assert.match(grader.error, /hard deadline/);
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
      messages: async () => ({ data: [
        { info: { role: 'user', agent: 'blender-worker' }, parts: [{ type: 'text', text: 'Inspect scene' }] },
        { info: { role: 'assistant', providerID: 'fixture-provider', modelID: 'fixture-model', variant: 'fixture-variant' }, parts: [] },
      ] }),
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
  const wrong = createHooks(f.harness, {
    session: {
      get: async ({ path: p }) => ({ data: { id: p.id, parentID: f.session, agent: 'blender-worker' } }),
      messages: async () => ({ data: [
        { info: { role: 'user', agent: 'blender-worker' }, parts: [{ type: 'text', text: 'Inspect scene' }] },
        { info: { role: 'assistant', providerID: 'other-provider', modelID: 'fixture-model', variant: 'fixture-variant' }, parts: [] },
      ] }),
    },
  });
  await before(wrong, 'ses_wrong_worker', 'blender_get_scene_info', {});
  await assert.rejects(
    before(wrong, 'ses_wrong_worker', 'blender_harness_execute', { token: '00000000-0000-0000-0000-000000000000', operation: 'apply', payload: {} }),
    /configured worker/,
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
      messages: async () => ({ data: [
        { info: { role: 'user', agent: 'blender-worker' }, parts: [{ type: 'text', text: 'Apply assignment' }] },
        { info: { role: 'assistant', providerID: 'fixture-provider', modelID: 'fixture-model', variant: 'fixture-variant' }, parts: [] },
      ] }),
    },
  });
  await before(worker, 'ses_worker', 'blender_harness_execute', { token: ticket.token, operation: 'apply', payload_path: ticket.payloadPath, payload_sha256: ticket.payloadHash, user_prompt: 'Apply assignment' });
  assert.equal(f.harness.transaction((s) => s.tickets[ticket.token].state), 'authorized');
});

test('plugin allows recovery reads but rejects unscoped file writes', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  await before(h, f.session, 'read', { filePath: path.join(f.root, f.project, 'README.md') });
  await before(h, f.session, 'write', { filePath: path.join(f.root, '.temp', 'Scratch', 'note.md'), content: 'workspace note' });
  await before(h, f.session, 'write', { filePath: path.join(f.root, f.project, 'Documents', 'DECISIONS.md'), content: 'new docs' });
  await assert.rejects(before(h, f.session, 'write', { filePath: path.join(f.root, f.scene), content: 'forged' }), /runtime-owned/);
  await assert.rejects(before(h, f.session, 'apply_patch', { patchText: '*** Begin Patch\n*** Add File: tools/bypass.py\n+pass\n*** End Patch' }), /scope/);
});

test('unregistered sessions cannot write project files or run mutating shell commands', async (t) => {
  const f = fixture(t), h = hooks(f);
  await assert.rejects(before(h, 'unregistered', 'write', { filePath: path.join(f.root, f.project, 'README.md'), content: 'bypass' }), /harness-owned/);
  await before(h, 'unregistered', 'write', { filePath: path.join(f.root, 'Blender', 'README.md'), content: 'collection docs' });
  await assert.rejects(before(h, 'unregistered', 'bash', { command: '.\\tools\\start-blender.cmd "Blender\\Test Project"' }), /retired/);
  await assert.rejects(before(h, 'unregistered', 'bash', { command: `git add -- "${f.project}/README.md"` }), /bootstrap-commit/);
  await assert.rejects(before(h, 'unregistered', 'bash', { command: 'git add -- .' }), /bootstrap-commit/);
  await assert.rejects(before(h, 'unregistered', 'bash', { command: 'Set-Content "Blender\\Test Project\\README.md" "bypass"' }), /project files/);
  await assert.rejects(before(h, 'unregistered', 'bash', { command: 'node -e "process.exit(1)"' }), /Shell approval required/);
  await assert.doesNotReject(before(h, 'unregistered', 'bash', { command: 'git status --short; echo bypass' }));
  await before(h, 'unregistered', 'bash', { command: 'git status --short' });
  await before(h, 'unregistered', 'bash', { command: 'node .kilo/blender-project-harness/tools/harness/cli.mjs scaffold --name "Fresh Project"' });
  await before(h, 'unregistered', 'bash', { command: 'git ls-tree -r --name-only HEAD' });
  await before(h, 'unregistered', 'bash', { command: 'git log --oneline -8' });
  await before(h, 'unregistered', 'bash', { command: 'Get-ChildItem .kilo/blender-project-harness/tools/harness' });
  await before(h, 'unregistered', 'bash', { command: 'Get-Content .kilo/blender-project-harness/tools/harness/plugin.mjs | Select-String safe' });
  await before(h, 'unregistered', 'bash', { command: 'rg -n "safeShellSegment" .kilo/blender-project-harness/tools/harness' });
  const approval = await approveShell(h, 'unregistered', 'git switch Test_Punal_12', 'Switch branches without discarding the preserved live-test evidence.');
  assert.ok(fs.existsSync(path.join(f.root, 'Commands', `${approval}.md`)));
  assert.match(fs.readFileSync(path.join(f.root, 'Commands', `${approval}.md`), 'utf8'), /Switch branches without discarding/);
  assert.match(git(f.root, ['log', '-1', '--format=%s']), /shell approval/);
});

test('production read-only shell works and other workspace commands need confirmation', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  await assert.doesNotReject(before(h, f.session, 'bash', { command: 'git log --oneline -8' }));
  await assert.doesNotReject(before(h, f.session, 'bash', { command: 'Get-Content .kilo/blender-project-harness/tools/harness/plugin.mjs | Select-String safe' }));
  await assert.rejects(before(h, f.session, 'bash', { command: 'npm install' }), /Shell approval required/);
  const approval = await approveShell(h, f.session, 'npm install', 'Run the locked dependency install for workspace maintenance.');
  assert.ok(fs.existsSync(path.join(f.root, f.project, 'Documents', 'Commands', `${approval}.md`)));
  assert.match(git(f.root, ['log', '-1', '--format=%s']), /shell approval/);
  assert.equal(git(f.root, ['status', '--porcelain', '--', `${f.project}/Documents/Commands`]).trim(), '');
  await assert.rejects(before(h, f.session, 'bash', { command: 'git add -- .' }), /blender_workflow commit/);
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
  git(f.root, ['add', '--', f.scene]);
  await assert.rejects(
    before(h, f.session, 'bash', { command: `git add -- "${f.scene}"` }),
    /blender_workflow commit/,
  );
  await assert.rejects(
    before(h, f.session, 'bash', { command: 'git commit -m "feat: bootstrap scene"' }),
    /blender_workflow commit/,
  );
  git(f.root, ['reset', '--', f.scene]);
  await h.tool.blender_workflow.execute(
    { action: 'commit', payload: JSON.stringify({ message: 'feat: bootstrap scene' }) },
    { sessionID: f.session },
  );
  await h.tool.goal_blender.execute({ action: 'status' }, { sessionID: f.session });
});

test('registered workspace code commits are allowed through shell approval', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const code = path.join(f.root, 'tools', 'harness', 'scratch.txt');
  fs.mkdirSync(path.dirname(code), { recursive: true });
  fs.writeFileSync(code, 'scratch\n');
  git(f.root, ['add', '--', 'tools/harness/scratch.txt']);
  await approveShell(h, f.session, 'git commit -m "chore: scratch workspace file"');
});

test('plugin permits matching ticket once, blocks cross-session ticket', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const ticket = f.harness.issue(f.session, 'save', {});
  await assert.rejects(before(h, 'ses_other', 'blender_harness_execute', ticket), /forged/);
  await before(h, f.session, 'blender_harness_execute', ticket);
  await assert.rejects(before(h, f.session, 'blender_harness_execute', ticket), /replayed/);
});

test('built-in goal clear remains available for recovery', async (t) => {
  const f = fixture(t), h = hooks(f);
  const output = { parts: [] };
  await h['command.execute.before']({ command: 'goal', sessionID: f.session, arguments: 'clear' }, output);
  assert.equal(output.parts.length, 0);
  await assert.doesNotReject(before(h, f.session, 'goal', { action: 'clear' }));
  const status = JSON.parse(await h.tool.blender_workflow.execute({ action: 'status', payload: {} }, { sessionID: f.session }));
  assert.equal(status.goalConflict, null);
});

test('built-in goal_report is disabled and invalidates registration', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  await assert.rejects(
    before(h, f.session, 'goal_report', { status: 'blocked', reason: 'waiting' }),
    /disabled|goal-blender/,
  );
  const status = JSON.parse(await h.tool.blender_workflow.execute({ action: 'status', payload: {} }, { sessionID: f.session }));
  assert.equal(status.goalActive, false);
  assert.equal(status.goalConflict.kind, 'built-in-goal');
  assert.equal(status.nextStep.phase, 'goal-conflict');
});

test('built-in Kilo goal creates a conflict instead of activating production', async (t) => {
  const f = fixture(t);
  const h = hooks(f, { 'kilo.goal': { status: 'blocked', reason: 'A rejected tool call blocked the goal.' } });
  f.begin();
  const status = JSON.parse(await h.tool.blender_workflow.execute({ action: 'status', payload: {} }, { sessionID: f.session }));
  assert.equal(status.kiloGoal.status, 'blocked');
  assert.equal(status.goalActive, false);
  assert.equal(status.goalConflict.kind, 'built-in-goal');
  assert.equal(status.nextStep.phase, 'goal-conflict');
});

test('active Kilo goal never activates the harness mission', async (t) => {
  const f = fixture(t);
  const h = hooks(f, { 'kilo.goal': { status: 'active' } });
  f.begin();
  f.harness.transaction((s) => { s.projects[f.project].goalActive = false; });
  const status = JSON.parse(await h.tool.blender_workflow.execute({ action: 'status', payload: {} }, { sessionID: f.session }));
  assert.equal(status.goalActive, false);
  assert.equal(status.goalConflict.kind, 'built-in-goal');
  assert.notEqual(status.nextStep.phase, 'resume-goal');
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

test('goal_blender blocks early completion and internal workflow actions', async (t) => {
  const f = fixture(t), h = hooks(f);
  await assert.rejects(
    h.tool.goal_blender.execute({ action: 'complete', evidence: 'not yet' }, { sessionID: f.session }),
    /completion requires|active/,
  );
  await assert.rejects(
    h.tool.blender_workflow.execute({ action: 'goal-active', payload: '{}' }, { sessionID: f.session }),
    /internal/,
  );
});

test('status includes the canonical state projection', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const status = JSON.parse(await h.tool.blender_workflow.execute({ action: 'status', payload: '{}' }, { sessionID: f.session }));
  assert.equal(status.state.version, 1);
  assert.equal(status.state.project.lifecycle, 'active');
  assert.ok(status.state.change);
  assert.equal(status.state.invariants.valid, true);
  assert.equal(status.state.workflow.phase, status.nextStep.phase);
  assert.equal(status.state.entities.change.phase, status.nextStep.phase);
  assert.equal(status.state.entities.worker.state, 'unbound');
});

test('config registers goal-blender and never goal', async (t) => {
  const f = fixture(t), h = hooks(f);
  const config = {};
  await h.config(config);
  assert.ok(config.command['goal-blender']);
  assert.match(config.command['goal-blender'].description, /Harness-owned/);
  assert.equal(config.command.goal, undefined);
});

test('reference action opens the runtime reference gate', async (t) => {
  const f = fixture(t), h = hooks(f);
  f.harness.transaction((s) => { delete s.references?.[f.session]; });
  const result = JSON.parse(await h.tool.blender_workflow.execute({ action: 'reference', payload: {} }, { sessionID: f.session }));
  assert.match(result.question, /HARNESS REFERENCE/);
  assert.deepEqual(result.labels, ['Use my references', 'Generate one', 'Use web references', 'None']);
  assert.match(result.instruction, /exact question.*HARNESS REFERENCE token/i);
  assert.equal(result.questionTool.questions[0].custom, false);
  assert.equal(result.questionTool.questions[0].multiple, false);
});

test('harness questions reject custom answers with a corrective error', async (t) => {
  const f = fixture(t), h = hooks(f);
  f.harness.transaction((s) => { delete s.references?.[f.session]; });
  const reference = JSON.parse(await h.tool.blender_workflow.execute({ action: 'reference', payload: {} }, { sessionID: f.session }));
  await assert.rejects(
    before(h, f.session, 'question', { questions: [{ question: reference.question, options: reference.questionTool.questions[0].options, custom: true, multiple: false }] }),
    /custom:false.*multiple:false/,
  );
});

test('goal_blender starts, pauses, and resumes without kilo.goal', async (t) => {
  const f = fixture(t), h = hooks(f);
  const started = JSON.parse(await h.tool.goal_blender.execute({ action: 'start' }, { sessionID: f.session }));
  assert.equal(started.goalActive, true);
  assert.equal(started.goalSource, 'goal-blender');
  assert.equal(started.goalMeta.autoTurns, 0);
  assert.match(started.handoff, /End this turn now/i);
  f.harness.transaction((s) => { s.projects[f.project].goalMeta.autoTurns = 7; });
  const restarted = JSON.parse(await h.tool.goal_blender.execute({ action: 'start' }, { sessionID: f.session }));
  assert.equal(restarted.goalMeta.autoTurns, 7);
  await assert.doesNotReject(before(h, f.session, 'question', { questions: [] }));
  const paused = JSON.parse(await h.tool.goal_blender.execute({ action: 'pause' }, { sessionID: f.session }));
  assert.equal(paused.goalActive, false);
  const resumed = JSON.parse(await h.tool.goal_blender.execute({ action: 'resume' }, { sessionID: f.session }));
  assert.equal(resumed.goalActive, true);
  assert.equal(resumed.goalSource, 'goal-blender');
});

test('goal-blender command runs the harness mission action', async (t) => {
  const f = fixture(t), h = hooks(f);
  const output = { parts: [] };
  await h['command.execute.before']({ command: 'goal-blender', sessionID: f.session, arguments: 'start' }, output);
  assert.match(output.parts[0].text, /"goalActive": true/);
  assert.match(output.parts[0].text, /"goalSource": "goal-blender"/);
  const statusOutput = { parts: [] };
  await h['command.execute.before']({ command: 'goal-blender', sessionID: f.session, arguments: '' }, statusOutput);
  assert.match(statusOutput.parts[0].text, /"goalActive": true/);
});

test('an armed wakeup suppresses goal auto-continuation until cancelled or due', async (t) => {
  const f = fixture(t);
  const calls = [];
  const h = hooks(f, undefined, { session: { promptAsync: async (args) => calls.push(args) } });
  await h.tool.goal_blender.execute({ action: 'start' }, { sessionID: f.session });
  const schedule = { delay: '5m', prompt: 'Check the render', reason: 'Wait for the render window' };
  await before(h, f.session, 'schedule_wakeup', schedule);
  await h['tool.execute.after']({ sessionID: f.session, callID: 'call_test', tool: 'schedule_wakeup', args: schedule }, { output: 'Wakeup scheduled: wake_123 due 2026-11-06T10:00:00Z' });
  let status = f.harness.command(f.session, 'status');
  assert.equal(status.wait.kind, 'wakeup');
  assert.equal(status.nextStep.phase, 'wait');
  await h.event({ event: { type: 'session.idle', properties: { sessionID: f.session } } });
  assert.equal(calls.length, 0);

  const cancel = { action: 'cancel', id: 'wake_123' };
  await before(h, f.session, 'cancel_wakeup', cancel);
  await h['tool.execute.after']({ sessionID: f.session, callID: 'call_test', tool: 'cancel_wakeup', args: cancel }, { output: 'Wakeup cancelled' });
  status = f.harness.command(f.session, 'status');
  assert.equal(status.wait, null);
  await h.event({ event: { type: 'session.idle', properties: { sessionID: f.session } } });
  assert.equal(calls.length, 1);
});

test('goal-blender auto-continues once per idle up to the cap', async (t) => {
  const f = fixture(t);
  const calls = [];
  const h = hooks(f, undefined, { session: { promptAsync: async (args) => calls.push(args) } });
  await h.tool.goal_blender.execute({ action: 'start' }, { sessionID: f.session });
  await h.event({ event: { type: 'session.idle', properties: { sessionID: f.session } } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.parts[0].synthetic, true);
  assert.match(calls[0].body.parts[0].text, /HARNESS GOAL CONTINUATION \(automatic; no user message\)/);
  assert.equal(f.harness.command(f.session, 'status').goalMeta.autoTurns, 1);
  f.harness.transaction((s) => { s.projects[f.project].goalMeta.autoTurns = 25; });
  await h.event({ event: { type: 'session.idle', properties: { sessionID: f.session } } });
  assert.equal(calls.length, 1);
});

test('an aborted turn pauses the mission instead of auto-continuing', async (t) => {
  const f = fixture(t);
  const calls = [];
  const h = hooks(f, undefined, {
    session: {
      promptAsync: async (args) => calls.push(args),
      messages: async () => ({ data: [{ info: { role: 'assistant', error: { name: 'MessageAbortedError' } } }] }),
    },
  });
  await h.tool.goal_blender.execute({ action: 'start' }, { sessionID: f.session });
  await h.event({ event: { type: 'session.idle', properties: { sessionID: f.session } } });
  assert.equal(calls.length, 0);
  const status = f.harness.command(f.session, 'status');
  assert.equal(status.goalActive, false);
  assert.match(status.paused.reason, /Stopped by the user/);
});

test('goal_blender stop aborts active children and records the stop', async (t) => {
  const f = fixture(t, { review: 'Single' });
  const aborted = [];
  const h = hooks(f, undefined, { session: { abort: async ({ path: p }) => aborted.push(p.id) } });
  f.begin();
  f.harness.transaction((s) => {
    s.projects[f.project].change.graders.visual = { child: 'ses_active_grader' };
  });
  const stopped = JSON.parse(await h.tool.goal_blender.execute({ action: 'stop' }, { sessionID: f.session }));
  assert.equal(stopped.goalActive, false);
  assert.deepEqual(stopped.abortedChildren, ['ses_active_grader']);
  assert.deepEqual(aborted, ['ses_active_grader']);
  assert.match(stopped.paused.reason, /Stopped by \/goal-blender/);
});

test('plugin injects compact durable recovery context', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const output = { context: [] };
  await h['experimental.session.compacting']({ sessionID: f.session }, output);
  assert.match(output.context[0], /Create fixture composition/);
  assert.match(output.context[0], /do not repeat mission start/);
});

test('development mode bypasses all workflow hooks', async (t) => {
  const f = fixture(t), h = hooks(f); f.begin();
  const configPath = path.join(f.root, '.kilo', 'blender-project-harness', 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.development_mode = true;
  fs.writeFileSync(configPath, JSON.stringify(config));

  await assert.doesNotReject(before(h, f.session, 'write', {
    filePath: path.join(f.root, 'tools', 'harness', 'dev-note.txt'),
    content: 'development note\n',
  }));
  await assert.doesNotReject(before(h, f.session, 'bash', { command: 'git branch -a -vv' }));
  await assert.doesNotReject(before(h, f.session, 'blender_execute_blender_code', { code: 'print(1)' }));

  const transformed = { system: [] };
  await h['experimental.chat.system.transform']({ sessionID: f.session }, transformed);
  assert.deepEqual(transformed.system, []);

  const after = { output: 'unchanged' };
  await h['tool.execute.after']({ sessionID: f.session, callID: 'dev', tool: 'bash', args: { command: 'git branch' } }, after);
  assert.equal(after.output, 'unchanged');
});

test('development mode can whitelist specific sessions', async (t) => {
  const f = fixture(t), h = hooks(f);
  const configPath = path.join(f.root, '.kilo', 'blender-project-harness', 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.development_mode = false;
  config.development_sessions = [f.session];
  fs.writeFileSync(configPath, JSON.stringify(config));

  const note = { filePath: path.join(f.root, f.project, 'Documents', 'DECISIONS.md'), content: 'session development note\n' };
  await assert.doesNotReject(before(h, f.session, 'write', note));
  await assert.doesNotReject(before(h, f.session, 'bash', { command: 'npm install' }));
  await assert.rejects(before(h, 'ses_other', 'write', note), /project files are harness-owned/);
  await assert.rejects(before(h, 'ses_other', 'bash', { command: 'npm install' }), /Shell approval required/);

  delete config.development_mode;
  fs.writeFileSync(configPath, JSON.stringify(config));
  await assert.doesNotReject(before(h, f.session, 'write', note));

  delete config.development_sessions;
  fs.writeFileSync(configPath, JSON.stringify(config));
  await assert.rejects(before(h, f.session, 'write', note), /no open bounded change/);
});
