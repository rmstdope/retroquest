# TTS (Fish Audio)

Tools for voicing the game's text with [Fish Audio](https://docs.fish.audio)'s hosted TTS. The
recorded narration (see *Recording an act*) ships with the game from `web/public/audio/narration/`;
everything else here is tooling and stays outside the build.

## Setup

- [Content Studio](https://github.com/rmstdope/content-studio), installed once with `bun link`, records
  the narration (see *Recording an act*).
- `FISH_AUDIO_API_KEY=…` in the repository's `.env` (gitignored), or in the environment.
- `ffmpeg` (for Content Studio, `level.py` and `check.py`), [uv](https://docs.astral.sh/uv/) (Content
  Studio's Whisper check, `check.py`) and `npm ci` in `web/`.

## Recording an act

An act's narration is recorded with [Content Studio](https://github.com/rmstdope/content-studio),
from a script of every line the story reads aloud. Run `content-studio` in the repository root: it
reads `content-studio.json` and opens in the browser. There a character is cast by audition (Fish's
library searched by keywords, rounds of takes of a phrase), and an act is generated: missing lines
recorded, lines whose voice, cue, words or pronunciation changed recorded again, each take checked
with Whisper. **Refresh dialog** runs the extractor for an act:

```sh
(cd web && npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/extract-act.ts 1)  # writes tts/act1/script.json (2, 3, 4 likewise)
```

A script.json or music.json that differs from what the extractor writes now fails vitest (`narrationScriptFresh.test.ts`), so rerun it after any change to what the game says.

The four lists of each act (`script`, `music`, `images`, `scenes`) are written in order of `id`, not
in play order, so two branches that change different records touch different places of the file
and git merges them without a regeneration.

- **The script** (`act<N>/script.json`, committed) is gathered by playing the act's golden path
  through the real engine, trying examine/use/talk/look at every step on a copy of the game. Each
  line has its speaker and an `id` made from the speaker and the words (`narrationKey` in
  `web/src/lantern/`), so changed wording means a new id and the old clip goes stale. A room's
  description is read again at every step and after every step of a branch (below), so each state
  the path or a branch leaves a room in is in it. Other lines the game builds from its state (a
  count, a name) are not in it and play silently.
- **Retiring clips.** When a wording change leaves a clip whose line left the script,
  `narrationCasts.test.ts` is red until it is retired. After regenerating the script, run
  `(cd web && npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/retire-orphans.ts)` (or name the
  acts): it drops those clips from `manifest.json` and the act's lock
  (`content-studio/narration/act<N>.lock.json`) and deletes their mp3s. Never edit those generated
  files by hand. The act's key-scene directions (`content-studio/narration/act<N>.edits.json`) are
  the studio's: move or drop one whose line changed there.
- **`act<N>/branches.json`** (all four acts, Act I included) lists optional scenes the golden path skips, each
  `{ after: <index of a path command>, commands: [...] }`, played on a copy so their lines are
  recorded too (Marcus told the truth, Brenn forgiven, Tobin and the Quiet Charm).
  Extraction fails, naming the branch, when `after` is not a step of the path or a command reaches
  nobody here (a "You don't see" answer, a say command with no one to hear it).
- **`act<N>/unreached.json`** acknowledges the lines the act's content can speak that the script
  lacks (`web/src/lantern/unreachedLines.test.ts` finds them by the string literals of every
  non-test file under `web/src/act<N>/`). A line you add that no path, probe or branch reaches fails
  that test, naming it and its file: reach it with a `branches.json` entry. Another test fails for
  an acknowledged key whose line is now spoken, reworded or gone: remove it. Add to
  `unreached.json` only for a line meant to stay unspoken. It is written by
  `(cd web && npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/list-unreached.ts 1)`.
- **`act<N>/writers.json`** gives unsigned writing, and narrated notes, to the writer by their
  opening words (the mother's letter, the father's note, Elior's journal); other writing is the
  narrator's. **`act<N>/silent.json`** lists openings that stay silent (the chapter page's help
  line).
- **`content-studio/narration/cast.json`** is one cast for the whole game: each speaker's library
  voice and fixed style cue (a speaker sounds the same in every act), and `pronounce`, by language
  (`en`), for words said differently from how they are written ("Act I" is said "Act One").
  **`content-studio/narration/act<N>.edits.json`** holds the act's `cues`, by line id, which
  replace the style on key-scene lines (and keeps the mother's Act III manner on her lines there). S2 models act
  bracketed directions rather than read them: `[hushed, uneasy]`, `[pause]`, `[whispering]`. A
  library voice is only a clone of its uploader's clips, and its title and tags are often wrong,
  so it is judged by its takes in the audition. Names need help: "Elior" came out as "Elia" or
  "Hylia" until `pronounce` spelled it out.
- **`content-studio/narration/act<N>.lock.json`** is Content Studio's record of what each clip was made from, so it
  knows which lines are up to date. Its own working state (auditions, takes not chosen, personal settings) is in
  `content-studio/cache/`, which is not committed. A checkout made before Content Studio's version 2 format
  moves its old cache once: `mkdir -p content-studio && mv .content-studio content-studio/cache`.
  `content-studio/cache/effects.json` is no longer read: the sound effects' rewordings are now in
  the committed `content-studio/effects/edits.json`. `content-studio/cache/scene-loudness.json` is
  no longer read either: the scenes' kept loudness is now in the committed
  `content-studio/scenes/act<N>.lock.json`.
- Clips are 64 kbps mono MP3, levelled to −16 LUFS as `level.py` levels them, in
  `web/public/audio/narration/act<N>/` with `manifest.json` (line id -> file, speaker, duration, word
  timings), which the story view reads. Each line is sent to Fish's free model (long ones in
  sentence-sized pieces) and the best of up to three takes is kept, aiming for 90% of the words
  heard. Until October 2026 this was `narrate.py`; Content Studio writes the same manifest (checked
  clip for clip on Act I), and `fish_tts.py`'s voice search is its audition. Both scripts are in
  this repository's history.

## Music

Content Studio's Music workspace lists the tracks the game plays today, so new music can be made for
them. **Refresh dialog** on an act also writes `act<N>/music.json`, the act's loop, and **Refresh
from the game** on the Stingers page runs `extract-shared.ts`, which writes `stingers.json`
(the new-quest and quest-complete sounds):

```sh
(cd web && npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/extract-shared.ts)  # writes tts/stingers.json
```

The lists come from `web/src/lantern/musicLists.ts`: a loop is named after the act's music file and
briefed in that file's table; each track's brief is its `text`. The game keeps playing its
freetouse.com and Voicy files; each track carries a `file`, the path of the file the game plays for
it, which the studio plays as "The game's file" until a take is chosen.

Content Studio keeps its own music files in `content-studio/music/`: **`edits.json`**, the briefs,
lengths, tempos and keys changed in the studio (a changed brief as `text`, with the game's brief it
was written over as `gameWas`), and **`lock.json`**, the take chosen for each track and what it was
made from. Both are committed; never edit them by hand. The game reads only the chosen tracks'
`web/public/audio/music/generated/manifest.json`.

## Sound effects

Content Studio's Sound effects workspace lists the game's sound effects, one list for the whole
game. **Refresh from the game** on the Sound effects page runs the same `refresh.shared` command as
the Stingers page, which also runs `extract-effects.ts`, writing `effects.json`:

```sh
(cd web && npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/extract-effects.ts)  # writes tts/effects.json
```

The list comes from `web/src/lantern/effectLists.ts`: each effect is `{ id, text, seconds, loops? }`,
its `text` the game's starting words for the studio's model and `loops` true for one that plays
round and round. Which scenes play an effect, and how loud, is the studio's scene mix
(`web/src/lantern/scenes/`).

Content Studio keeps its own effects files in `content-studio/effects/`: **`edits.json`**, the
effects reworded in the studio (the studio's words as `text`, with the game's words they were
written over as `gameWas`), and **`lock.json`**, the take chosen for each effect and what it was
made from. Both are committed; never edit them by hand. The game reads only the chosen effects'
`web/public/audio/soundeffects/generated/manifest.json`.

## Scenes

Content Studio's Scenes workspace sets what plays in each room: its music and level, and the sound
effects with it, how, in which state and how loud. **Refresh from the game** on an act's Scenes page
runs the same `refresh.part` command as Refresh dialog, which writes `act<N>/scenes.json` from
`web/src/lantern/sceneLists.ts`: one scene per room, `{ id, title, states, triggers }`, its `id` the
room's music track id and its `title` the room's name.

The studio writes each act's mix, `web/src/lantern/scenes/act<N>.mix.json`, which the game reads
(`sceneMix.ts`), and keeps the loudness each scene was last measured at, against the `scenes.output`
target in `content-studio.json`, in **`content-studio/scenes/act<N>.lock.json`**. Both are
committed; never edit them by hand.

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
clip are ignored. Content Studio checks every take this way as it records; `check.py` is for a
closer look at one clip, with its line's words in a text file:

```sh
python3 tts/check.py line.txt web/public/audio/narration/act1/0028ec78cb405e.mp3
```

## Voice prompts

`prompts/` holds two 30-36 s clips of LibriVox narrators, for cloning a voice (`fish_tts.py
--prompt` did it; Content Studio uses library voices only, so cloning is back in the history):
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

## Images

Content Studio's images workspace lists the pictures the game needs. **Refresh dialog** on an act
also writes `act<N>/images.json`: one image per room, then one portrait per character the act
registers (480x640, upright; a name two classes share is listed once; ids `act<N>-portrait-<class>`, or `portrait-<class>` for a
character in several acts, listed with the same entry in each of them; then Elior, the player, who is no class: `portrait-elior`, the same entry in every act),
each `{ id, title, width, height, text }`, where the text is the room's base
description with the markup removed, or, for a portrait, the character's hand-written face
portrait prompt from `web/src/lantern/portraitPrompts.ts` (it begins "A face portrait of"; the
in-game description is not used), the studio's starting prompt, and the
room's id is its music track id. The look all images share is the studio's own, the `style` of
`content-studio/images/edits.json`, changed in the studio's Style page (or by hand): the look
(`look`), things to keep out (`keepOut`, added to
the prompt as words, since the image models read no negative prompt, so anything drawn by naming
it is said as "no …" in the look instead) and an optional addition per act (`parts`). The look and
the act additions say only light, colour and mood, never a thing: whatever they name is drawn in
every room (an early "lantern light" put a lantern in each one), and each room's own description
sets its light. It lists no `palette`: the images keep full colour and the studio only brings each
take to size. The `images` section of `content-studio.json` points at the lists
(`from.part`). Prompt overrides are the studio's, in the same edits file (`images`), never in the
game's code, and the chosen take of each image is in `content-studio/images/lock.json`; the lists
come from `web/src/lantern/imageLists.ts` and a vitest test fails when a committed list is stale.

After the rooms and portraits each act's list also holds the belt pictures: one 256x256 square entry for every thing that can be carried and every spell the act registers, `item-<name>` or `spell-<name>` (`beltImageId`), the same entry in every act where the name appears. The words are the hand-written line of `web/src/lantern/beltPrompts.ts`, what is seen and never what it means, followed by the things-and-spells style (`BELT_STYLE`) that the studio's look cannot hold. The belt shows a picture once its file exists and keeps the first letter until then.
