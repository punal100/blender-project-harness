const OPERATION_NAMES = new Set([
  'create_mesh',
  'transform',
  'material',
  'shared_material',
  'duplicate',
  'create_light',
  'create_camera',
  'set_camera',
  'render_settings',
  'delete_object',
]);

const PRIMITIVES = new Set(['cube', 'uv_sphere', 'plane', 'cylinder']);
const LIGHT_KINDS = new Set(['POINT', 'AREA', 'SUN', 'SPOT']);
const NAME_RE = /^[\x20-\x7e]+(?![\s\S])/;
const MAX_BATCH = 10;

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
  const allowed = new Set(keys);
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

function script(body, imports = 'import bpy\nimport json\n') {
  return `${imports}\ntry:\n${body.split('\n').map((line) => `    ${line}`).join('\n')}\nexcept Exception as exc:\n    print("HARNESS_JSON:" + json.dumps({"ok": False, "error": str(exc)}, separators=(",", ":")))\n    raise\n`;
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
      strictObject(operation, ['operation', 'name', 'color', 'roughness', 'metallic', 'emission'], kind);
      requireKeys(operation, ['name', 'color', 'roughness', 'metallic'], kind);
      validateAllowedName(operation.name, allowed);
      validateMaterialValues(operation, kind);
      break;
    }
    case 'shared_material': {
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
    case 'render_settings': {
      strictObject(operation, ['operation', 'width', 'height', 'samples'], kind);
      requireKeys(operation, ['width', 'height', 'samples'], kind);
      for (const field of ['width', 'height', 'samples']) {
        if (!Number.isInteger(operation[field])) fail(`${kind}.${field} must be an integer`);
      }
      validateFiniteNumber(operation.width, `${kind}.width`, 16, 4096);
      validateFiniteNumber(operation.height, `${kind}.height`, 16, 4096);
      validateFiniteNumber(operation.samples, `${kind}.samples`, 1, 1024);
      break;
    }
    default:
      fail(`unsupported operation: ${kind}`);
  }
  return { kind, allowed };
}

function creationGuard(name) {
  return `if bpy.data.objects.get(${quote(name)}) is not None:\n    raise RuntimeError("object already exists")`;
}

function createMeshCode(operation) {
  const primitive = {
    cube: `verts = [(-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1), (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]\nfaces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]`,
    plane: `verts = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]\nfaces = [(0, 1, 2, 3)]`,
    cylinder: `from math import sin, cos, pi\nsegments = 32\nverts = [(cos(2 * pi * segment / segments), sin(2 * pi * segment / segments), z) for z in (-1, 1) for segment in range(segments)]\nfaces = [tuple(reversed(range(segments))), tuple(range(segments, 2 * segments))]\nfor segment in range(segments):\n    next_segment = (segment + 1) % segments\n    faces.append((segment, next_segment, segments + next_segment, segments + segment))`,
    uv_sphere: `from math import sin, cos, pi\nverts = [(0, 0, 1)]\nfaces = []\nsegments, rings = 16, 8\nfor ring in range(1, rings):\n    phi = pi * ring / rings\n    for segment in range(segments):\n        theta = 2 * pi * segment / segments\n        verts.append((sin(phi) * cos(theta), sin(phi) * sin(theta), cos(phi)))\nbottom = len(verts)\nverts.append((0, 0, -1))\nlast_ring = 1 + (rings - 2) * segments\nfor segment in range(segments):\n    next_segment = (segment + 1) % segments\n    faces.append((0, 1 + segment, 1 + next_segment))\n    faces.append((bottom, last_ring + next_segment, last_ring + segment))\nfor ring in range(rings - 2):\n    for segment in range(segments):\n        next_segment = (segment + 1) % segments\n        a = 1 + ring * segments + segment\n        b = 1 + ring * segments + next_segment\n        c = 1 + (ring + 1) * segments + next_segment\n        d = 1 + (ring + 1) * segments + segment\n        faces.append((a, d, c, b))`,
  }[operation.primitive];
  const name = quote(operation.name);
  return `${objectModeGuard()}\n${creationGuard(operation.name)}\n${primitive}\nmesh = bpy.data.meshes.new(${name} + "_Mesh")\nmesh.from_pydata(verts, [], faces)\nmesh.update()\nobj = bpy.data.objects.new(${name}, mesh)\nbpy.context.collection.objects.link(obj)\nobj.location = ${quote(operation.location)}\nobj.scale = ${quote(operation.scale)}\n${jsonReceipt('create_mesh', operation.name)}`;
}

