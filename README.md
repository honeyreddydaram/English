# Rail Words 🚂

A 3D word game for kids aged about 5–11. Each English puzzle a child answers adds a piece to a
spring track. When the track is finished, a little bullet train rides the whole thing:
up hills, through loops, and upside down.

## How to play (Windows laptop)

1. Double-click **`Start Game.bat`**.
2. The game opens in your web browser (Microsoft Edge or Google Chrome) at `http://localhost:8642`.
3. Keep the small black window open while playing. Close it to stop.

It works **with Wi-Fi turned off**. Nothing is installed, and the game does not need an account.

## Play on a phone or tablet

Open **https://honeyreddydaram.github.io/English/** in the phone's browser (Safari on iPhone, Chrome on Android).

- **Add it to the home screen** for an app-like icon: on iPhone, tap Share → *Add to Home Screen*; on Android,
  tap ⋮ → *Add to Home screen* / *Install app*.
- After the first visit, it **works offline**: the game keeps a copy of itself on the phone.
- The page only downloads the game. It never sends anything back, and progress stays on each device.

## The 10 stations (easy → hard)

| # | Station | Skill | Track |
|---|---|---|---|
| 1 | Rhyme Station | Rhyming words (2 choices) | Flat oval |
| 2 | Rhyme Junction | Odd one out | Gentle curves |
| 3 | First-Sound Tunnel | Beginning sounds (phonemes) | Small hills |
| 4 | Sound Counter | Counting sounds (phonemes) | Raised track with a dip |
| 5 | Sound Swap Bridge | Changing one sound | Bridge on posts |
| 6 | Word-Join Yard | Compound words (morphemes) | S-bends |
| 7 | Suffix Siding | -s, -ed, -ing, -er, -ful | Steep climbs |
| 8 | Prefix Peak | un-, re-, pre-, dis- | Vertical walls |
| 9 | Morpheme Mountain | Counting meaning parts | Upside-down run |
| 10 | Grand Word Loop | Building whole words | Full loop-the-loop |

Questions are in [`data/questions.json`](data/questions.json) and can be edited without touching code.
American English spelling and pronunciation are used throughout.

## Kind by design

- **No red X, no buzzer, no lives, no timers, no lost points, no "wrong".**
- A choice that isn't right just fades softly and the floating track piece gives a gentle wiggle.
- Help grows step by step: Pip repeats the question slowly → gives a hint → "Let's do it together!"
  and explains the answer. **The piece is always built**, so the child keeps moving forward.
- **Thinking time is respected.** The clock only starts once Pip stops talking. After about 8 seconds of quiet, Pip offers to say it again.
  If the child is still thinking, the choices drop to two and a hint appears. A little later, Pip offers to skip.
- If a question was hard, the next one starts with only two choices.
- Skipped questions come back at the end as **bonus carriages**: every answer adds a carriage to the train.
- **Ride Time** (🚂 button): pauses everything so the child can watch the train ride what they built.
- Every child gets the same station stamp, however many tries it took.

## Privacy

- The game only loads files from this folder. A browser security rule
  (Content-Security-Policy in `index.html`) blocks the page from sending anything to the internet.
- Progress is stored in the browser on this computer only.
- Pip's voice uses voices installed on the computer. **Online voices are off by default**
  (Grown-ups ⚙️ → "Allow online voices").
- The upcoming "Say it with Pip" microphone step will run speech recognition **on this laptop only**.
  A child's voice will never be uploaded.

## Grown-ups area

Tap **Grown-ups ⚙️** and hold the button for 2 seconds. You can choose Pip's voice and talking speed,
turn sound effects and motion down, open all stations, or reset stamps.

**About Pip's voice:** the list shows the voices installed on this computer (on Windows, usually
Microsoft Zira, David and Mark). Pip speaks slowly and slightly softer than normal; use "Hear Pip" to
pick the one you like best. Microsoft Edge also offers more natural-sounding "Online" voices. If you
allow those, only Pip's sentences are sent to Microsoft to be spoken. Nothing your child says or does
is sent.

## Third-party code

Only official, unmodified releases are used:

- [three.js](https://threejs.org) r186.1 (MIT), copied from the official npm package. See
  [`vendor/three/SOURCE.txt`](vendor/three/SOURCE.txt).

## For developers

- `js/scene.js`: 3D world, camera, track building animation, train movement
- `js/trackPath.js`, `js/levels.js`: track shapes as simple commands (straight, turn, pitch, close)
- `js/trackMesh.js`: block, spring, hole and post geometry
- `js/coach.js`: Pip's gentle feedback, hint ladder, and patience timers
- `js/main.js`: screens and level flow
- `tests/track.test.mjs`: checks every track closes, never crashes into itself, and stays above the table.
  Run with `node --import ./tests/three-loader.mjs tests/track.test.mjs`
