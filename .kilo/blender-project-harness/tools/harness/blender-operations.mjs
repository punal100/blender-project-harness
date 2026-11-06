const OPERATION_NAMES = new Set([
  'create_mesh',
  'create_scene',
  'switch_scene',
  'delete_scene',
  'duplicate_scene',
  'set_scene_camera',
  'scene_strip',
  'text',
  'modifier',
  'transform',
  'material',
  'shared_material',
  'duplicate',
  'create_light',
  'create_camera',
  'set_camera',
  'render_settings',
  'delete_object',
  'import_asset',
  'link_library',
  'import_audio',
  'image_reference',
  'image_texture',
  'world_hdri',
  'check_assets',
  'pack_assets',
  'export_scene',
]);

const PRIMITIVES = new Set(['cube', 'uv_sphere', 'plane', 'cylinder']);
const SCENE_MODES = new Set(['NEW', 'EMPTY', 'LINK_COPY', 'FULL_COPY']);
const SCENE_OPERATIONS = new Set(['create_mesh', 'text', 'modifier', 'transform', 'material', 'shared_material', 'duplicate', 'create_light', 'create_camera', 'set_camera', 'render_settings', 'delete_object', 'import_asset', 'link_library', 'import_audio', 'image_reference', 'image_texture', 'world_hdri', 'export_scene', 'set_scene_camera', 'scene_strip']);
const LIGHT_KINDS = new Set(['POINT', 'AREA', 'SUN', 'SPOT']);
const MODIFIER_KINDS = new Set(['BEVEL', 'SUBSURF', 'SOLIDIFY', 'MIRROR', 'ARRAY']);
export const OPERATION_LIMITS = {
  boundary: 'The reviewed operation layer is the limit; Blender and the MCP addon can do more, but raw Python remains blocked unless the explicit unsafe mode and a development session are enabled.',
  modifiers: { supported: [...MODIFIER_KINDS], unsupported: ['BOOLEAN'], workaround: 'Build openings from wall segments or separate mesh pieces, or use explicit unsafe mode.' },
  material: { supported: ['color', 'roughness', 'metallic', 'emission'], unsupported: ['transmission', 'ior', 'alpha'], workaround: 'Use a tinted plane or explicit unsafe mode for glass/transmission.' },
  createLight: { supported: ['name', 'kind', 'location', 'energy', 'color', 'temperature'], unsupported: ['rotation', 'size'], workaround: 'Create the light, then use transform for rotation; exact AREA size requires explicit unsafe mode.' },
  createMesh: { primitives: [...PRIMITIVES], semantics: 'Base cube is 2x2x2; final size = base size * scale. For a 1m cube use scale 0.5.', unsupported: ['size', 'dimensions'], workaround: 'Use scale = dimension/2 for a cube, or explicit unsafe mode for arbitrary mesh data.' },
};
const TEXT_ALIGN_X = new Set(['LEFT', 'CENTER', 'RIGHT', 'JUSTIFY', 'FLUSH']);
const TEXT_ALIGN_Y = new Set(['TOP', 'TOP_BASELINE', 'CENTER', 'BOTTOM_BASELINE', 'BOTTOM']);
const NAME_RE = /^[\x20-\x7e]+(?![\s\S])/;
const MAX_BATCH = 10;
const MODEL_EXTENSIONS = new Set(['.glb', '.gltf', '.fbx', '.obj', '.usd', '.usdz', '.blend']);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff', '.bmp']);
const HDRI_EXTENSIONS = new Set(['.hdr', '.exr']);
const AUDIO_EXTENSIONS = new Set(['.wav', '.mp3', '.ogg', '.flac']);
const EXPORT_EXTENSIONS = new Map([['glb', '.glb'], ['gltf', '.gltf'], ['fbx', '.fbx'], ['usd', '.usd'], ['obj', '.obj']]);

function fail(message) {
  throw new TypeError(message);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function strictObject(value, keys, label) {
  if (!isPlainObject(value)) fail(`${label} must be an object`);
  const allowed = new Set([...keys, 'scene']);
  for (const key of Reflect.ownKeys(value)) {
    if (!allowed.has(key)) fail(`${label} has extra key: ${String(key)}`);
  }
  for (const key in value) {
    if (!Object.hasOwn(value, key)) fail(`${label} has inherited key: ${key}`);
  }
}

function requireKeys(value, keys, label) {
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) fail(`${label}.${key} is required`);
  }
}

function validateString(value, label) {
  if (typeof value !== 'string' || value.length > 100 || !NAME_RE.test(value) || value.trim().length === 0) {
    fail(`${label} must be a non-blank printable ASCII string of at most 100 characters`);
  }
  return value;
}

function validateText(value, label) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 1000 || value.includes('\0')) {
    fail(`${label} must be a non-empty string of at most 1000 characters`);
  }
  return value;
}

function validateFiniteNumber(value, label, minimum = -Infinity, maximum = Infinity, positive = false) {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(`${label} must be finite`);
  if (value < minimum || value > maximum || (positive && value <= 0)) {
    fail(`${label} is out of bounds`);
  }
  return value;
}

function validateVector(value, label, length, minimum = -1e6, maximum = 1e6) {
  if (!Array.isArray(value) || value.length !== length) fail(`${label} must be an array of ${length} numbers`);
  return Array.from(value, (item, index) => validateFiniteNumber(item, `${label}[${index}]`, minimum, maximum));
}

function validateAllowedObjects(allowedObjects) {
  if (!Array.isArray(allowedObjects)) fail('allowedObjects must be an array');
  const names = allowedObjects.map((name, index) => validateString(name, `allowedObjects[${index}]`));
  if (new Set(names).size !== names.length) fail('allowedObjects must not contain duplicates');
  return names;
}

function validateAllowedName(name, allowed, label = 'name') {
  validateString(name, label);
  if (!allowed.includes(name)) fail(`${label} is not allowed: ${name}`);
}

function validateBoolean(value, label) {
  if (typeof value !== 'boolean') fail(`${label} must be a boolean`);
  return value;
}

function validateProjectRelativePath(value, label, directories, extensions) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 300 || value.includes('\0')) {
    fail(`${label} must be a non-empty project-relative path`);
  }
  if (value.startsWith('/') || value.startsWith('\\') || /^[A-Za-z]:/.test(value) || value.includes('\\')) {
    fail(`${label} must be a relative forward-slash project path`);
  }
  const segments = value.split('/');
  if (segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..')) {
    fail(`${label} must stay within the project`);
  }
  if (!directories.some((directory) => value.startsWith(`${directory}/`) && value.length > directory.length + 1)) {
    fail(`${label} must be under ${directories.join(', ')}`);
  }
  const dot = value.lastIndexOf('.');
  const extension = dot < 0 ? '' : value.slice(dot).toLowerCase();
  if (!extensions.has(extension)) fail(`${label} has an unsupported extension`);
  return value;
}

function validateOptionalTransform(operation, kind) {
  if (Object.hasOwn(operation, 'location')) validateVector(operation.location, `${kind}.location`, 3);
  if (Object.hasOwn(operation, 'rotation')) validateVector(operation.rotation, `${kind}.rotation`, 3);
  if (Object.hasOwn(operation, 'scale')) {
    validateVector(operation.scale, `${kind}.scale`, 3, 0, 1e4);
    if (operation.scale.some((value) => value === 0)) fail(`${kind}.scale values must be positive`);
  }
}

function validateImagePath(operation, label, directories, extensions = IMAGE_EXTENSIONS) {
  return validateProjectRelativePath(operation.path, label, directories, extensions);
}

function validateEmission(value, label) {
  if (value === undefined) return;
  if (!isPlainObject(value)) fail(`${label} must be an object`);
  strictObject(value, ['color', 'strength'], label);
  requireKeys(value, ['color', 'strength'], label);
  validateVector(value.color, `${label}.color`, 4, 0, 1);
  validateFiniteNumber(value.strength, `${label}.strength`, 0, 1e6);
}

function validateMaterialValues(operation, kind) {
  validateVector(operation.color, `${kind}.color`, 4, 0, 1);
  validateFiniteNumber(operation.roughness, `${kind}.roughness`, 0, 1);
  validateFiniteNumber(operation.metallic, `${kind}.metallic`, 0, 1);
  validateEmission(operation.emission, `${kind}.emission`);
}

function quote(value) {
  return JSON.stringify(value);
}

function jsonReceipt(operation, name = null) {
  const operationLiteral = JSON.stringify(operation);
  const nameLiteral = name === null ? 'None' : JSON.stringify(name);
  return `print("HARNESS_JSON:" + json.dumps({"ok": True, "operation": ${operationLiteral}, "name": ${nameLiteral}}, separators=(",", ":")))`;
}

function script(body, imports = 'import bpy\nimport json\nimport os\n') {
  return `${imports}\ntry:\n${body.split('\n').map((line) => `    ${line}`).join('\n')}\nexcept Exception as exc:\n    print("HARNESS_JSON:" + json.dumps({"ok": False, "error": str(exc)}, separators=(",", ":")))\n    raise\n`;
}

function hasScene(operation) {
  return Object.hasOwn(operation, 'scene');
}

function sceneSetup(operation) {
  if (!hasScene(operation)) return 'target_scene = bpy.context.scene';
  return `target_scene = bpy.data.scenes.get(${quote(operation.scene)})\nif target_scene is None:\n    raise RuntimeError("scene not found")`;
}

function sceneLink(operation, variable) {
  return hasScene(operation)
    ? `target_scene.collection.objects.link(${variable})`
    : `bpy.context.collection.objects.link(${variable})`;
}

function sceneObjectGuard(operation, variable = 'obj') {
  if (!hasScene(operation)) return '';
  return `${sceneSetup(operation)}\nif target_scene.objects.get(${variable}.name) is not ${variable}:\n    raise RuntimeError("object does not belong to the target scene")`;
}

