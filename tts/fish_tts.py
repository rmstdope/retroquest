# /// script
# requires-python = ">=3.10"
# dependencies = ["fish-audio-sdk==1.3.0"]
# ///
"""Speak a text file with Fish Audio's hosted TTS (https://docs.fish.audio).

    uv run tts/fish_tts.py credits
    uv run tts/fish_tts.py say tts/out/p2.txt tts/out/p2-fish.wav --dry-run
    uv run tts/fish_tts.py say tts/out/p2.txt tts/out/p2-fish.wav --prompt praetzellis

`say` prints what it is about to send (model, characters, voice) before sending, and
`--dry-run` stops there. The voice is Fish's default, a saved Fish voice
(`--reference-id`), one of our prompt clips by name (`--prompt`, from tts/prompts/), or
any clip with its transcript (`--prompt-wav`, `--prompt-text`), cloned per request.
S2 models take inline cues in the text, such as `[whisper]`, `[sigh]` or `[worried]`.

The API key is FISH_AUDIO_API_KEY, from the environment or the worktree's .env.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

from fishaudio import FishAudio
from fishaudio.types import Prosody, ReferenceAudio, TTSConfig

HERE = Path(__file__).parent
ENV_FILE = HERE.parent / ".env"
# USD per million UTF-8 bytes of text: s2.1-pro-free $0, s2.1-pro and s2-pro $15, drama-3 $50
# ($10 until 2026-11-12). drama-3 is directed in plain language: "[barely holding it together]",
# "[shaky breath]", and paired tags such as <whisper>…</whisper>, <slow>, <emphasis>.
MODELS = ["s2.1-pro-free", "s2.1-pro", "s2-pro", "drama-3"]


def api_key() -> str:
    """FISH_AUDIO_API_KEY from the environment, else from the worktree's .env."""
    if key := os.environ.get("FISH_AUDIO_API_KEY"):
        return key
    if ENV_FILE.is_file():
        for line in ENV_FILE.read_text().splitlines():
            name, _, value = line.partition("=")
            if name.strip() == "FISH_AUDIO_API_KEY":
                return value.strip().strip("'\"")
    sys.exit(f"FISH_AUDIO_API_KEY is not set (looked in the environment and {ENV_FILE})")


def references(args: argparse.Namespace) -> tuple[list[ReferenceAudio], str]:
    """The cloning references for the request, and a label describing the voice."""
    if args.prompt:
        prompts = json.loads((HERE / "prompts" / "prompts.json").read_text())
        wav, text = HERE / "prompts" / f"{args.prompt}.wav", prompts[args.prompt]["text"]
    elif args.prompt_wav:
        wav, text = args.prompt_wav, args.prompt_text or ""
    elif args.reference_id:
        return [], f"saved voice {args.reference_id}"
    else:
        return [], "Fish default voice"
    return [ReferenceAudio(audio=wav.read_bytes(), text=text)], f"cloned from {wav.name}"


def say(client: FishAudio, args: argparse.Namespace) -> None:
    """Speak args.text_file into args.out, after printing what will be sent."""
    text = args.text_file.read_text().strip()
    refs, voice = references(args)
    print(f"model:  {args.model}")
    print(f"voice:  {voice}")
    print(f"text:   {len(text.encode())} bytes, {len(text)} characters")
    print(f"tuning: temperature {args.temperature}, top_p {args.top_p}, speed {args.speed}")
    if args.dry_run:
        print("dry run: nothing sent")
        return

    config = TTSConfig(
        format=args.out.suffix.lstrip(".") or "wav",
        temperature=args.temperature,
        top_p=args.top_p,
        prosody=Prosody(speed=args.speed, volume=0),
        latency="normal",
    )
    started = time.time()
    audio = client.tts.convert(
        text=text, reference_id=args.reference_id, references=refs or None, config=config, model=args.model
    )
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_bytes(audio)
    print(f"wrote {args.out} ({len(audio) // 1024} KB) in {time.time() - started:.1f}s")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("credits", help="show the account's remaining credit (free)")

    s = commands.add_parser("say", help="speak a text file")
    s.add_argument("text_file", type=Path)
    s.add_argument("out", type=Path, help="output file; .wav, .mp3 or .opus picks the format")
    s.add_argument("--model", choices=MODELS, default="s2.1-pro-free")
    voice = s.add_mutually_exclusive_group()
    voice.add_argument("--reference-id", help="a saved Fish Audio voice id")
    voice.add_argument("--prompt", help="a clip in tts/prompts/ by name, e.g. praetzellis")
    voice.add_argument("--prompt-wav", type=Path, help="any clip to clone (with --prompt-text)")
    s.add_argument("--prompt-text", help="transcript of --prompt-wav")
    s.add_argument("--temperature", type=float, default=0.7)
    s.add_argument("--top-p", type=float, default=0.7)
    s.add_argument("--speed", type=float, default=1.0)
    s.add_argument("--dry-run", action="store_true", help="print the request without sending it")
    args = parser.parse_args()

    client = FishAudio(api_key=api_key())
    if args.command == "credits":
        print(client.account.get_credits())
    else:
        say(client, args)


if __name__ == "__main__":
    main()
