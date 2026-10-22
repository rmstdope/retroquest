"""Audition voice prompts: speak the same lines once per prompt in tts/prompts/.

Loads MisoTTS once, then for each prompt in tts/prompts/prompts.json (and once with
no prompt, as a baseline) speaks the audition lines with that clip as context and
writes tts/out/audition/<name>.wav.

    tts/vendor/MisoTTS/.venv/bin/python tts/audition.py [--only fry chenevert]
"""

import argparse
import json
import time
from pathlib import Path

from generate_intro import SENTENCE_PAUSE_S, load_generator, load_prompt, miso  # sets MPS fallback before torch loads

import torch
import torchaudio

HERE = Path(__file__).parent
LINES = [
    "One stormy night, a strange light appears in the sky, and you dream of a shadowy figure calling your name.",
    '"There are secrets in Willowbrook, child," she says.',
    '"Secrets that have waited for you."',
]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--device", default="mps" if torch.backends.mps.is_available() else "cpu")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--temperature", type=float, default=0.9)
    parser.add_argument("--only", nargs="*", help="prompt names to audition (default: all + baseline)")
    args = parser.parse_args()

    prompts = json.loads((HERE / "prompts" / "prompts.json").read_text())
    names = args.only or ["baseline", *prompts]
    out_dir = HERE / "out" / "audition"
    out_dir.mkdir(parents=True, exist_ok=True)

    gen = load_generator(args.device)
    pause = torch.zeros(int(SENTENCE_PAUSE_S * gen.sample_rate))
    for name in names:
        torch.manual_seed(args.seed)
        prompt = []
        if name != "baseline":
            prompt = load_prompt(gen, HERE / "prompts" / f"{name}.wav", prompts[name]["text"], 0)
        history = []
        pieces = []
        for line in LINES:
            started = time.time()
            audio = gen.generate(
                text=line,
                speaker=0,
                context=prompt + history,
                max_audio_length_ms=max(5_000, len(line) * 120),
                temperature=args.temperature,
            )
            print(f"{name:12} [{time.time() - started:4.0f}s] {audio.shape[-1] / gen.sample_rate:4.1f}s  {line}", flush=True)
            history.append(miso.Segment(speaker=0, text=line, audio=audio))
            pieces += [audio.cpu(), pause]
        path = out_dir / f"{name}.wav"
        torchaudio.save(str(path), torch.cat(pieces).unsqueeze(0), gen.sample_rate)
        print(f"wrote {path}", flush=True)


if __name__ == "__main__":
    main()