function activeSceneExpression() {
  return 'bpy.context.window.scene if bpy.context.window is not None else bpy.context.scene';
}

function objectLookup(name) {
  return `obj = bpy.data.objects.get(${quote(name)})\nif obj is None:\n    raise RuntimeError("object not found")`;
}

function objectModeGuard() {
  return `if bpy.context.mode != 'OBJECT':\n    raise RuntimeError("operation requires Object Mode")`;
}

function enumValues(rnaType, propertyName) {
  return `enum_prop = ${rnaType}.bl_rna.properties[${quote(propertyName)}]\nvalid_values = {item.identifier for item in enum_prop.enum_items}`;
}

function validateOperation(operation, allowedObjects) {
  const allowed = validateAllowedObjects(allowedObjects);
  if (!isPlainObject(operation)) fail('operation must be an object');
  requireKeys(operation, ['operation'], 'operation');
  const kind = validateString(operation.operation, 'operation.operation');
  if (!OPERATION_NAMES.has(kind)) fail(`unsupported operation: ${kind}`);

  switch (kind) {
    case 'create_scene': {
      strictObject(operation, ['operation', 'name', 'mode', 'source', 'activate'], kind);
      requireKeys(operation, ['name', 'mode'], kind);
      validateString(operation.name, `${kind}.name`);
      validateString(operation.mode, `${kind}.mode`);
      if (!SCENE_MODES.has(operation.mode)) fail(`${kind}.mode is invalid`);
      if (operation.mode !== 'NEW') {
        requireKeys(operation, ['source'], kind);
        validateString(operation.source, `${kind}.source`);
        if (operation.source === operation.name) fail(`${kind}.source and name must differ`);
      } else if (Object.hasOwn(operation, 'source')) {
        fail(`${kind}.source is not accepted with NEW`);
      }
      if (Object.hasOwn(operation, 'activate')) validateBoolean(operation.activate, `${kind}.activate`);
      break;
    }
    case 'switch_scene': {
      strictObject(operation, ['operation', 'name'], kind);
      requireKeys(operation, ['name'], kind);
      validateString(operation.name, `${kind}.name`);
      break;
    }
    case 'delete_scene': {
      strictObject(operation, ['operation', 'name'], kind);
      requireKeys(operation, ['name'], kind);
      validateString(operation.name, `${kind}.name`);
      break;
    }
    case 'duplicate_scene': {
      strictObject(operation, ['operation', 'source', 'name'], kind);
      requireKeys(operation, ['source', 'name'], kind);
      validateString(operation.source, `${kind}.source`);
      validateString(operation.name, `${kind}.name`);
      if (operation.source === operation.name) fail(`${kind}.source and name must differ`);
      break;
    }
    case 'set_scene_camera': {
      strictObject(operation, ['operation', 'scene', 'camera'], kind);
      requireKeys(operation, ['scene', 'camera'], kind);
      validateString(operation.scene, `${kind}.scene`);
      validateString(operation.camera, `${kind}.camera`);
      break;
    }
    case 'scene_strip': {
      strictObject(operation, ['operation', 'scene', 'source', 'name', 'channel', 'frame_start', 'frame_end'], kind);
      requireKeys(operation, ['scene', 'source'], kind);
      validateString(operation.scene, `${kind}.scene`);
      validateString(operation.source, `${kind}.source`);
      if (operation.scene === operation.source) fail(`${kind}.scene and source must differ`);
      if (Object.hasOwn(operation, 'name')) validateString(operation.name, `${kind}.name`);
      if (!Number.isInteger(operation.channel)) fail(`${kind}.channel must be an integer`);
      validateFiniteNumber(operation.channel, `${kind}.channel`, 1, 128);
      if (!Number.isInteger(operation.frame_start)) fail(`${kind}.frame_start must be an integer`);
      validateFiniteNumber(operation.frame_start, `${kind}.frame_start`, 0, 1e7);
      if (Object.hasOwn(operation, 'frame_end')) {
        if (!Number.isInteger(operation.frame_end)) fail(`${kind}.frame_end must be an integer`);
        validateFiniteNumber(operation.frame_end, `${kind}.frame_end`, 1, 1e7);
        if (operation.frame_end <= operation.frame_start) fail(`${kind}.frame_end must be after frame_start`);
      }
      break;
    }
    case 'create_mesh': {
      strictObject(operation, ['operation', 'name', 'primitive', 'location', 'scale'], kind);
      requireKeys(operation, ['name', 'primitive', 'location', 'scale'], kind);
      validateAllowedName(operation.name, allowed);
      validateString(operation.primitive, `${kind}.primitive`);
      if (!PRIMITIVES.has(operation.primitive)) fail(`${kind}.primitive is invalid`);
      validateVector(operation.location, `${kind}.location`, 3);
      validateVector(operation.scale, `${kind}.scale`, 3, 0, 1e4);
      if (operation.scale.some((value) => value === 0)) fail(`${kind}.scale values must be positive`);
      break;
    }
    case 'text': {
      strictObject(operation, ['operation', 'name', 'body', 'size', 'extrude', 'align_x', 'align_y', 'location', 'rotation', 'scale'], kind);
      requireKeys(operation, ['name', 'body'], kind);
      validateAllowedName(operation.name, allowed);
      validateText(operation.body, `${kind}.body`);
      if (Object.hasOwn(operation, 'size')) validateFiniteNumber(operation.size, `${kind}.size`, 0.01, 100);
      if (Object.hasOwn(operation, 'extrude')) validateFiniteNumber(operation.extrude, `${kind}.extrude`, 0, 10);
      if (Object.hasOwn(operation, 'align_x')) {
        validateString(operation.align_x, `${kind}.align_x`);
        if (!TEXT_ALIGN_X.has(operation.align_x)) fail(`${kind}.align_x is invalid`);
      }
      if (Object.hasOwn(operation, 'align_y')) {
        validateString(operation.align_y, `${kind}.align_y`);
        if (!TEXT_ALIGN_Y.has(operation.align_y)) fail(`${kind}.align_y is invalid`);
      }
      validateOptionalTransform(operation, kind);
      break;
    }
    case 'modifier': {
      strictObject(operation, ['operation', 'name', 'modifier', 'apply', 'width', 'segments', 'limit_method', 'angle_limit', 'levels', 'render_levels', 'thickness', 'offset', 'use_rim', 'axis', 'use_clip', 'count', 'relative_offset'], kind);
      requireKeys(operation, ['name', 'modifier'], kind);
      validateAllowedName(operation.name, allowed);
      validateString(operation.modifier, `${kind}.modifier`);
      if (!MODIFIER_KINDS.has(operation.modifier)) fail(`${kind}.modifier "${operation.modifier}" is unsupported by the harness reviewed-operation layer; supported: ${[...MODIFIER_KINDS].join(', ')}. Blender/MCP can do more, but raw Python stays blocked; use wall segments, a reviewed operation, or explicit unsafe mode.`);
      if (Object.hasOwn(operation, 'apply')) validateBoolean(operation.apply, `${kind}.apply`);
      if (operation.modifier === 'BEVEL') {
        if (Object.hasOwn(operation, 'width')) validateFiniteNumber(operation.width, `${kind}.width`, 0, 1000);
        if (Object.hasOwn(operation, 'segments')) {
          if (!Number.isInteger(operation.segments)) fail(`${kind}.segments must be an integer`);
          validateFiniteNumber(operation.segments, `${kind}.segments`, 1, 32);
        }
        if (Object.hasOwn(operation, 'limit_method') && !['NONE', 'ANGLE', 'WEIGHT', 'VGROUP'].includes(operation.limit_method)) fail(`${kind}.limit_method is invalid`);
        if (Object.hasOwn(operation, 'angle_limit')) validateFiniteNumber(operation.angle_limit, `${kind}.angle_limit`, 0, Math.PI);
      }
      if (operation.modifier === 'SUBSURF') {
        for (const field of ['levels', 'render_levels']) {
          if (Object.hasOwn(operation, field)) {
            if (!Number.isInteger(operation[field])) fail(`${kind}.${field} must be an integer`);
            validateFiniteNumber(operation[field], `${kind}.${field}`, 0, 6);
          }
        }
      }
      if (operation.modifier === 'SOLIDIFY') {
        if (Object.hasOwn(operation, 'thickness')) validateFiniteNumber(operation.thickness, `${kind}.thickness`, -1000, 1000);
        if (Object.hasOwn(operation, 'offset')) validateFiniteNumber(operation.offset, `${kind}.offset`, -1, 1);
        if (Object.hasOwn(operation, 'use_rim')) validateBoolean(operation.use_rim, `${kind}.use_rim`);
      }
      if (operation.modifier === 'MIRROR') {
        if (Object.hasOwn(operation, 'axis') && !['X', 'Y', 'Z'].includes(operation.axis)) fail(`${kind}.axis is invalid`);
        if (Object.hasOwn(operation, 'use_clip')) validateBoolean(operation.use_clip, `${kind}.use_clip`);
      }
      if (operation.modifier === 'ARRAY') {
        if (Object.hasOwn(operation, 'count')) {
          if (!Number.isInteger(operation.count)) fail(`${kind}.count must be an integer`);
          validateFiniteNumber(operation.count, `${kind}.count`, 1, 100);
        }
        if (Object.hasOwn(operation, 'relative_offset')) validateVector(operation.relative_offset, `${kind}.relative_offset`, 3);
      }
      break;
    }
    case 'transform': {
      strictObject(operation, ['operation', 'name', 'location', 'rotation', 'scale'], kind);
      requireKeys(operation, ['name'], kind);
      validateAllowedName(operation.name, allowed);
      const fields = ['location', 'rotation', 'scale'].filter((field) => Object.hasOwn(operation, field));
      if (fields.length === 0) fail(`${kind} requires location, rotation, or scale`);
      if (Object.hasOwn(operation, 'location')) validateVector(operation.location, `${kind}.location`, 3);
      if (Object.hasOwn(operation, 'rotation')) validateVector(operation.rotation, `${kind}.rotation`, 3);
      if (Object.hasOwn(operation, 'scale')) {
        validateVector(operation.scale, `${kind}.scale`, 3, 0, 1e4);
        if (operation.scale.some((value) => value === 0)) fail(`${kind}.scale values must be positive`);
      }
      break;
    }
    case 'material': {
      const unsupportedMaterial = ['transmission', 'ior', 'alpha'].filter((key) => Object.hasOwn(operation, key));
      if (unsupportedMaterial.length) fail(`${kind}.${unsupportedMaterial.join('/')} is unsupported by the harness reviewed material layer; supported: color, roughness, metallic, emission. Blender supports glass, but raw Python stays blocked; use a tinted plane, a reviewed material extension, or explicit unsafe mode.`);
      strictObject(operation, ['operation', 'name', 'color', 'roughness', 'metallic', 'emission'], kind);
      requireKeys(operation, ['name', 'color', 'roughness', 'metallic'], kind);
      validateAllowedName(operation.name, allowed);
      validateMaterialValues(operation, kind);
      break;
    }
    case 'shared_material': {
      const unsupportedMaterial = ['transmission', 'ior', 'alpha'].filter((key) => Object.hasOwn(operation, key));
      if (unsupportedMaterial.length) fail(`${kind}.${unsupportedMaterial.join('/')} is unsupported by the harness reviewed material layer; supported: color, roughness, metallic, emission. Blender supports glass, but raw Python stays blocked; use a tinted plane, a reviewed material extension, or explicit unsafe mode.`);
      strictObject(operation, ['operation', 'name', 'objects', 'color', 'roughness', 'metallic', 'emission'], kind);
      requireKeys(operation, ['name', 'objects', 'color', 'roughness', 'metallic'], kind);
      validateString(operation.name, `${kind}.name`);
      if (!Array.isArray(operation.objects) || operation.objects.length < 1 || operation.objects.length > 50) fail(`${kind}.objects must contain 1-50 object names`);
      const objects = operation.objects.map((name, index) => validateString(name, `${kind}.objects[${index}]`));
      if (new Set(objects).size !== objects.length) fail(`${kind}.objects must not contain duplicates`);
      for (const name of objects) validateAllowedName(name, allowed, `${kind}.objects`);
      validateMaterialValues(operation, kind);
      break;
    }
    case 'duplicate': {
      strictObject(operation, ['operation', 'name', 'new_name', 'location', 'rotation', 'scale'], kind);
      requireKeys(operation, ['name', 'new_name'], kind);
      validateAllowedName(operation.name, allowed);
      validateAllowedName(operation.new_name, allowed, `${kind}.new_name`);
      if (Object.hasOwn(operation, 'location')) validateVector(operation.location, `${kind}.location`, 3);
      if (Object.hasOwn(operation, 'rotation')) validateVector(operation.rotation, `${kind}.rotation`, 3);
      if (Object.hasOwn(operation, 'scale')) {
        validateVector(operation.scale, `${kind}.scale`, 3, 0, 1e4);
        if (operation.scale.some((value) => value === 0)) fail(`${kind}.scale values must be positive`);
      }
      break;
    }
    case 'create_light': {
      strictObject(operation, ['operation', 'name', 'kind', 'location', 'energy', 'color', 'temperature'], kind);
      requireKeys(operation, ['name', 'kind', 'location', 'energy'], kind);
      validateAllowedName(operation.name, allowed);
      validateString(operation.kind, `${kind}.kind`);
      if (!LIGHT_KINDS.has(operation.kind)) fail(`${kind}.kind is invalid`);
      validateVector(operation.location, `${kind}.location`, 3);
      validateFiniteNumber(operation.energy, `${kind}.energy`, 0, 1e9);
      if (Object.hasOwn(operation, 'color')) validateVector(operation.color, `${kind}.color`, 3, 0, 1);
      if (Object.hasOwn(operation, 'temperature')) {
        if (!Number.isInteger(operation.temperature)) fail(`${kind}.temperature must be an integer`);
        validateFiniteNumber(operation.temperature, `${kind}.temperature`, 1000, 15000);
      }
      break;
    }
    case 'create_camera': {
      strictObject(operation, ['operation', 'name', 'location', 'rotation', 'lens', 'dof'], kind);
      requireKeys(operation, ['name', 'location', 'rotation', 'lens'], kind);
      validateAllowedName(operation.name, allowed);
      validateVector(operation.location, `${kind}.location`, 3);
      validateVector(operation.rotation, `${kind}.rotation`, 3);
      validateFiniteNumber(operation.lens, `${kind}.lens`, 0, 1e4, true);
      if (Object.hasOwn(operation, 'dof')) {
        if (!isPlainObject(operation.dof)) fail(`${kind}.dof must be an object`);
        strictObject(operation.dof, ['aperture', 'focus_distance', 'focus_object'], `${kind}.dof`);
        requireKeys(operation.dof, ['aperture', 'focus_distance'], `${kind}.dof`);
        validateFiniteNumber(operation.dof.aperture, `${kind}.dof.aperture`, 0.1, 64);
        validateFiniteNumber(operation.dof.focus_distance, `${kind}.dof.focus_distance`, 0, 1e6);
        if (Object.hasOwn(operation.dof, 'focus_object')) validateAllowedName(operation.dof.focus_object, allowed, `${kind}.dof.focus_object`);
      }
      break;
    }
    case 'set_camera':
    case 'delete_object': {
      strictObject(operation, ['operation', 'name'], kind);
      requireKeys(operation, ['name'], kind);
      validateAllowedName(operation.name, allowed);
      break;
    }
    case 'import_asset':
    case 'link_library': {
      const keys = ['operation', 'name', 'path', 'location', 'rotation', 'scale', 'link'];
      strictObject(operation, keys, kind);
      requireKeys(operation, ['name', 'path'], kind);
      validateAllowedName(operation.name, allowed);
      validateProjectRelativePath(operation.path, `${kind}.path`, ['assets/models', 'assets/external', 'scenes'], kind === 'link_library' ? new Set(['.blend']) : MODEL_EXTENSIONS);
      validateOptionalTransform(operation, kind);
      if (Object.hasOwn(operation, 'link')) validateBoolean(operation.link, `${kind}.link`);
      if (kind === 'import_asset' && operation.link && !operation.path.toLowerCase().endsWith('.blend')) {
        fail('import_asset.link requires a .blend path');
      }
      break;
    }
    case 'import_audio': {
      strictObject(operation, ['operation', 'name', 'path', 'location', 'volume'], kind);
      requireKeys(operation, ['name', 'path'], kind);
      validateAllowedName(operation.name, allowed);
      validateProjectRelativePath(operation.path, `${kind}.path`, ['assets/audio', 'assets/external'], AUDIO_EXTENSIONS);
      if (Object.hasOwn(operation, 'location')) validateVector(operation.location, `${kind}.location`, 3);
      if (Object.hasOwn(operation, 'volume')) validateFiniteNumber(operation.volume, `${kind}.volume`, 0, 1);
      break;
    }
    case 'image_reference': {
      strictObject(operation, ['operation', 'name', 'path', 'location', 'rotation', 'scale'], kind);
      requireKeys(operation, ['name', 'path'], kind);
      validateAllowedName(operation.name, allowed);
      validateImagePath(operation, `${kind}.path`, ['Documents/References', 'assets/textures', 'assets/hdri', 'assets/external']);
      validateOptionalTransform(operation, kind);
      break;
    }
    case 'image_texture': {
      strictObject(operation, ['operation', 'name', 'objects', 'path', 'roughness', 'metallic', 'colorSpace', 'emission'], kind);
      requireKeys(operation, ['name', 'objects', 'path', 'roughness', 'metallic'], kind);
      validateString(operation.name, `${kind}.name`);
      if (!Array.isArray(operation.objects) || operation.objects.length < 1 || operation.objects.length > 50) fail(`${kind}.objects must contain 1-50 object names`);
      const objects = operation.objects.map((name, index) => validateString(name, `${kind}.objects[${index}]`));
      if (new Set(objects).size !== objects.length) fail(`${kind}.objects must not contain duplicates`);
      for (const name of objects) validateAllowedName(name, allowed, `${kind}.objects`);
      validateImagePath(operation, `${kind}.path`, ['assets/textures', 'assets/hdri', 'assets/external']);
      validateFiniteNumber(operation.roughness, `${kind}.roughness`, 0, 1);
      validateFiniteNumber(operation.metallic, `${kind}.metallic`, 0, 1);
      if (Object.hasOwn(operation, 'colorSpace') && !['sRGB', 'Non-Color'].includes(operation.colorSpace)) fail(`${kind}.colorSpace is invalid`);
      validateEmission(operation.emission, `${kind}.emission`);
      break;
    }
    case 'world_hdri': {
      strictObject(operation, ['operation', 'path', 'strength', 'rotation'], kind);
      requireKeys(operation, ['path'], kind);
      validateImagePath(operation, `${kind}.path`, ['assets/hdri', 'assets/external'], HDRI_EXTENSIONS);
      if (Object.hasOwn(operation, 'strength')) validateFiniteNumber(operation.strength, `${kind}.strength`, 0, 1000);
      if (Object.hasOwn(operation, 'rotation')) validateFiniteNumber(operation.rotation, `${kind}.rotation`, -1e6, 1e6);
      break;
    }
    case 'check_assets': {
      strictObject(operation, ['operation', 'strict'], kind);
      if (Object.hasOwn(operation, 'strict')) validateBoolean(operation.strict, `${kind}.strict`);
      break;
    }
    case 'pack_assets': {
      strictObject(operation, ['operation'], kind);
      break;
    }
    case 'export_scene': {
      strictObject(operation, ['operation', 'format', 'path'], kind);
      requireKeys(operation, ['format', 'path'], kind);
      validateString(operation.format, `${kind}.format`);
      if (!EXPORT_EXTENSIONS.has(operation.format)) fail(`${kind}.format is invalid`);
      validateProjectRelativePath(operation.path, `${kind}.path`, ['exports'], new Set([EXPORT_EXTENSIONS.get(operation.format)]));
      break;
    }
    case 'render_settings': {
      strictObject(operation, ['operation', 'width', 'height', 'samples', 'frame_start', 'frame_end', 'fps', 'useSequencer'], kind);
      requireKeys(operation, ['width', 'height', 'samples'], kind);
      for (const field of ['width', 'height', 'samples', 'frame_start', 'frame_end', 'fps']) {
        if (Object.hasOwn(operation, field) && !Number.isInteger(operation[field])) fail(`${kind}.${field} must be an integer`);
      }
      validateFiniteNumber(operation.width, `${kind}.width`, 16, 4096);
      validateFiniteNumber(operation.height, `${kind}.height`, 16, 4096);
      validateFiniteNumber(operation.samples, `${kind}.samples`, 1, 1024);
      if (Object.hasOwn(operation, 'frame_start')) validateFiniteNumber(operation.frame_start, `${kind}.frame_start`, 0, 1e7);
      if (Object.hasOwn(operation, 'frame_end')) validateFiniteNumber(operation.frame_end, `${kind}.frame_end`, 1, 1e7);
      if (Object.hasOwn(operation, 'frame_start') && Object.hasOwn(operation, 'frame_end') && operation.frame_end < operation.frame_start) fail(`${kind}.frame_end must not precede frame_start`);
      if (Object.hasOwn(operation, 'fps')) validateFiniteNumber(operation.fps, `${kind}.fps`, 1, 240);
      if (Object.hasOwn(operation, 'useSequencer')) validateBoolean(operation.useSequencer, `${kind}.useSequencer`);
      break;
    }
    default:
      fail(`unsupported operation: ${kind}`);
  }
  if (Object.hasOwn(operation, 'scene')) {
    if (!SCENE_OPERATIONS.has(kind)) fail(`${kind}.scene is not supported`);
    validateString(operation.scene, `${kind}.scene`);
  }
  return { kind, allowed };
}

