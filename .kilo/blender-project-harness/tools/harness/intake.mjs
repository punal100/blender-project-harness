import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const MAX_INTAKE_FILES = 200;
export const MAX_INTAKE_FILE_BYTES = 512 * 1024 * 1024;
export const MAX_INTAKE_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;
export const MAX_INTAKE_DEPTH = 8;

const MODEL_EXTENSIONS = new Set(['.glb', '.gltf', '.fbx', '.obj', '.usd', '.usdz', '.blend']);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff', '.bmp']);
const HDRI_EXTENSIONS = new Set(['.hdr', '.exr']);
const AUDIO_EXTENSIONS = new Set(['.wav', '.mp3', '.ogg', '.flac']);
const SCRIPT_EXTENSIONS = new Set(['.py', '.pyw']);
const MIME_TYPES = new Map([
  ['.glb', 'model/gltf-binary'], ['.gltf', 'model/gltf+json'], ['.fbx', 'application/octet-stream'],
  ['.obj', 'model/obj'], ['.usd', 'model/vnd.usd'], ['.usdz', 'model/vnd.usdz+zip'],
  ['.blend', 'application/x-blender'], ['.png', 'image/png'], ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'], ['.webp', 'image/webp'], ['.tif', 'image/tiff'],
  ['.tiff', 'image/tiff'], ['.bmp', 'image/bmp'], ['.hdr', 'image/vnd.radiance'],
  ['.exr', 'image/x-exr'], ['.wav', 'audio/wav'], ['.mp3', 'audio/mpeg'],
  ['.ogg', 'audio/ogg'], ['.flac', 'audio/flac'], ['.py', 'text/x-python'], ['.pyw', 'text/x-python'],
]);
const SIGNATURE_MESSAGES = new Map([
  ['.png', 'PNG'], ['.jpg', 'JPEG'], ['.jpeg', 'JPEG'], ['.webp', 'WebP'],
  ['.tif', 'TIFF'], ['.tiff', 'TIFF'], ['.bmp', 'BMP'], ['.glb', 'GLB'],
  ['.gltf', 'glTF JSON'], ['.fbx', 'FBX'], ['.obj', 'OBJ'], ['.usd', 'USD'],
  ['.usdz', 'USDZ'], ['.blend', 'Blender'], ['.hdr', 'Radiance HDR'],
  ['.exr', 'OpenEXR'], ['.wav', 'WAV'], ['.mp3', 'MP3'], ['.ogg', 'Ogg'],
  ['.flac', 'FLAC'], ['.py', 'Python source'], ['.pyw', 'Python source'],
]);
const SKIP_DIRECTORIES = new Set(['.git', 'node_modules', '__pycache__', '.pytest_cache', '.cache', 'cache']);

function fail(message) {
  throw new Error(message);
}

export function classifyIntakeFile(name) {
  const extension = path.extname(name).toLowerCase();
  if (MODEL_EXTENSIONS.has(extension)) return 'model';
  if (IMAGE_EXTENSIONS.has(extension)) return 'reference';
  if (HDRI_EXTENSIONS.has(extension)) return 'hdri';
  if (AUDIO_EXTENSIONS.has(extension)) return 'audio';
  if (SCRIPT_EXTENSIONS.has(extension)) return 'script';
  return null;
}

function safePart(value, fallback) {
  const text = String(value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 80);
  return text || fallback;
}

export function safeIntakeFileName(name, fallback = 'asset') {
  const extension = path.extname(name).toLowerCase();
  const stem = safePart(path.basename(name, path.extname(name)), fallback);
  return `${stem}${extension}`;
}

function hashFile(file) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  try {
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    let read;
    while ((read = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) hash.update(buffer.subarray(0, read));
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex');
}

function readPrefix(file, length = 4096) {
  const fd = fs.openSync(file, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const read = fs.readSync(fd, buffer, 0, length, 0);
    return buffer.subarray(0, read);
  } finally {
    fs.closeSync(fd);
  }
}

function startsWith(buffer, bytes) {
  return buffer.length >= bytes.length && bytes.every((byte, index) => buffer[index] === byte);
}

function textPrefix(buffer) {
  return buffer.toString('utf8').replace(/^\uFEFF/, '').trimStart();
}

function imageDimensions(buffer, extension) {
  if (extension === '.png' && buffer.length >= 24 && buffer.toString('ascii', 12, 16) === 'IHDR') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (['.jpg', '.jpeg'].includes(extension)) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      if (offset + 3 >= buffer.length) break;
      offset += 2 + buffer.readUInt16BE(offset + 2);
    }
  }
  if (extension === '.webp' && buffer.length >= 30 && buffer.toString('ascii', 12, 16) === 'VP8X') {
    return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 };
  }
  return { width: null, height: null };
}

