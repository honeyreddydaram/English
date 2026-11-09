// Conductor Pip's voice. Uses the voices built into the computer (Windows has
// Microsoft voices installed). By default only voices that run ON the device are used.
let voices = [];
let chosen = null;
let settings = { rate: 0.85, pitch: 1.05, voiceName: '', allowOnline: false };
const listeners = new Set();

// Calm, clear US English voices, best first. Only used if installed on this computer.
const PREFERRED = [
  /Ava.*Natural/i, /Jenny.*Natural/i, /Aria.*Natural/i, /Emma.*Natural/i, /Michelle.*Natural/i,
  /Samantha/i, /Ava/i, /Allison/i, /Zira/i, /Jenny/i, /Aria/i, /Google US English/i,
];

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

function loadVoices() {
  if (!supported) return;
  voices = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
  pick();
}

export function availableVoices() {
  return voices.filter((v) => settings.allowOnline || v.localService);
}

function pick() {
  const list = availableVoices();
  chosen = list.find((v) => v.name === settings.voiceName) || null;
  if (!chosen) {
    const us = list.filter((v) => /en[-_]US/i.test(v.lang));
    for (const re of PREFERRED) {
      chosen = us.find((v) => re.test(v.name)) || null;
      if (chosen) break;
    }
    chosen = chosen || us[0] || list[0] || null;
  }
}

export function currentVoice() { return chosen; }

export function configure(next) {
  settings = { ...settings, ...next };
  pick();
}

if (supported) {
  loadVoices();
  speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

/** Called with true while Pip is talking (for the mouth animation). */
export function onTalking(fn) { listeners.add(fn); }
const emit = (v) => listeners.forEach((fn) => fn(v));

let token = 0;
/** Speak text. Resolves when finished (or quickly if no voice is available). */
export function speak(text, { slow = false } = {}) {
  const my = ++token;
  stop(false);
  return new Promise((resolve) => {
    const finish = () => { if (my === token) emit(false); resolve(); };
    if (!supported || !chosen || settings.muted) {
      // no voice: still give the child time to read
      emit(true);
      setTimeout(finish, Math.min(4000, 600 + text.length * 35));
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.voice = chosen;
    u.lang = chosen.lang;
    u.rate = settings.rate * (slow ? 0.8 : 1);
    u.pitch = settings.pitch;
    u.volume = 1;
    u.onstart = () => emit(true);
    u.onend = finish;
    u.onerror = finish;
    // safety net: some engines forget to fire "end"
    setTimeout(finish, 2500 + text.length * 120);
    speechSynthesis.speak(u);
  });
}

export function stop(notify = true) {
  if (supported) speechSynthesis.cancel();
  if (notify) { token++; emit(false); }
}
