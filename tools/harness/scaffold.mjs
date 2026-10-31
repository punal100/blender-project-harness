import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const fail = (message) => { throw new Error(`Scaffold: ${message}`); };

const TEXT_EXTENSIONS = new Set(['.md', '.jsonc', '.json', '.txt', '.py', '.ps1', '.cmd', '.js', '.mjs']);
const TOKEN = /\{\{([A-Z_]+)\}\}/g;

function walk(directory, base = directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(full, base));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function isText(file) {
  return path.basename(file) === '.gitignore' || TEXT_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function render(text, replacements, name) {
  return text.replace(TOKEN, (token, key) => {
    if (!(key in replacements)) fail(`unknown template token ${token} in ${name}`);
    return replacements[key];
  });
}

export function scaffold(root, { name, description, goal, goalTitle, dryRun = false, date = new Date() }) {
  if (typeof name !== 'string' || !/^[A-Za-z0-9](?:[A-Za-z0-9 _-]*[A-Za-z0-9_-])?$/.test(name) || /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(name)) {
    fail('invalid project name; use letters, numbers, internal spaces, hyphens, or underscores, and avoid Windows device names');
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) fail('project name must contain at least one letter or number');

  const projectsRoot = path.join(root, 'Blender');
  const templateRoot = path.join(root, '.kilo', 'skills', 'blender-project-scaffold', 'templates', 'project');
  if (!fs.existsSync(projectsRoot) || !fs.statSync(projectsRoot).isDirectory()) fail(`project collection not found: ${projectsRoot}`);
  if (fs.existsSync(projectsRoot) && fs.lstatSync(projectsRoot).isSymbolicLink()) fail('project collection must not be a symbolic link or junction');
  if (!fs.existsSync(templateRoot) || !fs.statSync(templateRoot).isDirectory()) fail(`project template not found: ${templateRoot}`);
  const destination = path.join(projectsRoot, name);
  if (fs.existsSync(destination)) fail(`project already exists: ${destination}`);

  const replacements = {
    PROJECT_NAME: name,
    PROJECT_SLUG: slug,
    DATE: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    DESCRIPTION: description || 'TBD - replace with the project purpose.',
    GOAL: goal || 'TBD - replace with the first design request.',
    GOAL_TITLE: goalTitle || 'Project Brief',
  };
  const files = walk(templateRoot).map((file) => ({
    source: file,
    relative: path.relative(templateRoot, file),
    text: isText(file) ? render(fs.readFileSync(file, 'utf8'), replacements, file) : null,
  }));

  if (dryRun) return { dryRun: true, destination, slug, files: files.map((file) => file.relative) };

  const staging = path.join(projectsRoot, `.scaffold-${crypto.randomUUID().replaceAll('-', '')}`);
  let owned = false;
  try {
    fs.mkdirSync(staging);
    owned = true;
    for (const file of files) {
      const target = path.join(staging, file.relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      if (file.text === null) fs.copyFileSync(file.source, target);
      else fs.writeFileSync(target, file.text);
    }
    fs.renameSync(staging, destination);
    owned = false;
  } catch (error) {
    if (owned) fs.rmSync(staging, { recursive: true, force: true });
    throw error;
  }
  return { destination, slug };
}
