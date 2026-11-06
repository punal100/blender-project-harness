import fs from 'node:fs';
import { configPath } from './workspace.mjs';

export const TOOL_MODES = ['lite', 'smart', 'full', 'readonly', 'unsafe'];
export const CORE_TOOLS = ['get_addon_status', 'get_scene_info', 'look', 'get_guide', 'search_assets', 'disable_telemetry', 'record_trajectory_feedback'];
export const UNSAFE_TOOLS = new Set(['execute_blender_code', 'generate_3d', 'import_asset']);
const ROLES = new Set(['orchestrator', 'worker', 'grader']);
export const DEFAULT_TOOL_EXPOSURE = {
  role: 'orchestrator',
  mode: 'smart',
  maxExposed: 12,
  maxSchemaTokens: 6000,
  searchTopK: 5,
  listChanged: true,
  unsafe: { enabled: false, sessions: [] },
};

function roleName(value) {
  return typeof value === 'string' && ROLES.has(value.toLowerCase()) ? value.toLowerCase() : null;
}

function roleProfile(raw, role) {
  const roles = raw.roles;
  if (!roles || typeof roles !== 'object' || Array.isArray(roles)) return {};
  const selected = roles[role];
  return selected && typeof selected === 'object' && !Array.isArray(selected) ? selected : {};
}

export function readToolExposure(root = process.cwd(), role = process.env.BLENDER_ROLE ?? null) {
  let config = {};
  try {
    const file = configPath(root);
    if (fs.existsSync(file)) config = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    config = {};
  }
  const raw = config.tool_exposure ?? {};
  const selectedRole = roleName(role) ?? roleName(raw.active_role) ?? DEFAULT_TOOL_EXPOSURE.role;
  const profile = { ...raw, ...roleProfile(raw, selectedRole) };
  const mode = TOOL_MODES.includes(profile.mode) ? profile.mode : DEFAULT_TOOL_EXPOSURE.mode;
  const maxExposed = Number.isInteger(profile.max_exposed) && profile.max_exposed > 0 && profile.max_exposed <= 100 ? profile.max_exposed : DEFAULT_TOOL_EXPOSURE.maxExposed;
  const maxSchemaTokens = Number.isInteger(profile.max_schema_tokens) && profile.max_schema_tokens >= 1000 && profile.max_schema_tokens <= 100000 ? profile.max_schema_tokens : DEFAULT_TOOL_EXPOSURE.maxSchemaTokens;
  const searchTopK = Number.isInteger(profile.search_top_k) && profile.search_top_k > 0 && profile.search_top_k <= 20 ? profile.search_top_k : DEFAULT_TOOL_EXPOSURE.searchTopK;
  return {
    role: selectedRole,
    mode,
    maxExposed,
    maxSchemaTokens,
    searchTopK,
    listChanged: profile.list_changed !== false,
    allow: Array.isArray(profile.allow) ? profile.allow.filter((name) => typeof name === 'string') : [],
    deny: Array.isArray(profile.deny) ? profile.deny.filter((name) => typeof name === 'string') : [],
    unsafe: {
      enabled: raw.unsafe?.enabled === true,
      sessions: Array.isArray(raw.unsafe?.sessions) ? raw.unsafe.sessions.filter((session) => typeof session === 'string') : [],
    },
  };
}

export function toolExposureSummary(root = process.cwd(), role = process.env.BLENDER_ROLE ?? null) {
  const exposure = readToolExposure(root, role);
  return {
    role: exposure.role,
    mode: exposure.mode,
    maxExposed: exposure.maxExposed,
    maxSchemaTokens: exposure.maxSchemaTokens,
    searchTopK: exposure.searchTopK,
    listChanged: exposure.listChanged,
    unsafeEnabled: exposure.unsafe.enabled,
    unsafeSessions: exposure.unsafe.sessions.length,
    modes: [...TOOL_MODES],
  };
}

export function unsafeSessionAllowed(exposure, session) {
  return exposure?.mode === 'unsafe'
    && exposure.unsafe?.enabled === true
    && typeof session === 'string'
    && exposure.unsafe.sessions.includes(session);
}

export function toolAllowed(exposure, name) {
  if (!name) return false;
  if (UNSAFE_TOOLS.has(name)) {
    if (exposure.mode !== 'unsafe') return false;
    if (!exposure.unsafe.enabled) return false;
  }
  if (exposure.deny.includes(name)) return false;
  if (exposure.allow.length && !exposure.allow.includes(name)) return false;
  return true;
}

export function toolTokens(tool) {
  return Math.ceil(JSON.stringify(tool ?? {}).length / 4);
}