function operationBody(operation) {
  switch (operation.operation) {
    case 'create_mesh':
      return createMeshCode(operation);
    case 'transform': {
      const fields = [];
      if (Object.hasOwn(operation, 'location')) fields.push(`obj.location = ${quote(operation.location)}`);
      if (Object.hasOwn(operation, 'rotation')) fields.push(`obj.rotation_euler = ${quote(operation.rotation)}`);
      if (Object.hasOwn(operation, 'scale')) fields.push(`obj.scale = ${quote(operation.scale)}`);
      return `${objectModeGuard()}\n${objectLookup(operation.name)}\n${fields.join('\n')}\n${jsonReceipt('transform', operation.name)}`;
    }
    case 'material': {
      const emission = operation.emission ? `\nemission_socket = bsdf.inputs.get('Emission Color')\nif emission_socket is None:\n    emission_socket = bsdf.inputs.get('Emission')\nif emission_socket is None:\n    raise RuntimeError("Principled emission input not found")\nemission_socket.default_value = ${quote(operation.emission.color)}\nbsdf.inputs['Emission Strength'].default_value = ${operation.emission.strength}` : '';
      return `${objectModeGuard()}\n${objectLookup(operation.name)}\nif obj.type != 'MESH':\n    raise RuntimeError("material requires mesh object")\nmaterial = bpy.data.materials.new(${quote(operation.name)} + "_Material")\nmaterial.use_nodes = True\nbsdf = next((node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED'), None)\nif bsdf is None:\n    raise RuntimeError("Principled BSDF node not found")\nbsdf.inputs['Base Color'].default_value = ${quote(operation.color)}\nbsdf.inputs['Roughness'].default_value = ${operation.roughness}\nbsdf.inputs['Metallic'].default_value = ${operation.metallic}${emission}\nif obj.data.users > 1 or not obj.data.is_editable:\n    obj.data = obj.data.copy()\nif obj.data.materials:\n    obj.active_material = material\nelse:\n    obj.data.materials.append(material)\n${jsonReceipt('material', operation.name)}`;
    }
    case 'shared_material': {
      const emission = operation.emission ? `\nemission_socket = bsdf.inputs.get('Emission Color')\nif emission_socket is None:\n    emission_socket = bsdf.inputs.get('Emission')\nif emission_socket is None:\n    raise RuntimeError("Principled emission input not found")\nemission_socket.default_value = ${quote(operation.emission.color)}\nbsdf.inputs['Emission Strength'].default_value = ${operation.emission.strength}` : '';
      const assign = operation.objects.map((name) => `${objectLookup(name)}\nif obj.type != 'MESH':\n    raise RuntimeError("shared_material requires mesh objects")\nif obj.data.users > 1 or not obj.data.is_editable:\n    obj.data = obj.data.copy()\nif obj.data.materials:\n    obj.active_material = material\nelse:\n    obj.data.materials.append(material)`).join('\n');
      return `${objectModeGuard()}\nmaterial = bpy.data.materials.new(${quote(operation.name)} + "_Material")\nmaterial.use_nodes = True\nbsdf = next((node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED'), None)\nif bsdf is None:\n    raise RuntimeError("Principled BSDF node not found")\nbsdf.inputs['Base Color'].default_value = ${quote(operation.color)}\nbsdf.inputs['Roughness'].default_value = ${operation.roughness}\nbsdf.inputs['Metallic'].default_value = ${operation.metallic}${emission}\n${assign}\n${jsonReceipt('shared_material', operation.name)}`;
    }
    case 'duplicate': {
      const overrides = [];
      if (Object.hasOwn(operation, 'location')) overrides.push(`duplicate.location = ${quote(operation.location)}`);
      if (Object.hasOwn(operation, 'rotation')) overrides.push(`duplicate.rotation_euler = ${quote(operation.rotation)}`);
      if (Object.hasOwn(operation, 'scale')) overrides.push(`duplicate.scale = ${quote(operation.scale)}`);
      return `${objectModeGuard()}\n${objectLookup(operation.name)}\n${creationGuard(operation.new_name)}\nduplicate = obj.copy()\nduplicate.data = obj.data.copy()\nduplicate.name = ${quote(operation.new_name)}\nbpy.context.collection.objects.link(duplicate)\n${overrides.join('\n')}\n${jsonReceipt('duplicate', operation.new_name)}`;
    }
    case 'create_light': {
      const color = Object.hasOwn(operation, 'color') ? `\nlight_data.color = ${quote(operation.color)}` : '';
      const temperature = Object.hasOwn(operation, 'temperature') ? `\nif not hasattr(light_data, 'temperature'):\n    raise RuntimeError("light temperature unavailable")\nlight_data.temperature = ${operation.temperature}\nif hasattr(light_data, 'use_temperature'):\n    light_data.use_temperature = True` : '';
      return `${objectModeGuard()}\n${creationGuard(operation.name)}\nlight_enum = ${quote(operation.kind)}\n${enumValues('bpy.types.Light', 'type')}\nif light_enum not in valid_values:\n    raise RuntimeError("unsupported light type")\nlight_data = bpy.data.lights.new(${quote(operation.name)} + "_Light", type=light_enum)\nlight_data.energy = ${operation.energy}${color}${temperature}\nlight = bpy.data.objects.new(${quote(operation.name)}, light_data)\nbpy.context.collection.objects.link(light)\nlight.location = ${quote(operation.location)}\n${jsonReceipt('create_light', operation.name)}`;
    }
    case 'create_camera': {
      const dof = operation.dof ? `\ncamera_data.dof.use_dof = True\ncamera_data.dof.aperture_fstop = ${operation.dof.aperture}\ncamera_data.dof.focus_distance = ${operation.dof.focus_distance}${Object.hasOwn(operation.dof, 'focus_object') ? `\nfocus_object = bpy.data.objects.get(${quote(operation.dof.focus_object)})\nif focus_object is None:\n    raise RuntimeError("DOF focus object not found")\ncamera_data.dof.focus_object = focus_object` : ''}` : '';
      return `${objectModeGuard()}\n${creationGuard(operation.name)}\ncamera_data = bpy.data.cameras.new(${quote(operation.name)} + "_Camera")\ncamera_data.lens = ${operation.lens}\ncamera = bpy.data.objects.new(${quote(operation.name)}, camera_data)\nbpy.context.collection.objects.link(camera)\ncamera.location = ${quote(operation.location)}\ncamera.rotation_euler = ${quote(operation.rotation)}${dof}\n${jsonReceipt('create_camera', operation.name)}`;
    }
    case 'set_camera':
      return `${objectModeGuard()}\n${objectLookup(operation.name)}\nif obj.type != 'CAMERA':\n    raise RuntimeError("set_camera requires camera object")\nbpy.context.scene.camera = obj\n${jsonReceipt('set_camera', operation.name)}`;
    case 'render_settings':
      return `scene = bpy.context.scene\nscene.render.resolution_x = ${operation.width}\nscene.render.resolution_y = ${operation.height}\nscene.render.resolution_percentage = 100\nif hasattr(scene, 'cycles') and hasattr(scene.cycles, 'samples'):\n    scene.cycles.samples = ${operation.samples}\nif hasattr(scene, 'eevee') and hasattr(scene.eevee, 'taa_render_samples'):\n    scene.eevee.taa_render_samples = ${operation.samples}\n${jsonReceipt('render_settings')}`;
    case 'delete_object':
      return `${objectModeGuard()}\n${objectLookup(operation.name)}\nbpy.data.objects.remove(obj, do_unlink=True)\n${jsonReceipt('delete_object', operation.name)}`;
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

function renderPreflightCode(scenePath) {
  validateProjectPath(scenePath, 'scenePath');
  return `import bpy\nimport json\nimport os\n\nexpected = ${quote(scenePath)}\ncurrent = bpy.data.filepath\nif not current or os.path.normcase(os.path.abspath(bpy.path.abspath(current))) != os.path.normcase(os.path.abspath(bpy.path.abspath(expected))):\n    raise RuntimeError("scene filepath mismatch")\nscene = bpy.context.scene\ncamera = scene.camera\nif camera is None:\n    raise RuntimeError("scene camera is not set")\nif camera.type != 'CAMERA':\n    raise RuntimeError("scene camera is not a camera object")\nif not getattr(scene, 'render', None):\n    raise RuntimeError("scene render settings unavailable")\nif int(scene.render.resolution_x) < 16 or int(scene.render.resolution_y) < 16:\n    raise RuntimeError("render resolution is invalid")\nprint("HARNESS_JSON:" + json.dumps({"ok": True, "camera": camera.name, "resolution": [scene.render.resolution_x, scene.render.resolution_y]}, separators=(",", ":")))\n`;
}

function renderCode(scenePath, renderPath) {
  validateProjectPath(scenePath, 'scenePath');
  validateRenderPath(renderPath);
  const sceneLiteral = quote(scenePath);
  const renderLiteral = quote(renderPath);
  return `import bpy\nimport json\nimport os\n\nexpected = ${sceneLiteral}\ncurrent = bpy.data.filepath\nif not current or os.path.normcase(os.path.abspath(bpy.path.abspath(current))) != os.path.normcase(os.path.abspath(bpy.path.abspath(expected))):\n    raise RuntimeError("scene filepath mismatch")\nscene = bpy.context.scene\nimage_settings = scene.render.image_settings\n${enumValues('bpy.types.ImageFormatSettings', 'file_format')}\nif 'PNG' not in valid_values:\n    raise RuntimeError("PNG render format is unavailable")\nold_filepath = scene.render.filepath\nold_resolution_percentage = scene.render.resolution_percentage\nold_file_format = image_settings.file_format\nold_color_mode = image_settings.color_mode\nold_color_depth = image_settings.color_depth\nold_use_file_extension = scene.render.use_file_extension\ntry:\n    image_settings.file_format = 'PNG'\n    scene.render.use_file_extension = True\n    scene.render.filepath = ${renderLiteral}\n    scene.render.resolution_percentage = 100\n    bpy.ops.render.render(write_still=True)\nfinally:\n    image_settings.file_format = old_file_format\n    image_settings.color_mode = old_color_mode\n    image_settings.color_depth = old_color_depth\n    scene.render.use_file_extension = old_use_file_extension\n    scene.render.filepath = old_filepath\n    scene.render.resolution_percentage = old_resolution_percentage\nprint("HARNESS_JSON:" + json.dumps({"ok": True, "filepath": ${renderLiteral}}, separators=(",", ":")))\n`;
}

export { MAX_BATCH, OPERATION_NAMES, PRIMITIVES, operationBatchCode, operationCode, preflightCode, renderCode, renderPreflightCode, saveCode };