function signatureMatches(buffer, extension) {
  switch (extension) {
    case '.png': return startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case '.jpg':
    case '.jpeg': return startsWith(buffer, [0xff, 0xd8, 0xff]);
    case '.webp': return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    case '.tif':
    case '.tiff': return startsWith(buffer, [0x49, 0x49, 0x2a, 0x00]) || startsWith(buffer, [0x4d, 0x4d, 0x00, 0x2a]);
    case '.bmp': return startsWith(buffer, [0x42, 0x4d]);
    case '.glb': return buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'glTF';
    case '.gltf': return textPrefix(buffer).startsWith('{');
    case '.fbx': return buffer.toString('ascii', 0, 21).startsWith('Kaydara FBX Binary') || textPrefix(buffer).startsWith('; FBX');
    case '.obj': return !buffer.includes(0);
    case '.usd': return buffer.length >= 8 && buffer.toString('ascii', 0, 8) === 'PXR-USDC' || textPrefix(buffer).startsWith('#usda');
    case '.usdz': return startsWith(buffer, [0x50, 0x4b]);
    case '.blend': return buffer.length >= 7 && buffer.toString('ascii', 0, 7) === 'BLENDER' || startsWith(buffer, [0x1f, 0x8b]);
    case '.hdr': return /^#\?(?:RADIANCE|RGBE)/.test(textPrefix(buffer));
    case '.exr': return startsWith(buffer, [0x76, 0x2f, 0x31, 0x01]);
    case '.wav': return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE';
    case '.mp3': return startsWith(buffer, [0x49, 0x44, 0x33]) || (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
    case '.ogg': return buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'OggS';
    case '.flac': return buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'fLaC';
    case '.py':
    case '.pyw': return !buffer.includes(0);
    default: return false;
  }
}

export function inspectIntakeFile(file, kind) {
  const extension = path.extname(file).toLowerCase();
  const buffer = readPrefix(file);
  if (!signatureMatches(buffer, extension)) {
    fail(`file signature does not match ${SIGNATURE_MESSAGES.get(extension) ?? extension}`);
  }
  const dimensions = kind === 'reference' || kind === 'hdri' ? imageDimensions(buffer, extension) : { width: null, height: null };
  return {
    mime: MIME_TYPES.get(extension) ?? 'application/octet-stream',
    width: dimensions.width,
    height: dimensions.height,
  };
}

function assertNotState(file, home) {
  if (home && path.resolve(file).toLowerCase().startsWith(path.resolve(home).toLowerCase() + path.sep)) {
    fail('source cannot be the harness state directory');
  }
}

function assertExplicitSource(file) {
  const parsed = path.parse(file);
  if (parsed.root && path.resolve(parsed.root) === path.resolve(file)) fail('source cannot be a volume root');
  if (file.split(path.sep).some((part) => part && (part === '.git' || part === 'node_modules'))) {
    fail('source cannot be inside .git or node_modules');
  }
}

function assertRegularFile(file) {
  const stat = fs.lstatSync(file);
  if (stat.isSymbolicLink()) fail(`symlink rejected: ${file}`);
  if (!stat.isFile()) fail(`not a regular file: ${file}`);
  return stat;
}

function walkDirectory(directory, depth, state, rejected) {
  if (depth > MAX_INTAKE_DEPTH) {
    rejected.push({ path: directory, reason: `folder depth exceeds ${MAX_INTAKE_DEPTH}` });
    return;
  }
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    rejected.push({ path: directory, reason: `cannot read folder: ${error.message}` });
    return;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      rejected.push({ path: full, reason: 'symlink rejected' });
      continue;
    }
    if (entry.isDirectory()) {
      if (SKIP_DIRECTORIES.has(entry.name)) continue;
      walkDirectory(full, depth + 1, state, rejected);
      continue;
    }
    addFile(full, state, rejected);
  }
}

