# TTS experiments (MisoTTS)

An experiment in voicing the game's text with [MisoTTS](https://github.com/MisoLabsAI/MisoTTS),
an 8B open-weights English TTS model (Sesame CSM architecture, Mimi codec, 24 kHz output).
Nothing here is part of the game build.

## Setup (once)

```sh
git clone https://github.com/MisoLabsAI/MisoTTS.git tts/vendor/MisoTTS
(cd tts/vendor/MisoTTS && uv sync --python 3.10)
(cd web && npm ci)
```

The first run downloads about 34 GB into the Hugging Face cache: the float32 model weights
(32.8 GB), the Mimi codec, the SilentCipher watermarker and a Llama 3.2 tokenizer.

`generate_intro.py` replaces two upstream loaders:

- the tokenizer comes from the ungated `unsloth/Llama-3.2-1B` mirror (same tokenizer) instead
  of the gated `meta-llama/Llama-3.2-1B`;
- the weights are cast to bfloat16 tensor by tensor while being read, so loading peaks near
  16 GB instead of upstream's ~66 GB (a float32 model plus the full float32 state dict).

## Generate the Act I intro

```sh
(cd web && npx tsx --tsconfig tsconfig.json ../tts/extract-intro.ts) > tts/out/act1-intro.txt
tts/vendor/MisoTTS/.venv/bin/python tts/generate_intro.py tts/out/act1-intro.txt tts/out/act1-intro.wav
```

The text is spoken one sentence at a time, with the last few generated sentences as context
so the voice stays the same, and fixed pauses between sentences. `--chunk paragraph` speaks a
whole paragraph per generation instead, keeping only the previous paragraph as context to stay
inside the model's 2048-frame window. Tried and not recommended: chunks past ~20 s often run to
the length cap, and the model then repeats its context, drops or repeats sentences and garbles
words. Without a reference clip the voice is chosen by the random seed
(`--seed`); `--prompt-wav clip.wav --prompt-text "transcript"` clones a voice from about ten
seconds of audio instead. It runs on Apple Silicon through MPS (`--device mps`, the default
on a Mac) or on the CPU.

## Voice prompts

MisoTTS, like Sesame's CSM model it is based on, takes its voice and its emotion mostly from
the audio context, not from the text. The opening sentences set the tone for the rest, so a
flat opening (or no prompt) gives flat narration.

`prompts/` holds 25-36 s clips of expressive LibriVox narrators (public domain), with exact
transcripts, sources and cut times in `prompts.json`. `audition.py` speaks the same three
intro lines with each prompt, and once with none, into `out/audition/<name>.wav`:

```sh
tts/vendor/MisoTTS/.venv/bin/python tts/audition.py            # all prompts + baseline
tts/vendor/MisoTTS/.venv/bin/python tts/audition.py --only fry  # one prompt
```

To voice the whole intro with a prompt:

```sh
tts/vendor/MisoTTS/.venv/bin/python tts/generate_intro.py tts/out/act1-intro.txt tts/out/act1-intro-fry.wav \
  --prompt-wav tts/prompts/fry.wav --prompt-text "$(jq -r .fry.text tts/prompts/prompts.json)"
```

## Checking a clip

`check.py` transcribes a clip with Whisper (`uvx mlx-whisper`) and diffs it against its text,
listing dropped, added and changed words:

```sh
python3 tts/check.py tts/out/p2.txt tts/out/p2-praetzellis-paragraph.wav
```

## Findings so far (parked)

- Praetzellis is the preferred voice prompt so far.
- A ~20 s paragraph in one generation beats sentence-by-sentence (98% vs 88% of words heard);
  longer chunks drift and hit the length cap.
- The model often babbles a few words after the text ends; trimming after the last heard word
  (from Whisper timestamps) is the planned fix.
- Temperature 1.1 (one seed) stopped cleanly but slurred words and misplaced pauses; a fair
  comparison needs several seeds per temperature.

Every clip carries MisoTTS's inaudible SilentCipher watermark, as upstream applies it in
`generate()`.

`vendor/` and `out/` are not committed.
