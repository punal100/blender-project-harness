import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const BOOTSTRAP = `import bpy
import os
import socket
import traceback
from bpy.app.handlers import persistent

MAX_START_ATTEMPTS = 5
RETRY_INTERVAL = 0.5
_start_attempts = 0


def requested_port():
    value = os.environ.get("BLENDER_PORT", "").strip()
    if not value.isdigit() or not 1024 <= int(value) <= 65535:
        raise RuntimeError(
            "BLENDER_PORT is missing or invalid; launch Blender through the harness so the port matches .kilo/kilo.jsonc"
        )
    return int(value)


def apply_port(*_args):
    global _start_attempts
    _start_attempts += 1
    try:
        scene = bpy.context.scene
        if scene is None:
            raise RuntimeError("No active scene available for MCP startup")
        port = requested_port()

        server = getattr(bpy.types, "blendermcp_server", None)
        if server is not None or getattr(scene, "blendermcp_server_running", False):
            try:
                if "FINISHED" not in bpy.ops.blendermcp.stop_server():
                    raise RuntimeError("MCP stop operator did not finish")
            except Exception:
                if server is None:
                    raise
                server.stop()
            remaining = getattr(bpy.types, "blendermcp_server", None)
            if remaining is not None:
                if getattr(remaining, "running", False):
                    remaining.stop()
                if getattr(remaining, "running", False):
                    raise RuntimeError("Existing MCP server did not stop")
                del bpy.types.blendermcp_server
            scene.blendermcp_server_running = False

        scene.blendermcp_port = port
        result = bpy.ops.blendermcp.start_server()
        server = getattr(bpy.types, "blendermcp_server", None)
        listener = getattr(server, "socket", None)
        if ("FINISHED" not in result or not getattr(server, "running", False)
                or not getattr(scene, "blendermcp_server_running", False)
                or getattr(server, "port", None) != port or listener is None
                or listener.getsockname()[1] != port
                or not listener.getsockopt(socket.SOL_SOCKET, socket.SO_ACCEPTCONN)):
            raise RuntimeError(f"MCP server is not listening on requested port {port}")
        print(f"BlenderMCP: listening on port {port}", flush=True)
    except Exception:
        traceback.print_exc()
        if _start_attempts < MAX_START_ATTEMPTS:
            return RETRY_INTERVAL
        print(f"BlenderMCP: startup stopped after {MAX_START_ATTEMPTS} attempts", flush=True)
    return None


def schedule_apply_port(*_args):
    global _start_attempts
    _start_attempts = 0
    if not bpy.app.timers.is_registered(apply_port):
        bpy.app.timers.register(apply_port, first_interval=0.4, persistent=True)


@persistent
def restart_after_load(*_args):
    schedule_apply_port()


restart_after_load._kilo_blender_mcp_apply_port = apply_port
for handler in list(bpy.app.handlers.load_post):
    previous_timer = getattr(handler, "_kilo_blender_mcp_apply_port", None)
    if previous_timer is not None:
        if bpy.app.timers.is_registered(previous_timer):
            bpy.app.timers.unregister(previous_timer)
        bpy.app.handlers.load_post.remove(handler)
bpy.app.handlers.load_post.append(restart_after_load)
schedule_apply_port()
`;

export const fail = (message) => { throw new Error(`Blender harness: ${message}`); };

export const instanceFile = (home) => path.join(home, 'blender-instance.json');
const launchLockFile = (home) => path.join(home, 'blender-launch.lock');

export function readWorkspacePort(root) {
  const file = path.join(root, '.kilo', 'kilo.jsonc');
  if (!fs.existsSync(file)) fail(`workspace MCP config not found: ${file}`);
  const text = fs.readFileSync(file, 'utf8')
    .replace(/"(?:\\.|[^"\\])*"|\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g, (token) => (token.startsWith('"') ? token : ' '));
  const match = /"BLENDER_PORT"\s*:\s*"(\d+)"/.exec(text);
  if (!match) fail('.kilo/kilo.jsonc lacks BLENDER_PORT');
  const port = Number(match[1]);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) fail(`invalid BLENDER_PORT in .kilo/kilo.jsonc: ${match[1]}`);
  return port;
}

