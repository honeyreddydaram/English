// Soft sound effects made on the fly with the Web Audio API (no sound files, no buzzers).
let ctx = null;
let enabled = true;

export function setSoundEnabled(v) { enabled = v; }

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, { type = 'sine', vol = 0.12, glide = 0 } = {}) {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + start);
  if (glide) o.frequency.exponentialRampToValueAtTime(freq * glide, c.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}

export const sfx = {
  /** satisfying "click-thunk" when a piece snaps in */
  snap() {
    if (!enabled) return;
    tone(180, 0, 0.12, { type: 'triangle', vol: 0.18, glide: 0.6 });
    tone(1400, 0, 0.04, { type: 'square', vol: 0.03 });
  },
  /** happy little chime */
  yay() {
    if (!enabled) return;
    [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.09, 0.35, { vol: 0.08 }));
  },
  /** soft, neutral "hmm" — never a buzzer */
  hmm() {
    if (!enabled) return;
    tone(392, 0, 0.16, { vol: 0.05 });
    tone(349.23, 0.13, 0.22, { vol: 0.045 });
  },
  tap() {
    if (!enabled) return;
    tone(880, 0, 0.05, { vol: 0.03 });
  },
  /** two-tone train whistle for celebrations */
  whistle() {
    if (!enabled) return;
    tone(622, 0, 0.5, { vol: 0.05 });
    tone(784, 0, 0.5, { vol: 0.04 });
    tone(622, 0.6, 0.7, { vol: 0.05 });
    tone(784, 0.6, 0.7, { vol: 0.04 });
  },
  stamp() {
    if (!enabled) return;
    tone(120, 0, 0.18, { type: 'triangle', vol: 0.2, glide: 0.5 });
    [659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.15 + i * 0.1, 0.4, { vol: 0.07 }));
  },
};
