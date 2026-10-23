# TTS (Fish Audio)

Tools for voicing the game's text with [Fish Audio](https://docs.fish.audio)'s hosted TTS. The
recorded narration (see *Recording an act*) ships with the game from `web/public/audio/narration/`;
everything else here is tooling and stays outside the build.

## Setup

- [uv](https://docs.astral.sh/uv/) (the tool installs the Fish Audio SDK by itself) and `npm ci`
  in `web/`.
- `FISH_AUDIO_API_KEY=…` in the repository's `.env` (gitignored), or in the environment.
- `ffmpeg` (for `narrate.py` and `check.py`).

## Voicing text

```sh
uv run tts/fish_tts.py credits                                   # balance (free call)
uv run tts/fish_tts.py say text.txt out.wav --dry-run            # show the request only
uv run tts/fish_tts.py say text.txt out.wav --reference-id 7d805071401d4b738334f332a8c320c2 --per-paragraph
uv run tts/fish_tts.py say text.txt out.wav --prompt praetzellis --per-paragraph
uv run tts/fish_tts.py voices search "elderly female"            # library voices (free)
uv run tts/fish_tts.py voices show <id> --sample tts/out/sample.mp3   # details + demo clip
```

`voices search` searches the phrase and each of its words (the API's own search ranks by
popularity, not by match) and keeps voices whose title, description or tags contain every
word, most used first. `--loose` keeps everything the API returned.

- **Models.** `s2.1-pro-free` (default) costs nothing; `s2.1-pro`/`s2-pro` cost $15 and
  `drama-3` $50 per million bytes of text. Paid models need credit on the account.
- **Voice.** `--reference-id` takes a voice from Fish's library (the id is on its page at
  fish.audio); `--prompt` clones one of the clips in `prompts/` per request; with neither, Fish's
  default voice speaks. A library voice is only a clone of its uploader's clips: its title, tags
  and description are free text and often wrong, so judge it by its sample.
- **Cues.** S2 models take bracketed directions anywhere in the text, which they act rather
  than read: `[hushed, uneasy]`, `[pause]`, `[whispering]`, `[as an old wise woman, low and
  knowing]`. `drama-3` adds paired tags such as `<whisper>…</whisper>`.
- **`--per-paragraph`** sends one request per blank-line-separated paragraph and joins the WAVs
  with a 0.8 s pause. Long single requests (the whole Act I intro) dropped the connection.

Voiced so far: the Act I intro (`texts/act1-intro-cued.txt`, a cued copy of the text) with the
"old man bible storytelling" library voice and with the Praetzellis clone, and the
grandmother's first talk (`texts/grandmother-first-talk.txt`) with two elderly female library
voices. Names need help:
"Elior" comes out as "Elia", "Elir" or "Hylia", so a phonetic spelling in the text sent to
Fish is the likely fix.

## Recording an act

An act's narration is recorded from a script of every line the story reads aloud:

```sh
(cd web && npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/extract-act.ts 1)  # writes tts/act1/script.json (2, 3, 4 likewise)
uv run tts/narrate.py act1 --check     # what is missing or stale
uv run tts/narrate.py act1             # record what is missing, remove what is stale
uv run tts/narrate.py act1 --only KEY  # re-record chosen lines
uv run tts/narrate.py act1 --retime    # re-measure word timings, no new audio
```

- **The script** (`act1/script.json`, committed) is gathered by playing the act's golden path
  through the real engine, trying examine/use/talk/look at every step on a copy of the game. Each
  line has its speaker and a key made from the speaker and the words (`narrationKey` in
  `web/src/lantern/`), so changed wording means a new key and the old clip goes stale. Lines the
  game builds from its state are not in it and play silently.
- **`act<N>/branches.json`** (Acts II to IV) lists optional scenes the golden path skips, each
  `{ after: <index of a path command>, commands: [...] }`, played on a copy so their lines are
  recorded too (Marcus told the truth, Brenn forgiven, Tobin and the Quiet Charm).
- **`act1/writers.json`** gives unsigned writing, and narrated notes, to the writer by their opening words (the mother's
  letter, the father's note, Elior's journal); other writing is the narrator's.
  **`act1/silent.json`** lists openings that stay silent (the chapter page's help line).
- **`act1/cast.json`** holds each speaker's library voice and fixed style cue (approved by the
  navigator one by one), and `pronounce` for words said differently from how they are written
  ("Act I" is said "Act One"). **`act1/cues.json`** replaces the style on key-scene lines.
- **`narrate.py`** sends each line (long ones in sentence-sized pieces) to Fish's free model,
  transcribes the take with Whisper, aligns Whisper's word times onto the shown words, and keeps
  the best of up to three takes, aiming for 90% of the words heard; names (Elior, Aren, Lysa) and
  written prices are the usual misses. Clips are 64 kbps mono MP3 in
  `web/public/audio/narration/act1/` with `manifest.json` (key -> file, speaker, duration, word
  timings), which the story view reads.

## Getting the text

`extract-intro.ts` prints the Act I intro as plain text (markup stripped, the title as a spoken
sentence). `tsx` is not a dependency of `web/`; `npx` fetches the pinned version on demand.

```sh
(cd web && npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/extract-intro.ts) > tts/out/act1-intro.txt
```

## Checking a clip

`check.py` transcribes a clip with Whisper (`uvx mlx-whisper`, Apple Silicon) and diffs it
against its text (bracketed cues are ignored), listing dropped, added and changed words. Whisper invents text over trailing
silence; segments that are near-empty or reach past the end of the clip are ignored.

```sh
python3 tts/check.py tts/texts/act1-intro-cued.txt tts/out/act1-intro-fish-oldman-cued.wav
```

## Voice prompts

`prompts/` holds two 30-36 s clips of LibriVox narrators, for cloning with `--prompt`:
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