function creationGuard(name) {
  return `if bpy.data.objects.get(${quote(name)}) is not None:\n    raise RuntimeError("object already exists")`;
}

function createSceneCode(operation) {
  const previous = `previous_scene = ${activeSceneExpression()}`;
  const source = operation.mode === 'NEW'
    ? ''
    : `source_scene = bpy.data.scenes.get(${quote(operation.source)})\nif source_scene is None:\n    raise RuntimeError("source scene not found")\nif bpy.context.window is None:\n    raise RuntimeError("scene creation requires a window context")\nbpy.context.window.scene = source_scene`;
  const restore = operation.activate
    ? `if bpy.context.window is None:\n    raise RuntimeError("scene activation requires a window context")\nbpy.context.window.scene = created_scene`
    : `if bpy.context.window is not None:\n    bpy.context.window.scene = previous_scene`;
  return `${objectModeGuard()}\n${previous}\n${source}\nbpy.ops.scene.new(type=${quote(operation.mode)})\ncreated_scene = bpy.context.scene\nif created_scene is None:\n    raise RuntimeError("scene creation produced no scene")\ncreated_scene.name = ${quote(operation.name)}\n${restore}\n${jsonReceipt('create_scene', operation.name)}`;
}

function switchSceneCode(operation) {
  return `${objectModeGuard()}\ntarget_scene = bpy.data.scenes.get(${quote(operation.name)})\nif target_scene is None:\n    raise RuntimeError("scene not found")\nif bpy.context.window is None:\n    raise RuntimeError("scene switching requires a window context")\nbpy.context.window.scene = target_scene\n${jsonReceipt('switch_scene', operation.name)}`;
}

