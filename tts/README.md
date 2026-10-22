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
so the voice stays the same. Without a reference clip the voice is chosen by the random seed
(`--seed`); `--prompt-wav clip.wav --prompt-text "transcript"` clones a voice from about ten
seconds of audio instead. It runs on Apple Silicon through MPS (`--device mps`, the default
on a Mac) or on the CPU.

Every clip carries MisoTTS's inaudible SilentCipher watermark, as upstream applies it in
`generate()`.

`vendor/` and `out/` are not committed.
