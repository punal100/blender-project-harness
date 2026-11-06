import fs from 'node:fs';
import { configPath } from './workspace.mjs';

export const TOOL_MODES = ['lite', 'smart', 'full', 'readonly', 'unsafe'];
export const DEFAULT_TOOL_EXPOSURE = {
  mode: 'smart',
  maxExposed: 12,
  maxSchemaTokens: 6000,
  searchTopK: 5,
  listChanged: true,
  unsafe: { enabled: false, sessions: [] },
};
const UNSAFE_TOOLS = new Set(['execute_blender_code', 'generate_3d', 'import_asset']);

export function readToolExposure(root = process.cwd()) {
  let config = {};
  try {
    const file = configPath(root);
    if (fs.existsSync(file)) config = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    config = {};
  }
  const raw = config.tool_exposure ?? {};
  const mode = TOOL_MODES.includes(raw.mode) ? raw.mode : DEFAULT_TOOL_EXPOSURE.mode;
  const maxExposed = Number.isInteger(raw.max_exposed) && raw.max_exposed > 0 && raw.max_exposed <= 100 ? raw.max_exposed : DEFAULT_TOOL_EXPOSURE.maxExposed;
  const maxSchemaTokens = Number.isInteger(raw.max_schema_tokens) && raw.max_schema_tokens >= 1000 && raw.max_schema_tokens <= 100000 ? raw.max_schema_tokens : DEFAULT_TOOL_EXPOSURE.maxSchemaTokens;
  const searchTopK = Number.isInteger(raw.search_top_k) && raw.search_top_k > 0 && raw.search_top_k <= 20 ? raw.search_top_k : DEFAULT_TOOL_EXPOSURE.searchTopK;
  return {
    mode,
    maxExposed,
    maxSchemaTokens,
    searchTopK,
    listChanged: raw.list_changed !== false,
    allow: Array.isArray(raw.allow) ? raw.allow.filter((name) => typeof name === 'string') : [],
    deny: Array.isArray(raw.deny) ? raw.deny.filter((name) => typeof name === 'string') : [],
    unsafe: {
      enabled: raw.unsafe?.enabled === true,
      sessions: Array.isArray(raw.unsafe?.sessions) ? raw.unsafe.sessions.filter((session) => typeof session === 'string') : [],
    },
  };
}

export function toolExposureSummary(root = process.cwd()) {
  const exposure = readToolExposure(root);
  return {
    mode: exposure.mode,
    maxExposed: exposure.maxExposed,
    maxSchemaTokens: exposure.maxSchemaTokens,
    searchTopK: exposure.searchTopK,
    listChanged: exposure.listChanged,
    unsafeEnabled: exposure.unsafe.enabled,
    modes: [...TOOL_MODES],
  };
}

export function toolAllowed(exposure, name) {
  if (!name) return false;
  if (UNSAFE_TOOLS.has(name) && exposure.mode !== 'unsafe') return false;
  if (UNSAFE_TOOLS.has(name) && exposure.mode === 'unsafe' && !exposure.unsafe.enabled) return false;
  if (exposure.mode !== 'unsafe' && exposure.deny.includes(name)) return false;
  if (exposure.mode === 'unsafe' && exposure.deny.includes(name)) return false;
  if (exposure.allow.length && !exposure.allow.includes(name)) return false;
  return true;
}

export function toolTokens(tool) {
  return Math.ceil(JSON.stringify(tool ?? {}).length / 4);
}