function deleteSceneCode(operation) {
  return `${objectModeGuard()}\ntarget_scene = bpy.data.scenes.get(${quote(operation.name)})\nif target_scene is None:\n    raise RuntimeError("scene not found")\nif len(bpy.data.scenes) <= 1:\n    raise RuntimeError("cannot delete the last scene")\nif target_scene == bpy.context.scene:\n    raise RuntimeError("switch away from the scene before deleting it")\nfor other in bpy.data.scenes:\n    editor = other.sequence_editor\n    if editor is not None:\n        strips = getattr(editor, 'strips', None)\n        if strips is None:\n            strips = getattr(editor, 'sequences', [])\n        for strip in strips:\n            if getattr(strip, 'scene', None) == target_scene:\n                raise RuntimeError("scene is referenced by a Scene Strip")\nbpy.data.scenes.remove(target_scene, do_unlink=True)\n${jsonReceipt('delete_scene', operation.name)}`;
}

function duplicateSceneCode(operation) {
  const previous = `previous_scene = ${activeSceneExpression()}`;
  return `${objectModeGuard()}\n${previous}\nsource_scene = bpy.data.scenes.get(${quote(operation.source)})\nif source_scene is None:\n    raise RuntimeError("source scene not found")\nif bpy.context.window is None:\n    raise RuntimeError("scene duplication requires a window context")\nbpy.context.window.scene = source_scene\nbpy.ops.scene.new(type='FULL_COPY')\ncreated_scene = bpy.context.scene\nif created_scene is None:\n    raise RuntimeError("scene duplication produced no scene")\ncreated_scene.name = ${quote(operation.name)}\nbpy.context.window.scene = previous_scene\n${jsonReceipt('duplicate_scene', operation.name)}`;
}

function setSceneCameraCode(operation) {
  return `${objectModeGuard()}\ntarget_scene = bpy.data.scenes.get(${quote(operation.scene)})\nif target_scene is None:\n    raise RuntimeError("scene not found")\ncamera = bpy.data.objects.get(${quote(operation.camera)})\nif camera is None:\n    raise RuntimeError("camera object not found")\nif camera.type != 'CAMERA':\n    raise RuntimeError("object is not a camera")\nif target_scene.objects.get(camera.name) is not camera:\n    raise RuntimeError("camera does not belong to the target scene")\ntarget_scene.camera = camera\n${jsonReceipt('set_scene_camera', operation.camera)}`;
}

function sceneStripCode(operation) {
  const name = operation.name ?? operation.source;
  const end = Object.hasOwn(operation, 'frame_end')
    ? `strip.frame_final_end = ${operation.frame_end}`
    : '';
  return `${objectModeGuard()}\ntarget_scene = bpy.data.scenes.get(${quote(operation.scene)})\nif target_scene is None:\n    raise RuntimeError("scene not found")\nsource_scene = bpy.data.scenes.get(${quote(operation.source)})\nif source_scene is None:\n    raise RuntimeError("source scene not found")\nif target_scene.sequence_editor is None:\n    target_scene.sequence_editor_create()\nstrips = getattr(target_scene.sequence_editor, 'strips', None)\nif strips is None:\n    strips = getattr(target_scene.sequence_editor, 'sequences', None)\nif strips is None:\n    raise RuntimeError("sequencer strip collection is unavailable")\nstrip = strips.new_scene(${quote(name)}, source_scene, ${operation.channel}, ${operation.frame_start})\n${end}\n${jsonReceipt('scene_strip', name)}`;
}

function sceneFactsCode(sceneName = null) {
  const selection = sceneName === null
    ? 'scenes = list(bpy.data.scenes)'
    : `target_scene = bpy.data.scenes.get(${quote(sceneName)})\nif target_scene is None:\n    raise RuntimeError("scene not found")\nscenes = [target_scene]`;
  return `import bpy\nimport bmesh\nimport json\n${selection}\ndef scene_strips(scene):\n    editor = scene.sequence_editor\n    if editor is None:\n        return []\n    strips = getattr(editor, 'strips', None)\n    if strips is None:\n        strips = getattr(editor, 'sequences', [])\n    return list(strips)\ndef object_facts(obj):\n    facts = {\n        "name": obj.name,\n        "type": obj.type,\n        "location": [round(value, 6) for value in obj.location],\n        "rotation": [round(value, 6) for value in obj.rotation_euler],\n        "scale": [round(value, 6) for value in obj.scale],\n        "dimensions": [round(value, 6) for value in obj.dimensions],\n        "materials": [slot.material.name if slot.material is not None else None for slot in obj.material_slots],\n        "modifiers": [modifier.type for modifier in obj.modifiers],\n    }\n    if obj.type == 'MESH':\n        mesh = obj.data\n        bm = bmesh.new()\n        try:\n            bm.from_mesh(mesh)\n            facts["mesh"] = {\n                "vertices": len(mesh.vertices),\n                "edges": len(mesh.edges),\n                "faces": len(mesh.polygons),\n                "ngons": sum(1 for polygon in mesh.polygons if len(polygon.vertices) > 4),\n                "non_manifold_edges": sum(1 for edge in bm.edges if not edge.is_manifold),\n                "loose_vertices": sum(1 for vert in bm.verts if not vert.link_edges),\n                "degenerate_faces": sum(1 for face in bm.faces if face.calc_area() < 1e-9),\n            }\n        finally:\n            bm.free()\n    return facts\npayload = []\nfor scene in scenes:\n    payload.append({\n        "name": scene.name,\n        "objects": [object_facts(obj) for obj in list(scene.objects)[:1000]],\n        "collections": [collection.name for collection in list(scene.collection.children_recursive)[:500]],\n        "camera": scene.camera.name if scene.camera is not None else None,\n        "resolution": [scene.render.resolution_x, scene.render.resolution_y],\n        "engine": scene.render.engine,\n        "frame_start": scene.frame_start,\n        "frame_end": scene.frame_end,\n        "fps": scene.render.fps,\n        "film_transparent": bool(getattr(scene.render, "film_transparent", False)),\n        "color_management": {"view_transform": scene.view_settings.view_transform, "look": scene.view_settings.look, "exposure": scene.view_settings.exposure, "gamma": scene.view_settings.gamma},\n        "samples": getattr(getattr(scene, "eevee", None), "taa_render_samples", None),\n        "use_sequencer": bool(getattr(scene.render, "use_sequencer", False)),\n        "strips": [{"name": strip.name, "type": strip.type, "scene": getattr(getattr(strip, "scene", None), "name", None), "frame_start": strip.frame_start, "frame_end": strip.frame_final_end} for strip in scene_strips(scene)[:500]],\n    })\nprint("HARNESS_JSON:" + json.dumps({"ok": True, "scenes": payload}, separators=(",", ":")))`;
}

