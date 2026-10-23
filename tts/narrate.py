# /// script
# requires-python = ">=3.10"
# dependencies = ["fish-audio-sdk==1.3.0", "mlx-whisper==0.4.3"]
# ///
"""Record an act's narration: one clip per line of its script, with word timings.

    uv run tts/narrate.py act1            # record every line that has no clip yet
    uv run tts/narrate.py act1 --check    # report missing and stale clips, record nothing
    uv run tts/narrate.py act1 --only KEY # (re)record chosen lines
    uv run tts/narrate.py act1 --retime   # re-measure word timings of existing clips

Reads tts/<act>/script.json (written by extract-<act>.ts), cast.json (speaker -> voice and
style cue, plus how names are said) and cues.json (key -> a hand cue replacing the style).
Each line is spoken by Fish Audio (free s2.1-pro-free model) in its speaker's voice; long
lines go as sentence-sized pieces joined into one clip. The clip is transcribed with
Whisper, whose word times are aligned onto the line's shown words; a take where fewer than
90% of the words are heard is retried, up to three takes, keeping the best. Clips are
levelled to -16 LUFS (level.py) and encoded as 64 kbps mono MP3 into web/public/audio/narration/<act>/, with manifest.json
keyed by the line's narration key. Clips whose line left the script are removed.
Needs uv, ffmpeg, and FISH_AUDIO_API_KEY (environment or the repository's .env).
"""

import argparse
import difflib
import io
import json
import re
import subprocess
import sys
import tempfile
import threading
import time
import wave
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parent
MODEL = "s2.1-pro-free"
WHISPER_MODEL = "mlx-community/whisper-large-v3-turbo"
CHUNK_LIMIT = 400
MIN_HEARD = 0.9
TAKES = 3
BITRATE = "64k"
# Narration loudness: speech sits clearly above the music (-23 LUFS) and chimes (-26 LUFS).
NARRATION_LUFS = -16.0
PARALLEL = 4
SYNTH_TRIES = 4
GAP_S = 0.25


# ---- pure parts (tested in test_narrate.py) ----

_NUMBERS = {word: str(n) for n, word in enumerate(
    "zero one two three four five six seven eight nine ten eleven twelve".split())}


def _plain(word: str) -> str:
    """A word without case or punctuation."""
    return re.sub(r"[^a-z0-9']", "", word.lower())


def _norm(word: str) -> str:
    """A word for comparison: plain, and small numbers as digits (Whisper writes "1")."""
    plain = _plain(word)
    return _NUMBERS.get(plain, plain)


def align(tokens: list[str], heard: list[dict], duration: float, said: list[str] | None = None) -> tuple[list[dict], float]:
    """Give every shown token a start and end from Whisper's words.

    Tokens matched to a heard word take its times; unmatched tokens share the gap
    between their matched neighbours evenly. `said` is the same words as actually said
    (see `said_words`), compared in place of the shown ones. Returns the timed tokens
    and the share of tokens that were heard.
    """
    want = [_norm(t) for t in (said if said and len(said) == len(tokens) else tokens)]
    got = [_norm(w["word"]) for w in heard]
    times: list[tuple[float, float] | None] = [None] * len(tokens)
    for block in difflib.SequenceMatcher(a=want, b=got, autojunk=False).get_matching_blocks():
        for k in range(block.size):
            w = heard[block.b + k]
            times[block.a + k] = (float(w["start"]), float(w["end"]))
    matched = sum(t is not None for t in times)

    i = 0
    while i < len(tokens):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(tokens) and times[j] is None:
            j += 1
        left = times[i - 1][1] if i > 0 else 0.0
        right = times[j][0] if j < len(tokens) else duration
        right = max(right, left)
        step = (right - left) / (j - i)
        for k in range(i, j):
            times[k] = (left + step * (k - i), left + step * (k - i + 1))
        i = j

    timed = []
    last = 0.0
    for token, (start, end) in zip(tokens, times):
        start = min(max(start, last), duration)
        end = min(max(end, start), duration)
        timed.append({"word": token, "start": round(start, 3), "end": round(end, 3)})
        last = start
    return timed, (matched / len(tokens) if tokens else 1.0)


def chunk_text(text: str, limit: int = CHUNK_LIMIT) -> list[str]:
    """Split a line at sentence ends into pieces of at most `limit` characters where possible."""
    if len(text) <= limit:
        return [text]
    sentences = re.split(r"(?<=[.!?…])\s+", text)
    chunks: list[str] = []
    for sentence in sentences:
        if chunks and len(chunks[-1]) + 1 + len(sentence) <= limit:
            chunks[-1] += " " + sentence
        else:
            chunks.append(sentence)
    return chunks


