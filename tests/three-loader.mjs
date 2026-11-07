// Lets Node resolve `import ... from 'three'` to the copy in vendor/ (same as the browser import map).
import { register } from 'node:module';
const core = new URL('../vendor/three/build/three.core.js', import.meta.url).href;
register('data:text/javascript,' + encodeURIComponent(
  `export async function resolve(s, c, next) { return s === 'three' ? { url: ${JSON.stringify(core)}, shortCircuit: true } : next(s, c); }`,
));
