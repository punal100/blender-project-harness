import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { applyEdits, modify, parse, printParseErrorCode } from 'jsonc-parser';

export const PACKAGE_NAME = 'blender-project-harness';
export const INSTALL_RELATIVE = '.kilo/blender-project-harness';
export const BACKUP_RELATIVE = '.temp/blender-project-harness-backups';
export const SERVER_RELATIVE = `${INSTALL_RELATIVE}/tools/harness/server.mjs`;

const FORMAT = { formattingOptions: { insertSpaces: true, tabSize: 2 } };
const GITIGNORE_HEADER = '# Blender project harness';
const GITIGNORE_LINES = ['/.kilo/blender-project-harness/config.json', '.temp/'];

function exists(file) {
  try { fs.lstatSync(file); return true; } catch { return false; }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyTree(source, destination) {
  const base = path.resolve(source);
  const skip = new Set(['node_modules', '__pycache__', '.pytest_cache']);
  fs.cpSync(source, destination, {
    recursive: true,
    filter: (candidate) => {
      const relative = path.relative(base, path.resolve(candidate));
      return !relative.split(path.sep).some((part) => skip.has(part));
    },
  });
}

function movePath(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  try {
    fs.renameSync(source, destination);
  } catch (error) {
    if (error.code !== 'EXDEV') throw error;
    copyTree(source, destination);
    fs.rmSync(source, { recursive: true, force: true });
  }
}

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}

function uniqueBackup(root, version) {
  const parent = path.join(root, BACKUP_RELATIVE);
  const base = `${version || 'unknown'}-${stamp()}`;
  let candidate = path.join(parent, base);
  let index = 2;
  while (exists(candidate)) candidate = path.join(parent, `${base}-${index++}`);
  return candidate;
}

function installedVersion(installDir) {
  const versionFile = path.join(installDir, 'VERSION');
  if (exists(versionFile)) return fs.readFileSync(versionFile, 'utf8').trim() || null;
  const stateFile = path.join(installDir, 'install.json');
  if (!exists(stateFile)) return null;
  try { return readJson(stateFile).version ?? null; } catch { return null; }
}

function readState(installDir) {
  const file = path.join(installDir, 'install.json');
  if (!exists(file)) return null;
  try { return readJson(file); } catch { return null; }
}

function chooseConfig({ installDir, packageRoot, resetConfig }) {
  if (!resetConfig) {
    const current = path.join(installDir, 'config.json');
    if (exists(current)) {
      try {
        JSON.parse(fs.readFileSync(current, 'utf8').replace(/^\uFEFF/, ''));
        return current;
      } catch (error) {
        throw new Error(`invalid config ${current}: ${error.message}`);
      }
    }
  }
  const example = path.join(packageRoot, '.kilo', 'blender-project-harness', 'config.example.json');
  if (!exists(example)) throw new Error(`package config example missing: ${example}`);
  return example;
}

