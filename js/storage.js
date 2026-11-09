// Saves progress and grown-up settings on this computer only (browser local storage).
const KEY = 'rail-words-v1';

const defaults = {
  stamps: {},          // { levelId: true }
  settings: {
    rate: 0.85, voiceName: '', allowOnline: false,
    sound: true, reducedMotion: false, unlockAll: false,
  },
};

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(defaults);
    const data = JSON.parse(raw);
    return { stamps: data.stamps || {}, settings: { ...defaults.settings, ...(data.settings || {}) } };
  } catch {
    return structuredClone(defaults);
  }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable: play on */ }
}