function createMeshCode(operation) {
  const primitive = {
    cube: `verts = [(-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1), (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]\nfaces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]`,
    plane: `verts = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]\nfaces = [(0, 1, 2, 3)]`,
    cylinder: `from math import sin, cos, pi\nsegments = 32\nverts = [(cos(2 * pi * segment / segments), sin(2 * pi * segment / segments), z) for z in (-1, 1) for segment in range(segments)]\nfaces = [tuple(reversed(range(segments))), tuple(range(segments, 2 * segments))]\nfor segment in range(segments):\n    next_segment = (segment + 1) % segments\n    faces.append((segment, next_segment, segments + next_segment, segments + segment))`,
    uv_sphere: `from math import sin, cos, pi\nverts = [(0, 0, 1)]\nfaces = []\nsegments, rings = 16, 8\nfor ring in range(1, rings):\n    phi = pi * ring / rings\n    for segment in range(segments):\n        theta = 2 * pi * segment / segments\n        verts.append((sin(phi) * cos(theta), sin(phi) * sin(theta), cos(phi)))\nbottom = len(verts)\nverts.append((0, 0, -1))\nlast_ring = 1 + (rings - 2) * segments\nfor segment in range(segments):\n    next_segment = (segment + 1) % segments\n    faces.append((0, 1 + segment, 1 + next_segment))\n    faces.append((bottom, last_ring + next_segment, last_ring + segment))\nfor ring in range(rings - 2):\n    for segment in range(segments):\n        next_segment = (segment + 1) % segments\n        a = 1 + ring * segments + segment\n        b = 1 + ring * segments + next_segment\n        c = 1 + (ring + 1) * segments + next_segment\n        d = 1 + (ring + 1) * segments + segment\n        faces.append((a, d, c, b))`,
  }[operation.primitive];
  const name = quote(operation.name);
  return `${objectModeGuard()}\n${hasScene(operation) ? `${sceneSetup(operation)}\n` : ''}${creationGuard(operation.name)}\n${primitive}\nmesh = bpy.data.meshes.new(${name} + "_Mesh")\nmesh.from_pydata(verts, [], faces)\nmesh.update()\nobj = bpy.data.objects.new(${name}, mesh)\n${sceneLink(operation, 'obj')}\nobj.location = ${quote(operation.location)}\nobj.scale = ${quote(operation.scale)}\n${jsonReceipt('create_mesh', operation.name)}`;
}

function textCode(operation) {
  const size = operation.size ?? 1;
  const extrude = operation.extrude ?? 0;
  const alignX = operation.align_x ?? 'CENTER';
  const alignY = operation.align_y ?? 'CENTER';
  return `${objectModeGuard()}\n${hasScene(operation) ? `${sceneSetup(operation)}\n` : ''}${creationGuard(operation.name)}\ntext_data = bpy.data.curves.new(${quote(operation.name)} + "_Text", type='FONT')\ntext_data.body = ${quote(operation.body)}\ntext_data.size = ${size}\ntext_data.extrude = ${extrude}\ntext_data.align_x = ${quote(alignX)}\ntext_data.align_y = ${quote(alignY)}\ntext = bpy.data.objects.new(${quote(operation.name)}, text_data)\n${sceneLink(operation, 'text')}\n${transformCode(operation, 'text')}\n${jsonReceipt('text', operation.name)}`;
}

function modifierCode(operation) {
  const settings = [];
  if (operation.modifier === 'BEVEL') {
    if (Object.hasOwn(operation, 'width')) settings.push(`modifier.width = ${operation.width}`);
    if (Object.hasOwn(operation, 'segments')) settings.push(`modifier.segments = ${operation.segments}`);
    if (Object.hasOwn(operation, 'limit_method')) settings.push(`modifier.limit_method = ${quote(operation.limit_method)}`);
    if (Object.hasOwn(operation, 'angle_limit')) settings.push(`modifier.angle_limit = ${operation.angle_limit}`);
  }
  if (operation.modifier === 'SUBSURF') {
    if (Object.hasOwn(operation, 'levels')) settings.push(`modifier.levels = ${operation.levels}`);
    if (Object.hasOwn(operation, 'render_levels')) settings.push(`modifier.render_levels = ${operation.render_levels}`);
  }
  if (operation.modifier === 'SOLIDIFY') {
    if (Object.hasOwn(operation, 'thickness')) settings.push(`modifier.thickness = ${operation.thickness}`);
    if (Object.hasOwn(operation, 'offset')) settings.push(`modifier.offset = ${operation.offset}`);
    if (Object.hasOwn(operation, 'use_rim')) settings.push(`modifier.use_rim = ${operation.use_rim ? 'True' : 'False'}`);
  }
  if (operation.modifier === 'MIRROR') {
    const axis = operation.axis ?? 'X';
    settings.push(`modifier.use_axis[0] = ${axis === 'X' ? 'True' : 'False'}`);
    settings.push(`modifier.use_axis[1] = ${axis === 'Y' ? 'True' : 'False'}`);
    settings.push(`modifier.use_axis[2] = ${axis === 'Z' ? 'True' : 'False'}`);
    if (Object.hasOwn(operation, 'use_clip')) settings.push(`modifier.use_clip = ${operation.use_clip ? 'True' : 'False'}`);
  }
  if (operation.modifier === 'ARRAY') {
    if (Object.hasOwn(operation, 'count')) settings.push(`modifier.count = ${operation.count}`);
    if (Object.hasOwn(operation, 'relative_offset')) {
      settings.push(`modifier.use_relative_offset = True`);
      settings.push(`modifier.relative_offset_displace = ${quote(operation.relative_offset)}`);
    }
  }
  const apply = operation.apply === true
    ? `bpy.context.view_layer.objects.active = obj\nobj.select_set(True)\nbpy.ops.object.modifier_apply(modifier=modifier.name)`
    : '';
  return `${objectModeGuard()}\n${objectLookup(operation.name)}\n${sceneObjectGuard(operation)}\nif obj.type != 'MESH':\n    raise RuntimeError("modifier requires a mesh object")\nmodifier = obj.modifiers.new(${quote(operation.name + ' ' + operation.modifier)}, ${quote(operation.modifier)})\n${settings.join('\n')}\n${apply}\n${jsonReceipt('modifier', operation.name)}`;
}

function assetPathCode(path, { file = true } = {}) {
  return `asset_path = os.path.abspath(bpy.path.abspath("//" + ${quote(path)}))\n${file ? 'if not os.path.isfile(asset_path):\n    raise RuntimeError("asset file not found")' : ''}\nnormalized_asset = asset_path.replace("\\\\", "/")\nif "/assets/external/" in normalized_asset:\n    search_dir = os.path.dirname(asset_path)\n    while search_dir and not (os.path.isfile(os.path.join(search_dir, "SOURCE.md")) and os.path.isfile(os.path.join(search_dir, "LICENSE.txt"))):\n        if os.path.basename(search_dir) == "external":\n            raise RuntimeError("external asset requires SOURCE.md and LICENSE.txt in its asset folder")\n        parent_dir = os.path.dirname(search_dir)\n        if parent_dir == search_dir:\n            raise RuntimeError("external asset requires SOURCE.md and LICENSE.txt in its asset folder")\n        search_dir = parent_dir`;
}

function transformCode(operation, target) {
  const fields = [];
  if (Object.hasOwn(operation, 'location')) fields.push(`${target}.location = ${quote(operation.location)}`);
  if (Object.hasOwn(operation, 'rotation')) fields.push(`${target}.rotation_euler = ${quote(operation.rotation)}`);
  if (Object.hasOwn(operation, 'scale')) fields.push(`${target}.scale = ${quote(operation.scale)}`);
  return fields.join('\n');
}

function parentCode(operation) {
  return `creation_parent = bpy.data.objects.new(${quote(operation.name)}, None)\ncreation_parent.empty_display_type = 'PLAIN_AXES'\n${sceneLink(operation, 'creation_parent')}`;
}

