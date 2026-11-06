import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import fs from 'node:fs';
import { BlenderProxy, firstJson } from './proxy.mjs';
import { fixture } from './test-fixture.mjs';

const result = (text) => ({ content: [{ type: 'text', text }] });
function upstream(f) {
  const calls = [];
  return {
    calls,
    async listTools() { return { tools: ['look', 'execute_blender_code', 'import_asset', 'get_scene_info', 'get_guide'].map((name) => ({ name, inputSchema: { type: 'object' } })) }; },
    async callTool(call) {
      calls.push(call);
      if (call.name === 'get_addon_status') return result(JSON.stringify({ up_to_date: true }));
      if (call.name === 'get_scene_info') return result('Scene fixture\nCamera Fixture');
      if (call.name !== 'execute_blender_code') return result('Read only');
      const code = call.arguments.code;
      if (code.includes('"operation": "check_assets"')) {
        return result('HARNESS_JSON:' + JSON.stringify({ ok: true, operation: 'check_assets', strict: true, external: [], missing: [], packed: ['fixture.png'], libraries: [] }));
      }
      if (code.includes('external = bpy.utils.blend_paths')) {
        return result('HARNESS_JSON:' + JSON.stringify({ ok: true, filepath: fs.existsSync(path.join(f.root, f.scene)) ? path.join(f.root, f.scene) : '', is_dirty: false, missing: [] }));
      }
      if (code.includes('bpy.ops.wm.save_as_mainfile')) {
        f.write(f.scene, 'BLENDER fixture bytes');
        return result('HARNESS_JSON:' + JSON.stringify({ ok: true, filepath: path.join(f.root, f.scene) }));
      }
      if (code.includes('bpy.ops.export_scene.gltf')) {
        const exportPath = /"(exports\/[^"]+)"/.exec(code)?.[1];
        assert.ok(exportPath, 'export output bound to generated path');
        const bytes = Buffer.from('glTF' + '\u0002\u0000\u0000\u0000' + '\u0000'.repeat(8), 'binary');
        f.write(`${f.project}/${exportPath}`, bytes);
        return result('HARNESS_JSON:' + JSON.stringify({ ok: true, operation: 'export_scene', format: 'glb', path: exportPath, bytes: bytes.length, sha256: f.harness.hash(`${f.project}/${exportPath}`), scene: 'Scene' }));
      }
      if (code.includes('bpy.ops.render.render')) {
        const render = /scene\.render\.filepath = "(\/\/[^"\n]+)"/.exec(code)?.[1];
        assert.ok(render, 'render output bound to generated path');
        f.write(`${f.project}/${render.slice(2)}`, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]));
      }
      return result('HARNESS_JSON:' + JSON.stringify({ ok: true }));
    },
  };
}
async function execute(f, proxy, operation, payload = {}) {
  const { token } = f.harness.issue(f.session, operation, payload);
  f.harness.authorize(f.session, token, operation, payload);
  return proxy.call('harness_execute', { token, operation, payload, user_prompt: 'Create fixture scene.' });
}
async function prepareSeal(f, proxy) {
  f.harness.command(f.session, 'finalize');
  const wip = JSON.parse((await execute(f, proxy, 'wip')).content[0].text);
  f.harness.inspect(f.session, path.join(f.root, wip.change.wipRender.path), true);
}
const meshOperation = {
  operation: 'create_mesh',
  name: 'Cube',
  primitive: 'cube',
  location: [0, 0, 0],
  scale: [1, 1, 1],
};

test('proxy exposes the catalog through smart search, inspect, and invoke', async (t) => {
  const f = fixture(t), p = new BlenderProxy(f.harness, upstream(f));
  const listed = (await p.listTools()).tools.map((v) => v.name);
  assert.deepEqual(listed, ['get_scene_info', 'look', 'get_guide', 'harness_execute', 'blender_harness_scene_info', 'tool_search', 'tool_inspect', 'tool_invoke']);
  const search = JSON.parse((await p.call('tool_search', { query: 'execute' })).content[0].text);
  assert.equal(search.tools[0].name, 'execute_blender_code');
  assert.equal(search.tools[0].allowed, false);
  const inspect = JSON.parse((await p.call('tool_inspect', { name: 'execute_blender_code' })).content[0].text);
  assert.equal(inspect.tool.name, 'execute_blender_code');
  await assert.rejects(p.call('tool_invoke', { name: 'execute_blender_code', arguments: { code: 'anything' } }), /unavailable/);
  assert.match((await p.call('tool_invoke', { name: 'get_guide', arguments: {} })).content[0].text, /Read only|HARNESS_JSON/);
});

