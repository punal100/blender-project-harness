import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const packageRoot = path.dirname(fileURLToPath(import.meta.url));

function fail(message) {
  throw new Error(`Doctor: ${message}`);
}

function commandAvailable(command, args = ['--version']) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000 });
  if (result.error || result.status !== 0) fail(`${command} unavailable: ${result.error?.message ?? result.stderr?.trim() ?? `exit ${result.status}`}`);
  return (result.stdout ?? result.stderr ?? '').trim();
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
  catch (error) { fail(`invalid JSON ${path.relative(root, file)}: ${error.message}`); }
}

function checkPackage() {
  const pkg = readJson(path.join(packageRoot, 'package.json'));
  if (pkg.type !== 'module' || pkg.engines?.node !== '>=22') fail('package requires ESM and Node >=22');
  for (const dependency of ['@modelcontextprotocol/sdk', 'zod']) {
    if (!fs.existsSync(path.join(packageRoot, 'node_modules', dependency))) fail(`dependency missing: ${dependency}; run npm ci --prefix tools/harness`);
  }
  if (!fs.existsSync(path.join(packageRoot, 'package-lock.json'))) fail('package-lock.json missing; run npm install --prefix tools/harness');
}

function checkConfig() {
  const configPath = path.join(root, '.kilo', 'kilo.jsonc');
  const text = fs.readFileSync(configPath, 'utf8');
  if (!text.includes('tools/harness/server.mjs')) fail('.kilo/kilo.jsonc does not route Blender MCP through harness server');
  if (!/"BLENDER_PORT"\s*:\s*"\d+"/.test(text)) fail('.kilo/kilo.jsonc lacks BLENDER_PORT');
  if (!fs.existsSync(path.join(root, '.kilo', 'plugins', 'blender-workflow.js'))) fail('auto-loaded Blender workflow plugin missing');
}

function checkUpstream() {
  const version = commandAvailable('uvx', ['--from', 'mcp-for-blender==2.2.6', 'mcp-for-blender', '--help']);
  if (!version.includes('mcp-for-blender')) fail('pinned mcp-for-blender command did not return expected help');
}

function doctor() {
  const node = process.versions.node;
  if (Number.parseInt(node, 10) < 22) fail(`Node ${node} is too old; Node 22 or newer required`);
  checkPackage();
  checkConfig();
  commandAvailable('git');
  commandAvailable('uvx');
  checkUpstream();
  process.stdout.write(JSON.stringify({ ok: true, root, node, upstream: 'mcp-for-blender==2.2.6' }, null, 2) + '\n');
}

if (process.argv[2] !== 'doctor') fail('usage: node tools/harness/cli.mjs doctor');
try { doctor(); }
catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