function importAssetCode(operation, { libraryOnly = false } = {}) {
  const link = libraryOnly ? operation.link !== false : Boolean(operation.link);
  const targetScene = hasScene(operation) ? 'target_scene' : 'bpy.context.scene';
  const targetCollection = hasScene(operation) ? 'target_scene.collection' : 'bpy.context.collection';
  const loadLibrary = `with bpy.data.libraries.load(asset_path, link=${link ? 'True' : 'False'}) as (data_from, data_to):\n    data_to.objects = list(data_from.objects)\nimported = [obj for obj in data_to.objects if obj is not None]\nfor obj in imported:\n    ${targetCollection}.objects.link(obj)`;
  const operators = `existing_objects = set(${targetScene}.objects)\nsuffix = os.path.splitext(asset_path)[1].lower()\nif suffix in ('.glb', '.gltf'):\n    if not hasattr(bpy.ops.import_scene, 'gltf'):\n        raise RuntimeError("glTF import is unavailable")\n    bpy.ops.import_scene.gltf(filepath=asset_path)\nelif suffix == '.fbx':\n    if not hasattr(bpy.ops.import_scene, 'fbx'):\n        raise RuntimeError("FBX import is unavailable")\n    bpy.ops.import_scene.fbx(filepath=asset_path)\nelif suffix == '.usd' or suffix == '.usdz':\n    if not hasattr(bpy.ops.wm, 'usd_import'):\n        raise RuntimeError("USD import is unavailable")\n    bpy.ops.wm.usd_import(filepath=asset_path)\nelif suffix == '.obj':\n    if hasattr(bpy.ops.wm, 'obj_import'):\n        bpy.ops.wm.obj_import(filepath=asset_path)\n    elif hasattr(bpy.ops.import_scene, 'obj'):\n        bpy.ops.import_scene.obj(filepath=asset_path)\n    else:\n        raise RuntimeError("OBJ import is unavailable")\nelse:\n    raise RuntimeError("unsupported asset extension")\nimported = [obj for obj in ${targetScene}.objects if obj not in existing_objects]`;
  const parentImported = `for obj in imported:\n    if obj.parent is None:\n        obj.parent = creation_parent\nif not imported:\n    raise RuntimeError("asset import produced no objects")`;
  const core = libraryOnly
    ? `${creationGuard(operation.name)}\n${assetPathCode(operation.path)}\n${parentCode(operation)}\n${loadLibrary}\n${parentImported}`
    : `${creationGuard(operation.name)}\n${assetPathCode(operation.path)}\n${parentCode(operation)}\nfor obj in list(bpy.context.selected_objects):\n    obj.select_set(False)\nif os.path.splitext(asset_path)[1].lower() == '.blend':\n${loadLibrary.split('\n').map((line) => `    ${line}`).join('\n')}\nelse:\n${operators.split('\n').map((line) => `    ${line}`).join('\n')}\n${parentImported}`;
  const prefix = hasScene(operation)
    ? `${sceneSetup(operation)}\nprevious_scene = ${activeSceneExpression()}\nif bpy.context.window is None:\n    raise RuntimeError("scene-aware import requires a window context")\nbpy.context.window.scene = target_scene\n`
    : '';
  const restore = hasScene(operation)
    ? `\nfinally:\n    bpy.context.window.scene = previous_scene`
    : '';
  const body = `${objectModeGuard()}\n${prefix}${hasScene(operation) ? 'try:\n' : ''}${core.split('\n').map((line) => `    ${line}`).join('\n')}${hasScene(operation) ? '\n' + transformCode(operation, 'creation_parent').split('\n').map((line) => `    ${line}`).join('\n') + '\n    ' + jsonReceipt(libraryOnly ? 'link_library' : 'import_asset', operation.name) + restore : '\n' + transformCode(operation, 'creation_parent') + '\n' + jsonReceipt(libraryOnly ? 'link_library' : 'import_asset', operation.name)}`;
  return body;
}

function imageReferenceCode(operation) {
  return `${objectModeGuard()}\n${hasScene(operation) ? `${sceneSetup(operation)}\n` : ''}${creationGuard(operation.name)}\n${assetPathCode(operation.path)}\nimage = bpy.data.images.load(asset_path, check_existing=True)\nreference = bpy.data.objects.new(${quote(operation.name)}, None)\nreference.empty_display_type = 'IMAGE'\nreference.empty_display_size = 1.0\nreference.data = image\nreference.show_in_front = True\nreference.hide_render = True\n${sceneLink(operation, 'reference')}\n${transformCode(operation, 'reference')}\n${jsonReceipt('image_reference', operation.name)}`;
}

function imageTextureCode(operation) {
  const colorSpace = operation.colorSpace ?? 'sRGB';
  const emission = operation.emission ? `\nemission_socket = bsdf.inputs.get('Emission Color')\nif emission_socket is None:\n    emission_socket = bsdf.inputs.get('Emission')\nif emission_socket is None:\n    raise RuntimeError("Principled emission input not found")\nemission_socket.default_value = ${quote(operation.emission.color)}\nbsdf.inputs['Emission Strength'].default_value = ${operation.emission.strength}` : '';
  const assign = operation.objects.map((name) => `${objectLookup(name)}\n${sceneObjectGuard(operation)}\nif obj.type != 'MESH':\n    raise RuntimeError("image_texture requires mesh objects")\nif obj.data.users > 1 or not obj.data.is_editable:\n    obj.data = obj.data.copy()\nif obj.data.materials:\n    obj.active_material = material\nelse:\n    obj.data.materials.append(material)`).join('\n');
  return `${objectModeGuard()}\n${assetPathCode(operation.path)}\nimage = bpy.data.images.load(asset_path, check_existing=True)\nimage.colorspace_settings.name = ${quote(colorSpace)}\nmaterial = bpy.data.materials.new(${quote(operation.name)} + "_Material")\nmaterial.use_nodes = True\nnodes = material.node_tree.nodes\nlinks = material.node_tree.links\nbsdf = next((node for node in nodes if node.type == 'BSDF_PRINCIPLED'), None)\nif bsdf is None:\n    raise RuntimeError("Principled BSDF node not found")\ntexture = nodes.new('ShaderNodeTexImage')\ntexture.image = image\ntexture.interpolation = 'Linear'\ncoordinates = nodes.new('ShaderNodeTexCoord')\nlinks.new(coordinates.outputs['Generated'], texture.inputs['Vector'])\nlinks.new(texture.outputs['Color'], bsdf.inputs['Base Color'])\nbsdf.inputs['Roughness'].default_value = ${operation.roughness}\nbsdf.inputs['Metallic'].default_value = ${operation.metallic}${emission}\n${assign}\n${jsonReceipt('image_texture')}`;
}

function worldHdriCode(operation) {
  const strength = operation.strength ?? 1;
  const rotation = operation.rotation ?? 0;
  const scene = hasScene(operation) ? `${sceneSetup(operation)}\nscene = target_scene` : 'scene = bpy.context.scene';
  return `${scene}\n${assetPathCode(operation.path)}\nimage = bpy.data.images.load(asset_path, check_existing=True)\nworld = scene.world\nif world is None:\n    world = bpy.data.worlds.new("World")\n    scene.world = world\nworld.use_nodes = True\nnodes = world.node_tree.nodes\nlinks = world.node_tree.links\nnodes.clear()\noutput = nodes.new('ShaderNodeOutputWorld')\nbackground = nodes.new('ShaderNodeBackground')\nenvironment = nodes.new('ShaderNodeTexEnvironment')\nmapping = nodes.new('ShaderNodeMapping')\ncoordinates = nodes.new('ShaderNodeTexCoord')\nenvironment.image = image\nmapping.inputs['Rotation'].default_value = (0, 0, ${rotation})\nlinks.new(coordinates.outputs['Generated'], mapping.inputs['Vector'])\nlinks.new(mapping.outputs['Vector'], environment.inputs['Vector'])\nlinks.new(environment.outputs['Color'], background.inputs['Color'])\nbackground.inputs['Strength'].default_value = ${strength}\nlinks.new(background.outputs['Background'], output.inputs['Surface'])\n${jsonReceipt('world_hdri')}`;
}

function checkAssetsCode(operation) {
  const strict = operation.strict === true;
  return `external = bpy.utils.blend_paths(absolute=True, packed=False, local=True)\nmissing = [path for path in external if not os.path.exists(path)]\n${strict ? 'if missing:\n    raise RuntimeError("missing external files: " + ", ".join(missing))\n' : ''}packed = [image.name for image in bpy.data.images if image.packed_file is not None]\nlibraries = [{"path": library.filepath, "packed": bool(getattr(library, "packed_file", None))} for library in bpy.data.libraries]\nprint("HARNESS_JSON:" + json.dumps({"ok": True, "operation": "check_assets", "strict": ${strict ? 'True' : 'False'}, "external": external, "missing": missing, "packed": packed, "libraries": libraries}, separators=(",", ":")))`;
}

function packAssetsCode() {
  return `bpy.ops.file.pack_all()\npacked = [image.name for image in bpy.data.images if image.packed_file is not None]\nprint("HARNESS_JSON:" + json.dumps({"ok": True, "operation": "pack_assets", "packed": packed}, separators=(",", ":")))`;
}

function exportSceneCode(operation) {
  const format = operation.format;
  const code = {
    glb: `if not hasattr(bpy.ops.export_scene, 'gltf'):\n    raise RuntimeError("glTF export is unavailable")\nbpy.ops.export_scene.gltf(filepath=export_path, export_format='GLB', use_selection=False)`,
    gltf: `if not hasattr(bpy.ops.export_scene, 'gltf'):\n    raise RuntimeError("glTF export is unavailable")\nbpy.ops.export_scene.gltf(filepath=export_path, export_format='GLTF_SEPARATE', use_selection=False)`,
    fbx: `if not hasattr(bpy.ops.export_scene, 'fbx'):\n    raise RuntimeError("FBX export is unavailable")\nbpy.ops.export_scene.fbx(filepath=export_path, use_selection=False)`,
    usd: `if not hasattr(bpy.ops.wm, 'usd_export'):\n    raise RuntimeError("USD export is unavailable")\nbpy.ops.wm.usd_export(filepath=export_path, selected_objects_only=False)`,
    obj: `if hasattr(bpy.ops.wm, 'obj_export'):\n    bpy.ops.wm.obj_export(filepath=export_path, export_selected_objects=False)\nelif hasattr(bpy.ops.export_scene, 'obj'):\n    bpy.ops.export_scene.obj(filepath=export_path, use_selection=False)\nelse:\n    raise RuntimeError("OBJ export is unavailable")`,
  }[format];
  const scene = hasScene(operation)
    ? `${sceneSetup(operation)}\nprevious_scene = ${activeSceneExpression()}\nif bpy.context.window is None:\n    raise RuntimeError("scene-aware export requires a window context")\nbpy.context.window.scene = target_scene\nscene_name = target_scene.name`
    : 'scene_name = bpy.context.scene.name';
  const restore = hasScene(operation) ? '\nif bpy.context.window is not None:\n    bpy.context.window.scene = previous_scene' : '';
  return `${scene}\nimport hashlib\nexport_path = os.path.abspath(bpy.path.abspath("//" + ${quote(operation.path)}))\nos.makedirs(os.path.dirname(export_path), exist_ok=True)\n${code}\nif not os.path.exists(export_path):\n    raise RuntimeError("export produced no file")\nwith open(export_path, 'rb') as export_file:\n    export_bytes = export_file.read()\n${restore}\nprint("HARNESS_JSON:" + json.dumps({"ok": True, "operation": "export_scene", "format": ${quote(format)}, "path": ${quote(operation.path)}, "bytes": os.path.getsize(export_path), "sha256": hashlib.sha256(export_bytes).hexdigest(), "scene": scene_name}, separators=(",", ":")))`;
}

