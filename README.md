# Rail Words 🚂

A 3D word game for kids aged about 5–11. Each English puzzle a child answers adds a piece to a
spring track. When the track is finished, a little bullet train rides the whole thing:
up hills, through loops, and upside down.

## Requirements

**To play** (nothing to install):

| | Needed |
|---|---|
| Computer | Windows 10 or 11 (uses the built-in Windows PowerShell). Mac or Linux: see "Other computers" below. |
| Browser | Microsoft Edge or Google Chrome 89+, Safari 16.4+, or Firefox 108+ |
| Graphics | Any computer or phone that supports WebGL 2 (almost all from 2018 on) |
| Disk space | About 3 MB |
| Internet | Not needed on the laptop. On a phone, only for the first visit. |
| Sound | Speakers or headphones, for Pip's voice |

**To change the game or run the tests** (optional):

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org) 20.6 or newer (only for running the tests)
- [Python 3](https://www.python.org/downloads/) (only for running the game on Mac or Linux)

## Commands

### 1. Get the game

```bash
git clone https://github.com/honeyreddydaram/English.git
cd English
git checkout claude/understanding-clarification-36y28o
```

No Git? On GitHub, open the branch `claude/understanding-clarification-36y28o`, click **Code → Download ZIP**,
and unzip it.

### 2. Play on a Windows laptop

Double-click **`Start Game.bat`** in the game folder.

Or run it yourself from a Command Prompt in the game folder:

```bat
powershell -NoProfile -ExecutionPolicy Bypass -File tools\serve.ps1
```

The game opens in your browser at **http://localhost:8642**. Keep the small black window open while playing.
Close it to stop. It works **with Wi-Fi turned off**, and it needs no install or account.

### 3. Other computers (Mac or Linux)

From the game folder:

```bash
python3 -m http.server 8642 --bind 127.0.0.1
```

Then open **http://localhost:8642** in your browser. Press `Ctrl+C` in the terminal to stop.

The game must be opened through a local server like this. Double-clicking `index.html` will not work,
because browsers block game modules opened straight from a file.

### 4. Run the tests (optional)

Checks every track joins into a loop, never crashes into itself, and stays above the table:

```bash
node --import ./tests/three-loader.mjs tests/track.test.mjs
```

Checks the question file is valid:

```bash
node -e "const q=require('./data/questions.json');let n=0;for(const k in q)for(const x of q[k]){n++;if(x.answer<0||x.answer>=x.options.length)throw new Error('bad answer in station '+k)}console.log(n+' questions OK')"
```

### 5. Save your changes to GitHub

```bash
git add -A
git commit -m "Describe what you changed"
git push origin claude/understanding-clarification-36y28o
```

If you changed any game file, also change `VERSION` at the top of `sw.js` (for example `rail-words-v2`)
so phones that installed the game download the update.

### 6. Put it online for phones (GitHub Pages, one time)

1. Open https://github.com/honeyreddydaram/English/settings/pages
2. **Source:** *Deploy from a branch*
3. **Branch:** `claude/understanding-clarification-36y28o`, folder `/ (root)`, then **Save**
4. After 1–2 minutes the game is live at https://honeyreddydaram.github.io/English/

Every later `git push` to that branch updates the website automatically.

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
Microsoft Zira, David and Mark). Pip speaks a little slower than normal; use "Hear Pip" to
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
- `tests/track.test.mjs`: track checks (see "Run the tests" above)
- `tools/serve.ps1`: the small local server used by `Start Game.bat`
- `sw.js`, `manifest.webmanifest`: offline copy and home-screen install for phones