test('full mode falls back to smart when the schema budget would be exceeded', async (t) => {
  const f = fixture(t);
  f.write('.kilo/blender-project-harness/config.json', JSON.stringify({ tool_exposure: { mode: 'full', max_exposed: 4 } }));
  const p = new BlenderProxy(f.harness, upstream(f));
  const listed = (await p.listTools()).tools.map((v) => v.name);
  assert.ok(listed.includes('tool_search'));
  assert.ok(!listed.includes('execute_blender_code'));
});

test('unsafe mode exposes the raw catalog only when explicitly enabled', async (t) => {
  const f = fixture(t);
  f.write('.kilo/blender-project-harness/config.json', JSON.stringify({ tool_exposure: { mode: 'unsafe', unsafe: { enabled: true } } }));
  const p = new BlenderProxy(f.harness, upstream(f));
  assert.ok((await p.listTools()).tools.some((v) => v.name === 'execute_blender_code'));
  assert.match((await p.call('tool_invoke', { name: 'execute_blender_code', arguments: { code: 'anything' } })).content[0].text, /HARNESS_JSON/);
});

test('proxy hides raw mutation tools and rejects direct calls', async (t) => {
  const f = fixture(t), p = new BlenderProxy(f.harness, upstream(f));
  assert.ok((await p.listTools()).tools.some((v) => v.name === 'look'));
  await assert.rejects(p.call('execute_blender_code', { code: 'anything' }), /not exposed|unregistered/);
  await assert.rejects(p.call('harness_execute', { token: 'forged', operation: 'save', payload: {}, user_prompt: 'test' }), /authorization/);
});

test('scene info is read-only and does not issue a ticket', async (t) => {
  const f = fixture(t);
  const mock = upstream(f);
  const p = new BlenderProxy(f.harness, mock);
  const response = await p.call('blender_harness_scene_info', { user_prompt: 'Inspect scenes.' });
  assert.ok(response.content[0].text);
  assert.equal(f.harness.command(f.session, 'status').change, null);
  assert.ok(mock.calls.some((call) => call.name === 'execute_blender_code' && call.arguments.code.includes('payload = []')));
});

test('proxy needs hook receipt even when issued ticket exists', async (t) => {
  const f = fixture(t); f.begin();
  const p = new BlenderProxy(f.harness, upstream(f));
  const { token } = f.harness.issue(f.session, 'save', {});
  await assert.rejects(p.call('harness_execute', { token, operation: 'save', payload: {}, user_prompt: 'test' }), /authorization/);
});

test('proxy seals immutable evidence, manifest and PNG, then checkpoint succeeds', async (t) => {
  const f = fixture(t); f.begin();
  const upstreamMock = upstream(f), p = new BlenderProxy(f.harness, upstreamMock);
  await execute(f, p, 'apply', meshOperation);
  await execute(f, p, 'save');
  await prepareSeal(f, p);
  const seal = JSON.parse((await execute(f, p, 'seal')).content[0].text);
  assert.ok(fs.existsSync(seal.render));
  assert.ok(seal.change.evidenceKey);
  assert.throws(() => f.harness.command(f.session, 'self-review', { notes: 'not viewed' }), /inspect/);
  f.harness.inspect(f.session, seal.render, true);
  f.harness.command(f.session, 'self-review', { notes: 'Fixture image inspected, acceptance checks pass.' });
  const manifest = JSON.parse(fs.readFileSync(path.join(f.root, seal.manifest), 'utf8'));
  assert.equal(manifest.active_goal, `${f.project}/${f.goal}`);
  assert.equal(manifest.verdict, 'PASS');
  assert.equal(manifest.operation_tasks.some((task) => Object.hasOwn(task, 'token')), false);
  const { git } = await import('./engine.mjs');
  git(f.root, ['add', '--', f.project]); f.commit();
  assert.equal(f.harness.command(f.session, 'checkpoint').change, null);
  assert.equal(f.harness.command(f.session, 'goal-complete').complete, true);
});

test('strict check_assets receipt is embedded in the sealed manifest', async (t) => {
  const f = fixture(t); f.begin();
  f.write(`${f.project}/notes.txt`, 'asset check evidence\n');
  const p = new BlenderProxy(f.harness, upstream(f));
  await execute(f, p, 'apply', { operation: 'check_assets', strict: true });
  await execute(f, p, 'save');
  await prepareSeal(f, p);
  const seal = JSON.parse((await execute(f, p, 'seal')).content[0].text);
  const manifest = JSON.parse(fs.readFileSync(path.join(f.root, seal.manifest), 'utf8'));
  assert.equal(manifest.asset_check.strict, true);
  assert.deepEqual(manifest.asset_check.packed, ['fixture.png']);
});

