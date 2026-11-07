// The 10 levels: the English skill and the track shape both get harder.
// Questions live in data/questions.json (keyed by level id).
export const LEVELS = [
  {
    id: 1, name: 'Rhyme Station', skill: 'Rhyming words', emoji: '🎵',
    intro: 'Rhyming words sound the same at the end. Cat… hat! Let’s build!',
    start: { x: -1.5, y: 0.3, z: 1.8, heading: 0 },
    track: [['straight', 3], ['turn', 180, 1.8], ['straight', 6], ['turn', 180, 1.8], ['straight', 3]],
  },
  {
    id: 2, name: 'Rhyme Junction', skill: 'Odd one out', emoji: '🔀',
    intro: 'Three words. Two rhyme, one is different. Can you spot it?',
    start: { x: -2.5, y: 0.3, z: 2.2, heading: 0 },
    track: [['straight', 2], ['turn', 60, 1.4], ['turn', -60, 1.4], ['straight', 1], ['turn', 90, 1.5], ['straight', 2.5],
      ['turn', 90, 1.5], ['straight', 3], ['turn', -50, 1.3], ['turn', 50, 1.3], ['straight', 0.5], ['turn', 90, 1.5], ['close']],
  },
  {
    id: 3, name: 'First-Sound Tunnel', skill: 'Beginning sounds', emoji: '👂',
    intro: 'Every word starts with a sound. Ball starts with buh. Let’s listen!',
    start: { x: -3, y: 0.3, z: 1.8, heading: 0 },
    track: [['straight', 1.5], ['pitch', 20, 3], ['straight', 1.4], ['pitch', -20, 3], ['straight', 0.6], ['pitch', -20, 3],
      ['straight', 1.4], ['pitch', 20, 3], ['straight', 0.5], ['turn', 180, 1.8], ['straight', 9.34], ['turn', 180, 1.8], ['close']],
  },
  {
    id: 4, name: 'Sound Counter', skill: 'Counting sounds', emoji: '🔢',
    intro: 'Words are made of little sounds. Ship is sh, i, p. Three sounds!',
    start: { x: -3, y: 1.7, z: 1.8, heading: 0 },
    track: [['straight', 1], ['pitch', -40, 2], ['pitch', 80, 2], ['pitch', -40, 2], ['straight', 0.8], ['turn', 180, 1.8],
      ['straight', 6.94], ['turn', 180, 1.8], ['close']],
  },
  {
    id: 5, name: 'Sound Swap Bridge', skill: 'Changing sounds', emoji: '🌉',
    intro: 'Change one sound and you get a new word! Cat becomes hat!',
    start: { x: -3.5, y: 0.3, z: 2, heading: 0 },
    track: [['straight', 0.8], ['pitch', 25, 2.5], ['straight', 1.2], ['pitch', -25, 2.5], ['straight', 2.5], ['pitch', -25, 2.5],
      ['straight', 1.2], ['pitch', 25, 2.5], ['straight', 0.6], ['turn', 180, 2], ['straight', 10.3], ['turn', 180, 2], ['close']],
  },
  {
    id: 6, name: 'Word-Join Yard', skill: 'Compound words', emoji: '🧩',
    intro: 'Two small words can join to make a big word. Sun plus flower is sunflower!',
    start: { x: -3, y: 0.3, z: 2.2, heading: 0 },
    track: [['turn', 45, 1.4], ['turn', -90, 1.4], ['turn', 90, 1.4], ['turn', -45, 1.4], ['straight', 0.6], ['turn', 90, 1.6],
      ['straight', 1.6], ['turn', 90, 1.6], ['turn', -40, 1.3], ['turn', 40, 1.3], ['straight', 1.5], ['turn', 90, 1.6], ['close']],
  },
  {
    id: 7, name: 'Suffix Siding', skill: 'Endings: -s, -ed, -ing, -er', emoji: '🔚',
    intro: 'A suffix goes at the end of a word. Jump plus ing is jumping!',
    start: { x: -3.5, y: 0.3, z: 2, heading: 0 },
    track: [['straight', 0.6], ['pitch', 55, 1.4], ['straight', 1.4], ['pitch', -55, 1.4], ['straight', 1.4], ['pitch', -55, 1.4],
      ['straight', 1.4], ['pitch', 55, 1.4], ['straight', 0.6], ['turn', 180, 2], ['straight', 8.79], ['turn', 180, 2], ['close']],
  },
  {
    id: 8, name: 'Prefix Peak', skill: 'Beginnings: un-, re-, pre-, dis-', emoji: '⛰️',
    intro: 'A prefix goes at the start of a word. Un plus happy is unhappy!',
    start: { x: -3.5, y: 0.3, z: 2, heading: 0 },
    track: [['straight', 0.8], ['pitch', 90, 1.1], ['straight', 1.2], ['pitch', -90, 1.1], ['straight', 1.6], ['pitch', -90, 1.1],
      ['straight', 1.2], ['pitch', 90, 1.1], ['straight', 0.8], ['turn', 180, 2], ['straight', 7.6], ['turn', 180, 2], ['close']],
  },
  {
    id: 9, name: 'Morpheme Mountain', skill: 'Counting word parts', emoji: '🏔️',
    intro: 'Big words are made of parts that have meaning. Un, happy, ly!',
    start: { x: -1, y: 0.3, z: 2.4, heading: 0 },
    track: [['straight', 1.5], ['pitch', 180, 1.3, 0.7], ['straight', 1.6], ['pitch', 180, 1.3, 0.7], ['straight', 4],
      ['turn', 180, 2.2], ['straight', 3.9], ['turn', 180, 1.5], ['close']],
  },
  {
    id: 10, name: 'Grand Word Loop', skill: 'Building whole words', emoji: '🏆',
    intro: 'The big finale! Put a prefix, a root and a suffix together to build a word.',
    start: { x: -3.5, y: 0.3, z: 2.6, heading: 0 },
    track: [['straight', 1.5], ['pitch', 360, 1.4, 1.4], ['straight', 1.5], ['turn', 90, 1.6], ['pitch', 25, 2], ['straight', 1.2],
      ['pitch', -25, 2], ['turn', 90, 1.6], ['straight', 2], ['pitch', -25, 2], ['straight', 1.2], ['pitch', 25, 2], ['turn', 90, 1.6], ['close']],
  },
];