def spoken_text(text: str, cue: str, cast: dict) -> str:
    """The text sent to Fish: the cue, then the line with names said as the cast asks.

    A quest card's checklist bullets are read as a list, not as "asterisk".
    """
    text = re.sub(r":\s*\*\s+", ": ", text)
    text = re.sub(r"\s+\*\s+", ", ", text)
    for written, said in cast.get("pronounce", {}).items():
        text = text.replace(written, said)
    return f"{cue} {text}".strip()


def said_words(text: str, cast: dict) -> list[str]:
    """The shown words as they are said: the cast's pronunciations applied to the whole line.

    Falls back to the shown words when a pronunciation changes the word count, since the
    timings must line up one to one with the shown words.
    """
    shown = text.split(" ")
    said = spoken_text(text, "", cast).split(" ")
    return said if len(said) == len(shown) else shown


def heard_words(segments: list[dict], duration: float) -> list[dict]:
    """Whisper's words, without what it invents over trailing silence.

    Invented text comes as near-empty segments or segments that start once the speech is
    over; a real last segment may still end a little past the clip, and is kept.
    """
    words = []
    for segment in segments:
        if segment["end"] - segment["start"] < 0.3 or segment["start"] >= duration - 0.1:
            continue
        words.extend(segment.get("words", []))
    return words


def orphan_cues(cues: dict, script: list[dict]) -> list[str]:
    """Cue keys whose line is no longer in the script (its wording changed), so the cue no longer applies."""
    keys = {line["key"] for line in script}
    return sorted(key for key in cues if key not in keys)


# ---- recording ----

def _client():
    sys.path.insert(0, str(HERE))
    from fish_tts import api_key  # the same key lookup as the Fish tool
    from fishaudio import FishAudio

    return FishAudio(api_key=api_key())


def _synthesise(client, text: str, voice: str) -> bytes:
    from fishaudio.types import TTSConfig

    config = TTSConfig(format="wav", latency="normal")
    for attempt in range(SYNTH_TRIES):
        try:
            return client.tts.convert(text=text, reference_id=voice, config=config, model=MODEL)
        except Exception:  # Fish drops connections now and then; the last try raises
            if attempt == SYNTH_TRIES - 1:
                raise
            time.sleep(2 * (attempt + 1))


def _join(clips: list[bytes]) -> tuple[bytes, float]:
    """One WAV from the pieces of a line, a short pause between them, and its length."""
    out = io.BytesIO()
    frames_total, rate = 0, 44100
    with wave.open(out, "wb") as joined:
        for index, clip in enumerate(clips):
            with wave.open(io.BytesIO(clip)) as part:
                frame_bytes = part.getsampwidth() * part.getnchannels()
                if index == 0:
                    joined.setparams(part.getparams()._replace(nframes=0))
                    rate = part.getframerate()
                    gap = b"\0" * int(GAP_S * rate) * frame_bytes
                else:
                    joined.writeframes(gap)
                    frames_total += len(gap) // frame_bytes
                # Fish streams its WAV, so the header's length is a placeholder: count what is read.
                frames = part.readframes(part.getnframes())
                joined.writeframes(frames)
                frames_total += len(frames) // frame_bytes
    return out.getvalue(), frames_total / rate


_WHISPER_LOCK = threading.Lock()


def _transcribe(wav_path: Path, duration: float) -> list[dict]:
    """Whisper's words with times, without the text it invents over trailing silence.

    Fish requests run in parallel threads; Whisper shares one GPU, so it runs one at a time.
    """
    import mlx_whisper

    with _WHISPER_LOCK:
        result = mlx_whisper.transcribe(str(wav_path), path_or_hf_repo=WHISPER_MODEL, word_timestamps=True)
    return heard_words(result["segments"], duration)


def _encode(wav: bytes, mp3_path: Path) -> None:
    """Encode a take as mono MP3, then bring it to the narration loudness (see level.py)."""
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-f", "wav", "-i", "-", "-ac", "1", "-b:a", BITRATE, str(mp3_path)],
        input=wav, check=True,
    )
    sys.path.insert(0, str(HERE))
    from level import level

    level(mp3_path, mp3_path, NARRATION_LUFS)


def _take(client, line: dict, cast: dict, cues: dict) -> tuple[bytes, float]:
    """One take of a line: each sentence-sized piece spoken with its cue, joined into one WAV."""
    voice = cast["speakers"][line["speaker"]]
    cue = cues.get(line["key"], voice["style"])
    pieces = [spoken_text(chunk, cue, cast) for chunk in chunk_text(line["text"])]
    return _join([_synthesise(client, piece, voice["voice"]) for piece in pieces])


