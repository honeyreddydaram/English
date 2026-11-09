// Turns a list of simple "turtle" commands into a smooth 3D track path.
// The path is a list of frames: position, forward, up (and side = forward x up).
// Pure math: only uses three.js vector types, so it can be tested without a browser.
import { Vector3 } from 'three';

const STEP = 0.1; // distance between sampled frames (world units)
const WORLD_UP = new Vector3(0, 1, 0);

function frame(p, f, u) {
  return { p: p.clone(), f: f.clone(), u: u.clone() };
}

/**
 * Commands:
 *  ['straight', length]
 *  ['turn', degrees, radius]          (+ = left, - = right; only while upright)
 *  ['pitch', degrees, radius, shift]  (+ = nose up; shift = sideways drift in world units)
 *  ['close']                          (smooth curve back to the start)
 */
export function buildPath(commands, start = { x: 0, y: 0.3, z: 0, heading: 0 }) {
  const p = new Vector3(start.x, start.y, start.z);
  const f = new Vector3(Math.cos(start.heading), 0, -Math.sin(start.heading));
  const u = WORLD_UP.clone();
  const frames = [frame(p, f, u)];
  const first = frames[0];

  const push = () => frames.push(frame(p, f, u));

  for (const cmd of commands) {
    const [type, a, b, c] = cmd;
    if (type === 'straight') {
      const n = Math.max(1, Math.round(a / STEP));
      for (let i = 0; i < n; i++) { p.addScaledVector(f, a / n); push(); }
    } else if (type === 'turn') {
      const angle = (a * Math.PI) / 180;
      const len = Math.abs(angle) * b;
      const n = Math.max(2, Math.round(len / STEP));
      const dA = angle / n;
      for (let i = 0; i < n; i++) {
        // move along the arc chord, then rotate heading around "up"
        f.applyAxisAngle(u, dA / 2);
        p.addScaledVector(f, len / n);
        f.applyAxisAngle(u, dA / 2);
        push();
      }
    } else if (type === 'pitch') {
      const angle = (a * Math.PI) / 180;
      const len = Math.abs(angle) * b;
      const n = Math.max(2, Math.round(len / STEP));
      const dA = angle / n;
      const side = new Vector3().crossVectors(f, u).normalize();
      const shift = c || 0;
      for (let i = 0; i < n; i++) {
        const r = new Vector3().crossVectors(f, u).normalize();
        f.applyAxisAngle(r, dA / 2); u.applyAxisAngle(r, dA / 2);
        p.addScaledVector(f, len / n);
        f.applyAxisAngle(r, dA / 2); u.applyAxisAngle(r, dA / 2);
        if (shift) p.addScaledVector(side, shift / n);
        push();
      }
    } else if (type === 'close') {
      closeTo(frames, p, f, first);
    }
    f.normalize(); u.normalize();
  }
  return finalize(frames);
}

// Cubic Bezier from the current end back to the starting frame (kept upright).
function closeTo(frames, p, f, first) {
  const p0 = p.clone();
  const p3 = first.p.clone();
  if (p0.distanceTo(p3) < 0.05) { // already back at the start
    frames[frames.length - 1] = frame(first.p, first.f, first.u);
    return;
  }
  const d = p0.distanceTo(p3) * 0.42 + 0.5;
  const p1 = p0.clone().addScaledVector(f, d);
  const p2 = p3.clone().addScaledVector(first.f, -d);
  const approxLen = p0.distanceTo(p1) + p1.distanceTo(p2) + p2.distanceTo(p3);
  const n = Math.max(4, Math.round(approxLen / STEP));
  const pt = new Vector3();
  const tan = new Vector3();
  for (let i = 1; i < n; i++) {
    const t = i / n, it = 1 - t;
    pt.set(0, 0, 0)
      .addScaledVector(p0, it * it * it)
      .addScaledVector(p1, 3 * it * it * t)
      .addScaledVector(p2, 3 * it * t * t)
      .addScaledVector(p3, t * t * t);
    tan.set(0, 0, 0)
      .addScaledVector(p1.clone().sub(p0), 3 * it * it)
      .addScaledVector(p2.clone().sub(p1), 6 * it * t)
      .addScaledVector(p3.clone().sub(p2), 3 * t * t)
      .normalize();
    const up = WORLD_UP.clone().addScaledVector(tan, -WORLD_UP.dot(tan)).normalize();
    frames.push(frame(pt, tan, up));
  }
  // Last frame duplicates the start, so the loop is seamless.
  frames.push(frame(first.p, first.f, first.u));
  p.copy(first.p); f.copy(first.f);
}

// Re-sample to (almost) equal spacing and store cumulative distance.
function finalize(raw) {
  const out = [{ ...raw[0], s: 0 }];
  let s = 0;
  for (let i = 1; i < raw.length; i++) {
    const d = raw[i].p.distanceTo(raw[i - 1].p);
    if (d < 1e-5) continue;
    s += d;
    out.push({ ...raw[i], s });
  }
  for (const fr of out) {
    fr.f.normalize();
    // make sure up is exactly perpendicular to forward
    fr.u.addScaledVector(fr.f, -fr.u.dot(fr.f)).normalize();
    fr.side = new Vector3().crossVectors(fr.f, fr.u).normalize();
  }
  const closed = out[out.length - 1].p.distanceTo(out[0].p) < 0.05;
  return { frames: out, length: s, closed };
}

/** Interpolated frame at distance s along the path. */
export function frameAt(path, s, target = {}) {
  const fr = path.frames;
  const L = path.length;
  if (path.closed) s = ((s % L) + L) % L; else s = Math.min(Math.max(s, 0), L);
  // binary search
  let lo = 0, hi = fr.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (fr[mid].s <= s) lo = mid; else hi = mid;
  }
  const A = fr[lo], B = fr[hi];
  const t = B.s > A.s ? (s - A.s) / (B.s - A.s) : 0;
  target.p = (target.p || new Vector3()).lerpVectors(A.p, B.p, t);
  target.f = (target.f || new Vector3()).lerpVectors(A.f, B.f, t).normalize();
  target.u = (target.u || new Vector3()).lerpVectors(A.u, B.u, t).normalize();
  target.side = (target.side || new Vector3()).crossVectors(target.f, target.u).normalize();
  return target;
}

/** Simple self-check used by tests: closest approach between far-apart parts of the track. */
export function minClearance(path, ignoreWithin = 3) {
  const pts = path.frames.filter((_, i) => i % 2 === 0);
  let best = Infinity;
  const L = path.length;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      let ds = Math.abs(pts[i].s - pts[j].s);
      if (path.closed) ds = Math.min(ds, L - ds);
      if (ds < ignoreWithin) continue;
      const d = pts[i].p.distanceTo(pts[j].p);
      if (d < best) best = d;
    }
  }
  return best;
}
