// Conductor Pip's coaching: gentle feedback, help that grows step by step,
// patience when a child is thinking, and never any punishment.
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const LINES = {
  praise: ['Yes! Click!', 'You got it!', 'Great listening!', 'Wonderful!', 'Choo choo! Nice one!', "That's right!"],
  praiseAfterTrying: ['You kept trying, and you got it!', 'Yes! Great job sticking with it!', 'You figured it out!'],
  tryAgain: [
    "Ooh, close! Let's listen again.",
    "Good thinking! Let's try one more time.",
    "Hmm, that piece doesn't fit yet. Let's look together.",
    "That's a tricky one. Trains go up hills slowly too!",
  ],
  wait1: ["Take your time. I'll say it again.", "No rush! Let's listen one more time."],
  wait2: ['Let me make it a little easier.'],
  wait3: ['Want to skip this one? We can come back to it later.'],
  skip: "No problem! I'll lay this piece for you, and we'll try it again later.",
  together: "Let's do it together!",
  ride: 'Nice work so far! Let’s enjoy the ride.',
};

// How long (ms) of quiet thinking before Pip offers each kind of help.
export const WAIT = { repeat: 8000, easier: 15000, skip: 25000 };

/**
 * Runs one question. `ui` draws things; `voice` speaks.
 * Resolves with { result: 'correct' | 'revealed' | 'skipped' | 'aborted', tries }.
 */
export class Coach {
  constructor(ui, voice, sfx) {
    this.ui = ui; this.voice = voice; this.sfx = sfx;
    this.timers = [];
  }

  questionSpeech(q, visible) {
    const names = visible.map((i) => q.options[i].say || q.options[i].t);
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')}, or ${names[names.length - 1]}?` : names[0];
    return `${q.say || q.prompt} ${list}`;
  }

  ask(q, { easy = false } = {}) {
    this.q = q;
    this.done = false;
    this.tries = 0;
    this.busy = false;
    this.paused = false;
    this.waitStage = 0;
    // When the last question was hard, start this one with just 2 choices.
    let visible = q.options.map((_, i) => i);
    if (easy && visible.length > 2) visible = this.twoChoices(q);
    this.visible = visible;
    this.ui.showQuestion(q, visible, (i) => this.choose(i), () => this.skip(), () => this.repeat());
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.talk(this.questionSpeech(q, visible), { bubble: false });
    });
  }

  twoChoices(q) {
    const wrong = q.options.map((_, i) => i).filter((i) => i !== q.answer);
    const keep = wrong[Math.floor(Math.random() * wrong.length)];
    return [q.answer, keep].sort((a, b) => a - b);
  }

  // Speak, then start the patience timers once Pip has finished talking.
  async talk(text, { slow = false, bubble = true } = {}) {
    this.clearTimers();
    if (bubble) this.ui.say(text);
    await this.voice.speak(text, { slow });
    if (!this.done && !this.paused && !this.busy) this.startTimers();
  }

  startTimers() {
    this.clearTimers();
    const at = (ms, fn) => this.timers.push(setTimeout(() => { if (!this.done && !this.paused) fn(); }, ms));
    if (this.waitStage < 1) at(WAIT.repeat, () => { this.waitStage = 1; this.talk(`${pick(LINES.wait1)} ${this.questionSpeech(this.q, this.visible)}`, { slow: true }); });
    else if (this.waitStage < 2) at(WAIT.easier - WAIT.repeat, () => { this.waitStage = 2; this.makeEasier(); });
    else if (this.waitStage < 3) at(WAIT.skip - WAIT.easier, () => { this.waitStage = 3; this.ui.showSkip(true); this.talk(pick(LINES.wait3)); });
  }

  clearTimers() { this.timers.forEach(clearTimeout); this.timers = []; }

  makeEasier() {
    const q = this.q;
    if (this.visible.length > 2) {
      const keep = this.twoChoices(q).filter((i) => this.visible.includes(i));
      const twoKeep = keep.length === 2 ? keep : [q.answer, this.visible.find((i) => i !== q.answer)];
      this.visible.filter((i) => !twoKeep.includes(i)).forEach((i) => this.ui.hideOption(i));
      this.visible = twoKeep;
    }
    this.ui.showHint(q.hint);
    this.talk(`${pick(LINES.wait2)} ${q.hint}`, { slow: true });
  }

  repeat() {
    if (this.done || this.busy) return;
    this.talk(this.questionSpeech(this.q, this.visible), { slow: this.tries > 0, bubble: false });
  }

  async choose(i) {
    if (this.done || this.busy) return;
    this.clearTimers();
    this.voice.stop();
    const q = this.q;
    if (i === q.answer) {
      this.finish(this.tries === 0 ? pick(LINES.praise) : pick(LINES.praiseAfterTrying), 'correct', i);
      return;
    }
    // Not yet. Fade that choice softly and offer a bit more help each time.
    this.tries++;
    this.sfx.hmm();
    this.ui.wobble();
    this.waitStage = 0;
    // With only two choices, keep both on the first miss so it is still a real second try.
    const keepBoth = this.visible.length <= 2 && this.tries === 1;
    if (!keepBoth) {
      this.ui.fadeOption(i);
      this.visible = this.visible.filter((v) => v !== i);
    }
    if (this.tries >= 3 || this.visible.length <= 1) {
      // Do it together: show the answer kindly, then build the piece anyway.
      this.busy = true;
      this.ui.glowOption(q.answer);
      this.ui.showHint(q.explain);
      this.ui.say(`${LINES.together} ${q.explain}`);
      await this.voice.speak(`${LINES.together} ${q.explain}`);
      if (!this.done) this.finish('', 'revealed', q.answer, true);
    } else if (keepBoth) {
      this.ui.showHint(q.hint);
      this.talk(`${pick(LINES.tryAgain)} ${q.hint}`, { slow: true });
    } else if (this.tries === 1) {
      this.talk(`${pick(LINES.tryAgain)} ${this.questionSpeech(q, this.visible)}`, { slow: true });
    } else {
      this.ui.showHint(q.hint);
      this.talk(`${pick(LINES.tryAgain)} ${q.hint}`, { slow: true });
    }
  }

  skip() {
    if (this.done) return;
    this.busy = true;
    this.clearTimers();
    this.ui.say(LINES.skip);
    this.voice.speak(LINES.skip);
    this.finish('', 'skipped', -1, true);
  }

  finish(line, result, i, quiet = false) {
    this.done = true;
    this.clearTimers();
    if (i >= 0) this.ui.markRight(i);
    if (!quiet) { this.ui.say(line); this.voice.speak(line); }
    const r = this.resolve; this.resolve = null;
    r && r({ result, tries: this.tries });
  }

  /** Ride Time: everything waits, nothing is lost. */
  pause() {
    this.paused = true;
    this.clearTimers();
    this.voice.stop();
  }

  resume() {
    if (this.done) return;
    this.paused = false;
    this.waitStage = Math.min(this.waitStage, 1);
    this.talk(this.questionSpeech(this.q, this.visible), { bubble: false });
  }

  abort() {
    if (this.done) return;
    this.done = true;
    this.clearTimers();
    const r = this.resolve; this.resolve = null;
    r && r({ result: 'aborted', tries: this.tries });
  }
}
