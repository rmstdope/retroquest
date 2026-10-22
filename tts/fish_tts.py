# /// script
# requires-python = ">=3.10"
# dependencies = ["fish-audio-sdk==1.3.0"]
# ///
"""Speak a text file with Fish Audio's hosted TTS (https://docs.fish.audio).

    uv run tts/fish_tts.py credits
    uv run tts/fish_tts.py say tts/out/p2.txt tts/out/p2-fish.wav --dry-run
    uv run tts/fish_tts.py say tts/out/p2.txt tts/out/p2-fish.wav --prompt praetzellis
    uv run tts/fish_tts.py voices search "old woman"
    uv run tts/fish_tts.py voices show 7d805071401d4b738334f332a8c320c2 --sample tts/out/sample.mp3

`say` prints what it is about to send (model, characters, voice) before sending, and
`--dry-run` stops there. The voice is Fish's default, a saved Fish voice
(`--reference-id`), one of our prompt clips by name (`--prompt`, from tts/prompts/), or
any clip with its transcript (`--prompt-wav`, `--prompt-text`), cloned per request.
S2 models take inline cues in the text, such as `[whisper]`, `[sigh]` or `[worried]`.

The API key is FISH_AUDIO_API_KEY, from the environment or the worktree's .env.
"""

import argparse
import io
import json
import os
import re
import sys
import time
import wave
from pathlib import Path

import httpx
from fishaudio import FishAudio
from fishaudio.types import Prosody, ReferenceAudio, TTSConfig

HERE = Path(__file__).parent
ENV_FILE = HERE.parent / ".env"
# USD per million UTF-8 bytes of text: s2.1-pro-free $0, s2.1-pro and s2-pro $15, drama-3 $50
# ($10 until 2026-11-12). drama-3 is directed in plain language: "[barely holding it together]",
# "[shaky breath]", and paired tags such as <whisper>…</whisper>, <slow>, <emphasis>.
MODELS = ["s2.1-pro-free", "s2.1-pro", "s2-pro", "drama-3"]
PARAGRAPH_PAUSE_S = 0.8


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

    if args.per_paragraph and args.out.suffix != ".wav":
        sys.exit("--per-paragraph joins WAV files; give a .wav output")
    config = TTSConfig(
        format=args.out.suffix.lstrip(".") or "wav",
        temperature=args.temperature,
        top_p=args.top_p,
        prosody=Prosody(speed=args.speed, volume=0),
        latency="normal",
    )
    def convert(chunk: str) -> bytes:
        return client.tts.convert(
            text=chunk, reference_id=args.reference_id, references=refs or None, config=config, model=args.model
        )

    started = time.time()
    if args.per_paragraph:
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        clips = []
        for index, paragraph in enumerate(paragraphs, 1):
            clips.append(convert(paragraph))
            print(f"  paragraph {index}/{len(paragraphs)} done ({time.time() - started:.0f}s)", flush=True)
        audio = join_wavs(clips, PARAGRAPH_PAUSE_S)
    else:
        audio = convert(text)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_bytes(audio)
    print(f"wrote {args.out} ({len(audio) // 1024} KB) in {time.time() - started:.1f}s")


def join_wavs(clips: list[bytes], pause_s: float) -> bytes:
    """One WAV from several of the same format, with `pause_s` of silence between them."""
    out = io.BytesIO()
    with wave.open(out, "wb") as joined:
        for index, clip in enumerate(clips):
            with wave.open(io.BytesIO(clip)) as part:
                if index == 0:
                    joined.setparams(part.getparams())
                    silence = b"\0" * int(pause_s * part.getframerate()) * part.getsampwidth() * part.getnchannels()
                else:
                    joined.writeframes(silence)
                joined.writeframes(part.readframes(part.getnframes()))
    return out.getvalue()


def search_voices(client: FishAudio, args: argparse.Namespace) -> None:
    """List library voices whose title, description or tags hold every word of the query.

    The API's title search is loose and ranks by popularity, so a phrase rarely brings up
    the voice that matches it. The phrase and each of its words are searched, a few pages
    each, and the pooled results are filtered here; --loose keeps them all.
    """
    words = set(args.query.lower().split())
    found = {}
    for term in dict.fromkeys([args.query, *args.query.lower().split()]):
        for page in range(1, args.pages + 1):
            voices = client.voices.list(title=term, language=args.language, page_size=100, page_number=page)
            for voice in voices.items:
                text = f"{voice.title} {voice.description or ''} {' '.join(voice.tags)}".lower()
                if args.loose or words <= set(re.findall(r"[a-z0-9']+", text)):
                    found.setdefault(voice.id, voice)
            if len(voices.items) < 100:
                break
    ranked = sorted(found.values(), key=lambda voice: -voice.task_count)[: args.limit]
    if not ranked:
        print(f"no voices with all of {sorted(words)} as words in title, description or tags; try --loose or more --pages")
    for voice in ranked:
        description = " ".join((voice.description or "").split())
        print(f"{voice.id}  {voice.title.strip()[:36]:36}  {voice.task_count:>9} uses  {description[:80]}")


def show_voice(client: FishAudio, args: argparse.Namespace) -> None:
    """Print a library voice's metadata, and save its first sample with --sample."""
    voice = client.voices.get(args.voice_id)
    print(f"title:       {voice.title.strip()}")
    print(f"description: {voice.description}")
    print(f"tags:        {', '.join(voice.tags)}")
    print(f"languages:   {', '.join(voice.languages)}   visibility: {voice.visibility}   mode: {voice.train_mode}")
    print(f"author:      {voice.author.nickname}   created {voice.created_at.date()}")
    print(f"popularity:  {voice.task_count} uses, {voice.like_count} likes")
    for sample in voice.samples:
        print(f"sample:      {sample.text}")
    if args.sample:
        if not voice.samples or not voice.samples[0].audio:
            sys.exit("this voice has no sample audio")
        response = httpx.get(voice.samples[0].audio, follow_redirects=True, timeout=60)
        response.raise_for_status()
        args.sample.parent.mkdir(parents=True, exist_ok=True)
        args.sample.write_bytes(response.content)
        print(f"wrote {args.sample}")


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
    s.add_argument("--per-paragraph", action="store_true",
                   help="one request per blank-line-separated paragraph, joined into one WAV")
    s.add_argument("--dry-run", action="store_true", help="print the request without sending it")
    v = commands.add_parser("voices", help="find voices in Fish's library (free)").add_subparsers(
        dest="voices_command", required=True
    )
    search = v.add_parser("search", help="voices whose title, description or tags hold every query word")
    search.add_argument("query")
    search.add_argument("--language", default="en")
    search.add_argument("--limit", type=int, default=15)
    search.add_argument("--pages", type=int, default=3, help="pages of 100 to scan per search term")
    search.add_argument("--loose", action="store_true", help="keep every result the API returns")
    show = v.add_parser("show", help="a voice's details")
    show.add_argument("voice_id")
    show.add_argument("--sample", type=Path, help="save the voice's sample clip here (.mp3)")
    args = parser.parse_args()

    client = FishAudio(api_key=api_key())
    if args.command == "credits":
        print(client.account.get_credits())
    elif args.command == "voices":
        (search_voices if args.voices_command == "search" else show_voice)(client, args)
    else:
        say(client, args)


if __name__ == "__main__":
    main()
