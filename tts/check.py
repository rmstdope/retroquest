"""Check a generated clip against its text: transcribe it with Whisper and diff the words.

Prints the transcript, the share of text words heard in order, and every dropped,
added or changed stretch, so content errors show up without listening.

    python3 tts/check.py tts/texts/p2.txt tts/out/p2.wav

Needs uv (Whisper runs through `uvx mlx-whisper`, on Apple Silicon) and, for clips
other than WAV, ffprobe (from ffmpeg) to read their length.
"""

import difflib
import json
import re
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

WHISPER = "mlx-whisper==0.4.3"
WHISPER_MODEL = "mlx-community/whisper-large-v3-turbo"
MIN_SEGMENT_S = 0.3


def words(text: str) -> list[str]:
    """Lower-case words without punctuation, for a forgiving comparison."""
    return re.findall(r"[a-z0-9']+", text.lower().replace("—", " "))


def clip_seconds(clip: Path) -> float:
    """The clip's length: read from a WAV header, or asked of ffprobe for other formats."""
    if clip.suffix.lower() == ".wav":
        with wave.open(str(clip)) as audio:
            return audio.getnframes() / audio.getframerate()
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(clip)],
        capture_output=True, text=True, check=True,
    )
    return float(probe.stdout)


def transcribe(wav: Path) -> str:
    """Whisper's transcript of `wav`."""
    with tempfile.TemporaryDirectory() as out_dir:
        result = subprocess.run(
            ["uvx", "--from", WHISPER, "mlx_whisper", "--model", WHISPER_MODEL,
             "--output-format", "json", "--output-dir", out_dir, "--output-name", "t",
             "--verbose", "False", str(wav)],
            capture_output=True, text=True,
        )
        if result.returncode:
            sys.exit(f"Whisper failed:\n{result.stderr}")
        segments = json.loads((Path(out_dir) / "t.json").read_text())["segments"]
    duration = clip_seconds(wav)
    # On trailing silence Whisper invents text: near-zero-length segments, or segments
    # reaching past the end of the file. Drop both.
    return " ".join(
        seg["text"].strip()
        for seg in segments
        if seg["end"] - seg["start"] >= MIN_SEGMENT_S and seg["end"] <= duration + MIN_SEGMENT_S
    )


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit("usage: python3 tts/check.py TEXT_FILE CLIP")
    text_file, wav = Path(sys.argv[1]), Path(sys.argv[2])
    want = words(re.sub(r"\[[^\]]*\]", " ", text_file.read_text()))
    if not want:
        sys.exit(f"{text_file} has no words to check against")
    heard_text = transcribe(wav)
    heard = words(heard_text)

    matcher = difflib.SequenceMatcher(a=want, b=heard, autojunk=False)
    matched = sum(block.size for block in matcher.get_matching_blocks())
    print(f"heard: {heard_text}\n")
    print(f"words matched: {matched}/{len(want)} ({100 * matched / len(want):.0f}%), heard {len(heard)} words")
    for op, a1, a2, b1, b2 in matcher.get_opcodes():
        if op != "equal":
            print(f"  {op:8} text: {' '.join(want[a1:a2]) or '-':40} heard: {' '.join(heard[b1:b2]) or '-'}")


if __name__ == "__main__":
    main()
