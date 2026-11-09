// Rail Words: answer word puzzles, build the track, ride the train.
import { World } from './scene.js';
import { LEVELS } from './levels.js';
import { PALETTE } from './trackMesh.js';
import { Coach, LINES } from './coach.js';
import * as voice from './speech.js';
import { sfx, setSoundEnabled } from './sound.js';
import * as store from './storage.js';

const $ = (id) => document.getElementById(id);
const show = (el, on = true) => el.classList.toggle('hidden', !on);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const state = store.load();
const world = new World($('world'));
let questions = {};
let session = null; // the level being played

// ---------------- settings ----------------
function applySettings() {
  const s = state.settings;
  voice.configure({ rate: s.rate, voiceName: s.voiceName, allowOnline: s.allowOnline });
  setSoundEnabled(s.sound);
  const calm = s.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  world.reducedMotion = calm;
  document.body.classList.toggle('calm', calm);
  $('btn-sound').textContent = s.sound ? '🔊' : '🔈';
}

// ---------------- Pip ----------------
const pip = $('pip');
voice.onTalking((on) => pip.classList.toggle('talking', on));
function say(text) { $('bubble').textContent = text; }
function cheer() { pip.classList.remove('happy'); void pip.offsetWidth; pip.classList.add('happy'); }

// ---------------- question card (the UI the coach drives) ----------------
const ui = {
  showQuestion(q, visible, onChoose, onSkip, onHear) {
    $('q-word').textContent = q.word ? `${q.emoji || ''} ${q.word}`.trim() : '';
    $('q-prompt').textContent = q.prompt;
    say('');
    show($('q-hint'), false);
    show($('btn-skip'), false);
    const box = $('q-options');
    box.innerHTML = '';
    q.options.forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.dataset.i = i;
      b.innerHTML = `<span class="e"></span><span class="t"></span>`;
      b.querySelector('.e').textContent = o.e || '';
      b.querySelector('.t').textContent = o.t;
      b.setAttribute('aria-label', o.say || o.t);
      if (!visible.includes(i)) b.classList.add('gone');
      b.addEventListener('click', () => { sfx.tap(); onChoose(i); });
      box.appendChild(b);
    });
    $('btn-skip').onclick = onSkip;
    $('btn-hear').onclick = onHear;
    show($('card'));
    $('btn-ride').disabled = false;
  },
  opt: (i) => $('q-options').querySelector(`[data-i="${i}"]`),
  fadeOption(i) { ui.opt(i)?.classList.add('faded'); },
  hideOption(i) { ui.opt(i)?.classList.add('gone'); },
  glowOption(i) { ui.opt(i)?.classList.add('glow'); },
  markRight(i) { const b = ui.opt(i); if (b) { b.classList.remove('glow'); b.classList.add('right'); } },
  showHint(text) { $('q-hint').textContent = `💡 ${text}`; show($('q-hint')); },
  showSkip(on) { show($('btn-skip'), on); },
  say,
  wobble() { world.wobbleGhost(); },
};
const coach = new Coach(ui, voice, sfx);

// ---------------- HUD ----------------
function drawPieces() {
  const box = $('hud-pieces');
  box.innerHTML = '';
  const total = world.sections.length - 1;
  for (let i = 1; i <= total; i++) {
    const el = document.createElement('i');
    if (i < world.built) { el.classList.add('on'); el.style.background = PALETTE[(i * 2) % PALETTE.length]; }
    box.appendChild(el);
  }
}

// ---------------- screens ----------------
function screen(name) {
  for (const id of ['title', 'map', 'done']) show($(id), id === name);
  const playing = name === 'play';
  show($('hud'), playing);
  show(pip, playing);
  if (!playing) { show($('card'), false); show($('ride-banner'), false); }
}

function unlocked(id) {
  return state.settings.unlockAll || id === 1 || state.stamps[id - 1] || state.stamps[id];
}