function adjacentLicenseCandidates(file) {
  const directory = path.dirname(file);
  try {
    return fs.readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && (/^(LICENSE|LICENCE|COPYING|COPYRIGHT|ATTRIBUTION|README)(\.|$)/i.test(entry.name) || /\.(license|licence)$/i.test(entry.name)))
      .map((entry) => entry.name)
      .slice(0, 20);
  } catch {
    return [];
  }
}

function addFile(file, state, rejected) {
  if (state.files >= MAX_INTAKE_FILES) {
    rejected.push({ path: file, reason: `file count exceeds ${MAX_INTAKE_FILES}` });
    return;
  }
  let stat;
  try {
    stat = assertRegularFile(file);
  } catch (error) {
    rejected.push({ path: file, reason: error.message });
    return;
  }
  if (stat.size > MAX_INTAKE_FILE_BYTES) {
    rejected.push({ path: file, reason: `file exceeds ${MAX_INTAKE_FILE_BYTES} bytes` });
    return;
  }
  if (state.bytes + stat.size > MAX_INTAKE_TOTAL_BYTES) {
    rejected.push({ path: file, reason: `total intake exceeds ${MAX_INTAKE_TOTAL_BYTES} bytes` });
    return;
  }
  const kind = classifyIntakeFile(file);
  if (!kind) {
    rejected.push({ path: file, reason: 'unsupported file type' });
    return;
  }
  let metadata;
  try {
    metadata = inspectIntakeFile(file, kind);
  } catch (error) {
    rejected.push({ path: file, reason: error.message });
    return;
  }
  state.files += 1;
  state.bytes += stat.size;
  state.entries.push({
    sourcePath: file,
    name: path.basename(file),
    kind,
    bytes: stat.size,
    sha256: hashFile(file),
    licenseCandidates: adjacentLicenseCandidates(file),
    ...metadata,
  });
}

export function collectIntakeSources({ root, files = [], folders = [], home = null }) {
  if (!Array.isArray(files) || !Array.isArray(folders)) fail('files and folders must be arrays');
  const state = { files: 0, bytes: 0, entries: [] };
  const rejected = [];
  const add = (value) => {
    if (typeof value !== 'string' || !value.trim()) fail('intake paths must be non-empty strings');
    const full = path.resolve(root, value);
    assertNotState(full, home);
    assertExplicitSource(full);
    let stat;
    try {
      stat = fs.lstatSync(full);
    } catch (error) {
      rejected.push({ path: full, reason: `missing source: ${error.message}` });
      return;
    }
    if (stat.isSymbolicLink()) {
      rejected.push({ path: full, reason: 'symlink rejected' });
      return;
    }
    if (stat.isDirectory()) {
      walkDirectory(full, 0, state, rejected);
      return;
    }
    addFile(full, state, rejected);
  };
  for (const file of files) add(file);
  for (const folder of folders) add(folder);
  return { entries: state.entries, rejected, bytes: state.bytes };
}

function sourceOptions(source) {
  if (source === undefined || source === null) return {};
  if (typeof source !== 'object' || Array.isArray(source)) fail('source must be an object');
  const allowed = ['name', 'asset', 'url', 'vendor', 'author', 'license', 'licenseText', 'licenseFile', 'attribution', 'redistributable', 'external', 'packaging', 'notes', 'licenseUrl'];
  for (const key of Object.keys(source)) if (!allowed.includes(key)) fail(`source has unsupported field: ${key}`);
  for (const key of ['name', 'asset', 'url', 'vendor', 'author', 'license', 'licenseText', 'licenseFile', 'attribution', 'packaging', 'notes', 'licenseUrl']) {
    if (source[key] !== undefined && typeof source[key] !== 'string') fail(`source.${key} must be a string`);
  }
  if (source.external !== undefined && typeof source.external !== 'boolean') fail('source.external must be a boolean');
  if (source.redistributable !== undefined && typeof source.redistributable !== 'boolean') fail('source.redistributable must be a boolean');
  return source;
}

