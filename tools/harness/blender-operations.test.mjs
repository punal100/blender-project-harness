import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { MAX_BATCH, operationBatchCode, operationCode, preflightCode, renderCode, renderPreflightCode, saveCode } from './blender-operations.mjs';

const allowed = ['Cube', 'Camera', 'Lamp'];

function runPython(source, input) {
  const result = spawnSync('python', ['-I', '-B', '-c', source], {
    input: JSON.stringify(input), encoding: 'utf8', timeout: 10000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const receipt = result.stdout.split(/\r?\n/).find((line) => line.startsWith('TEST_JSON:'));
  assert.ok(receipt, result.stdout);
  return JSON.parse(receipt.slice('TEST_JSON:'.length));
}

const meshOperation = (primitive = 'cube') => ({
  operation: 'create_mesh', name: 'Cube', primitive, location: [0, 0, 0], scale: [1, 1, 1],
});

test('names accept exact printable ASCII including spaces, reject blank/control/long names', () => {
  for (const name of ['Floor Lamp', ' Cube ', 'x'.repeat(100), String.fromCharCode(...Array.from({ length: 95 }, (_, i) => i + 32))]) {
    assert.doesNotThrow(() => operationCode({ operation: 'delete_object', name }, [name]));
  }
  for (const name of ['', '   ', 'x'.repeat(101), 'Cube\n', 'Cube\r', 'A\tB', 'A\0B', 'A\x7fB', 'A\u00e9B']) {
    assert.throws(() => operationCode({ operation: 'delete_object', name }, [name]), /ASCII/);
  }
});

test('operation schema rejects custom prototypes, inherited fields, and hidden extra keys', () => {
  const valid = { operation: 'delete_object', name: 'Cube' };
  for (const value of [Object.create(valid), new (class { constructor() { Object.assign(this, valid); } })(), [], new Date()]) {
    assert.throws(() => operationCode(value, allowed), /must be an object/);
  }
  assert.doesNotThrow(() => operationCode(Object.assign(Object.create(null), valid), allowed));
  assert.throws(() => operationCode({ ...valid, [Symbol('extra')]: true }, allowed), /extra key/);
  assert.throws(() => operationCode(Object.defineProperty({ ...valid }, 'extra', { value: true }), allowed), /extra key/);
  Object.defineProperty(Object.prototype, 'location', { value: [0, 0, 0], configurable: true });
  try {
    assert.throws(() => operationCode({ operation: 'transform', name: 'Cube' }, allowed), /requires/);
    assert.throws(() => operationCode({ operation: 'create_light', name: 'Lamp', kind: 'POINT', energy: 1 }, allowed), /location is required/);
  } finally {
    delete Object.prototype.location;
  }
  Object.defineProperty(Object.prototype, 'inheritedExtra', { value: true, enumerable: true, configurable: true });
  try {
    assert.throws(() => operationCode(valid, allowed), /inherited key/);
  } finally {
    delete Object.prototype.inheritedExtra;
  }
  assert.throws(() => operationCode({ name: 'Cube' }, allowed), /operation is required/);
});

test('all spatial vectors and scale enforce finite inclusive bounds', () => {
  const operations = [
    [meshOperation(), ['location']],
    [{ operation: 'transform', name: 'Cube', location: [0, 0, 0], rotation: [0, 0, 0] }, ['location', 'rotation']],
    [{ operation: 'create_light', name: 'Lamp', kind: 'POINT', location: [0, 0, 0], energy: 1 }, ['location']],
    [{ operation: 'create_camera', name: 'Camera', location: [0, 0, 0], rotation: [0, 0, 0], lens: 50 }, ['location', 'rotation']],
  ];
  for (const [operation, fields] of operations) {
    for (const field of fields) {
      assert.doesNotThrow(() => operationCode({ ...operation, [field]: [-1e6, 0, 1e6] }, allowed));
      for (const bad of [-1e6 - 1, 1e6 + 1, NaN, Infinity, -Infinity, '1', null, undefined]) {
        for (let axis = 0; axis < 3; axis++) {
          const vector = [0, 0, 0];
          vector[axis] = bad;
          assert.throws(() => operationCode({ ...operation, [field]: vector }, allowed), /finite|bounds/);
        }
      }
      assert.throws(() => operationCode({ ...operation, [field]: Array(3) }, allowed), /finite/);
      assert.throws(() => operationCode({ ...operation, [field]: [0, 0] }, allowed), /array of 3/);
    }
  }
  for (const operation of [meshOperation(), { operation: 'transform', name: 'Cube' }]) {
    assert.doesNotThrow(() => operationCode({ ...operation, scale: [Number.MIN_VALUE, 1, 1e4] }, allowed));
    for (const bad of [0, -1, 1e4 + 1, NaN, Infinity]) {
      assert.throws(() => operationCode({ ...operation, scale: [1, bad, 1] }, allowed), /finite|bounds|positive/);
    }
  }
});

test('energy and positive lens enforce upper bounds', () => {
  const light = { operation: 'create_light', name: 'Lamp', kind: 'POINT', location: [0, 0, 0] };
  const camera = { operation: 'create_camera', name: 'Camera', location: [0, 0, 0], rotation: [0, 0, 0] };
  for (const energy of [0, 1e9]) assert.doesNotThrow(() => operationCode({ ...light, energy }, allowed));
  for (const lens of [Number.MIN_VALUE, 1e4]) assert.doesNotThrow(() => operationCode({ ...camera, lens }, allowed));
  for (const energy of [-1, 1e9 + 1, NaN, Infinity]) assert.throws(() => operationCode({ ...light, energy }, allowed), /finite|bounds/);
  for (const lens of [-1, 0, 1e4 + 1, NaN, Infinity]) assert.throws(() => operationCode({ ...camera, lens }, allowed), /finite|bounds/);
});

test('material vectors retain tighter color bounds and reject sparse components', () => {
  const operation = { operation: 'material', name: 'Cube', color: [0, 1, 0, 1], roughness: 0, metallic: 1 };
  assert.doesNotThrow(() => operationCode(operation, allowed));
  for (const bad of [-0.01, 1.01, NaN, Infinity]) {
    for (const field of ['roughness', 'metallic']) {
      assert.throws(() => operationCode({ ...operation, [field]: bad }, allowed), /finite|bounds/);
    }
    assert.throws(() => operationCode({ ...operation, color: [0, 0, bad, 1] }, allowed), /finite|bounds/);
  }
  assert.throws(() => operationCode({ ...operation, color: Array(4) }, allowed), /finite/);
});

test('operationCode emits bounded create_mesh script', () => {
  const code = operationCode({
    operation: 'create_mesh',
    name: 'Cube',
    primitive: 'cube',
    location: [0, 1, 2],
    scale: [1, 2, 3],
  }, allowed);
  assert.match(code, /HARNESS_JSON:/);
  assert.match(code, /bpy\.data\.meshes\.new/);
  assert.match(code, /mesh\.from_pydata/);
  assert.doesNotMatch(code, /bpy\.ops\.mesh/);
  assert.doesNotMatch(code, /exec\(|eval\(|__import__/);
});

test('operationCode validates extra keys, names, bounds, and enums', () => {
  assert.throws(() => operationCode({ operation: 'delete_object', name: 'Cube', extra: true }, allowed), /extra key/);
  assert.throws(() => operationCode({ operation: 'delete_object', name: 'Other' }, allowed), /not allowed/);
  assert.throws(() => operationCode({ operation: 'render_settings', width: 15, height: 100, samples: 1 }, []), /out of bounds/);
  assert.throws(() => operationCode({ operation: 'create_light', name: 'Lamp', kind: 'AREA', location: [0, 0, 0], energy: -1 }, allowed), /out of bounds/);
  assert.throws(() => operationCode({ operation: 'create_camera', name: 'Camera', location: [0, 0, 0], rotation: [0, 0, 0], lens: 0 }, allowed), /out of bounds/);
  assert.throws(() => operationCode({ operation: 'transform', name: 'Cube' }, allowed), /requires/);
});

test('operationCode includes dynamic enum checks and object mode guards', () => {
  const light = operationCode({ operation: 'create_light', name: 'Lamp', kind: 'POINT', location: [0, 0, 0], energy: 10 }, allowed);
  assert.match(light, /bl_rna\.properties/);
  assert.match(light, /valid_values/);
  assert.match(light, /bpy\.context\.mode != 'OBJECT'/);
  const material = operationCode({ operation: 'material', name: 'Cube', color: [1, 0, 0, 1], roughness: 0.5, metallic: 0 }, allowed);
  assert.match(material, /node\.type == 'BSDF_PRINCIPLED'/);
});

test('render settings accepts empty allow-list', () => {
  const code = operationCode({ operation: 'render_settings', width: 1920, height: 1080, samples: 64 }, []);
  assert.match(code, /resolution_x = 1920/);
  assert.match(code, /HARNESS_JSON:/);
});

test('batched apply validates one to ten operations', () => {
  const batch = operationBatchCode({ operations: [meshOperation(), { operation: 'transform', name: 'Cube', location: [0, 1, 0] }] }, allowed);
  assert.equal(batch.length, 2);
  assert.equal(MAX_BATCH, 10);
  assert.throws(() => operationBatchCode({ operations: [] }, allowed), /1-10/);
  assert.throws(() => operationBatchCode({ operations: Array.from({ length: 11 }, () => ({ operation: 'delete_object', name: 'Cube' })) }, allowed), /1-10/);
  assert.throws(() => operationBatchCode({ operations: [meshOperation()], extra: true }, allowed), /extra key/);
});

test('camera DOF, light color/temperature, emission, shared materials, and duplicates generate guarded code', () => {
  const camera = operationCode({ operation: 'create_camera', name: 'Camera', location: [0, 0, 0], rotation: [0, 0, 0], lens: 50, dof: { aperture: 2.8, focus_distance: 3, focus_object: 'Cube' } }, allowed);
  assert.match(camera, /use_dof = True/);
  assert.match(camera, /aperture_fstop = 2.8/);
  assert.match(camera, /focus_object/);
  const light = operationCode({ operation: 'create_light', name: 'Lamp', kind: 'AREA', location: [0, 0, 0], energy: 100, color: [1, 0.7, 0.5], temperature: 3200 }, allowed);
  assert.match(light, /light_data\.color/);
  assert.match(light, /light_data\.temperature = 3200/);
  const material = operationCode({ operation: 'material', name: 'Cube', color: [0.2, 0.3, 0.4, 1], roughness: 0.4, metallic: 0.2, emission: { color: [1, 0.5, 0.2, 1], strength: 2 } }, allowed);
  assert.match(material, /Emission Color/);
  assert.match(material, /Emission Strength/);
  const shared = operationCode({ operation: 'shared_material', name: 'Wood', objects: ['Cube', 'Lamp'], color: [1, 1, 1, 1], roughness: 0.5, metallic: 0 }, allowed);
  assert.match(shared, /shared_material/);
  assert.match(shared, /bpy\.data\.materials\.new/);
  const duplicate = operationCode({ operation: 'duplicate', name: 'Cube', new_name: 'Copy', location: [1, 0, 0] }, [...allowed, 'Copy']);
  assert.match(duplicate, /duplicate\.data = obj\.data\.copy\(\)/);
  assert.match(duplicate, /duplicate\.location/);
});

test('asset, image, audio, validation, and export operations generate bounded code', () => {
  const full = [...allowed, 'Imported', 'Linked', 'Reference', 'Rain'];
  const imported = operationCode({
    operation: 'import_asset',
    name: 'Imported',
    path: 'assets/models/model.glb',
    location: [0, 0, 0],
  }, full);
  assert.match(imported, /bpy\.data\.libraries\.load|import_scene\.gltf/);
  assert.match(imported, /creation_parent/);
  const external = operationCode({
    operation: 'import_asset',
    name: 'Imported',
    path: 'assets/external/vendor/asset/model.fbx',
  }, full);
  assert.match(external, /SOURCE\.md/);
  assert.match(external, /LICENSE\.txt/);
  const library = operationCode({
    operation: 'link_library',
    name: 'Linked',
    path: 'assets/models/library.blend',
    link: true,
  }, full);
  assert.match(library, /bpy\.data\.libraries\.load/);
  assert.match(library, /link=True/);
  const reference = operationCode({
    operation: 'image_reference',
    name: 'Reference',
    path: 'Documents/References/mood.png',
    location: [1, 2, 3],
  }, full);
  assert.match(reference, /empty_display_type = 'IMAGE'/);
  assert.match(reference, /hide_render = True/);
  const texture = operationCode({
    operation: 'image_texture',
    name: 'Wood',
    objects: ['Cube'],
    path: 'assets/textures/wood.png',
    roughness: 0.5,
    metallic: 0,
    colorSpace: 'sRGB',
  }, full);
  assert.match(texture, /ShaderNodeTexImage/);
  assert.match(texture, /ShaderNodeTexCoord/);
  assert.match(texture, /colorspace_settings\.name/);
  const hdri = operationCode({
    operation: 'world_hdri',
    path: 'assets/hdri/studio.exr',
    strength: 1.2,
    rotation: 0.5,
  }, full);
  assert.match(hdri, /ShaderNodeTexEnvironment/);
  assert.match(hdri, /ShaderNodeBackground/);
  const audio = operationCode({
    operation: 'import_audio',
    name: 'Rain',
    path: 'assets/audio/rain.ogg',
    volume: 0.6,
  }, full);
  assert.match(audio, /bpy\.data\.sounds\.load/);
  assert.match(audio, /bpy\.data\.speakers\.new/);
  const checked = operationCode({ operation: 'check_assets' }, []);
  assert.match(checked, /blend_paths/);
  assert.match(checked, /missing/);
  const packed = operationCode({ operation: 'pack_assets' }, []);
  assert.match(packed, /pack_all/);
  const exported = operationCode({ operation: 'export_scene', format: 'glb', path: 'exports/room.glb' }, []);
  assert.match(exported, /export_scene\.gltf/);
  assert.match(exported, /export_format='GLB'/);
  assert.throws(() => operationCode({ operation: 'import_asset', name: 'Imported', path: '../outside.glb' }, full), /stay within/);
  assert.throws(() => operationCode({ operation: 'import_asset', name: 'Imported', path: 'C:\\outside.glb' }, full), /relative/);
  assert.throws(() => operationCode({ operation: 'import_asset', name: 'Imported', path: 'assets/models/model.txt' }, full), /extension/);
  assert.throws(() => operationCode({ operation: 'export_scene', format: 'glb', path: 'exports/room.fbx' }, []), /extension/);
  assert.throws(() => operationCode({ operation: 'export_scene', format: 'glb', path: 'scenes/room.glb' }, []), /under exports/);
  assert.throws(() => operationCode({ operation: 'image_texture', name: 'Wood', objects: ['Cube'], path: 'assets/textures/wood.txt', roughness: 0.5, metallic: 0 }, full), /extension/);
});

test('preflight, save, and render code enforce explicit project paths', () => {
  const preflight = preflightCode('//project.blend');
  assert.match(preflight, /bpy\.utils\.blend_paths\(absolute=True, packed=False, local=True\)/);
  assert.match(preflight, /is_dirty/);
  assert.match(preflight, /HARNESS_JSON:/);
  const save = saveCode('//project.blend');
  assert.match(save, /bpy\.ops\.wm\.save_as_mainfile/);
  assert.match(save, /check_existing=False/);
  assert.match(save, /refusing mismatched existing scene filepath/);
  assert.doesNotMatch(save, /preferences|save_version|save_userpref/);
  const render = renderCode('//project.blend', '//renders/frame.png');
  assert.match(render, /try:/);
  assert.match(render, /finally:/);
  assert.match(render, /write_still=True/);
  assert.doesNotMatch(render, /save_as_mainfile/);
  const camera = renderPreflightCode('//project.blend');
  assert.match(camera, /scene camera is not set/);
  assert.match(camera, /camera\.type != 'CAMERA'/);
  assert.match(camera, /resolution is invalid/);
  assert.throws(() => renderCode('//project.blend', 'C:\\outside.png'), /project-relative/);
});

test('every operation and lifecycle script compiles as Python without importing Blender', () => {
  const operations = [
    ...['cube', 'plane', 'uv_sphere', 'cylinder'].map(meshOperation),
    { operation: 'transform', name: 'Cube', location: [1, 2, 3], rotation: [0, 1, 2], scale: [1, 1, 1] },
    { operation: 'material', name: 'Cube', color: [1, 0, 0, 1], roughness: 0.5, metallic: 0, emission: { color: [1, 0.4, 0.2, 1], strength: 1 } },
    { operation: 'shared_material', name: 'Wood', objects: ['Cube', 'Lamp'], color: [1, 0, 0, 1], roughness: 0.5, metallic: 0 },
    { operation: 'duplicate', name: 'Cube', new_name: 'Copy' },
    { operation: 'create_light', name: 'Lamp', kind: 'AREA', location: [0, 0, 0], energy: 100, color: [1, 0.7, 0.5], temperature: 3200 },
    { operation: 'create_camera', name: 'Camera', location: [0, 0, 0], rotation: [0, 0, 0], lens: 50, dof: { aperture: 2.8, focus_distance: 3, focus_object: 'Cube' } },
    { operation: 'set_camera', name: 'Camera' }, { operation: 'delete_object', name: 'Cube' },
    { operation: 'render_settings', width: 1920, height: 1080, samples: 64 },
    { ...meshOperation(), name: 'Floor "Lamp" \\ 1' },
    { operation: 'import_asset', name: 'Imported', path: 'assets/models/model.glb' },
    { operation: 'link_library', name: 'Linked', path: 'assets/models/library.blend', link: true },
    { operation: 'import_audio', name: 'Rain', path: 'assets/audio/rain.ogg', volume: 0.6 },
    { operation: 'image_reference', name: 'Reference', path: 'Documents/References/mood.png' },
    { operation: 'image_texture', name: 'Wood', objects: ['Cube'], path: 'assets/textures/wood.png', roughness: 0.5, metallic: 0 },
    { operation: 'world_hdri', path: 'assets/hdri/studio.exr', strength: 1.2 },
    { operation: 'check_assets' },
    { operation: 'pack_assets' },
    { operation: 'export_scene', format: 'glb', path: 'exports/room.glb' },
  ];
  const scripts = operations.map((operation) => operationCode(operation, [...allowed, 'Copy', 'Floor "Lamp" \\ 1', 'Imported', 'Linked', 'Rain', 'Reference']));
  scripts.push(preflightCode('//project.blend'), saveCode('//project.blend'), renderPreflightCode('//project.blend'), renderCode('//project.blend', '//renders/frame.png'));
  const count = runPython(`import json, sys
scripts = json.load(sys.stdin)
for code in scripts:
    compile(code, '<generated>', 'exec')
print('TEST_JSON:' + json.dumps(len(scripts)))`, scripts);
  assert.equal(count, scripts.length);
});

test('generated primitives execute against mock bpy with nondegenerate outward manifold topology', () => {
  const scripts = Object.fromEntries(['cube', 'plane', 'uv_sphere', 'cylinder'].map((primitive) => [primitive, operationCode(meshOperation(primitive), allowed)]));
  const meshes = runPython(`import json, sys, types
scripts = json.load(sys.stdin)
result = {}
class Mesh:
    def from_pydata(self, verts, edges, faces):
        self.verts, self.faces = verts, faces
    def update(self):
        pass
for primitive, code in scripts.items():
    mesh = Mesh()
    bpy = types.ModuleType('bpy')
    bpy.data = types.SimpleNamespace(
        objects=types.SimpleNamespace(get=lambda name: None, new=lambda name, data: types.SimpleNamespace(data=data)),
        meshes=types.SimpleNamespace(new=lambda name: mesh))
    bpy.context = types.SimpleNamespace(mode='OBJECT', collection=types.SimpleNamespace(objects=types.SimpleNamespace(link=lambda obj: None)))
    sys.modules['bpy'] = bpy
    exec(compile(code, '<geometry>', 'exec'), {})
    result[primitive] = {'verts': mesh.verts, 'faces': mesh.faces}
print('TEST_JSON:' + json.dumps(result))`, scripts);
  const subtract = (a, b) => a.map((v, i) => v - b[i]);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
  for (const [primitive, { verts, faces }] of Object.entries(meshes)) {
    assert.equal(new Set(verts.map((v) => v.map((n) => n.toFixed(10)).join(','))).size, verts.length, `${primitive}: duplicate vertices`);
    const edges = new Map();
    for (const face of faces) {
      assert.equal(new Set(face).size, face.length);
      assert.ok(face.every((index) => Number.isInteger(index) && index >= 0 && index < verts.length));
      const normal = cross(subtract(verts[face[1]], verts[face[0]]), subtract(verts[face[2]], verts[face[0]]));
      assert.ok(dot(normal, normal) > 1e-16, `${primitive}: degenerate face`);
      const center = [0, 1, 2].map((axis) => face.reduce((sum, index) => sum + verts[index][axis], 0) / face.length);
      assert.ok(primitive === 'plane' ? normal[2] > 0 : dot(normal, center) > 0, `${primitive}: inward face`);
      for (let i = 0; i < face.length; i++) {
        const a = face[i], b = face[(i + 1) % face.length];
        const key = [Math.min(a, b), Math.max(a, b)].join(',');
        const uses = edges.get(key) ?? [];
        uses.push(a < b ? 1 : -1);
        edges.set(key, uses);
      }
    }
    if (primitive !== 'plane') {
      assert.ok([...edges.values()].every((uses) => uses.length === 2 && uses[0] + uses[1] === 0), `${primitive}: non-manifold/inconsistent winding`);
      assert.equal(verts.length - edges.size + faces.length, 2, `${primitive}: Euler characteristic`);
    }
  }
  assert.equal(meshes.cylinder.verts.length, 64);
  assert.equal(meshes.cylinder.faces.filter((f) => f.length === 32).length, 2);
  assert.equal(meshes.cylinder.faces.filter((f) => f.length === 4).length, 32);
  assert.equal(meshes.uv_sphere.verts.length, 114);
  assert.equal(meshes.uv_sphere.faces.filter((f) => f.length === 3).length, 32);
  assert.equal(meshes.uv_sphere.faces.filter((f) => f.length === 4).length, 96);
});

test('material mock execution copies shared/read-only meshes and changes only active slot', () => {
  const code = operationCode({ operation: 'material', name: 'Cube', color: [1, 0, 0, 1], roughness: 0.5, metallic: 0 }, allowed);
  assert.doesNotMatch(code, /materials\.clear/);
  const count = runPython(`import json, sys, types
code = json.load(sys.stdin)
class Mesh:
    def __init__(self, users, editable, slots):
        self.users, self.is_editable, self.materials = users, editable, list(slots)
        self.copies = 0
    def copy(self):
        self.copies += 1
        return Mesh(1, True, self.materials)
class Object:
    type = 'MESH'
    def __init__(self, mesh):
        self.data = mesh
        self.active_material_index = 1 if mesh.materials else 0
    @property
    def active_material(self):
        return self.data.materials[self.active_material_index]
    @active_material.setter
    def active_material(self, material):
        assert self.data.is_editable
        self.data.materials[self.active_material_index] = material
count = 0
for users, editable in [(2, True), (1, False), (1, True)]:
    for slots in [[], ['first', 'active', 'last']]:
        mesh = Mesh(users, editable, slots)
        obj = Object(mesh)
        inputs = {name: types.SimpleNamespace(default_value=None) for name in ['Base Color', 'Roughness', 'Metallic']}
        node = types.SimpleNamespace(type='BSDF_PRINCIPLED', inputs=inputs)
        material = types.SimpleNamespace(node_tree=types.SimpleNamespace(nodes=[node]))
        bpy = types.ModuleType('bpy')
        bpy.context = types.SimpleNamespace(mode='OBJECT')
        bpy.data = types.SimpleNamespace(objects={'Cube': obj}, materials=types.SimpleNamespace(new=lambda name: material))
        sys.modules['bpy'] = bpy
        exec(compile(code, '<material>', 'exec'), {})
        should_copy = users > 1 or not editable
        assert (obj.data is not mesh) == should_copy
        assert mesh.copies == int(should_copy)
        if should_copy:
            assert mesh.materials == slots
        assert len(obj.data.materials) == (len(slots) or 1)
        if slots:
            assert obj.data.materials[0] == 'first'
            assert obj.data.materials[1] is material
            assert obj.data.materials[2] == 'last'
            assert obj.active_material_index == 1
        else:
            assert obj.data.materials[0] is material
        assert inputs['Base Color'].default_value == [1, 0, 0, 1]
        assert inputs['Roughness'].default_value == 0.5
        assert inputs['Metallic'].default_value == 0
        count += 1
print('TEST_JSON:' + json.dumps(count))`, code);
  assert.equal(count, 6);
});

test('render mock execution forces PNG and restores settings after success, failure, and unavailable enum', () => {
  const code = renderCode('//project.blend', '//renders/frame.png');
  assert.doesNotMatch(code, /save_as_mainfile|save_userpref/);
  const count = runPython(`import json, sys, types
code = json.load(sys.stdin)
class ImageSettings:
    def __init__(self):
        self._format = 'OPEN_EXR'
        self.color_mode = 'RGBA'
        self.color_depth = '32'
    @property
    def file_format(self):
        return self._format
    @file_format.setter
    def file_format(self, value):
        self._format = value
        if value == 'PNG':
            self.color_mode = 'RGB'
            self.color_depth = '8'
count = 0
for failure, formats in [(False, ['OPEN_EXR', 'PNG']), (True, ['OPEN_EXR', 'PNG']), (False, ['OPEN_EXR'])]:
    image = ImageSettings()
    render = types.SimpleNamespace(filepath='//original.exr', resolution_percentage=42, image_settings=image, use_file_extension=False)
    calls = []
    def perform_render(*, write_still):
        calls.append(True)
        assert write_still is True
        assert image.file_format == 'PNG'
        assert render.use_file_extension is True
        assert render.filepath == '//renders/frame.png'
        assert render.resolution_percentage == 100
        if failure:
            raise RuntimeError('mock render failure')
    bpy = types.ModuleType('bpy')
    bpy.data = types.SimpleNamespace(filepath='//project.blend')
    bpy.path = types.SimpleNamespace(abspath=lambda path: path)
    bpy.context = types.SimpleNamespace(scene=types.SimpleNamespace(render=render))
    bpy.types = types.SimpleNamespace(ImageFormatSettings=types.SimpleNamespace(bl_rna=types.SimpleNamespace(properties={
        'file_format': types.SimpleNamespace(enum_items=[types.SimpleNamespace(identifier=value) for value in formats])})))
    bpy.ops = types.SimpleNamespace(render=types.SimpleNamespace(render=perform_render))
    sys.modules['bpy'] = bpy
    try:
        exec(compile(code, '<render>', 'exec'), {})
        assert not failure and 'PNG' in formats
    except RuntimeError as exc:
        assert str(exc) == ('mock render failure' if failure else 'PNG render format is unavailable')
    assert len(calls) == int('PNG' in formats)
    assert image.file_format == 'OPEN_EXR'
    assert image.color_mode == 'RGBA'
    assert image.color_depth == '32'
    assert render.filepath == '//original.exr'
    assert render.resolution_percentage == 42
    assert render.use_file_extension is False
    count += 1
print('TEST_JSON:' + json.dumps(count))`, code);
  assert.equal(count, 3);
});