test('proxy executes one batched apply ticket and saves each operation', async (t) => {
  const f = fixture(t); f.begin();
  const p = new BlenderProxy(f.harness, upstream(f));
  const applied = JSON.parse((await execute(f, p, 'apply', { operations: [
    meshOperation,
    { operation: 'transform', name: 'Cube', location: [0, 0, 1] },
  ] })).content[0].text);
  assert.equal(applied.change.operations, 1);
  const ledger = fs.readFileSync(path.join(f.root, f.project, 'Documents', 'TASKSTRACKER.md'), 'utf8');
  assert.match(ledger, /apply x2/);
  assert.match(ledger, /done/);
  const taskDoc = fs.readFileSync(path.join(f.root, f.project, 'Documents', 'Tasks', 'T001', 'SUMMARY.md'), 'utf8');
  assert.match(taskDoc, /create_mesh/);
  assert.match(taskDoc, /Operation Results/);
});

test('proxy verifies export receipts and records them on the project', async (t) => {
  const f = fixture(t); f.begin();
  const p = new BlenderProxy(f.harness, upstream(f));
  await execute(f, p, 'apply', { operation: 'export_scene', format: 'glb', path: 'exports/room.glb' });
  const status = f.harness.command(f.session, 'status');
  assert.equal(status.change.operations, 1);
  assert.equal(status.exports.length, 1);
  assert.equal(status.exports[0].path, `${f.project}/exports/room.glb`);
  assert.match(status.exports[0].sha256, /^[a-f0-9]{64}$/);
});

test('proxy renders a WIP image without creating review evidence', async (t) => {
  const f = fixture(t); f.begin();
  const p = new BlenderProxy(f.harness, upstream(f));
  await execute(f, p, 'apply', meshOperation);
  const wip = JSON.parse((await execute(f, p, 'wip')).content[0].text);
  assert.ok(wip.change.wipRender.path.startsWith(`${f.project}/renders/wip/`));
  assert.ok(fs.existsSync(path.join(f.root, wip.change.wipRender.path)));
  assert.equal(wip.change.evidence, undefined);
});

test('proxy camera preflight fails before creating round artifacts and keeps recovery available', async (t) => {
  const f = fixture(t); f.begin();
  const noCamera = upstream(f);
  const baseCall = noCamera.callTool.bind(noCamera);
  noCamera.callTool = async (call) => {
    if (call.name === 'execute_blender_code' && call.arguments.code.includes('scene camera is not set')) {
      return { isError: true, content: [{ type: 'text', text: 'RuntimeError: scene camera is not set' }] };
    }
    return baseCall(call);
  };
  const p = new BlenderProxy(f.harness, noCamera);
  await execute(f, p, 'apply', meshOperation);
  f.harness.command(f.session, 'finalize');
  await assert.rejects(execute(f, p, 'wip'), /camera/);
  const status = f.harness.command(f.session, 'status');
  assert.equal(status.change.sealed, false);
  assert.equal(status.nextStep.phase, 'recover');
  assert.equal(fs.existsSync(path.join(f.root, f.project, 'renders', 'final')), false);
  const reopened = f.harness.recover(f.session, { reopen: true });
  assert.equal(reopened.change.reopen, true);
});

test('proxy fails closed on addon mismatch and preserves recovery', async (t) => {
  const f = fixture(t); f.begin();
  const bad = upstream(f);
  bad.callTool = async () => result('{"up_to_date":false}');
  const p = new BlenderProxy(f.harness, bad);
  await assert.rejects(execute(f, p, 'save'), /addon mismatch/);
  assert.equal(f.harness.command(f.session, 'status').change.sealed, false);
  assert.ok(f.harness.issue(f.session, 'save', {}).token);
});

test('failed seal removes incomplete round artifacts and reserves its sequence', async (t) => {
  const f = fixture(t); f.begin();
  let failScene = false;
  const bad = upstream(f);
  bad.callTool = async (call) => {
    if (call.name === 'get_addon_status') return result(JSON.stringify({ up_to_date: true }));
    if (failScene && call.name === 'execute_blender_code' && call.arguments?.code?.includes('payload = []')) return { isError: true, content: [{ type: 'text', text: 'scene facts failed' }] };
    return upstream(f).callTool(call);
  };
  const p = new BlenderProxy(f.harness, bad);
  await execute(f, p, 'apply', meshOperation);
  await execute(f, p, 'save');
  await prepareSeal(f, p);
  failScene = true;
  await assert.rejects(execute(f, p, 'seal'), /Blender execution failed/);
  const failed = f.harness.command(f.session, 'status').change;
  assert.equal(failed.sealed, false);
  assert.ok(fs.existsSync(path.join(f.root, f.project, 'Documents', 'Reviews')));
  await assert.rejects(execute(f, p, 'seal'), /Blender execution failed/);
  assert.equal(f.harness.command(f.session, 'status').change.sealed, false);
});

test('JSON extraction handles escaped strings and denies incomplete objects', () => {
  assert.deepEqual(firstJson('prefix {"ok":true,"text":"} { \\""} suffix'), { ok: true, text: '} { "' });
  assert.throws(() => firstJson('{"ok":'), /receipt/);
});
