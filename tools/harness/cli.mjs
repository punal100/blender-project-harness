import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { findBlender, instanceStatus } from './blender.mjs';
import { Harness } from './engine.mjs';
import { scaffold } from './scaffold.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const packageRoot = path.dirname(fileURLToPath(import.meta.url));

function fail(message) {
  throw new Error(`Harness: ${message}`);
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

function stateHome() {
  const key = crypto.createHash('sha256').update(root.toLowerCase()).digest('hex');
  return path.join(os.homedir(), '.local', 'state', 'blender-workflow-harness', key);
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

function doctor({ project } = {}) {
  const node = process.versions.node;
  if (Number.parseInt(node, 10) < 22) fail(`Node ${node} is too old; Node 22 or newer required`);
  checkPackage();
  checkConfig();
  commandAvailable('git');
  commandAvailable('uvx');
  checkUpstream();
  const blender = findBlender();
  const instance = instanceStatus(stateHome());
  const projectState = project ? new Harness(root).projectDoctor(project) : null;
  process.stdout.write(JSON.stringify({ ok: true, root, node, upstream: 'mcp-for-blender==2.2.6', blender, instance, project: projectState }, null, 2) + '\n');
}

function parseOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith('--')) fail(`unexpected argument: ${token}`);
    const key = token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (key === 'dryRun') { options.dryRun = true; continue; }
    const value = args[index + 1];
    if (value === undefined || value.startsWith('--')) fail(`missing value for ${token}`);
    options[key] = value;
    index += 1;
  }
  return options;
}

async function main() {
  const command = process.argv[2];
  if (command === 'doctor') return doctor(parseOptions(process.argv.slice(3)));
  if (command === 'scaffold') {
    const options = parseOptions(process.argv.slice(3));
    if (!options.name) fail('usage: node tools/harness/cli.mjs scaffold --name "Project Name" [--description "..."] [--goal "..."] [--goal-title "..."] [--dry-run]');
    const result = scaffold(root, {
      name: options.name,
      description: options.description,
      goal: options.goal,
      goalTitle: options.goalTitle,
      dryRun: Boolean(options.dryRun),
    });
    if (result.dryRun) process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    else {
      process.stdout.write(`Created Blender project: ${result.destination}\n\n`);
      process.stdout.write('Next:\n');
      process.stdout.write('1. Fill confirmed records through blender_workflow bootstrap-document; use capabilities.documentFormats.\n');
      process.stdout.write('2. Commit the exact scaffold through blender_workflow bootstrap-commit; do not use manual project Git.\n');
      process.stdout.write('3. Call blender_workflow prepare, answer its exact question, then start or resume the goal.\n');
      process.stdout.write(`4. After registration and goal start, call blender_workflow {action:"status",payload:"{\\"project\\":\\"Blender/<Name>\\"}"} and follow nextStep.\n`);
    }
    return undefined;
  }
  fail('usage: node tools/harness/cli.mjs doctor [--project "Blender/Name"] | scaffold --name "Project Name"');
}

try { await main(); }
catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