function importAudioCode(operation) {
  const volume = operation.volume ?? 1;
  return `${objectModeGuard()}\n${hasScene(operation) ? `${sceneSetup(operation)}\n` : ''}${creationGuard(operation.name)}\n${assetPathCode(operation.path)}\nsound = bpy.data.sounds.load(asset_path, check_existing=True)\nspeaker_data = bpy.data.speakers.new(${quote(operation.name)} + "_Speaker")\nspeaker_data.sound = sound\nspeaker_data.volume = ${volume}\nspeaker = bpy.data.objects.new(${quote(operation.name)}, speaker_data)\n${sceneLink(operation, 'speaker')}\n${Object.hasOwn(operation, 'location') ? `speaker.location = ${quote(operation.location)}` : ''}\n${jsonReceipt('import_audio', operation.name)}`;
}

function operationBody(operation) {
  switch (operation.operation) {
    case 'create_scene':
      return createSceneCode(operation);
    case 'switch_scene':
      return switchSceneCode(operation);
    case 'delete_scene':
      return deleteSceneCode(operation);
    case 'duplicate_scene':
      return duplicateSceneCode(operation);
    case 'set_scene_camera':
      return setSceneCameraCode(operation);
    case 'scene_strip':
      return sceneStripCode(operation);
    case 'import_asset':
      return importAssetCode(operation);
    case 'link_library':
      return importAssetCode(operation, { libraryOnly: true });
    case 'import_audio':
      return importAudioCode(operation);
    case 'image_reference':
      return imageReferenceCode(operation);
    case 'image_texture':
      return imageTextureCode(operation);
    case 'world_hdri':
      return worldHdriCode(operation);
    case 'check_assets':
      return checkAssetsCode(operation);
    case 'pack_assets':
      return packAssetsCode();
    case 'export_scene':
      return exportSceneCode(operation);
    case 'create_mesh':
      return createMeshCode(operation);
    case 'text':
      return textCode(operation);
    case 'modifier':
      return modifierCode(operation);
    case 'transform': {
      const fields = [];
      if (Object.hasOwn(operation, 'location')) fields.push(`obj.location = ${quote(operation.location)}`);
      if (Object.hasOwn(operation, 'rotation')) fields.push(`obj.rotation_euler = ${quote(operation.rotation)}`);
      if (Object.hasOwn(operation, 'scale')) fields.push(`obj.scale = ${quote(operation.scale)}`);
      return `${objectModeGuard()}\n${objectLookup(operation.name)}\n${sceneObjectGuard(operation)}\n${fields.join('\n')}\n${jsonReceipt('transform', operation.name)}`;
    }
    case 'material': {
      const emission = operation.emission ? `\nemission_socket = bsdf.inputs.get('Emission Color')\nif emission_socket is None:\n    emission_socket = bsdf.inputs.get('Emission')\nif emission_socket is None:\n    raise RuntimeError("Principled emission input not found")\nemission_socket.default_value = ${quote(operation.emission.color)}\nbsdf.inputs['Emission Strength'].default_value = ${operation.emission.strength}` : '';
      return `${objectModeGuard()}\n${objectLookup(operation.name)}\n${sceneObjectGuard(operation)}\nif obj.type not in ('MESH', 'FONT', 'CURVE'):\n    raise RuntimeError("material requires mesh, text, or curve object")\nmaterial = bpy.data.materials.new(${quote(operation.name)} + "_Material")\nmaterial.use_nodes = True\nbsdf = next((node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED'), None)\nif bsdf is None:\n    raise RuntimeError("Principled BSDF node not found")\nbsdf.inputs['Base Color'].default_value = ${quote(operation.color)}\nbsdf.inputs['Roughness'].default_value = ${operation.roughness}\nbsdf.inputs['Metallic'].default_value = ${operation.metallic}${emission}\nif obj.data.users > 1 or not obj.data.is_editable:\n    obj.data = obj.data.copy()\nif obj.data.materials:\n    obj.active_material = material\nelse:\n    obj.data.materials.append(material)\n${jsonReceipt('material', operation.name)}`;
    }
    case 'shared_material': {
      const emission = operation.emission ? `\nemission_socket = bsdf.inputs.get('Emission Color')\nif emission_socket is None:\n    emission_socket = bsdf.inputs.get('Emission')\nif emission_socket is None:\n    raise RuntimeError("Principled emission input not found")\nemission_socket.default_value = ${quote(operation.emission.color)}\nbsdf.inputs['Emission Strength'].default_value = ${operation.emission.strength}` : '';
      const assign = operation.objects.map((name) => `${objectLookup(name)}\n${sceneObjectGuard(operation)}\nif obj.type not in ('MESH', 'FONT', 'CURVE'):\n    raise RuntimeError("shared_material requires mesh, text, or curve objects")\nif obj.data.users > 1 or not obj.data.is_editable:\n    obj.data = obj.data.copy()\nif obj.data.materials:\n    obj.active_material = material\nelse:\n    obj.data.materials.append(material)`).join('\n');
      return `${objectModeGuard()}\nmaterial = bpy.data.materials.new(${quote(operation.name)} + "_Material")\nmaterial.use_nodes = True\nbsdf = next((node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED'), None)\nif bsdf is None:\n    raise RuntimeError("Principled BSDF node not found")\nbsdf.inputs['Base Color'].default_value = ${quote(operation.color)}\nbsdf.inputs['Roughness'].default_value = ${operation.roughness}\nbsdf.inputs['Metallic'].default_value = ${operation.metallic}${emission}\n${assign}\n${jsonReceipt('shared_material', operation.name)}`;
    }
    case 'duplicate': {
      const overrides = [];
      if (Object.hasOwn(operation, 'location')) overrides.push(`duplicate.location = ${quote(operation.location)}`);
      if (Object.hasOwn(operation, 'rotation')) overrides.push(`duplicate.rotation_euler = ${quote(operation.rotation)}`);
      if (Object.hasOwn(operation, 'scale')) overrides.push(`duplicate.scale = ${quote(operation.scale)}`);
      return `${objectModeGuard()}\n${objectLookup(operation.name)}\n${sceneObjectGuard(operation)}\n${creationGuard(operation.new_name)}\nduplicate = obj.copy()\nduplicate.data = obj.data.copy()\nduplicate.name = ${quote(operation.new_name)}\n${sceneLink(operation, 'duplicate')}\n${overrides.join('\n')}\n${jsonReceipt('duplicate', operation.new_name)}`;
    }
    case 'create_light': {
      const color = Object.hasOwn(operation, 'color') ? `\nlight_data.color = ${quote(operation.color)}` : '';
      const temperature = Object.hasOwn(operation, 'temperature') ? `\nif not hasattr(light_data, 'temperature'):\n    raise RuntimeError("light temperature unavailable")\nlight_data.temperature = ${operation.temperature}\nif hasattr(light_data, 'use_temperature'):\n    light_data.use_temperature = True` : '';
      return `${objectModeGuard()}\n${hasScene(operation) ? `${sceneSetup(operation)}\n` : ''}${creationGuard(operation.name)}\nlight_enum = ${quote(operation.kind)}\n${enumValues('bpy.types.Light', 'type')}\nif light_enum not in valid_values:\n    raise RuntimeError("unsupported light type")\nlight_data = bpy.data.lights.new(${quote(operation.name)} + "_Light", type=light_enum)\nlight_data.energy = ${operation.energy}${color}${temperature}\nlight = bpy.data.objects.new(${quote(operation.name)}, light_data)\n${sceneLink(operation, 'light')}\nlight.location = ${quote(operation.location)}\n${jsonReceipt('create_light', operation.name)}`;
    }
    case 'create_camera': {
      const dof = operation.dof ? `\ncamera_data.dof.use_dof = True\ncamera_data.dof.aperture_fstop = ${operation.dof.aperture}\ncamera_data.dof.focus_distance = ${operation.dof.focus_distance}${Object.hasOwn(operation.dof, 'focus_object') ? `\nfocus_object = bpy.data.objects.get(${quote(operation.dof.focus_object)})\nif focus_object is None:\n    raise RuntimeError("DOF focus object not found")\ncamera_data.dof.focus_object = focus_object` : ''}` : '';
      return `${objectModeGuard()}\n${hasScene(operation) ? `${sceneSetup(operation)}\n` : ''}${creationGuard(operation.name)}\ncamera_data = bpy.data.cameras.new(${quote(operation.name)} + "_Camera")\ncamera_data.lens = ${operation.lens}\ncamera = bpy.data.objects.new(${quote(operation.name)}, camera_data)\n${sceneLink(operation, 'camera')}\ncamera.location = ${quote(operation.location)}\ncamera.rotation_euler = ${quote(operation.rotation)}${dof}\n${jsonReceipt('create_camera', operation.name)}`;
    }
    case 'set_camera':
      return `${objectModeGuard()}\n${objectLookup(operation.name)}\n${sceneObjectGuard(operation)}\nif obj.type != 'CAMERA':\n    raise RuntimeError("set_camera requires camera object")\n${hasScene(operation) ? 'target_scene' : 'bpy.context.scene'}.camera = obj\n${jsonReceipt('set_camera', operation.name)}`;
    case 'render_settings': {
      const scene = hasScene(operation) ? `${sceneSetup(operation)}\nscene = target_scene` : 'scene = bpy.context.scene';
      const extras = [];
      if (Object.hasOwn(operation, 'frame_start')) extras.push(`scene.frame_start = ${operation.frame_start}`);
      if (Object.hasOwn(operation, 'frame_end')) extras.push(`scene.frame_end = ${operation.frame_end}`);
      if (Object.hasOwn(operation, 'fps')) extras.push(`scene.render.fps = ${operation.fps}`);
      if (Object.hasOwn(operation, 'useSequencer')) extras.push(`scene.render.use_sequencer = ${operation.useSequencer ? 'True' : 'False'}`);
      return `${scene}\nscene.render.resolution_x = ${operation.width}\nscene.render.resolution_y = ${operation.height}\nscene.render.resolution_percentage = 100\nif hasattr(scene, 'cycles') and hasattr(scene.cycles, 'samples'):\n    scene.cycles.samples = ${operation.samples}\nif hasattr(scene, 'eevee') and hasattr(scene.eevee, 'taa_render_samples'):\n    scene.eevee.taa_render_samples = ${operation.samples}\n${extras.join('\n')}\n${jsonReceipt('render_settings')}`;
    }
    case 'delete_object':
      return `${objectModeGuard()}\n${objectLookup(operation.name)}\n${sceneObjectGuard(operation)}\n${hasScene(operation) ? `${sceneSetup(operation)}\nfor collection in [target_scene.collection, *target_scene.collection.children_recursive]:\n    if obj.name in collection.objects:\n        collection.objects.unlink(obj)\nif not obj.users_collection:\n    bpy.data.objects.remove(obj, do_unlink=True)` : 'bpy.data.objects.remove(obj, do_unlink=True)'}\n${jsonReceipt('delete_object', operation.name)}`;
    default:
      fail(`unsupported operation: ${operation.operation}`);
  }
}