function runNpmCi(harnessDir) {
  const args = ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'];
  const result = spawnSync('npm', args, {
    cwd: harnessDir,
    env: process.env,
    shell: process.platform === 'win32',
    stdio: 'inherit',
    windowsHide: false,
  });
  if (result.error) throw new Error(`npm ci failed to start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`npm ci failed in ${harnessDir} with exit ${result.status}`);
}

function edit(text, pointer, value) {
  const edits = modify(text, pointer, value, FORMAT);
  return edits.length ? applyEdits(text, edits) : text;
}

function prepareKiloConfig(root) {
  const file = path.join(root, '.kilo', 'kilo.jsonc');
  let text = exists(file) ? fs.readFileSync(file, 'utf8') : '{\n  "$schema": "https://app.kilo.ai/config.json",\n  "mcp": {}\n}\n';
  const errors = [];
  parse(text, errors);
  if (errors.length) {
    throw new Error(`invalid .kilo/kilo.jsonc: ${printParseErrorCode(errors[0].error)} at offset ${errors[0].offset}`);
  }
  text = edit(text, ['mcp', 'blender', 'type'], 'local');
  text = edit(text, ['mcp', 'blender', 'command'], ['node', SERVER_RELATIVE]);
  text = edit(text, ['mcp', 'blender', 'enabled'], true);
  const parsed = parse(text, []);
  if (!parsed?.mcp?.blender?.environment?.BLENDER_PORT) {
    text = edit(text, ['mcp', 'blender', 'environment', 'BLENDER_PORT'], '9877');
  }
  return text.endsWith('\n') ? text : `${text}\n`;
}

function preparePlugin() {
  return [
    "import { server } from '../blender-project-harness/tools/harness/plugin.mjs';",
    '',
    "export default { id: 'blender-workflow-harness', server };",
    '',
  ].join('\n');
}

function prepareGitignore(root) {
  const file = path.join(root, '.gitignore');
  const text = exists(file) ? fs.readFileSync(file, 'utf8') : '';
  if (text.includes(GITIGNORE_HEADER)) return text;
  const lines = [GITIGNORE_HEADER, ...GITIGNORE_LINES];
  const separator = text && !text.endsWith('\n') ? '\n\n' : text ? '\n' : '';
  return `${text}${separator}${lines.join('\n')}\n`;
}

function copyMissingFile(source, destination) {
  if (exists(destination)) return false;
  copyFile(source, destination);
  return true;
}

function copyMissingTree(source, destination) {
  if (!exists(source)) return [];
  const copied = [];
  const entries = fs.readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      if (!exists(to)) {
        copyTree(from, to);
        copied.push(path.relative(source, from));
      } else {
        copied.push(...copyMissingTree(from, to).map((name) => path.join(entry.name, name)));
      }
    } else if (entry.isFile() && !exists(to)) {
      copyFile(from, to);
      copied.push(entry.name);
    }
  }
  return copied;
}

function backupWorkspaceFile(root, relative, version) {
  const source = path.join(root, relative);
  if (!exists(source)) return null;
  const backup = path.join(root, BACKUP_RELATIVE, `${version || 'unknown'}-${stamp()}-workspace`, relative);
  copyFile(source, backup);
  return path.relative(root, backup).replaceAll('\\', '/');
}

function installSurfaces({ root, packageRoot, version, backupRoot }) {
  const warnings = [];
  const actions = [];
  const written = [];
  if (copyMissingFile(path.join(packageRoot, 'AGENTS.md'), path.join(root, 'AGENTS.md'))) actions.push('AGENTS.md');
  if (copyMissingFile(path.join(packageRoot, 'README.md'), path.join(root, 'README.md'))) actions.push('README.md');
  const skills = copyMissingTree(path.join(packageRoot, '.kilo', 'skills'), path.join(root, '.kilo', 'skills'));
  if (skills.length) actions.push(`${skills.length} skill file(s)`);
  const agents = copyMissingTree(path.join(packageRoot, '.kilo', 'agent'), path.join(root, '.kilo', 'agent'));
  if (agents.length) actions.push(`${agents.length} agent file(s)`);
  if (copyMissingFile(path.join(packageRoot, 'Blender', 'README.md'), path.join(root, 'Blender', 'README.md'))) actions.push('Blender/README.md');

  const plugin = path.join(root, '.kilo', 'plugins', 'blender-workflow.js');
  const pluginText = preparePlugin();
  if (exists(plugin) && fs.readFileSync(plugin, 'utf8') !== pluginText) {
    const backup = backupWorkspaceFile(root, '.kilo/plugins/blender-workflow.js', version);
    if (backup) warnings.push(`previous plugin backed up to ${backup}`);
  }
  copyFile(path.join(packageRoot, '.kilo', 'plugins', 'blender-workflow.js'), plugin);
  fs.writeFileSync(plugin, pluginText);
  written.push('.kilo/plugins/blender-workflow.js');

  const kiloFile = path.join(root, '.kilo', 'kilo.jsonc');
  const kiloText = prepareKiloConfig(root);
  const oldKilo = exists(kiloFile) ? fs.readFileSync(kiloFile, 'utf8') : null;
  if (oldKilo !== kiloText) {
    fs.mkdirSync(path.dirname(kiloFile), { recursive: true });
    fs.writeFileSync(kiloFile, kiloText);
    written.push('.kilo/kilo.jsonc');
  }

  const gitignoreFile = path.join(root, '.gitignore');
  const gitignoreText = prepareGitignore(root);
  if (!exists(gitignoreFile) || fs.readFileSync(gitignoreFile, 'utf8') !== gitignoreText) {
    fs.writeFileSync(gitignoreFile, gitignoreText);
    written.push('.gitignore');
  }

  if (backupRoot && exists(backupRoot)) warnings.push(`previous install backed up to ${path.relative(root, backupRoot).replaceAll('\\', '/')}`);
  return { actions, warnings, written };
}

export function install({ root, packageRoot, version, skipDeps = false, resetConfig = false, force = false, dryRun = false }) {
  root = path.resolve(root);
  packageRoot = path.resolve(packageRoot);
  if (!version) throw new Error('package version is missing');
  const installDir = path.join(root, INSTALL_RELATIVE);
  const previousVersion = exists(installDir) ? installedVersion(installDir) : null;
  const current = previousVersion === version;
  if (current && !force) {
    return { ok: true, status: 'current', root, installDir, version, previousVersion, backup: null };
  }
  const backup = exists(installDir) ? uniqueBackup(root, previousVersion) : null;
  const configSource = chooseConfig({ installDir, packageRoot, resetConfig });
  const dependencies = skipDeps ? 'skipped' : 'install';
  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      status: current ? 'current' : previousVersion ? 'update' : 'install',
      root,
      installDir,
      version,
      previousVersion,
      backup: backup ? path.relative(root, backup).replaceAll('\\', '/') : null,
      config: path.relative(root, configSource).replaceAll('\\', '/'),
      dependencies,
    };
  }

  const stage = path.join(root, '.kilo', `.blender-project-harness-${crypto.randomUUID().replaceAll('-', '')}`);
  let moved = false;
  const dependencyState = skipDeps ? 'skipped' : 'installed';
  try {
    fs.mkdirSync(stage, { recursive: true });
    const source = path.join(packageRoot, '.kilo', 'blender-project-harness');
    copyTree(path.join(source, 'tools'), path.join(stage, 'tools'));
    copyFile(path.join(source, 'config.example.json'), path.join(stage, 'config.example.json'));
    copyFile(configSource, path.join(stage, 'config.json'));
    fs.writeFileSync(path.join(stage, 'VERSION'), `${version}\n`);
    if (!skipDeps) runNpmCi(path.join(stage, 'tools', 'harness'));
    writeJson(path.join(stage, 'install.json'), {
      schemaVersion: 1,
      package: PACKAGE_NAME,
      version,
      installedAt: new Date().toISOString(),
      dependencies: dependencyState,
      node: process.version,
      server: SERVER_RELATIVE,
      backup: backup ? path.relative(root, backup).replaceAll('\\', '/') : null,
    });

    if (backup) {
      movePath(installDir, backup);
      moved = true;
    }
    try {
      movePath(stage, installDir);
    } catch (error) {
      if (moved) movePath(backup, installDir);
      throw error;
    }
  } catch (error) {
    fs.rmSync(stage, { recursive: true, force: true });
    throw error;
  }

  const surfaces = installSurfaces({ root, packageRoot, version, backupRoot: backup });
  return {
    ok: true,
    status: previousVersion ? 'updated' : 'installed',
    root,
    installDir,
    version,
    previousVersion,
    backup: backup ? path.relative(root, backup).replaceAll('\\', '/') : null,
    dependencies: dependencyState,
    ...surfaces,
  };
}

export function status({ root }) {
  root = path.resolve(root);
  const installDir = path.join(root, INSTALL_RELATIVE);
  const state = readState(installDir);
  return {
    installed: Boolean(state),
    installDir,
    version: state?.version ?? installedVersion(installDir),
    installedAt: state?.installedAt ?? null,
    backup: state?.backup ?? null,
    server: state?.server ?? SERVER_RELATIVE,
  };
}