function generatedOptions(generated) {
  if (generated === undefined || generated === null) return null;
  if (typeof generated !== 'object' || Array.isArray(generated)) fail('generated must be an object');
  const allowed = ['tool', 'model', 'prompt', 'seed', 'width', 'height', 'c2pa'];
  for (const key of Object.keys(generated)) if (!allowed.includes(key)) fail(`generated has unsupported field: ${key}`);
  for (const key of ['tool', 'model', 'prompt', 'seed']) {
    if (generated[key] !== undefined && typeof generated[key] !== 'string') fail(`generated.${key} must be a string`);
  }
  for (const key of ['width', 'height']) {
    if (generated[key] !== undefined && (!Number.isInteger(generated[key]) || generated[key] < 1 || generated[key] > 100000)) {
      fail(`generated.${key} must be a positive integer`);
    }
  }
  if (generated.c2pa !== undefined && typeof generated.c2pa !== 'boolean') fail('generated.c2pa must be a boolean');
  return generated;
}

export function licenseTextFor(source) {
  if (!source) return null;
  if (source.licenseText && source.licenseText.trim()) {
    if (source.licenseText.length > 1_000_000) fail('source.licenseText is too large');
    return source.licenseText.replace(/\r\n?/g, '\n');
  }
  if (source.licenseFile) {
    const file = path.resolve(source.licenseFile);
    const stat = assertRegularFile(file);
    if (stat.size > 1_000_000) fail('source.licenseFile is too large');
    return fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n');
  }
  return null;
}

function externalFor(kind, source) {
  if (kind === 'script') return false;
  if (source?.external !== undefined) return source.external;
  if (source?.url || source?.license) return true;
  return kind === 'model';
}

export function validateIntakeOptions({ kind = 'auto', source, generated } = {}) {
  const allowedKinds = new Set(['auto', 'model', 'reference', 'texture', 'hdri', 'audio', 'script']);
  if (!allowedKinds.has(kind)) fail(`kind must be one of ${[...allowedKinds].join(', ')}`);
  const normalizedSource = sourceOptions(source);
  const normalizedGenerated = generatedOptions(generated);
  const external = kind === 'auto' || normalizedGenerated ? false : externalFor(kind, normalizedSource);
  const licenseText = licenseTextFor(normalizedSource);
  return { kind, source: normalizedSource, generated: normalizedGenerated, external, licenseText };
}

export function intakeDestination({ kind, entry, source = {}, generated = null }) {
  const extension = path.extname(entry.name).toLowerCase();
  const hash = entry.sha256.slice(0, 8);
  if (kind === 'script') return `scripts/${safeIntakeFileName(entry.name, 'script')}`;
  const external = generated ? false : externalFor(kind, source);
  const vendor = safePart(source.vendor || source.author || 'local', 'local');
  const asset = safePart(source.name || source.asset || path.basename(entry.name, path.extname(entry.name)), 'asset');
  if (kind === 'reference') {
    if (external) return `Documents/References/${vendor}/${asset}-${hash}/${safeIntakeFileName(entry.name, 'reference')}`;
    const stem = safePart(path.basename(entry.name, path.extname(entry.name)), 'reference');
    return `Documents/References/${stem}-${hash}${extension}`;
  }
  if (external) return `assets/external/${vendor}/${asset}/${safeIntakeFileName(entry.name, 'asset')}`;
  const directory = { model: 'assets/models', texture: 'assets/textures', hdri: 'assets/hdri', audio: 'assets/audio' }[kind];
  if (!directory) fail(`cannot choose a destination for ${kind}`);
  return `${directory}/${safeIntakeFileName(entry.name, 'asset')}`;
}

export function planIntake({ root, projectName, files = [], folders = [], kind = 'auto', source, generated, home = null }) {
  const options = validateIntakeOptions({ kind, source, generated });
  const collected = collectIntakeSources({ root, files, folders, home });
  const entries = [];
  const rejected = [...collected.rejected];
  for (const entry of collected.entries) {
    const selected = options.kind === 'auto' ? entry.kind : options.kind;
    if (entry.kind !== selected && !(selected === 'texture' && (entry.kind === 'reference' || entry.kind === 'hdri'))) {
      rejected.push({ path: entry.sourcePath, reason: `file type ${entry.kind} is not ${selected}` });
      continue;
    }
    if (selected === 'script' && !SCRIPT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      rejected.push({ path: entry.sourcePath, reason: 'scripts must be .py or .pyw' });
      continue;
    }
    const external = options.generated ? false : externalFor(selected, options.source);
    if (external && !options.source.license) {
      rejected.push({ path: entry.sourcePath, reason: 'external asset requires source.license' });
      continue;
    }
    if (external && !options.licenseText) {
      rejected.push({ path: entry.sourcePath, reason: 'external asset requires source.licenseText or source.licenseFile' });
      continue;
    }
    entries.push({
      ...entry,
      kind: selected,
      destination: intakeDestination({ kind: selected, entry, source: options.source, generated: options.generated }),
      external,
    });
  }
  return { projectName, entries, rejected, source: options.source, generated: options.generated, external: options.external, licenseText: options.licenseText };
}

