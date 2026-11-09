// The 3D world: table, soft lighting, camera, track sections and the train.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildPath } from './trackPath.js';
import { buildSection, sectionRanges } from './trackMesh.js';
import { Train } from './train.js';

const easeOutBack = (t) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };

export class World {
  constructor(canvas) {
    this.reducedMotion = false;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e9eef2');
    scene.fog = new THREE.Fog('#e9eef2', 26, 60);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
    this.scene = scene;

    scene.add(new THREE.HemisphereLight('#fffaf0', '#d9cbb8', 0.9));
    const sun = new THREE.DirectionalLight('#fff4e2', 1.6);
    sun.position.set(6, 12, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 });
    sun.shadow.radius = 4;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    // A soft, light wooden tabletop
    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(70, 70, 0.4, 96),
      new THREE.MeshStandardMaterial({ color: '#efe4d3', roughness: 0.85 }),
    );
    table.position.y = -0.2;
    table.receiveShadow = true;
    scene.add(table);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.camera.position.set(0, 9, 12);
    this.controls = new OrbitControls(this.camera, canvas);
    Object.assign(this.controls, {
      enableDamping: true, dampingFactor: 0.08, enablePan: false,
      minDistance: 6, maxDistance: 32, maxPolarAngle: 1.38, minPolarAngle: 0.25,
      autoRotateSpeed: 0.7,
    });

    this.train = new Train(scene);
    this.trackRoot = new THREE.Group();
    scene.add(this.trackRoot);
    this.anims = [];
    this.sparkles = [];
    this.mode = 'idle';
    this.target = 0;
    this.timer = new THREE.Timer();
    this.timer.connect(document);

    window.addEventListener('resize', () => this.resize());
    this.resize();
    renderer.setAnimationLoop((time) => this.tick(time));
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // keep the whole track in view on tall (phone) screens too
    this.camera.fov = w / h < 1 ? 58 : 42;
    this.camera.updateProjectionMatrix();
  }

  /** Load a level's track, split into `pieces` sections (section 0 is already built). */
  loadTrack(level, pieces) {
    this.trackRoot.clear();
    this.anims = [];
    this.path = buildPath(level.track, level.start);
    this.ranges = sectionRanges(this.path, pieces);
    this.sections = this.ranges.map(([a, b], i) => {
      const g = buildSection(this.path, a, b, i * 2 + level.id);
      g.visible = false;
      this.trackRoot.add(g);
      return g;
    });
    this.ghosts = [];
    this.built = 0;
    this.revealSection(0, true);

    // camera framing
    const box = new THREE.Box3().setFromObject(this.trackRoot);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    // look a little in front of the track so it sits above the question card
    this.controls.target.set(c.x, 0, c.z + size * 0.16);
    const far = window.innerWidth / window.innerHeight < 1 ? 1.5 : 1.0;
    this.camera.position.set(c.x + 0.6, size * 0.82 * far, c.z + size * 0.98 * far);
    this.controls.update();

    this.train.clearCarriages();
    this.train.dir = 1;
    this.train.s = this.ranges[0][1] - 0.45;
    this.mode = 'idle';
    this.target = this.train.s;
  }

  get builtEnd() { return this.ranges[this.built - 1][1]; }
  get complete() { return this.built >= this.sections.length; }

  /** Show the next piece floating above its spot, see-through. */
  showGhost(i) {
    this.hideGhost();
    if (i >= this.sections.length) return;
    const [a, b] = this.ranges[i];
    const g = buildSection(this.path, a, b, 0, { ghost: true });
    g.userData.bob = 0;
    g.userData.wobble = 0;
    this.trackRoot.add(g);
    this.ghost = g;
  }

  hideGhost() {
    if (this.ghost) { this.trackRoot.remove(this.ghost); this.ghost = null; }
  }

  /** Gentle "doesn't fit yet" wiggle — nothing breaks, nothing is lost. */
  wobbleGhost() {
    if (this.ghost && !this.reducedMotion) this.ghost.userData.wobble = 1;
  }

  /** Snap a section into place with a bounce and sparkles. */
  revealSection(i, instant = false) {
    const g = this.sections[i];
    g.visible = true;
    this.built = Math.max(this.built, i + 1);
    if (instant || this.reducedMotion) { g.position.y = 0; return Promise.resolve(); }
    g.position.y = 1.4;
    return new Promise((resolve) => {
      this.anims.push({
        t: 0, dur: 0.6,
        step: (k) => { g.position.y = 1.4 * (1 - easeOutBack(k)); },
        done: () => { g.position.y = 0; this.burst(i); resolve(); },
      });
    });
  }

  burst(i) {
    const [a, b] = this.ranges[i];
    const mid = this.path.frames[Math.floor(((a + b) / 2 / this.path.length) * (this.path.frames.length - 1))];
    const n = 40;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3), vel = [];
    const colors = new Float32Array(n * 3);
    const pal = ['#ffd27a', '#ffffff', '#a8dcff', '#ffb3c1', '#c6f2a6'].map((c) => new THREE.Color(c));
    for (let k = 0; k < n; k++) {
      pos.set([mid.p.x, mid.p.y + 0.35, mid.p.z], k * 3);
      vel.push(new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3 + 1, (Math.random() - 0.5) * 3));
      const c = pal[k % pal.length]; colors.set([c.r, c.g, c.b], k * 3);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.11, vertexColors: true, transparent: true, depthWrite: false });
    const pts = new THREE.Points(geo, mat);
    this.scene.add(pts);
    this.sparkles.push({ pts, vel, life: 1 });
  }

  /** Drive the train forward to a distance; resolves when it arrives. */
  driveTo(s) {
    this.mode = 'drive';
    this.target = s;
    this.train.dir = 1;
    return new Promise((r) => { this._arrive = r; });
  }

  ride(on) {
    if (on) {
      this.mode = this.complete ? 'loop' : 'pingpong';
      this.controls.autoRotate = !this.reducedMotion;
    } else {
      this.controls.autoRotate = false;
      if (!this.complete) {
        this.mode = 'drive';
        this.target = this.builtEnd - 0.45;
        this.train.dir = 1;
        this._arrive = null;
      } else {
        this.mode = 'idle';
      }
    }
  }

  tick(time) {
    this.timer.update(time);
    const dt = Math.min(this.timer.getDelta(), 0.1);
    const t = this.timer.getElapsed();
    for (const a of [...this.anims]) {
      a.t += dt;
      const k = Math.min(1, a.t / a.dur);
      a.step(k);
      if (k >= 1) { this.anims.splice(this.anims.indexOf(a), 1); a.done && a.done(); }
    }
    if (this.ghost) {
      const u = this.ghost.userData;
      u.wobble = Math.max(0, u.wobble - dt * 1.6);
      const bob = this.reducedMotion ? 0 : Math.sin(t * 2) * 0.08;
      this.ghost.position.set(Math.sin(t * 28) * 0.07 * u.wobble, 0.9 + bob, Math.cos(t * 23) * 0.04 * u.wobble);
    }
    for (const sp of [...this.sparkles]) {
      sp.life -= dt * 1.1;
      const arr = sp.pts.geometry.attributes.position.array;
      sp.vel.forEach((v, k) => {
        v.y -= 6 * dt;
        arr[k * 3] += v.x * dt; arr[k * 3 + 1] += v.y * dt; arr[k * 3 + 2] += v.z * dt;
      });
      sp.pts.geometry.attributes.position.needsUpdate = true;
      sp.pts.material.opacity = Math.max(0, sp.life);
      if (sp.life <= 0) { this.scene.remove(sp.pts); sp.pts.geometry.dispose(); this.sparkles.splice(this.sparkles.indexOf(sp), 1); }
    }
    if (this.path) this.moveTrain(dt);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  moveTrain(dt) {
    const tr = this.train;
    const speed = 1.7;
    if (this.mode === 'drive') {
      const d = this.target - tr.s;
      const step = Math.sign(d) * Math.min(Math.abs(d), speed * dt * Math.min(1, 0.4 + Math.abs(d)));
      tr.s += step;
      if (Math.abs(this.target - tr.s) < 0.002) {
        tr.s = this.target; this.mode = 'idle';
        if (this._arrive) { const r = this._arrive; this._arrive = null; r(); }
      }
    } else if (this.mode === 'pingpong') {
      const tail = tr.cars.length * 0.6;
      const lo = 0.45 + tail, hi = this.builtEnd - 0.45 - tail;
      if (hi <= lo) { tr.update(this.path, dt); return; }
      tr.s += tr.dir * speed * 0.7 * dt;
      if (tr.s > hi) { tr.s = hi; tr.dir = -1; }
      if (tr.s < lo) { tr.s = lo; tr.dir = 1; }
    } else if (this.mode === 'loop') {
      tr.dir = 1;
      tr.s = (tr.s + speed * 1.1 * dt) % this.path.length;
    }
    tr.update(this.path, dt);
  }
}
