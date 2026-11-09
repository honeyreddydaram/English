// Builds the 3D track pieces: chunky colored blocks with a groove,
// a metal spring lying in the groove, little square holes, and white support posts.
import * as THREE from 'three';
import { frameAt } from './trackPath.js';

// Soft, slightly muted toy colors (taken from the look of the real toy).
export const PALETTE = ['#F2A65A', '#F3CF5B', '#9CCB6E', '#7DB4DE', '#B7A2DA', '#EC8777'];

const W = 0.5, H = 0.3, B = 0.06; // half width, half height, bevel
const GW = 0.17, GD = 0.15;        // groove half width, groove floor height
export const TRACK_TOP = H;        // top surface height above the path line
export const GROOVE_FLOOR = GD;

// Cross-section (counter-clockwise, x = sideways, y = up).
const PROFILE = [
  [-W + B, -H], [W - B, -H], [W, -H + B], [W, H - B], [W - B, H],
  [GW, H], [GW, GD], [-GW, GD], [-GW, H],
  [-W + B, H], [-W, H - B], [-W, -H + B],
].map(([x, y]) => new THREE.Vector2(x, y));
const CAP_TRIS = THREE.ShapeUtils.triangulateShape(PROFILE, []);

const materials = new Map();
export function blockMaterial(color) {
  if (!materials.has(color)) {
    materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.0 }));
  }
  return materials.get(color);
}
const springMat = new THREE.MeshStandardMaterial({ color: '#d5d8de', roughness: 0.32, metalness: 0.85 });
const holeMat = new THREE.MeshStandardMaterial({ color: '#4a4650', roughness: 0.9 });
const postMat = new THREE.MeshStandardMaterial({ color: '#f5f2ec', roughness: 0.45 });
export const ghostMat = new THREE.MeshStandardMaterial({
  color: '#ffffff', roughness: 0.4, transparent: true, opacity: 0.38, depthWrite: false,
  emissive: '#bfe3ff', emissiveIntensity: 0.35,
});

function sampleFrames(path, s0, s1, step = 0.08) {
  const n = Math.max(2, Math.ceil((s1 - s0) / step));
  const out = [];
  for (let i = 0; i <= n; i++) out.push(frameAt(path, s0 + ((s1 - s0) * i) / n, {}));
  return out;
}

/** One block = the profile swept between distances s0 and s1. */
export function blockGeometry(path, s0, s1) {
  const frames = sampleFrames(path, s0, s1);
  const pos = [], nor = [], idx = [];
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  const world = (fr, pt, out) => out.copy(fr.p).addScaledVector(fr.side, pt.x).addScaledVector(fr.u, pt.y);

  // side walls: one strip per profile edge, so edges stay crisp
  for (let e = 0; e < PROFILE.length; e++) {
    const a = PROFILE[e], b = PROFILE[(e + 1) % PROFILE.length];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
    const nx = dy / len, ny = -dx / len;
    const base = pos.length / 3;
    for (const fr of frames) {
      n.copy(fr.side).multiplyScalar(nx).addScaledVector(fr.u, ny);
      world(fr, a, v); pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z);
      world(fr, b, v); pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z);
    }
    for (let i = 0; i < frames.length - 1; i++) {
      const A0 = base + i * 2, B0 = A0 + 1, A1 = A0 + 2, B1 = A0 + 3;
      idx.push(A0, A1, B0, B0, A1, B1);
    }
  }
  // end caps
  const cap = (fr, dir) => {
    const base = pos.length / 3;
    n.copy(fr.f).multiplyScalar(dir);
    for (const pt of PROFILE) { world(fr, pt, v); pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z); }
    for (const [i, j, k] of CAP_TRIS) {
      if (dir > 0) idx.push(base + i, base + j, base + k); else idx.push(base + i, base + k, base + j);
    }
  };
  cap(frames[0], -1);
  cap(frames[frames.length - 1], 1);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  fixWinding(g);
  return g;
}

