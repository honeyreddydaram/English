// Checks every level's track: closes into a loop, doesn't crash into itself, stays above the table.
// Run: node --import ./tests/three-loader.mjs tests/track.test.mjs
import { buildPath, minClearance } from '../js/trackPath.js';
import { LEVELS } from '../js/levels.js';
let ok = true;
for (const lv of LEVELS) {
  const path = buildPath(lv.track, lv.start);
  const clear = minClearance(path, 3);
  let minY = Infinity, maxStep = 0, maxBend = 0;
  path.frames.forEach((fr, i) => {
    minY = Math.min(minY, fr.p.y);
    if (i) { maxStep = Math.max(maxStep, fr.s - path.frames[i-1].s); maxBend = Math.max(maxBend, fr.f.angleTo(path.frames[i-1].f)); }
  });
  const bad = !path.closed || clear < 1.15 || minY < 0.29 || maxBend > 0.2;
  if (bad) ok = false;
  console.log(`${bad ? 'FAIL' : 'ok  '} L${lv.id} len=${path.length.toFixed(1)} closed=${path.closed} clearance=${clear.toFixed(2)} minY=${minY.toFixed(2)} maxBend=${maxBend.toFixed(3)}`);
}
process.exit(ok ? 0 : 1);
