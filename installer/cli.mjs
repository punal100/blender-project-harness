import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { install, status, INSTALL_RELATIVE, PACKAGE_NAME } from './install.mjs';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));

function usage() {
  return [
    `${PACKAGE_NAME} ${packageJson.version}`,
    '',
    'Usage:',
    '  npx @punal_manalan/blender-project-harness [install] [options]',
    '  npx @punal_manalan/blender-project-harness status [--root <path>] [--json]',
    '  npx @punal_manalan/blender-project-harness doctor [--root <path>]',
    '',
    'Options:',
    '  --root <path>       Workspace root (default: current directory)',
    '  --force             Reinstall the current version',
    '  --dry-run           Show what would change without writing',
    '  --skip-deps         Do not run npm ci in the installed harness',
    '  --reset-config      Replace the installed config with the package example',
    '  --json              Print machine-readable output',
    '  --version           Print the package version',
    '  --help              Show this help',
    '',
    'The harness is installed under .kilo/blender-project-harness.',
    'An existing installation is moved to .temp/blender-project-harness-backups.',
  ].join('\n');
}

function parse(argv) {
  const known = new Set(['install', 'status', 'doctor', 'help']);
  const command = known.has(argv[0]) ? argv.shift() : 'install';
  const options = { root: process.cwd(), force: false, dryRun: false, skipDeps: false, resetConfig: false, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--root') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error('missing value for --root');
      options.root = path.resolve(value);
      index += 1;
    } else if (token === '--force') options.force = true;
    else if (token === '--dry-run') options.dryRun = true;
    else if (token === '--skip-deps' || token === '--no-deps') options.skipDeps = true;
    else if (token === '--reset-config') options.resetConfig = true;
    else if (token === '--json') options.json = true;
    else if (token === '--help' || token === '-h') options.help = true;
    else if (token === '--version' || token === '-v') options.version = true;
    else throw new Error(`unknown option: ${token}`);
  }
  return { command, options };
}

function humanInstall(result) {
  if (result.status === 'current') {
    return `${PACKAGE_NAME} ${result.version} is already installed at ${INSTALL_RELATIVE}. Use --force to reinstall.`;
  }
  const lines = [
    `${result.status === 'updated' ? 'Updated' : 'Installed'} ${PACKAGE_NAME} ${result.version}`,
    `Location: ${path.relative(result.root, result.installDir).replaceAll('\\', '/')}`,
    `Dependencies: ${result.dependencies}`,
  ];
  if (result.backup) lines.push(`Backup: ${result.backup}`);
  if (result.written?.length) lines.push(`Updated: ${result.written.join(', ')}`);
  if (result.actions?.length) lines.push(`Created: ${result.actions.join(', ')}`);
  if (result.warnings?.length) lines.push(...result.warnings.map((warning) => `Warning: ${warning}`));
  return lines.join('\n');
}

async function main(argv) {
  try {
    const { command, options } = parse([...argv]);
    if (options.help || command === 'help') {
      process.stdout.write(`${usage()}\n`);
      return;
    }
    if (options.version) {
      process.stdout.write(`${packageJson.version}\n`);
      return;
    }
    if (command === 'status') {
      const result = status({ root: options.root });
      process.stdout.write(options.json ? `${JSON.stringify(result, null, 2)}\n`
        : result.installed
          ? `${PACKAGE_NAME} ${result.version} installed at ${path.relative(result.root, result.installDir).replaceAll('\\', '/')}\n`
          : `${PACKAGE_NAME} is not installed under ${INSTALL_RELATIVE}\n`);
      return;
    }
    if (command === 'doctor') {
      const cli = path.join(options.root, INSTALL_RELATIVE, 'tools', 'harness', 'cli.mjs');
      if (!fs.existsSync(cli)) throw new Error(`harness is not installed at ${INSTALL_RELATIVE}; run install first`);
      const result = spawnSync(process.execPath, [cli, 'doctor'], { cwd: options.root, stdio: 'inherit', windowsHide: false });
      if (result.error) throw result.error;
      process.exitCode = result.status ?? 1;
      return;
    }
    const result = install({
      root: options.root,
      packageRoot,
      version: packageJson.version,
      force: options.force,
      dryRun: options.dryRun,
      skipDeps: options.skipDeps,
      resetConfig: options.resetConfig,
    });
    process.stdout.write(options.json || options.dryRun ? `${JSON.stringify(result, null, 2)}\n` : `${humanInstall(result)}\n`);
  } catch (error) {
    process.stderr.write(`${PACKAGE_NAME}: ${error.message}\n`);
    process.exitCode = 1;
  }
}

export { main };
