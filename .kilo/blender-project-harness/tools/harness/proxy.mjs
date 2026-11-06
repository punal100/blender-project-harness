import fs from 'node:fs';
import path from 'node:path';
import { Harness, contained, digest, stable, deny, git } from './engine.mjs';
import { operationBatchCode, preflightCode, saveCode, renderCode, renderPreflightCode, sceneFactsCode } from './blender-operations.mjs';
import { readToolExposure, toolAllowed, toolTokens } from './tool-exposure.mjs';

export const READ_TOOLS = new Set(['get_addon_status', 'get_scene_info', 'look', 'get_guide', 'search_assets', 'disable_telemetry', 'record_trajectory_feedback']);
export const SCENE_INFO_TOOL = {
  name: 'blender_harness_scene_info',
  description: 'Read-only scene facts for one scene or all scenes. No ticket, save, or mutation.',
  inputSchema: { type: 'object', properties: { scene: { type: 'string' }, user_prompt: { type: 'string' } }, required: ['user_prompt'], additionalProperties: false },
};
export const EXECUTE_TOOL = {
  name: 'harness_execute',
  description: 'Execute one ticketed bounded Blender apply batch, save, WIP render, or seal. Obtain ticket from blender_workflow. Raw Python/imports/generation unavailable.',
  inputSchema: { type: 'object', properties: { token: { type: 'string' }, operation: { type: 'string', enum: ['apply', 'save', 'seal', 'wip'] },
    payload: { type: 'object' }, user_prompt: { type: 'string' } }, required: ['token', 'operation', 'payload', 'user_prompt'], additionalProperties: false },
};
export const TOOL_SEARCH_TOOL = {
  name: 'tool_search',
  description: 'Search the full Blender MCP tool catalog. Returns names, one-line descriptions, and policy status. Use tool_inspect for one schema.',
  inputSchema: { type: 'object', properties: { query: { type: 'string' }, category: { type: 'string' }, limit: { type: 'integer' } }, required: ['query'], additionalProperties: false },
};
export const TOOL_INSPECT_TOOL = {
  name: 'tool_inspect',
  description: 'Return the full schema for one Blender MCP tool without loading the rest of the catalog.',
  inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'], additionalProperties: false },
};
export const TOOL_INVOKE_TOOL = {
  name: 'tool_invoke',
  description: 'Invoke one policy-allowed Blender MCP tool with explicit arguments. Unsafe tools require the unsafe mode and an explicit development session.',
  inputSchema: { type: 'object', properties: { name: { type: 'string' }, arguments: { type: 'object' } }, required: ['name'], additionalProperties: false },
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

function exportSignature(format, buffer) {
  if (format === 'glb') return buffer.subarray(0, 4).toString('ascii') === 'glTF';
  if (format === 'gltf') return buffer.toString('utf8', 0, Math.min(buffer.length, 4096)).trimStart().startsWith('{');
  if (format === 'fbx') return buffer.toString('ascii', 0, Math.min(buffer.length, 32)).startsWith('Kaydara FBX Binary') || buffer.toString('utf8', 0, Math.min(buffer.length, 4096)).trimStart().startsWith('; FBX');
  if (format === 'usd') return buffer.subarray(0, 8).toString('ascii') === 'PXR-USDC' || buffer.toString('utf8', 0, Math.min(buffer.length, 4096)).trimStart().startsWith('#usda');
  if (format === 'obj') return !buffer.includes(0);
  return false;
}

export class BlenderProxy {
  constructor(harness, upstream) { this.harness = harness; this.upstream = upstream; }
  verifyExport(context, receipt) {
    if (!receipt || typeof receipt.path !== 'string' || !receipt.path.startsWith('exports/')) deny('export receipt path is invalid');
    const projectPath = `${context.project}/${receipt.path}`;
    const full = contained(this.harness.root, projectPath);
    if (!fs.existsSync(full)) deny('export file is missing');
    const buffer = fs.readFileSync(full);
    if (buffer.length === 0) deny('export file is empty');
    if (buffer.length !== receipt.bytes || this.harness.hash(projectPath) !== receipt.sha256) deny('export receipt hash does not match the file');
    if (!exportSignature(receipt.format, buffer)) deny('export file signature does not match the format');
    return { ...receipt, path: projectPath };
  }
  async catalog() {
    if (this.catalogCache) return this.catalogCache;
    const tools = [], seen = new Set();
    let cursor;
    do {
      if (cursor && seen.has(cursor)) deny('upstream tool pagination repeated');
      seen.add(cursor);
      const response = await this.upstream.listTools(cursor ? { cursor } : {});
      tools.push(...response.tools);
      cursor = response.nextCursor;
    } while (cursor);
    this.catalogCache = tools;
    return tools;
  }
  exposureTools(all, exposure) {
    const byName = new Map(all.map((tool) => [tool.name, tool]));
    const coreNames = ['get_addon_status', 'get_scene_info', 'look', 'get_guide', 'search_assets', 'disable_telemetry', 'record_trajectory_feedback'];
    const core = coreNames.map((name) => byName.get(name)).filter(Boolean);
    const harnessTools = [EXECUTE_TOOL, SCENE_INFO_TOOL];
    const meta = [TOOL_SEARCH_TOOL, TOOL_INSPECT_TOOL, TOOL_INVOKE_TOOL];
    if (exposure.mode === 'readonly') return [...core, SCENE_INFO_TOOL];
    if (exposure.mode === 'lite') return [...core, ...harnessTools];
    if (exposure.mode === 'smart') return [...core, ...harnessTools, ...meta];
    if (exposure.mode === 'unsafe' && exposure.unsafe.enabled) {
      const tools = [...core, ...harnessTools, ...all.filter((tool) => !coreNames.includes(tool.name) && toolAllowed(exposure, tool.name))];
      return tools.length <= exposure.maxExposed && tools.reduce((sum, tool) => sum + toolTokens(tool), 0) <= exposure.maxSchemaTokens ? tools : [...core, ...harnessTools, ...meta];
    }
    const direct = all.filter((tool) => !coreNames.includes(tool.name) && toolAllowed(exposure, tool.name));
    const tools = [...core, ...harnessTools, ...direct];
    if (tools.length <= exposure.maxExposed && tools.reduce((sum, tool) => sum + toolTokens(tool), 0) <= exposure.maxSchemaTokens) return tools;
    return [...core, ...harnessTools, ...meta];
  }
  async listTools() {
    const all = await this.catalog();
    this.exposure = readToolExposure(this.harness.root);
    const tools = this.exposureTools(all, this.exposure);
    this.exposed = new Set(tools.map((tool) => tool.name));
    return { tools };
  }
  async call(name, args) {
    const exposure = this.exposure ?? readToolExposure(this.harness.root);
    const all = await this.catalog();
    const category = (tool) => /guide/i.test(tool.name) ? 'guide' : /code/i.test(tool.name) ? 'code' : /generate/i.test(tool.name) ? 'generate' : /asset/i.test(tool.name) ? 'asset' : 'read';
    const policy = (tool) => toolAllowed(exposure, tool.name)
      ? { allowed: true, reason: null }
      : { allowed: false, reason: exposure.mode === 'unsafe' ? 'unsafe mode is disabled or the tool is denied' : 'not exposed in this mode; use the unsafe/development mode only with explicit approval' };
    const text = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });
    if (name === TOOL_SEARCH_TOOL.name) {
      if (!args || Object.keys(args).some((key) => !['query', 'category', 'limit'].includes(key)) || typeof args.query !== 'string' || !args.query.trim()) deny('tool_search requires query and optional category/limit');
      const limit = Number.isInteger(args.limit) ? Math.min(Math.max(args.limit, 1), exposure.searchTopK) : exposure.searchTopK;
      const query = args.query.toLowerCase();
      const matches = all.filter((tool) => (!args.category || category(tool) === args.category) && `${tool.name} ${tool.description ?? ''}`.toLowerCase().includes(query)).slice(0, limit);
      return text({ mode: exposure.mode, query: args.query, tools: matches.map((tool) => ({ name: tool.name, description: tool.description ?? '', category: category(tool), ...policy(tool) })) });
    }
    if (name === TOOL_INSPECT_TOOL.name) {
      if (!args || Object.keys(args).some((key) => key !== 'name') || typeof args.name !== 'string' || !args.name.trim()) deny('tool_inspect requires name');
      const tool = all.find((item) => item.name === args.name);
      if (!tool) deny(`unknown Blender MCP tool: ${args.name}`);
      return text({ mode: exposure.mode, tool, ...policy(tool) });
    }
    if (name === TOOL_INVOKE_TOOL.name) {
      if (!args || Object.keys(args).some((key) => !['name', 'arguments'].includes(key)) || typeof args.name !== 'string' || !args.name.trim() || (args.arguments !== undefined && (typeof args.arguments !== 'object' || Array.isArray(args.arguments) || args.arguments === null))) deny('tool_invoke requires name and optional object arguments');
      const tool = all.find((item) => item.name === args.name);
      if (!tool) deny(`unknown Blender MCP tool: ${args.name}`);
      const accepted = policy(tool);
      if (!accepted.allowed) deny(`${tool.name} is unavailable: ${accepted.reason}`);
      return this.upstream.callTool({ name: tool.name, arguments: args.arguments ?? {} });
    }
    if (name === SCENE_INFO_TOOL.name) {
      if (!args || Object.keys(args).some((key) => !['scene', 'user_prompt'].includes(key)) || typeof args.user_prompt !== 'string' || !args.user_prompt.trim() || (args.scene !== undefined && (typeof args.scene !== 'string' || !args.scene.trim()))) deny('scene info requires user_prompt and optional scene name');
      return this.result(await this.run(sceneFactsCode(args.scene ?? null), args.user_prompt));
    }
    if (READ_TOOLS.has(name) && toolAllowed(exposure, name)) return this.upstream.callTool({ name, arguments: args });
    if (name !== 'harness_execute') {
      if (this.exposed?.has(name) && toolAllowed(exposure, name)) return this.upstream.callTool({ name, arguments: args });
      deny(`tool ${name} is not exposed in ${exposure.mode} mode`);
    }
    if (!args || Object.keys(args).some((k) => !['token', 'operation', 'payload', 'user_prompt'].includes(k)) || typeof args.user_prompt !== 'string' || !args.user_prompt.trim()) deny('strict ticket arguments and verbatim user prompt required');
    const context = this.harness.consume(args.token, args.operation, args.payload);
    const scenePath = contained(this.harness.root, context.scene, true);
    let round = null;
    let roundRoot = null;
    let renderPath = null;
    let indexPath = null;
    let indexLine = null;
    let roundCreated = false;
    let completed = 0;
    const operationResults = [];
    try {
      const addon = await this.upstream.callTool({ name: 'get_addon_status', arguments: { user_prompt: args.user_prompt } });
      if (addon.isError || firstJson(textOf(addon)).up_to_date !== true) deny('addon mismatch or unavailable');
      const before = await this.run(preflightCode(scenePath), args.user_prompt);
      if (before.missing?.length) deny('missing external scene dependencies');
      if (context.change.sceneHash && this.harness.hash(context.scene) !== context.change.sceneHash) deny('scene file changed outside guarded operation');
      if (args.operation === 'apply') {
        if (before.is_dirty) deny('live scene has unsaved changes; save or recover before applying a guarded operation');
        if (!before.filepath) deny('save initial scene before editing');
        const operations = operationBatchCode(args.payload, context.change.objects);
        const names = Array.isArray(args.payload?.operations) ? args.payload.operations.map((operation) => operation.operation) : [args.payload?.operation ?? 'apply'];
        for (const [index, operation] of operations.entries()) {
          let receipt;
          try {
            receipt = await this.run(operation, args.user_prompt);
            if (names[index] === 'export_scene') receipt = this.verifyExport(context, receipt);
          } catch (error) {
            operationResults.push({ index: index + 1, operation: names[index], ok: false, error: String(error.message) });
            throw error;
          }
          await this.run(saveCode(scenePath), args.user_prompt);
          operationResults.push({ index: index + 1, operation: names[index], ok: true, ...(['export_scene', 'check_assets'].includes(names[index]) ? { receipt } : {}) });
          completed += 1;
        }
        const result = this.harness.finish(args.token, { ok: true, completed, operationResults });
        return this.result(result);
      }
      await this.run(saveCode(scenePath), args.user_prompt);
      const saved = await this.run(preflightCode(scenePath), args.user_prompt);
      if (saved.is_dirty || saved.filepath !== scenePath) deny('authoritative scene save not verified');
      if (args.operation === 'save') return this.result(this.harness.finish(args.token, { ok: true }));
      const renderPreflight = await this.run(renderPreflightCode(scenePath), args.user_prompt);
      if (args.operation === 'wip') {
        if (Array.isArray(renderPreflight.lights) && renderPreflight.lights.length === 0 && renderPreflight.world === false) {
          deny('WIP preflight: the scene has no lights and no world. Add a light or a world before rendering; a black frame is not a valid WIP');
        }
        if (Array.isArray(renderPreflight.lights) && renderPreflight.lights.length > 0 && renderPreflight.lights.every((light) => Number(light.energy) === 0) && renderPreflight.world === false) {
          deny('WIP preflight: every scene light has zero energy and there is no world. Raise a light before rendering');
        }
        const relativeRender = `renders/wip/WIP-${Date.now()}.png`;
        const wipPath = `${context.project}/${relativeRender}`;
        contained(this.harness.root, wipPath, true);
        fs.mkdirSync(path.dirname(path.join(this.harness.root, wipPath)), { recursive: true });
        await this.run(renderCode(scenePath, `//${relativeRender}`), args.user_prompt);
        const image = fs.readFileSync(contained(this.harness.root, wipPath));
        if (!image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) deny('WIP render is not PNG');
        return this.result(this.harness.finish(args.token, { ok: true, renderPath: wipPath, preflight: renderPreflight }));
      }
       round = this.makeRound(context.project, context.change.failedRounds ?? []);
       roundRoot = `${context.project}/Documents/Reviews/${round}`;
       const evidenceRoot = contained(this.harness.root, `${roundRoot}/_evidence`, true);
       fs.mkdirSync(evidenceRoot, { recursive: true });
       roundCreated = true;
       const roundRelative = `Documents/Reviews/${round}`;
       const declaredScenes = (context.change.scenes ?? []).filter((name) => typeof name === 'string' && name.trim());
       const primaryScene = context.change.primaryScene ?? declaredScenes[0] ?? null;
       const sceneOrder = [...new Set([primaryScene, ...declaredScenes].filter(Boolean))];
       if (!sceneOrder.length) sceneOrder.push(null);
       const renders = {};
       const scenes = [];
       const evidenceNames = new Set();
       let primary = primaryScene;
       for (const [index, sceneName] of sceneOrder.entries()) {
         const preflight = await this.run(renderPreflightCode(scenePath, sceneName), args.user_prompt);
         const name = sceneName ?? preflight.scene ?? 'active';
         if (primary === null) primary = name;
         const safeName = String(name).replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').slice(0, 80) || `scene-${index + 1}`;
         const relativeRender = name === primary
           ? `renders/final/${round}.png`
           : `${roundRelative}/_evidence/scenes/${safeName}/camera.png`;
         const projectRender = `${context.project}/${relativeRender}`;
         const absoluteRender = projectRender;
         contained(this.harness.root, absoluteRender, true);
         fs.mkdirSync(path.dirname(path.join(this.harness.root, absoluteRender)), { recursive: true });
         await this.run(renderCode(scenePath, `//${relativeRender}`, sceneName), args.user_prompt);
         const render = fs.readFileSync(contained(this.harness.root, absoluteRender));
         if (!render.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) deny('review render is not PNG');
         if (name === primary) renderPath = projectRender;
         const sceneDir = contained(this.harness.root, `${roundRoot}/_evidence/scenes/${safeName}`, true);
         fs.mkdirSync(sceneDir, { recursive: true });
         const cameraPath = `${roundRoot}/_evidence/scenes/${safeName}/camera.png`;
         if (name === primary) fs.copyFileSync(path.join(this.harness.root, absoluteRender), path.join(this.harness.root, cameraPath));
         const facts = await this.run(sceneFactsCode(name), args.user_prompt);
         const factsPath = `${roundRoot}/_evidence/scenes/${safeName}/scene-facts.json`;
         const textPath = `${roundRoot}/_evidence/scenes/${safeName}/scene.txt`;
         fs.writeFileSync(path.join(this.harness.root, factsPath), JSON.stringify(facts.scenes?.[0] ?? facts, null, 2) + '\n');
         fs.writeFileSync(path.join(this.harness.root, textPath), JSON.stringify(facts.scenes?.[0] ?? facts, null, 2) + '\n');
         renders[name] = projectRender;
         scenes.push({ name, render: projectRender, camera: preflight.camera, use_sequencer: preflight.use_sequencer, resolution: preflight.resolution, facts: factsPath });
         for (const pathName of [projectRender, cameraPath, factsPath, textPath]) evidenceNames.add(pathName);
       }
       const referenceRoot = path.join(this.harness.root, context.project, 'Documents', 'References');
       if (fs.existsSync(referenceRoot)) {
         const referenceFiles = fs.readdirSync(referenceRoot, { withFileTypes: true })
           .filter((entry) => entry.isFile() && /\.(?:png|jpe?g|webp)$/i.test(entry.name))
           .map((entry) => entry.name)
           .sort();
         for (const name of referenceFiles) {
           const source = contained(this.harness.root, `${context.project}/Documents/References/${name}`);
           const safeName = name.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').slice(0, 120) || `reference-${referenceFiles.indexOf(name) + 1}`;
           const target = `${roundRoot}/_evidence/references/${safeName}`;
           fs.mkdirSync(path.dirname(contained(this.harness.root, target, true)), { recursive: true });
           fs.copyFileSync(source, contained(this.harness.root, target, true));
           evidenceNames.add(target);
         }
       }
      const evidence = Object.fromEntries([...evidenceNames].map((name) => [name, this.harness.hash(name)]));
      const evidenceKey = digest(stable({ scene: this.harness.hash(context.scene), specs: context.records.specs, evidence }));
      const manifest = { round, created: new Date().toISOString(), previous_round: context.previousRound, active_goal: `${context.project}/${context.goal}`,
        base_commit: context.change.base, dirty: git(this.harness.root, ['status', '--porcelain', '--', context.project]).trim(),
        scene: { path: context.scene, sha256: this.harness.hash(context.scene) }, primary_scene: primary, scenes,
        scene_requirements: context.change.sceneRequirements ?? {}, specs: context.records.specs,
        asset_check: context.change.assetCheckReceipt ?? null,
        evidence, evidence_key: evidenceKey, graders: context.records.roster, tasks: {}, operation_tasks: context.operationTasks ?? [] };
      fs.writeFileSync(contained(this.harness.root, `${roundRoot}/manifest.json`, true), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
       indexPath = `${context.project}/Documents/Reviews/README.md`;
       indexLine = `\n- ${round}: ${context.change.outcome}; evidence ${evidenceKey}\n`;
       fs.appendFileSync(contained(this.harness.root, indexPath), indexLine);
       const result = this.harness.finish(args.token, { ok: true, round, renderPath, evidence, renders, primaryScene: primary, scenes: scenes.map((scene) => scene.name) });
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
      try { this.harness.finish(args.token, { ok: false, error: String(error.message), round, completed, operationResults }); } catch { /* A sealed state remains fail-closed if manifest publication failed. */ }
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
