// The little white bullet train (and bonus carriages) that ride in the groove.
import * as THREE from 'three';
import { frameAt } from './trackPath.js';
import { TRACK_TOP } from './trackMesh.js';

const white = new THREE.MeshStandardMaterial({ color: '#fbfbfd', roughness: 0.28, metalness: 0.05 });
const glass = new THREE.MeshStandardMaterial({ color: '#2b3140', roughness: 0.15, metalness: 0.3 });
const red = new THREE.MeshStandardMaterial({ color: '#e0605a', roughness: 0.4 });
const blue = new THREE.MeshStandardMaterial({ color: '#4f7fd1', roughness: 0.4 });
const lamp = new THREE.MeshStandardMaterial({ color: '#fff6d8', emissive: '#fff1b8', emissiveIntensity: 0.9 });

function stripes(group, length, y) {
  for (const z of [1, -1]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(length, 0.022, 0.01), red);
    r.position.set(0, y, z * 0.198);
    const b = new THREE.Mesh(new THREE.BoxGeometry(length, 0.022, 0.01), blue);
    b.position.set(0, y - 0.035, z * 0.192);
    group.add(r, b);
  }
}

function windows(group, xs, y) {
  for (const z of [1, -1]) for (const x of xs) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.06, 0.01), glass);
    w.position.set(x, y, z * 0.2);
    group.add(w);
  }
}

export function makeEngine() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.32, 8, 20), white);
  body.rotation.z = Math.PI / 2; // lie along the forward (x) axis
  body.scale.set(0.95, 1, 1);
  body.castShadow = true;
  g.add(body);
  // pointed, glassy nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.155, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.6), glass);
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(0.24, 0.07, 0);
  nose.scale.set(0.8, 0.55, 1.15);
  g.add(nose);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), lamp);
  light.position.set(0.355, -0.04, 0);
  g.add(light);
  windows(g, [-0.17, -0.07, 0.03], 0.07);
  stripes(g, 0.5, -0.02);
  g.userData.length = 0.72;
  return g;
}

export function makeCarriage() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.2, 6, 18), white);
  body.rotation.z = Math.PI / 2;
  body.castShadow = true;
  g.add(body);
  windows(g, [-0.1, 0, 0.1], 0.07);
  stripes(g, 0.36, -0.02);
  g.userData.length = 0.6;
  return g;
}

/** Engine + carriages that follow the track. */
export class Train {
  constructor(scene) {
    this.scene = scene;
    this.engine = makeEngine();
    scene.add(this.engine);
    this.cars = [];
    this.s = 0;
    this.dir = 1;
    this._fr = {};
    this._m = new THREE.Matrix4();
  }

  addCarriage() {
    const c = makeCarriage();
    c.scale.setScalar(0.001);
    c.userData.grow = 0;
    this.scene.add(c);
    this.cars.push(c);
    return c;
  }

  clearCarriages() {
    for (const c of this.cars) this.scene.remove(c);
    this.cars = [];
  }

  place(obj, path, s, facing) {
    const fr = frameAt(path, s, this._fr);
    const f = fr.f.clone().multiplyScalar(facing);
    const side = fr.side.clone().multiplyScalar(facing);
    this._m.makeBasis(f, fr.u, side);
    obj.quaternion.setFromRotationMatrix(this._m);
    obj.position.copy(fr.p).addScaledVector(fr.u, TRACK_TOP + 0.13);
  }

  update(path, dt) {
    this.place(this.engine, path, this.s, this.dir);
    let gap = 0.66;
    for (const c of this.cars) {
      let s = this.s - this.dir * gap;
      if (!path.closed) s = Math.max(0, Math.min(path.length, s));
      this.place(c, path, s, this.dir);
      if (c.userData.grow < 1) {
        c.userData.grow = Math.min(1, c.userData.grow + dt * 2.2);
        const t = c.userData.grow;
        c.scale.setScalar(Math.max(0.001, 1 + 0.25 * Math.sin(t * Math.PI) - (1 - t) * 0.9));
      }
      gap += 0.6;
    }
  }
}