def _best_take(client, line: dict, cast: dict, cues: dict) -> tuple[bytes, float, list[dict], float]:
    """Up to TAKES takes, stopping at the first that Whisper hears well enough; the best one."""
    tokens = line["text"].split(" ")
    best = None
    for _ in range(TAKES):
        wav, duration = _take(client, line, cast, cues)
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            tmp.write(wav)
            tmp.flush()
            heard = _transcribe(Path(tmp.name), duration)
        timed, ratio = align(tokens, heard, duration, said_words(line["text"], cast))
        if best is None or ratio > best[3]:
            best = (wav, duration, timed, ratio)
        if ratio >= MIN_HEARD:
            break
    return best


def record(lines: list[dict], cast: dict, cues: dict, out_dir: Path, manifest: dict) -> list[str]:
    """Record `lines` into `out_dir`, updating `manifest`; returns the keys recorded below the bar."""
    client = _client()
    below = []
    with ThreadPoolExecutor(PARALLEL) as pool:
        results = pool.map(lambda line: _best_take(client, line, cast, cues), lines)
        for number, (line, (wav, duration, timed, ratio)) in enumerate(zip(lines, results), 1):
            file = f"{line['key']}.mp3"
            _encode(wav, out_dir / file)
            manifest[line["key"]] = {"file": file, "speaker": line["speaker"], "duration": round(duration, 3), "words": timed}
            flag = "" if ratio >= MIN_HEARD else "  BELOW THE BAR"
            print(f"[{number}/{len(lines)}] {ratio:4.0%} {line['speaker']:<11} {line['text'][:60]}{flag}", flush=True)
            if ratio < MIN_HEARD:
                below.append(line["key"])
            _write_manifest(out_dir, manifest)
    return below


def retime(script: list[dict], cast: dict, out_dir: Path, manifest: dict) -> None:
    """Re-measure the word timings of every recorded line from its clip, without new audio."""
    for number, line in enumerate(script, 1):
        clip = manifest.get(line["key"])
        if not clip:
            continue
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(out_dir / clip["file"]), tmp.name], check=True)
            with wave.open(tmp.name) as audio:
                duration = audio.getnframes() / audio.getframerate()
            heard = _transcribe(Path(tmp.name), duration)
        clip["words"], ratio = align(line["text"].split(" "), heard, duration, said_words(line["text"], cast))
        clip["duration"] = round(duration, 3)
        print(f"[{number}/{len(script)}] {ratio:4.0%} {line['speaker']:<11} {line['text'][:60]}", flush=True)


def _write_manifest(out_dir: Path, manifest: dict) -> None:
    (out_dir / "manifest.json").write_text(json.dumps(dict(sorted(manifest.items())), indent=1) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("act", help="act folder in tts/, e.g. act1")
    parser.add_argument("--check", action="store_true", help="report missing and stale clips; record nothing")
    parser.add_argument("--only", nargs="+", metavar="KEY", help="(re)record only these lines")
    parser.add_argument("--retime", action="store_true", help="re-measure the word timings of existing clips; no new audio")
    args = parser.parse_args()

    act_dir = HERE / args.act
    script = json.loads((act_dir / "script.json").read_text())
    cast = json.loads((act_dir / "cast.json").read_text())
    cues_path = act_dir / "cues.json"
    cues = json.loads(cues_path.read_text()) if cues_path.exists() else {}
    out_dir = ROOT / "web" / "public" / "audio" / "narration" / args.act
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = out_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}

    wanted = {line["key"] for line in script}
    missing = [line for line in script if line["key"] not in manifest or not (out_dir / manifest[line["key"]]["file"]).exists()]
    stale = sorted(set(manifest) - wanted)
    unknown = sorted({line["speaker"] for line in script} - set(cast["speakers"]))
    if unknown:
        sys.exit(f"no voice cast for: {', '.join(unknown)}")

    orphans = orphan_cues(cues, script)
    if args.check:
        print(f"{len(script)} lines, {len(missing)} missing, {len(stale)} stale, {len(orphans)} orphaned cues")
        for line in missing:
            print(f"  missing {line['key']} {line['speaker']}: {line['text'][:60]}")
        for key in stale:
            print(f"  stale   {key}")
        for key in orphans:
            print(f"  orphaned cue {key}: its line's wording changed; re-key it in cues.json")
        sys.exit(1 if missing or stale or orphans else 0)

    if args.retime:
        retime(script, cast, out_dir, manifest)
        _write_manifest(out_dir, manifest)
        return

    for key in stale:
        (out_dir / manifest.pop(key)["file"]).unlink(missing_ok=True)
    todo = [line for line in script if line["key"] in set(args.only)] if args.only else missing
    below = record(todo, cast, cues, out_dir, manifest) if todo else []
    _write_manifest(out_dir, manifest)
    print(f"recorded {len(todo)}, removed {len(stale)} stale; {len(below)} below the bar: {' '.join(below)}")


if __name__ == "__main__":
    main()