export function copyIntake({ projectRoot, plan, licenseText = null }) {
  const copied = [];
  const duplicates = [];
  const rejected = [...plan.rejected];
  for (const entry of plan.entries) {
    const target = path.join(projectRoot, ...entry.destination.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    let final = target;
    if (fs.existsSync(final)) {
      const existing = hashFile(final);
      if (existing === entry.sha256) {
        duplicates.push({ ...entry, stored: entry.destination, reason: 'same content already exists' });
        continue;
      }
      const extension = path.extname(final);
      const stem = final.slice(0, -extension.length);
      let index = 2;
      while (fs.existsSync(`${stem}-${index}${extension}`)) index += 1;
      final = `${stem}-${index}${extension}`;
    }
    fs.copyFileSync(entry.sourcePath, final, fs.constants.COPYFILE_EXCL);
    if (hashFile(final) !== entry.sha256) {
      fs.rmSync(final, { force: true });
      fail(`copied file hash mismatch: ${entry.sourcePath}`);
    }
    const stored = path.relative(projectRoot, final).replaceAll('\\', '/');
    if (entry.external) {
      if (!licenseText) {
        fs.rmSync(final, { force: true });
        rejected.push({ path: entry.sourcePath, reason: 'external asset requires licence text' });
        continue;
      }
      fs.writeFileSync(path.join(path.dirname(final), 'LICENSE.txt'), licenseText, 'utf8');
    }
    copied.push({ ...entry, stored, target: final });
  }
  return { copied, duplicates, rejected };
}

const cell = (value) => String(value ?? '').replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ').slice(0, 300);

function insertTableRow(content, header, row, placeholder) {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const headerIndex = lines.findIndex((line) => line.trim() === header);
  if (headerIndex < 0) {
    const rules = lines.findIndex((line) => /^##\s+Rules\s*$/.test(line));
    const insert = rules >= 0 ? rules : lines.length;
    lines.splice(insert, 0, header, header.replace(/[^|]+/g, (value) => value.trim() ? '---' : value), row, '');
    return lines.join('\n');
  }
  let end = headerIndex + 2;
  while (end < lines.length && lines[end].trim().startsWith('|')) end += 1;
  const placeholderIndex = lines.findIndex((line, index) => index > headerIndex && index < end && line.trim() === placeholder);
  if (placeholderIndex >= 0) lines[placeholderIndex] = row;
  else lines.splice(end, 0, row);
  return lines.join('\n');
}

export function appendAssetRow(content, row) {
  const header = '| Asset ID | Asset | Type | Source URL | Author / vendor | Licence | Local path | Packaging | Redistributable | SHA-256 | Preview | Used in | Notes |';
  const placeholder = '| — | None yet | — | — | — | — | — | — | — | — | — | — | — |';
  const line = `| ${cell(row.assetId || row.sha256?.slice(0, 12) || '—')} | ${cell(row.asset)} | ${cell(row.type)} | ${cell(row.sourceUrl)} | ${cell(row.author)} | ${cell(row.license)} | ${cell(row.localPath)} | ${cell(row.packaging)} | ${cell(row.redistributable)} | ${cell(row.sha256)} | ${cell(row.preview)} | ${cell(row.usedIn)} | ${cell(row.notes)} |`;
  if (content.includes(`| ${cell(row.localPath)} |`)) return content;
  return insertTableRow(content, header, line, placeholder);
}

export function appendReferenceRow(content, row) {
  const header = '| Reference | Source | What it informs | Notes |';
  const placeholder = '| — | — | — | — |';
  const line = `| ${cell(row.reference)} | ${cell(row.source)} | ${cell(row.informs)} | ${cell(row.notes)} |`;
  if (content.includes(`| ${cell(row.reference)} |`)) return content;
  return insertTableRow(content, header, line, placeholder);
}

export function appendIntakeRow(content, row) {
  const header = '| Time | Kind | Original | Stored | Bytes | MIME | Dimensions | SHA-256 | Source | Licence | Status |';
  const dimensions = row.width && row.height ? `${row.width}x${row.height}` : '';
  const line = `| ${cell(row.time)} | ${cell(row.kind)} | ${cell(row.original)} | ${cell(row.stored)} | ${cell(row.bytes)} | ${cell(row.mime)} | ${cell(dimensions)} | ${cell(row.sha256)} | ${cell(row.source)} | ${cell(row.license)} | ${cell(row.status)} |`;
  if (content.includes(`| ${cell(row.stored)} |`)) return content;
  return insertTableRow(content, header, line, null);
}

export function createIntakeDocument(projectName) {
  return [
    `# Intake — ${projectName}`,
    '',
    'Harness-owned record of files supplied by the user. Original files are never moved or deleted.',
    '',
    '## Intake',
    '',
    '| Time | Kind | Original | Stored | Bytes | MIME | Dimensions | SHA-256 | Source | Licence | Status |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    '',
  ].join('\n');
}

export function sourceDocument({ entry, source = {}, license = '', generated = null }) {
  const generatedFields = generated
    ? [
      `- Generated by: ${generated.tool || '—'}`,
      `- Model: ${generated.model || '—'}`,
      `- Prompt: ${generated.prompt || '—'}`,
      `- Seed: ${generated.seed || '—'}`,
      `- Dimensions: ${generated.width || '—'} × ${generated.height || '—'}`,
      `- C2PA present: ${generated.c2pa ? 'yes' : 'unknown'}`,
    ]
    : [];
  return [
    '# Asset Source',
    '',
    `- Asset: ${source.name || entry.name}`,
    `- Original filename: ${entry.name}`,
    `- Source URL: ${source.url || '—'}`,
    `- Author / vendor: ${source.author || source.vendor || '—'}`,
    `- Licence: ${source.license || license || '—'}`,
    `- Licence source URL: ${source.licenseUrl || '—'}`,
    '- Verbatim licence copy: LICENSE.txt (required; preserve original licence files too)',
    `- Attribution required: ${source.attribution || '—'}`,
    `- Redistribution allowed: ${source.redistributable === undefined ? '—' : source.redistributable ? 'yes' : 'no'}`,
    `- Licence status: ${source.license ? 'provided' : entry.licenseCandidates?.length ? 'candidates only; not accepted' : 'missing'}`,
    `- Adjacent licence candidates: ${entry.licenseCandidates?.length ? entry.licenseCandidates.join(', ') : '—'}`,
    '- Licence candidate policy: candidates are evidence only; verify and provide the accepted licence text',
    `- Packaging in .blend: ${source.packaging || 'none'}`,
    `- Local path: ${entry.stored}`,
    `- Bytes: ${entry.bytes}`,
    `- MIME type: ${entry.mime || '—'}`,
    `- Dimensions: ${entry.width && entry.height ? `${entry.width} × ${entry.height}` : '—'}`,
    '- Imported into: —',
    '- Modifications: none',
    '- Original asset / derivative relationship: original',
    `- Acquisition instructions and file hashes: ${entry.sha256}`,
    `- Date: ${new Date().toISOString().slice(0, 10)}`,
    `- Notes: ${source.notes || '—'}`,
    ...generatedFields,
    '',
  ].join('\n');
}

export function referenceSourceDocument({ entry, source = {}, generated = null }) {
  return [
    `# Reference — ${source.name || entry.name}`,
    '',
    `- Original filename: ${entry.name}`,
    `- Stored: ${entry.stored}`,
    `- Bytes: ${entry.bytes}`,
    `- MIME type: ${entry.mime || '—'}`,
    `- Dimensions: ${entry.width && entry.height ? `${entry.width} × ${entry.height}` : '—'}`,
    `- Source: ${source.url || source.author || 'user-supplied'}`,
    `- Licence: ${source.license || 'project-owned or user-supplied'}`,
    `- Informs: ${source.notes || 'visual direction'}`,
    ...(generated ? [
      `- Generated by: ${generated.tool || '—'}`,
      `- Model: ${generated.model || '—'}`,
      `- Prompt: ${generated.prompt || '—'}`,
      `- Seed: ${generated.seed || '—'}`,
      `- Dimensions: ${generated.width || '—'} × ${generated.height || '—'}`,
      `- C2PA present: ${generated.c2pa ? 'yes' : 'unknown'}`,
    ] : []),
    '',
  ].join('\n');
}
