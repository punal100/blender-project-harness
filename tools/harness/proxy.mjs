import fs from 'node:fs';
import path from 'node:path';
import { Harness, contained, digest, stable, deny, git } from './engine.mjs';
import { operationCode, preflightCode, saveCode, renderCode } from './blender-operations.mjs';

export const READ_TOOLS = new Set(['get_addon_status', 'get_scene_info', 'look', 'search_assets', 'disable_telemetry', 'record_trajectory_feedback']);
export const EXECUTE_TOOL = {
  name: 'harness_execute',
  description: 'Execute one ticketed bounded Blender operation, save, or seal. Obtain ticket from blender_workflow. Raw Python/imports/generation unavailable.',
  inputSchema: { type: 'object', properties: { token: { type: 'string' }, operation: { type: 'string', enum: ['apply', 'save', 'seal'] },
    payload: { type: 'object' }, user_prompt: { type: 'string' } }, required: ['token', 'operation', 'payload', 'user_prompt'], additionalProperties: false },
};
export const textOf = (result) => (result.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
export function firstJson(text) {
  const start = text.indexOf('{');
  let depth = 0, quote = false, escaped = false;
  for (let i = start; i >= 0 && i < text.length; i++) {
    const c = text[i];
    if (quote) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quote = false; }
    else if (c === '"') quote = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(text.slice(start, i + 1));
  }
  deny('upstream response lacks JSON receipt');
}

