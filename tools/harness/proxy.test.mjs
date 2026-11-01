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
    async listTools() { return { tools: ['look', 'execute_blender_code', 'import_asset', 'get_scene_info'].map((name) => ({ name, inputSchema: { type: 'object' } })) }; },
    async callTool(call) {
      calls.push(call);
      if (call.name === 'get_addon_status') return result(JSON.stringify({ up_to_date: true }));
      if (call.name === 'get_scene_info') return result('Scene fixture\nCamera Fixture');
      if (call.name !== 'execute_blender_code') return result('Read only');
      const code = call.arguments.code;
      if (code.includes('external = bpy.utils.blend_paths')) {
        return result('HARNESS_JSON:' + JSON.stringify({ ok: true, filepath: fs.existsSync(path.join(f.root, f.scene)) ? path.join(f.root, f.scene) : '', is_dirty: false, missing: [] }));
      }
      if (code.includes('bpy.ops.wm.save_as_mainfile')) {
        f.write(f.scene, 'BLENDER fixture bytes');
        return result('HARNESS_JSON:' + JSON.stringify({ ok: true, filepath: path.join(f.root, f.scene) }));
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
const meshOperation = {
  operation: 'create_mesh',
  name: 'Cube',
  primitive: 'cube',
  location: [0, 0, 0],
  scale: [1, 1, 1],
};

test('proxy hides raw mutation tools and rejects direct calls', async (t) => {
  const f = fixture(t), p = new BlenderProxy(f.harness, upstream(f));
  assert.deepEqual((await p.listTools()).tools.map((v) => v.name), ['look', 'get_scene_info', 'harness_execute']);
  await assert.rejects(p.call('execute_blender_code', { code: 'anything' }), /unregistered/);
  await assert.rejects(p.call('harness_execute', { token: 'forged', operation: 'save', payload: {}, user_prompt: 'test' }), /authorization/);
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
  const seal = JSON.parse((await execute(f, p, 'seal')).content[0].text);
  assert.ok(fs.existsSync(seal.render));
  assert.ok(seal.change.evidenceKey);
  assert.throws(() => f.harness.command(f.session, 'self-review', { notes: 'not viewed' }), /inspect/);
  f.harness.inspect(f.session, seal.render, true);
  f.harness.command(f.session, 'self-review', { notes: 'Fixture image inspected, acceptance checks pass.' });
  const manifest = JSON.parse(fs.readFileSync(path.join(f.root, seal.manifest), 'utf8'));
  assert.equal(manifest.active_goal, `${f.project}/${f.goal}`);
  assert.equal(manifest.verdict, 'PASS');
  const { git } = await import('./engine.mjs');
  git(f.root, ['add', '--', f.project]); f.commit();
  assert.equal(f.harness.command(f.session, 'checkpoint').change, null);
  assert.equal(f.harness.command(f.session, 'goal-complete').complete, true);
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
  const bad = upstream(f);
  bad.callTool = async (call) => {
    if (call.name === 'get_addon_status') return result(JSON.stringify({ up_to_date: true }));
    if (call.name === 'get_scene_info') return { isError: true, content: [{ type: 'text', text: 'summary failed' }] };
    return upstream(f).callTool(call);
  };
  const p = new BlenderProxy(f.harness, bad);
  await execute(f, p, 'apply', meshOperation);
  await execute(f, p, 'save');
  await assert.rejects(execute(f, p, 'seal'), /scene evidence capture failed/);
  const failed = f.harness.command(f.session, 'status').change;
  assert.equal(failed.sealed, false);
  assert.ok(fs.existsSync(path.join(f.root, f.project, 'Documents', 'Reviews')));
  await assert.rejects(execute(f, p, 'seal'), /scene evidence capture failed/);
  assert.equal(f.harness.command(f.session, 'status').change.sealed, false);
});

test('JSON extraction handles escaped strings and denies incomplete objects', () => {
  assert.deepEqual(firstJson('prefix {"ok":true,"text":"} { \\""} suffix'), { ok: true, text: '} { "' });
  assert.throws(() => firstJson('{"ok":'), /receipt/);
});