function exeFile(candidate) {
  try {
    const full = path.resolve(candidate);
    return fs.statSync(full).isFile() && path.extname(full).toLowerCase() === '.exe' ? full : null;
  } catch { return null; }
}

function walkExecutables(directory, depth = 0) {
  if (depth > 3) return [];
  let entries;
  try { entries = fs.readdirSync(directory, { withFileTypes: true }); } catch { return []; }
  const found = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === 'blender.exe') found.push(full);
    else if (entry.isDirectory() && !entry.isSymbolicLink()) found.push(...walkExecutables(full, depth + 1));
  }
  return found;
}

export function findBlender(env = process.env) {
  const candidates = [];
  if (env.BLENDER_EXE) candidates.push(env.BLENDER_EXE);
  const where = spawnSync('where.exe', ['blender.exe'], { encoding: 'utf8', windowsHide: true, timeout: 15000 });
  if (where.status === 0) candidates.push(...where.stdout.split(/\r?\n/).filter(Boolean));
  const roots = [
    env.ProgramFiles && path.join(env.ProgramFiles, 'Blender Foundation'),
    env['ProgramFiles(x86)'] && path.join(env['ProgramFiles(x86)'], 'Blender Foundation'),
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Programs', 'Blender Foundation'),
    env.ProgramFiles && path.join(env.ProgramFiles, 'Steam', 'steamapps', 'common', 'Blender'),
    env.USERPROFILE && path.join(env.USERPROFILE, 'scoop', 'apps', 'blender', 'current'),
  ].filter(Boolean);
  for (const directory of roots) {
    if (fs.existsSync(directory)) candidates.push(...walkExecutables(directory));
  }
  const unique = [...new Set(candidates.map((candidate) => exeFile(candidate)).filter(Boolean))];
  if (!unique.length) fail('Blender not found. Set BLENDER_EXE to the full blender.exe path or add Blender to PATH.');
  return unique
    .map((file) => ({ file, version: spawnSync('powershell.exe', ['-NoLogo', '-NoProfile', '-Command',
      `(Get-Item -LiteralPath '${file.replaceAll("'", "''")}').VersionInfo.ProductVersion`], { encoding: 'utf8', windowsHide: true, timeout: 15000 }).stdout?.trim() ?? '' }))
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))[0].file;
}

export function isAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; }
  catch (error) { return error.code === 'EPERM'; }
}

export function readInstance(home) {
  try { return JSON.parse(fs.readFileSync(instanceFile(home), 'utf8')); }
  catch { return null; }
}

export function instanceStatus(home) {
  const instance = readInstance(home);
  if (!instance) return { running: false };
  if (!isAlive(instance.pid)) {
    try { fs.rmSync(instanceFile(home), { force: true }); } catch { /* recovery */ }
    return { running: false, stalePid: instance.pid };
  }
  return { running: true, ...instance };
}

function writeInstance(home, instance) {
  const file = instanceFile(home);
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(instance, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

export function acquireLaunchLock(home) {
  fs.mkdirSync(home, { recursive: true });
  const file = launchLockFile(home);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const fd = fs.openSync(file, 'wx');
      fs.writeSync(fd, JSON.stringify({ pid: process.pid, at: Date.now() }));
      fs.closeSync(fd);
      return () => { try { fs.rmSync(file, { force: true }); } catch { /* lock already gone */ } };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let stale = false;
      try { stale = Date.now() - fs.statSync(file).mtimeMs > 60000; } catch { stale = true; }
      if (stale) { fs.rmSync(file, { force: true }); continue; }
      fail('another launch is in progress; wait for it to finish');
    }
  }
  fail('launch lock could not be acquired');
}

export function portListening(port, timeout = 500) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    const done = (value) => { socket.destroy(); resolve(value); };
    socket.setTimeout(timeout);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