function operationCode(operation, allowedObjects) {
  validateOperation(operation, allowedObjects);
  const body = operationBody(operation);
  return script(body);
}

function operationBatchCode(payload, allowedObjects) {
  if (!isPlainObject(payload)) fail('apply payload must be an object');
  if (!Object.hasOwn(payload, 'operations')) return [operationCode(payload, allowedObjects)];
  strictObject(payload, ['operations'], 'apply payload');
  if (!Array.isArray(payload.operations) || payload.operations.length < 1 || payload.operations.length > MAX_BATCH) {
    fail(`apply payload.operations must contain 1-${MAX_BATCH} operations`);
  }
  return payload.operations.map((operation, index) => {
    try { return operationCode(operation, allowedObjects); }
    catch (error) { throw new TypeError(`apply payload.operations[${index}]: ${error.message}`); }
  });
}

function validateProjectPath(value, label) {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\0')) fail(`${label} must be non-empty path`);
  if (!value.toLowerCase().endsWith('.blend')) fail(`${label} must end with .blend`);
  return value;
}

function validateRenderPath(value) {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\0')) fail('renderPath must be non-empty path');
  if (value.startsWith('//') === false) fail('renderPath must be project-relative (//...)');
  if (value.split(/[\\/]/).includes('..')) fail('renderPath must stay within project');
  return value;
}

function preflightCode(scenePath) {
  validateProjectPath(scenePath, 'scenePath');
  const pathLiteral = quote(scenePath);
  // blend_paths documents referenced paths, not exhaustive sequence-frame/UDIM-tile expansion.
  // This existence check excludes packed data and linked-library paths (local=True).
  return `import bpy\nimport json\nimport os\n\nexpected = ${pathLiteral}\ncurrent = bpy.data.filepath\nif current and os.path.normcase(os.path.abspath(bpy.path.abspath(current))) != os.path.normcase(os.path.abspath(bpy.path.abspath(expected))):\n    raise RuntimeError("scene filepath mismatch")\nexternal = bpy.utils.blend_paths(absolute=True, packed=False, local=True)\nmissing = [path for path in external if not os.path.exists(path)]\nreceipt = {\n    "ok": True,\n    "filepath": current,\n    "is_dirty": bool(bpy.data.is_dirty),\n    "version": list(bpy.app.version),\n    "packed": sum(1 for image in bpy.data.images if image.packed_file is not None),\n    "external": external,\n    "missing": missing,\n}\nprint("HARNESS_JSON:" + json.dumps(receipt, separators=(",", ":")))\n`;
}

function saveCode(scenePath) {
  validateProjectPath(scenePath, 'scenePath');
  const pathLiteral = quote(scenePath);
  return `import bpy\nimport json\nimport os\n\nexpected = ${pathLiteral}\ncurrent = bpy.data.filepath\nif current and os.path.normcase(os.path.abspath(bpy.path.abspath(current))) != os.path.normcase(os.path.abspath(bpy.path.abspath(expected))):\n    raise RuntimeError("refusing mismatched existing scene filepath")\nbpy.ops.wm.save_as_mainfile(filepath=expected, check_existing=False)\nprint("HARNESS_JSON:" + json.dumps({"ok": True, "filepath": bpy.data.filepath}, separators=(",", ":")))\n`;
}

function sceneSelectionCode(sceneName) {
  if (!sceneName) return 'target_scene = bpy.context.scene';
  return `target_scene = bpy.data.scenes.get(${quote(sceneName)})\nif target_scene is None:\n    raise RuntimeError("scene not found")`;
}

function renderPreflightCode(scenePath, sceneName = null) {
  validateProjectPath(scenePath, 'scenePath');
  return `import bpy\nimport json\nimport os\n\nexpected = ${quote(scenePath)}\ncurrent = bpy.data.filepath\nif not current or os.path.normcase(os.path.abspath(bpy.path.abspath(current))) != os.path.normcase(os.path.abspath(bpy.path.abspath(expected))):\n    raise RuntimeError("scene filepath mismatch")\n${sceneSelectionCode(sceneName)}\nif not getattr(target_scene, 'render', None):\n    raise RuntimeError("scene render settings unavailable")\nuse_sequencer = bool(getattr(target_scene.render, 'use_sequencer', False)) and target_scene.sequence_editor is not None\ncamera = target_scene.camera\nif camera is None and not use_sequencer:\n    raise RuntimeError("scene camera is not set")\nif camera is not None and camera.type != 'CAMERA':\n    raise RuntimeError("scene camera is not a camera object")\nif int(target_scene.render.resolution_x) < 16 or int(target_scene.render.resolution_y) < 16:\n    raise RuntimeError("render resolution is invalid")\nprint("HARNESS_JSON:" + json.dumps({"ok": True, "scene": getattr(target_scene, "name", None), "camera": camera.name if camera is not None else None, "use_sequencer": use_sequencer, "resolution": [target_scene.render.resolution_x, target_scene.render.resolution_y]}, separators=(",", ":")))\n`;
}

function renderCode(scenePath, renderPath, sceneName = null) {
  validateProjectPath(scenePath, 'scenePath');
  validateRenderPath(renderPath);
  const sceneLiteral = quote(scenePath);
  const renderLiteral = quote(renderPath);
  const switchCode = sceneName
    ? `previous_scene = ${activeSceneExpression()}\nif bpy.context.window is None:\n    raise RuntimeError("scene-aware render requires a window context")\nbpy.context.window.scene = target_scene`
    : '';
  const restore = sceneName
    ? `\n    if bpy.context.window is not None:\n        bpy.context.window.scene = previous_scene`
    : '';
  return `import bpy\nimport json\nimport os\n\nexpected = ${sceneLiteral}\ncurrent = bpy.data.filepath\nif not current or os.path.normcase(os.path.abspath(bpy.path.abspath(current))) != os.path.normcase(os.path.abspath(bpy.path.abspath(expected))):\n    raise RuntimeError("scene filepath mismatch")\n${sceneSelectionCode(sceneName)}\n${switchCode}\nimage_settings = target_scene.render.image_settings\n${enumValues('bpy.types.ImageFormatSettings', 'file_format')}\nif 'PNG' not in valid_values:\n    raise RuntimeError("PNG render format is unavailable")\nold_filepath = target_scene.render.filepath\nold_resolution_percentage = target_scene.render.resolution_percentage\nold_file_format = image_settings.file_format\nold_color_mode = image_settings.color_mode\nold_color_depth = image_settings.color_depth\nold_use_file_extension = target_scene.render.use_file_extension\ntry:\n    image_settings.file_format = 'PNG'\n    target_scene.render.use_file_extension = True\n    target_scene.render.filepath = ${renderLiteral}\n    target_scene.render.resolution_percentage = 100\n    bpy.ops.render.render(write_still=True)\nfinally:\n    image_settings.file_format = old_file_format\n    image_settings.color_mode = old_color_mode\n    image_settings.color_depth = old_color_depth\n    target_scene.render.use_file_extension = old_use_file_extension\n    target_scene.render.filepath = old_filepath\n    target_scene.render.resolution_percentage = old_resolution_percentage${restore}\nprint("HARNESS_JSON:" + json.dumps({"ok": True, "scene": getattr(target_scene, "name", None), "filepath": ${renderLiteral}}, separators=(",", ":")))\n`;
}

export { MAX_BATCH, OPERATION_NAMES, PRIMITIVES, operationBatchCode, operationCode, preflightCode, renderCode, renderPreflightCode, saveCode, sceneFactsCode };
