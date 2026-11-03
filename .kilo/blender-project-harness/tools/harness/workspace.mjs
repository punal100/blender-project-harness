import fs from 'node:fs';
import path from 'node:path';

export const INSTALL_RELATIVE = path.join('.kilo', 'blender-project-harness');
export const CONFIG_RELATIVE = path.join(INSTALL_RELATIVE, 'config.json');

export function workspaceRoot(start) {
  const explicit = process.env.BLENDER_WORKSPACE_ROOT;
  if (explicit) {
    const resolved = path.resolve(explicit);
    if (fs.existsSync(resolved)) return resolved;
  }
  let current = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(current, '.kilo'))
      && (fs.existsSync(path.join(current, 'Blender')) || fs.existsSync(path.join(current, 'AGENTS.md')))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  const cwd = path.resolve(process.cwd());
  if (fs.existsSync(path.join(cwd, '.kilo'))) return cwd;
  return path.resolve(start, '..', '..');
}

export function configPath(root) {
  return path.join(root, CONFIG_RELATIVE);
}