function drawMap() {
  const ol = $('stations');
  ol.innerHTML = '';
  for (const lv of LEVELS) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    const open = unlocked(lv.id);
    const done = state.stamps[lv.id];
    b.className = `station${open ? '' : ' locked'}${done ? ' done' : ''}`;
    b.innerHTML = `<span class="n"></span><span class="em"></span><span class="nm"></span><span class="sk"></span><span class="badge"></span>`;
    b.querySelector('.n').textContent = `Station ${lv.id}`;
    b.querySelector('.em').textContent = lv.emoji;
    b.querySelector('.nm').textContent = lv.name;
    b.querySelector('.sk').textContent = open ? lv.skill : 'Opens after the station before';
    b.querySelector('.badge').textContent = done ? '🏅' : open ? '' : '🔒';
    b.addEventListener('click', () => {
      if (open) startLevel(lv.id);
      else voice.speak(`Station ${lv.id} opens after you finish station ${lv.id - 1}.`);
    });
    li.appendChild(b);
    ol.appendChild(li);
  }
}

function goMap() {
  endSession();
  drawMap();
  screen('map');
}

function endSession() {
  if (session) { session.alive = false; coach.abort(); }
  session = null;
  voice.stop();
  world.ride(false);
  world.hideGhost();
}

// ---------------- the level flow ----------------
async function startLevel(id) {
  endSession();
  const lv = LEVELS.find((l) => l.id === id);
  const qs = questions[id];
  const me = { lv, alive: true, bonus: [], struggled: false, riding: false };
  session = me;
  world.loadTrack(lv, qs.length + 1);
  screen('play');
  $('hud-level').textContent = `${lv.emoji} Station ${lv.id}: ${lv.name}`;
  $('hud-skill').textContent = lv.skill;
  $('btn-ride').disabled = true;
  show($('card'), false);
  drawPieces();
  const alive = () => me.alive && session === me;

  say(lv.intro);
  await voice.speak(lv.intro);
  if (!alive()) return;

  for (let k = 0; k < qs.length; k++) {
    world.showGhost(k + 1);
    const res = await coach.ask(qs[k], { easy: me.struggled });
    if (!alive() || res.result === 'aborted') return;
    me.struggled = res.result !== 'correct' || res.tries >= 2;
    if (res.result !== 'correct') me.bonus.push(qs[k]);
    if (res.result === 'correct') cheer();
    await wait(res.result === 'correct' ? 700 : 300);
    if (!alive()) return;
    show($('card'), false);
    $('btn-ride').disabled = true;
    world.hideGhost();
    sfx.snap();
    await world.revealSection(k + 1);
    drawPieces();
    if (k + 1 < qs.length) {
      await world.driveTo(world.builtEnd - 0.45);
      if (!alive()) return;
    }
  }

  // Track complete!
  sfx.whistle();
  cheer();
  const doneLine = 'You built the whole track! Choo choo!';
  say(doneLine);
  world.ride(true);
  await voice.speak(doneLine);
  if (!alive()) return;

  // Bonus carriages: questions we skipped or did together come back, gently.
  if (me.bonus.length) {
    const line = 'Let’s add some bonus carriages to our train. Each answer adds a carriage!';
    say(line);
    await voice.speak(line);
    for (const q of me.bonus) {
      if (!alive()) return;
      const res = await coach.ask(q, { easy: true });
      if (!alive() || res.result === 'aborted') return;
      cheer();
      sfx.yay();
      world.train.addCarriage();
      await wait(900);
    }
    show($('card'), false);
    world.ride(true);
  }
  if (!alive()) return;
  $('btn-ride').disabled = true;
  state.stamps[lv.id] = true;
  store.save(state);
  await wait(1200);
  if (!alive()) return;
  showDone(lv);
}

function showDone(lv) {
  sfx.stamp();
  $('stamp').textContent = lv.emoji;
  $('done-title').textContent = `${lv.name} stamp!`;
  const next = LEVELS.find((l) => l.id === lv.id + 1);
  $('done-text').textContent = next ? `Next stop: ${next.name}.` : 'You finished every station. You are a Word Engineer!';
  show($('btn-next'), !!next);
  show($('done'));
  const line = next ? `You earned the ${lv.name} stamp! Great work!` : 'You finished every station! You are a Word Engineer!';
  say(line);
  voice.speak(line);
}

// ---------------- Ride Time ----------------
function setRide(on) {
  if (!session) return;
  session.riding = on;
  world.ride(on);
  show($('ride-banner'), on);
  show($('card'), !on);
  if (on) { coach.pause(); say(LINES.ride); voice.speak(LINES.ride); } else { say(''); coach.resume(); }
}
$('btn-ride').addEventListener('click', () => setRide(true));
$('btn-back').addEventListener('click', () => setRide(false));