export function logTail(file, lines = 12) {
  try { return fs.readFileSync(file, 'utf8').trimEnd().split(/\r?\n/).slice(-lines).join('\n'); }
  catch { return ''; }
}

function killProcess(pid) {
  if (!isAlive(pid)) return;
  if (process.platform === 'win32') spawnSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, timeout: 15000 });
  else { try { process.kill(-pid, 'SIGTERM'); } catch { try { process.kill(pid, 'SIGTERM'); } catch { /* already gone */ } } }
}

export async function launchProject({ root, home, project, scene, session, env = process.env }) {
  const projectPath = path.resolve(root, project);
  const projectsRoot = path.resolve(root, 'Blender');
  if (path.dirname(projectPath) !== projectsRoot) fail(`project must live under ${projectsRoot}: ${project}`);
  if (!fs.existsSync(projectPath) || !fs.statSync(projectPath).isDirectory()) fail(`project not found: ${project}`);

  const port = readWorkspacePort(root);
  const scenePath = path.resolve(root, scene);
  if (!scenePath.startsWith(`${projectPath}${path.sep}`)) fail(`scene must stay inside ${project}`);
  const existing = instanceStatus(home);
  if (existing.running) {
    if (existing.project === project && existing.scene === scene && existing.port === port) return { started: false, ...existing };
    fail(`only one Blender instance may run from this workspace; PID ${existing.pid} is using ${existing.project}`);
  }
  if (await portListening(port)) fail(`port ${port} is already in use; another process may be holding the MCP socket`);
  const blender = findBlender(env);

  const logsRoot = path.join(projectPath, 'logs');
  fs.mkdirSync(logsRoot, { recursive: true });
  const logName = `blender-${new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '')}-${process.pid}.log`;
  const logPath = path.join(logsRoot, logName);
  fs.mkdirSync(home, { recursive: true });
  const bootstrapPath = path.join(home, 'blender-bootstrap.py');
  fs.writeFileSync(bootstrapPath, BOOTSTRAP);

  const release = acquireLaunchLock(home);
  try {
    if (instanceStatus(home).running) fail('another Blender instance started while launching; stop it first');
    const args = [];
    if (fs.existsSync(scenePath)) args.push(scenePath);
    args.push('--log', '*', '--python', bootstrapPath);
    const out = fs.openSync(logPath, 'a');
    let child;
    try {
      child = spawn(blender, args, { cwd: projectPath, env: { ...env, BLENDER_PORT: String(port) }, detached: true, stdio: ['ignore', out, out], windowsHide: false });
    } finally { fs.closeSync(out); }
    child.unref();
    if (!child.pid) fail(`Blender did not start; see ${logPath}`);

    const instance = {
      pid: child.pid,
      project,
      scene,
      port,
      blender,
      log: path.relative(root, logPath).replaceAll('\\', '/'),
      startedAt: new Date().toISOString(),
      session,
    };
    writeInstance(home, instance);

    const timeout = Number(env.HARNESS_LAUNCH_TIMEOUT_MS ?? 25000);
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (!isAlive(child.pid)) {
        fs.rmSync(instanceFile(home), { force: true });
        fail(`Blender exited during startup; see ${instance.log}\n${logTail(logPath)}`);
      }
      if (await portListening(port)) return { started: true, ...instance, addonListening: true };
      await delay(400);
    }
    return { started: true, ...instance, addonListening: false, warning: `addon is not listening on port ${port}; check ${instance.log}` };
  } finally {
    release();
  }
}

export function stopProject({ home, project }) {
  const instance = readInstance(home);
  if (!instance) return { running: false };
  if (project && instance.project !== project) fail(`running instance belongs to ${instance.project}, not ${project}; only its registered session may stop it`);
  if (isAlive(instance.pid)) killProcess(instance.pid);
  fs.rmSync(instanceFile(home), { force: true });
  return { running: false, stopped: instance };
}
