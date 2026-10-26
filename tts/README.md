# TTS (Fish Audio)

Tools for voicing the game's text with [Fish Audio](https://docs.fish.audio)'s hosted TTS. The
recorded narration (see *Recording an act*) ships with the game from `web/public/audio/narration/`;
everything else here is tooling and stays outside the build.

## Setup

- [Audio Studio](https://github.com/rmstdope/audio-studio), installed once with `bun link`, records
  the narration (see *Recording an act*).
- `FISH_AUDIO_API_KEY=…` in the repository's `.env` (gitignored), or in the environment.
- `ffmpeg` (for Audio Studio, `level.py` and `check.py`), [uv](https://docs.astral.sh/uv/) (Audio
  Studio's Whisper check, `check.py`) and `npm ci` in `web/`.

## Recording an act

An act's narration is recorded with [Audio Studio](https://github.com/rmstdope/audio-studio),
from a script of every line the story reads aloud. Run `audio-studio` in the repository root: it
reads `audio-studio.json` and opens in the browser. There a character is cast by audition (Fish's
library searched by keywords, rounds of takes of a phrase), and an act is generated: missing lines
recorded, lines whose voice, cue, words or pronunciation changed recorded again, each take checked
with Whisper. **Refresh dialog** runs the extractor for an act:

```sh
(cd web && npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/extract-act.ts 1)  # writes tts/act1/script.json (2, 3, 4 likewise)
```

A script.json or music.json that differs from what the extractor writes now fails vitest (`narrationScriptFresh.test.ts`), so rerun it after any change to what the game says.

- **The script** (`act<N>/script.json`, committed) is gathered by playing the act's golden path
  through the real engine, trying examine/use/talk/look at every step on a copy of the game. Each
  line has its speaker and a key made from the speaker and the words (`narrationKey` in
  `web/src/lantern/`), so changed wording means a new key and the old clip goes stale. Lines the
  game builds from its state are not in it and play silently.
- **Retiring clips.** When a wording change leaves a clip whose line left the script,
  `narrationCasts.test.ts` is red until it is retired. After regenerating the script, run
  `(cd web && npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/retire-orphans.ts)` (or name the
  acts): it drops those clips from `manifest.json` and `narration.lock.json` and deletes their
  mp3s. Never edit those generated files by hand. `cues.json` is written by hand: move or drop a key-scene direction whose line changed.
- **`act<N>/branches.json`** (Acts II to IV) lists optional scenes the golden path skips, each
  `{ after: <index of a path command>, commands: [...] }`, played on a copy so their lines are
  recorded too (Marcus told the truth, Brenn forgiven, Tobin and the Quiet Charm).
- **`act<N>/writers.json`** gives unsigned writing, and narrated notes, to the writer by their
  opening words (the mother's letter, the father's note, Elior's journal); other writing is the
  narrator's. **`act<N>/silent.json`** lists openings that stay silent (the chapter page's help
  line).
- **`cast.json`** is one cast for the whole game: each speaker's library voice and fixed style cue
  (a speaker sounds the same in every act), and `pronounce` for words said differently from how
  they are written ("Act I" is said "Act One"). **`act<N>/cues.json`** replaces the style on
  key-scene lines (and keeps the mother's Act III manner on her lines there). S2 models act
  bracketed directions rather than read them: `[hushed, uneasy]`, `[pause]`, `[whispering]`. A
  library voice is only a clone of its uploader's clips, and its title and tags are often wrong,
  so it is judged by its takes in the audition. Names need help: "Elior" came out as "Elia" or
  "Hylia" until `pronounce` spelled it out.
- **`act<N>/narration.lock.json`** is Audio Studio's record of what each clip was made from, so it
  knows which lines are up to date. Its own state (auditions, cached takes) is in `.audio-studio/`,
  which is not committed.
- Clips are 64 kbps mono MP3, levelled to −16 LUFS as `level.py` levels them, in
  `web/public/audio/narration/act<N>/` with `manifest.json` (key -> file, speaker, duration, word
  timings), which the story view reads. Each line is sent to Fish's free model (long ones in
  sentence-sized pieces) and the best of up to three takes is kept, aiming for 90% of the words
  heard. Until October 2026 this was `narrate.py`; Audio Studio writes the same manifest (checked
  clip for clip on Act I), and `fish_tts.py`'s voice search is its audition. Both scripts are in
  this repository's history.

## Music

Audio Studio's Music workspace lists the tracks the game plays today, so new music can be made for
them. **Refresh dialog** on an act also writes `act<N>/music.json`, the act's loop, and **Refresh
from the game** on the Stingers page runs `extract-shared.ts`, which writes `stingers.json`
(the new-quest and quest-complete sounds):

```sh
(cd web && npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/extract-shared.ts)  # writes tts/stingers.json
```

The lists come from `web/src/lantern/musicLists.ts`: a loop is named after the act's music file and
briefed in that file's table. The game keeps playing its freetouse.com and Voicy files; each track
carries a `file`, the path of the file the game plays for it, which the studio plays as "The game's
file" until a take is chosen.

## Getting the text

`extract-intro.ts` prints the Act I intro as plain text (markup stripped, the title as a spoken
sentence), and `texts/` holds the texts voiced in the first experiments with Fish; both are kept
from those experiments. `tsx` is not a dependency of `web/`; `npx` fetches the pinned version on
demand.

```sh
(cd web && npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/extract-intro.ts) > tts/out/act1-intro.txt
```

## Checking a clip

`check.py` transcribes a clip with Whisper (`uvx mlx-whisper`, Apple Silicon) and diffs it
against its text (bracketed cues are ignored), listing dropped, added and changed words. Whisper
invents text over trailing silence; segments that are near-empty or reach past the end of the
clip are ignored. Audio Studio checks every take this way as it records; `check.py` is for a
closer look at one clip, with its line's words in a text file:

```sh
python3 tts/check.py line.txt web/public/audio/narration/act1/0016e4860763bd.mp3
```

## Voice prompts

`prompts/` holds two 30-36 s clips of LibriVox narrators, for cloning a voice (`fish_tts.py
--prompt` did it; Audio Studio uses library voices only, so cloning is back in the history):
`praetzellis` (*Treasure Island*) and `driver` (*The Princess and the Goblin*). LibriVox
recordings are public domain, and both texts are public domain worldwide (Stevenson d. 1894,
MacDonald d. 1905); `prompts.json` has the exact transcripts, sources and cut times. Clips of
texts still in copyright outside the US were left out. Cloning a real narrator's voice for
audio that ships in the game is a separate decision.

## Earlier: MisoTTS (removed)

The open-weights [MisoTTS](https://github.com/MisoLabsAI/MisoTTS) 8B model ran locally on an
M5 Pro at about 7x slower than real time. It took voice and emotion from a reference clip, but
drifted past ~20 s per generation (repeating, skipping and garbling words) and often babbled
after the text ended. Fish's free model was faster, word-accurate and directable with cues, so
the MisoTTS scripts were removed; they are in this branch's history.