// ---------------- buttons ----------------
$('btn-play').addEventListener('click', () => { sfx.tap(); goMap(); });
$('btn-map').addEventListener('click', goMap);
$('btn-tomap').addEventListener('click', goMap);
$('btn-again').addEventListener('click', () => { show($('done'), false); world.ride(true); });
$('btn-next').addEventListener('click', () => { show($('done'), false); startLevel(session.lv.id + 1); });
$('btn-sound').addEventListener('click', () => {
  state.settings.sound = !state.settings.sound;
  store.save(state); applySettings();
});

// ---------------- grown-ups area ----------------
const dlg = $('grown');
function openGrown() {
  show($('gate')); show($('settings'), false);
  dlg.showModal();
}
$('btn-grown').addEventListener('click', openGrown);
$('btn-grown2').addEventListener('click', openGrown);
dlg.querySelectorAll('.close-grown').forEach((b) => b.addEventListener('click', () => dlg.close()));
dlg.addEventListener('close', () => { if (!$('map').classList.contains('hidden')) drawMap(); });

// press and hold for 2 seconds (keeps little fingers out)
let holdTimer = null, holdStart = 0;
const bar = $('btn-hold').querySelector('span');
function holdTick() {
  const k = Math.min(1, (performance.now() - holdStart) / 2000);
  bar.style.width = `${k * 100}%`;
  if (k >= 1) { stopHold(); show($('gate'), false); fillSettings(); show($('settings')); return; }
  holdTimer = requestAnimationFrame(holdTick);
}
function stopHold() { cancelAnimationFrame(holdTimer); holdTimer = null; bar.style.width = '0'; }
$('btn-hold').addEventListener('pointerdown', (e) => { e.preventDefault(); holdStart = performance.now(); holdTick(); });
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => $('btn-hold').addEventListener(ev, () => { if (holdTimer) stopHold(); }));

function fillSettings() {
  const s = state.settings;
  const sel = $('set-voice');
  sel.innerHTML = '';
  const list = voice.availableVoices();
  if (!list.length) {
    const o = document.createElement('option');
    o.textContent = 'No voices found on this computer';
    sel.appendChild(o);
  }
  const cur = voice.currentVoice();
  for (const v of list) {
    const o = document.createElement('option');
    o.value = v.name;
    o.textContent = `${v.name} (${v.lang})${v.localService ? '' : ' — online'}`;
    if (cur && cur.name === v.name) o.selected = true;
    sel.appendChild(o);
  }
  $('set-rate').value = s.rate;
  $('set-online').checked = s.allowOnline;
  $('set-sound').checked = s.sound;
  $('set-motion').checked = s.reducedMotion;
  $('set-unlock').checked = s.unlockAll;
}

function readSettings() {
  const s = state.settings;
  s.voiceName = $('set-voice').value || '';
  s.rate = Number($('set-rate').value);
  s.sound = $('set-sound').checked;
  s.reducedMotion = $('set-motion').checked;
  s.unlockAll = $('set-unlock').checked;
  const online = $('set-online').checked;
  const changedOnline = online !== s.allowOnline;
  s.allowOnline = online;
  store.save(state);
  applySettings();
  if (changedOnline) fillSettings();
}
$('settings').addEventListener('change', readSettings);
$('btn-test-voice').addEventListener('click', () => {
  readSettings();
  voice.speak("Hi! I'm Conductor Pip. Let's build a track together!");
});
$('btn-reset').addEventListener('click', () => {
  state.stamps = {};
  store.save(state);
  $('btn-reset').textContent = 'Stamps reset ✓';
});

// ---------------- start ----------------
async function boot() {
  applySettings();
  try {
    const res = await fetch('data/questions.json');
    questions = await res.json();
  } catch {
    say('Please start the game with the "Start Game" file.');
  }
  // a pretty track on the title screen
  world.loadTrack(LEVELS[0], 7);
  for (let i = 1; i < 7; i++) world.revealSection(i, true);
  world.ride(true);
  screen('title');
}
boot();

// Keep a copy on the device so the game works offline (and can be added to the home screen).
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* still playable without it */ });
}

// handy for automated checks
window.__railWords = { world, state, startLevel, coach, LEVELS };
