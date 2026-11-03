import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { classifyIntakeFile, safeIntakeFileName } from './intake.mjs';

export const MAX_DOWNLOAD_BYTES = 512 * 1024 * 1024;
const MAX_REDIRECTS = 5;

function fail(message) {
  throw new Error(message);
}

function privateHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host === '::1' || host === '0.0.0.0') return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true;
  const match = /^172\.(\d+)\./.exec(host);
  if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31) return true;
  return false;
}

export function validateDownloadUrl(value) {
  let url;
  try { url = new URL(value); } catch { fail('download URL is invalid'); }
  if (url.protocol !== 'https:') fail('download URL must use HTTPS');
  if (url.username || url.password) fail('download URL cannot contain credentials');
  if (privateHost(url.hostname)) fail('download URL cannot target a private or local host');
  return url;
}

export function downloadFileName(url, filename) {
  let name = filename;
  if (!name) {
    const pathname = new URL(url).pathname;
    name = decodeURIComponent(pathname.split('/').filter(Boolean).at(-1) ?? 'download');
  }
  if (!classifyIntakeFile(name)) fail('download filename must be a supported asset, reference, script, or image type');
  return safeIntakeFileName(name, 'download');
}

function headerFileName(header) {
  if (!header) return null;
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(header);
  return match ? decodeURIComponent(match[1].replace(/"/g, '')) : null;
}

function stageDirectory(root, project) {
  const key = String(project ?? 'workspace').replace(/[^A-Za-z0-9._-]+/g, '-').slice(0, 80) || 'workspace';
  return path.join(root, '.temp', 'Intake', key, `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`);
}

export async function downloadToStaging({ root, project, url, filename, maxBytes = MAX_DOWNLOAD_BYTES } = {}) {
  const current = validateDownloadUrl(url);
  if (!Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_DOWNLOAD_BYTES) fail(`maxBytes must be between 1 and ${MAX_DOWNLOAD_BYTES}`);
  let response;
  let target = current;
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    response = await fetch(target, {
      redirect: 'manual',
      signal: AbortSignal.timeout(120_000),
      headers: { 'user-agent': 'blender-workflow-harness/1.0' },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) fail('download redirect has no location');
      target = validateDownloadUrl(new URL(location, target).toString());
      continue;
    }
    break;
  }
  if (!response || response.status < 200 || response.status >= 300) fail(`download failed with status ${response?.status ?? 'unknown'}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (/^text\/html\b/i.test(contentType) || /^application\/json\b/i.test(contentType)) fail('download returned a document, not an asset');
  const length = Number(response.headers.get('content-length') ?? 0);
  if (Number.isFinite(length) && length > maxBytes) fail(`download exceeds maxBytes (${length} > ${maxBytes})`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > maxBytes) fail(`download exceeds maxBytes (${buffer.byteLength} > ${maxBytes})`);
  const chosen = downloadFileName(target.toString(), filename ?? headerFileName(response.headers.get('content-disposition')));
  const directory = stageDirectory(root, project);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const file = path.join(directory, chosen);
  fs.writeFileSync(file, buffer, { mode: 0o600 });
  return {
    project: project ?? null,
    url: target.toString(),
    path: file,
    relative: path.relative(root, file).replaceAll('\\', '/'),
    filename: chosen,
    bytes: buffer.byteLength,
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    contentType,
    next: 'Call blender_workflow intake with this path and a source/licence record; download alone does not import or execute.',
  };
}