// Make sure triangles face the same way as their normals (so lighting is right).
function fixWinding(g) {
  const p = g.attributes.position, n = g.attributes.normal, index = g.index.array;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), nn = new THREE.Vector3();
  for (let t = 0; t < index.length; t += 3) {
    a.fromBufferAttribute(p, index[t]); b.fromBufferAttribute(p, index[t + 1]); c.fromBufferAttribute(p, index[t + 2]);
    b.sub(a); c.sub(a); b.cross(c);
    nn.fromBufferAttribute(n, index[t]);
    if (b.dot(nn) < 0) { const tmp = index[t + 1]; index[t + 1] = index[t + 2]; index[t + 2] = tmp; }
  }
}

/** The coil spring lying in the groove. */
export function springGeometry(path, s0, s1) {
  const r = 0.075, coilPitch = 0.07, perTurn = 8;
  const turns = (s1 - s0) / coilPitch;
  const n = Math.max(8, Math.round(turns * perTurn));
  const pts = [];
  const fr = {};
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n;
    frameAt(path, s, fr);
    const th = (i / perTurn) * Math.PI * 2;
    pts.push(fr.p.clone()
      .addScaledVector(fr.u, GD + r * 0.9 + Math.sin(th) * r * 0.9)
      .addScaledVector(fr.side, Math.cos(th) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  return new THREE.TubeGeometry(curve, n, 0.011, 4, false);
}

/** Build one section (a group of blocks) between s0 and s1. */
export function buildSection(path, s0, s1, colorStart, { ghost = false } = {}) {
  const group = new THREE.Group();
  const len = s1 - s0;
  const count = Math.max(1, Math.round(len / 1.05));
  const gap = 0.012;
  const holes = [];
  for (let i = 0; i < count; i++) {
    const a = s0 + (len * i) / count + gap, b = s0 + (len * (i + 1)) / count - gap;
    const color = PALETTE[(colorStart + i * 4 + Math.floor(i / 3)) % PALETTE.length];
    const mesh = new THREE.Mesh(blockGeometry(path, a, b), ghost ? ghostMat : blockMaterial(color));
    mesh.castShadow = !ghost; mesh.receiveShadow = !ghost;
    group.add(mesh);
    if (!ghost) {
      for (const t of [0.3, 0.7]) holes.push(frameAt(path, a + (b - a) * t, {}));
    }
  }
  if (!ghost) {
    // little square holes on both sides of every block
    const geo = new THREE.BoxGeometry(0.075, 0.075, 0.012);
    const inst = new THREE.InstancedMesh(geo, holeMat, holes.length * 2);
    const m = new THREE.Matrix4(), q = new THREE.Matrix4();
    let k = 0;
    for (const fr of holes) {
      for (const sgn of [1, -1]) {
        q.makeBasis(fr.f, fr.u, fr.side);
        m.copy(q).setPosition(fr.p.clone().addScaledVector(fr.side, sgn * (W + 0.001)));
        inst.setMatrixAt(k++, m);
      }
    }
    group.add(inst);

    const spring = new THREE.Mesh(springGeometry(path, s0 + 0.02, s1 - 0.02), springMat);
    spring.castShadow = true;
    group.add(spring);

    addPosts(group, path, s0, s1);
  }
  group.userData = { s0, s1 };
  return group;
}

// White posts under raised, upright parts of the track (like the real toy's stands).
function addPosts(group, path, s0, s1) {
  const fr = {};
  for (let s = Math.ceil(s0 / 1.6) * 1.6 + 0.4; s < s1; s += 1.6) {
    frameAt(path, s, fr);
    const bottom = fr.p.y - H;
    if (fr.u.y < 0.9 || bottom < 0.25) continue;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, bottom, 12), postMat);
    post.position.set(fr.p.x, bottom / 2, fr.p.z);
    post.castShadow = true;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.04, 20), postMat);
    foot.position.set(fr.p.x, 0.02, fr.p.z);
    foot.receiveShadow = true;
    group.add(post, foot);
  }
}

/** Split the whole path into `n` sections of equal length. */
export function sectionRanges(path, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push([(path.length * i) / n, (path.length * (i + 1)) / n]);
  return out;
}
