// Bake the CC0 Quaternius Standard glTF onto the bundled avatar bind poses.
// From the repository root: node scripts/retarget-chapel-motion.mjs /path/to/AnimationLibrary_Godot_Standard.gltf
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { Matrix4, Object3D, Quaternion, Vector3 } from 'three';

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('Supply the path to the Quaternius Standard glTF.');
const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
const buffer = readFileSync(join(dirname(sourcePath), source.buffers[0].uri));
const names = new Map(
  Object.entries({
    Hips: 'DEF-hips',
    Spine: 'DEF-spine.001',
    Spine1: 'DEF-spine.002',
    Spine2: 'DEF-spine.003',
    Neck: 'DEF-neck',
    Head: 'DEF-head',
  }),
);
for (const [side, suffix] of [
  ['Left', '.L'],
  ['Right', '.R'],
]) {
  for (const [part, base] of Object.entries({
    Shoulder: 'shoulder',
    Arm: 'upper_arm',
    ForeArm: 'forearm',
    Hand: 'hand',
    UpLeg: 'thigh',
    Leg: 'shin',
    Foot: 'foot',
    ToeBase: 'toe',
  }))
    names.set(side + part, 'DEF-' + base + suffix);
  for (const [finger, bone] of Object.entries({
    Thumb: 'thumb',
    Index: 'f_index',
    Middle: 'f_middle',
    Ring: 'f_ring',
    Pinky: 'f_pinky',
  })) {
    for (const joint of [1, 2, 3])
      names.set(side + 'Hand' + finger + joint, 'DEF-' + bone + '.0' + joint + suffix);
  }
}
const clips = {
  Sitting_Idle_Loop: 'seated',
  Sitting_Exit: 'stand',
  Walk_Formal_Loop: 'walk',
  Idle_Loop: 'idle',
  Idle_Talking_Loop: 'speak',
  Sitting_Enter: 'sit',
};
function rig(gltf) {
  const nodes = gltf.nodes.map((n) => {
    const o = new Object3D();
    o.name = n.name || '';
    if (n.matrix) new Matrix4().fromArray(n.matrix).decompose(o.position, o.quaternion, o.scale);
    if (n.translation) o.position.fromArray(n.translation);
    if (n.rotation) o.quaternion.fromArray(n.rotation);
    if (n.scale) o.scale.fromArray(n.scale);
    return o;
  });
  gltf.nodes.forEach((node, i) => {
    for (const child of node.children || []) nodes[i].add(nodes[child]);
  });
  const root = new Object3D();
  for (const n of nodes) if (!n.parent) root.add(n);
  root.updateMatrixWorld(true);
  return { root, nodes, byName: new Map(nodes.map((n) => [n.name, n])) };
}
function accessor(i) {
  const a = source.accessors[i],
    v = source.bufferViews[a.bufferView];
  if (a.componentType !== 5126 || v.byteStride) throw new Error('Expected packed float accessors.');
  const width = { SCALAR: 1, VEC3: 3, VEC4: 4 }[a.type];
  return new Float32Array(
    buffer.buffer,
    buffer.byteOffset + (v.byteOffset || 0) + (a.byteOffset || 0),
    a.count * width,
  );
}
const pos = (o) => o.getWorldPosition(new Vector3());
const quat = (o) => o.getWorldQuaternion(new Quaternion());
const delta = (a, b) => pos(b).sub(pos(a)).normalize();
function glb(gltf, bin) {
  const data = Buffer.from(JSON.stringify(gltf));
  const j = Buffer.alloc(Math.ceil(data.length / 4) * 4, 32);
  data.copy(j);
  const header = Buffer.alloc(20);
  header.write('glTF');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + j.length + bin.length, 8);
  header.writeUInt32LE(j.length, 12);
  header.write('JSON', 16);
  const bh = Buffer.alloc(8);
  bh.writeUInt32LE(bin.length, 0);
  bh.write('BIN\0', 4);
  return Buffer.concat([header, j, bh, bin]);
}
const output = 'apps/web/public/avatars/motion';
mkdirSync(output, { recursive: true });
const rigs = {
  mourner: 'mourner',
  visitor: 'visitor',
  mother: 'cast/mother',
  father: 'cast/father',
  sister: 'cast/sister',
  friend: 'cast/friend',
};
const selected = process.argv.slice(3);
for (const [model, path] of Object.entries(rigs)) {
  if (selected.length && !selected.includes(model)) continue;
  const raw = readFileSync('apps/web/public/avatars/' + path + '.glb');
  const src = rig(source),
    dst = rig(JSON.parse(raw.subarray(20, 20 + raw.readUInt32LE(12)).toString()));
  const pairs = [];
  dst.root.traverse((b) => {
    const a = src.byName.get(names.get(b.name));
    if (a) pairs.push({ a, b });
  });
  // Rotate A-pose limbs into the source T-pose. Each bone has its own local axes.
  for (const [base, child] of [
    ['Arm', 'ForeArm'],
    ['ForeArm', 'Hand'],
    ['UpLeg', 'Leg'],
    ['Leg', 'Foot'],
    ['Foot', 'ToeBase'],
  ]) {
    for (const side of ['Left', 'Right']) {
      const b = dst.byName.get(side + base),
        c = dst.byName.get(side + child);
      const a = src.byName.get(names.get(b.name)),
        ac = src.byName.get(names.get(c.name));
      const parent = quat(b.parent),
        turn = new Quaternion().setFromUnitVectors(delta(b, c), delta(a, ac));
      b.quaternion.copy(
        parent.clone().invert().multiply(turn).multiply(parent).multiply(b.quaternion),
      );
      b.updateWorldMatrix(false, true);
    }
  }
  for (const pair of pairs) pair.basis = quat(pair.a).invert().multiply(quat(pair.b));
  const hips = pairs.find((p) => p.b.name === 'Hips'),
    srcHip = pos(hips.a),
    dstHip = pos(hips.b);
  const rest = src.nodes.map((n) => ({
    p: n.position.clone(),
    q: n.quaternion.clone(),
    s: n.scale.clone(),
  }));
  const buffers = [],
    views = [],
    accessors = [],
    animations = [];
  let offset = 0;
  function add(values, type, count, ext = {}) {
    const bytes = Buffer.from(new Float32Array(values).buffer);
    const id = views.length;
    views.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length });
    buffers.push(bytes);
    offset += bytes.length;
    accessors.push({ bufferView: id, componentType: 5126, count, type, ...ext });
    return accessors.length - 1;
  }
  for (const animation of source.animations.filter((a) => clips[a.name])) {
    const channels = animation.channels.map((c) => {
      const s = animation.samplers[c.sampler];
      return {
        node: src.nodes[c.target.node],
        target: c.target.path,
        times: accessor(s.input),
        values: accessor(s.output),
        i: 0,
      };
    });
    const length = Math.max(...channels.map((c) => c.times.at(-1))),
      count = Math.round(length * 24) + 1;
    const times = Array.from({ length: count }, (_, i) => Math.min(i / 24, length));
    const rotations = pairs.map(() => []),
      positions = [];
    src.nodes.forEach((n, i) => {
      n.position.copy(rest[i].p);
      n.quaternion.copy(rest[i].q);
      n.scale.copy(rest[i].s);
    });
    for (const time of times) {
      for (const c of channels) {
        while (c.i + 1 < c.times.length - 1 && c.times[c.i + 1] < time) c.i++;
        const next = Math.min(c.i + 1, c.times.length - 1),
          t0 = c.times[c.i],
          t1 = c.times[next];
        const blend = t1 > t0 ? Math.min(1, Math.max(0, (time - t0) / (t1 - t0))) : 0;
        if (c.target === 'rotation')
          c.node.quaternion
            .fromArray(c.values, 4 * c.i)
            .slerp(new Quaternion().fromArray(c.values, 4 * next), blend);
        else {
          const v = c.target === 'scale' ? c.node.scale : c.node.position;
          v.fromArray(c.values, 3 * c.i).lerp(new Vector3().fromArray(c.values, 3 * next), blend);
        }
      }
      src.root.updateMatrixWorld(true);
      const displacement = pos(hips.a)
        .sub(srcHip)
        .multiplyScalar(dstHip.y / srcHip.y);
      // The aisle supplies horizontal travel. Preserve pelvic sway and the forward lean when sitting.
      displacement.z = Math.min(0.18, Math.max(-0.18, displacement.z));
      hips.b.position.copy(hips.b.parent.worldToLocal(dstHip.clone().add(displacement)));
      for (const [i, { a, b, basis }] of pairs.entries()) {
        const orientation = quat(b.parent).invert().multiply(quat(a)).multiply(basis).normalize();
        const arr = rotations[i];
        if (arr.length && orientation.dot(new Quaternion().fromArray(arr, arr.length - 4)) < 0) {
          orientation.set(-orientation.x, -orientation.y, -orientation.z, -orientation.w);
        }
        b.quaternion.copy(orientation);
        b.updateWorldMatrix(false, false);
        arr.push(...orientation.toArray());
      }
      const ground = Math.min(
        ...['LeftToeBase', 'RightToeBase', 'LeftFoot', 'RightFoot'].map(
          (k) => pos(dst.byName.get(k)).y,
        ),
      );
      const hipPoint = pos(hips.b);
      hipPoint.y += 0.034 - ground;
      hips.b.position.copy(hips.b.parent.worldToLocal(hipPoint));
      positions.push(...hips.b.position.toArray());
    }
    const input = add(times, 'SCALAR', count, { min: [times[0]], max: [times.at(-1)] });
    const tracks = [],
      samplers = [];
    function track(node, path, values, type) {
      const id = samplers.length;
      samplers.push({ input, output: add(values, type, count), interpolation: 'LINEAR' });
      tracks.push({ sampler: id, target: { node, path } });
    }
    pairs.forEach((p, i) => track(i, 'rotation', rotations[i], 'VEC4'));
    track(pairs.indexOf(hips), 'translation', positions, 'VEC3');
    animations.push({ name: clips[animation.name], samplers, channels: tracks });
  }
  const bytes = Buffer.concat(buffers);
  const doc = {
    asset: { version: '2.0', generator: 'Eulogy · Quaternius CC0 retarget' },
    scene: 0,
    scenes: [{ nodes: pairs.map((_, i) => i) }],
    nodes: pairs.map(({ b }) => ({ name: b.name })),
    buffers: [{ byteLength: bytes.length }],
    bufferViews: views,
    accessors,
    animations,
  };
  writeFileSync(join(output, model + '.glb'), glb(doc, bytes));
}