export class BlenderProxy {
  constructor(harness, upstream) { this.harness = harness; this.upstream = upstream; }
  async listTools() {
    const tools = [], seen = new Set();
    let cursor;
    do {
      if (cursor && seen.has(cursor)) deny('upstream tool pagination repeated');
      seen.add(cursor);
      const response = await this.upstream.listTools(cursor ? { cursor } : {});
      tools.push(...response.tools.filter((t) => READ_TOOLS.has(t.name)));
      cursor = response.nextCursor;
    } while (cursor);
    return { tools: [...tools, EXECUTE_TOOL] };
  }
  async call(name, args) {
    if (READ_TOOLS.has(name)) return this.upstream.callTool({ name, arguments: args });
    if (name !== 'harness_execute') deny('unregistered Blender operation');
    if (!args || Object.keys(args).some((k) => !['token', 'operation', 'payload', 'user_prompt'].includes(k)) || typeof args.user_prompt !== 'string' || !args.user_prompt.trim()) deny('strict ticket arguments and verbatim user prompt required');
    const context = this.harness.consume(args.token, args.operation, args.payload);
    const scenePath = contained(this.harness.root, context.scene, true);
    let round = null;
    let roundRoot = null;
    let renderPath = null;
    let indexPath = null;
    let indexLine = null;
    let roundCreated = false;
    try {
      const addon = await this.upstream.callTool({ name: 'get_addon_status', arguments: { user_prompt: args.user_prompt } });
      if (addon.isError || firstJson(textOf(addon)).up_to_date !== true) deny('addon mismatch or unavailable');
      const before = await this.run(preflightCode(scenePath), args.user_prompt);
      if (before.missing?.length) deny('missing external scene dependencies');
      if (context.change.sceneHash && this.harness.hash(context.scene) !== context.change.sceneHash) deny('scene file changed outside guarded operation');
      if (args.operation === 'apply') {
        if (before.is_dirty) deny('live scene has unsaved changes; save or recover before applying a guarded operation');
        if (!before.filepath) deny('save initial scene before editing');
        await this.run(operationCode(args.payload, context.change.objects), args.user_prompt);
        // Each operation saves before handoff, even when several operations form one logical change.
        await this.run(saveCode(scenePath), args.user_prompt);
        const result = this.harness.finish(args.token, { ok: true });
        return this.result(result);
      }
      await this.run(saveCode(scenePath), args.user_prompt);
      const saved = await this.run(preflightCode(scenePath), args.user_prompt);
      if (saved.is_dirty || saved.filepath !== scenePath) deny('authoritative scene save not verified');
      if (args.operation === 'save') return this.result(this.harness.finish(args.token, { ok: true }));
       round = this.makeRound(context.project, context.change.failedRounds ?? []);
       const relativeRender = `renders/final/${round}.png`;
       renderPath = `${context.project}/${relativeRender}`;
       roundRoot = `${context.project}/Documents/Reviews/${round}`;
       contained(this.harness.root, renderPath, true);
       fs.mkdirSync(path.dirname(path.join(this.harness.root, renderPath)), { recursive: true });
       roundCreated = true;
       await this.run(renderCode(scenePath, `//${relativeRender}`), args.user_prompt);
      const render = fs.readFileSync(contained(this.harness.root, renderPath));
      if (!render.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) deny('review render is not PNG');
      const summary = await this.upstream.callTool({ name: 'get_scene_info', arguments: { fields: ['settings', 'location', 'size', 'materials', 'topology'], limit: 10000, user_prompt: args.user_prompt } });
      if (summary.isError || /^Error/i.test(textOf(summary))) deny('scene evidence capture failed');
       const evidenceRoot = contained(this.harness.root, `${roundRoot}/_evidence`, true);
      fs.mkdirSync(evidenceRoot, { recursive: true });
      fs.copyFileSync(path.join(this.harness.root, renderPath), path.join(evidenceRoot, 'camera.png'));
      fs.writeFileSync(path.join(evidenceRoot, 'scene.txt'), textOf(summary));
      const evidenceNames = [renderPath, `${roundRoot}/_evidence/camera.png`, `${roundRoot}/_evidence/scene.txt`];
      const evidence = Object.fromEntries(evidenceNames.map((name) => [name, this.harness.hash(name)]));
      const evidenceKey = digest(stable({ scene: this.harness.hash(context.scene), specs: context.records.specs, evidence }));
      const manifest = { round, created: new Date().toISOString(), previous_round: context.previousRound, active_goal: `${context.project}/${context.goal}`,
        base_commit: context.change.base, dirty: git(this.harness.root, ['status', '--porcelain', '--', context.project]).trim(),
        scene: { path: context.scene, sha256: this.harness.hash(context.scene) }, specs: context.records.specs,
        evidence, evidence_key: evidenceKey, graders: context.records.roster, tasks: {} };
      fs.writeFileSync(contained(this.harness.root, `${roundRoot}/manifest.json`, true), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
       indexPath = `${context.project}/Documents/Reviews/README.md`;
       indexLine = `\n- ${round}: ${context.change.outcome}; evidence ${evidenceKey}\n`;
       fs.appendFileSync(contained(this.harness.root, indexPath), indexLine);
       const result = this.harness.finish(args.token, { ok: true, round, renderPath, evidence });
      return this.result({ ...result, render: path.join(this.harness.root, renderPath), manifest: `${roundRoot}/manifest.json` });
    } catch (error) {
      if (indexPath && indexLine) {
        try {
          const index = contained(this.harness.root, indexPath);
          const text = fs.readFileSync(index, 'utf8');
          const at = text.lastIndexOf(indexLine);
          if (at >= 0) fs.writeFileSync(index, text.slice(0, at) + text.slice(at + indexLine.length));
        } catch { /* Preserve fail-closed state when cleanup cannot restore the index. */ }
      }
      if (roundCreated && roundRoot) {
        try { fs.rmSync(contained(this.harness.root, roundRoot), { recursive: true, force: true }); } catch { /* Preserve evidence for manual recovery. */ }
      }
      if (renderPath) {
        try { fs.rmSync(contained(this.harness.root, renderPath), { force: true }); } catch { /* Preserve evidence for manual recovery. */ }
      }
      try { this.harness.finish(args.token, { ok: false, error: String(error.message), round }); } catch { /* A sealed state remains fail-closed if manifest publication failed. */ }
      throw error;
    }
  }
  async run(code, prompt) {
    const result = await this.upstream.callTool({ name: 'execute_blender_code', arguments: { code, user_prompt: prompt } });
    const text = textOf(result);
    const receipts = [...text.matchAll(/HARNESS_JSON:([^\r\n]+)/g)];
    if (result.isError || receipts.length !== 1 || /Error executing code:/.test(text)) deny(`Blender execution failed: ${text.slice(0, 1500)}`);
    const receipt = JSON.parse(receipts[0][1]);
    if (receipt.ok !== true) deny('Blender operation receipt failed');
    return receipt;
  }
  makeRound(project, reserved = []) {
    const base = contained(this.harness.root, `${project}/Documents/Reviews`);
    const index = fs.existsSync(path.join(base, 'README.md')) ? fs.readFileSync(path.join(base, 'README.md'), 'utf8') : '';
    const names = [...fs.readdirSync(base), ...reserved, ...index.matchAll(/R(\d+)-\d{8}T\d{6}Z/g)].map((v) => typeof v === 'string' ? v : v[0]);
    const next = Math.max(0, ...names.map((v) => Number(/^R(\d+)-/.exec(v)?.[1] ?? 0))) + 1;
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const round = `R${String(next).padStart(2, '0')}-${stamp}`;
    fs.mkdirSync(contained(this.harness.root, `${project}/Documents/Reviews/${round}`, true));
    return round;
  }
  result(value) { return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] }; }
}
