"""Bring audio files to a target loudness, keeping their format.

    python3 tts/level.py --lufs -20 web/public/audio/music/*.mp3   # level files in place
    python3 tts/level.py --lufs -16 --check web/public/audio/narration/act1/*.mp3

Loudness is integrated loudness (EBU R128, LUFS). Each file is measured and re-encoded with
the gain that brings it to the target, a limiter keeping peaks below -1.5 dBFS, then
measured again and corrected; sample rate, channels, bit rate and timing are kept. Audio
Studio levels every narration clip it records the same way (`output.lufs` in audio-studio.json).
Needs ffmpeg.
"""

import argparse
import json
import math
import re
import subprocess
import sys
import tempfile
from pathlib import Path

TRUE_PEAK = -1.5
LRA = 11
# Encodes allowed to reach the target: limiting takes off a little loudness each time.
PASSES = 4


def _measure(path: Path, target: float, true_peak: float) -> dict:
    """ffmpeg loudnorm's first-pass measurement of `path`."""
    result = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path),
         "-af", f"loudnorm=I={target}:TP={true_peak}:LRA={LRA}:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True, check=True,
    )
    return json.loads(re.findall(r"\{[^{}]*\}", result.stderr)[-1])


def gain_filter(gain_db: float, true_peak: float = TRUE_PEAK) -> str:
    """A constant gain, with a limiter that keeps the few peaks it would push too high below `true_peak`."""
    ceiling = 10 ** (true_peak / 20)
    return f"volume={gain_db:.2f}dB,alimiter=limit={ceiling:.4f}:attack=5:release=50:level=false"


def _probe(path: Path) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0",
         "-show_entries", "stream=sample_rate,channels,bit_rate", "-of", "json", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    return json.loads(out)["streams"][0]


def loudness(path: Path) -> float:
    """Integrated loudness of `path` in LUFS."""
    return float(_measure(path, -16.0, TRUE_PEAK)["input_i"])


def level(source: Path, target_path: Path, target: float, true_peak: float = TRUE_PEAK) -> None:
    """Write `source` to `target_path` at `target` LUFS, keeping its rate, channels and bit rate.

    The gain is what the measurement asks for; a limiter catches the peaks that gain would
    push past `true_peak` (speech has short sharp peaks). The limiting takes a little
    loudness off, so the result is measured again and the gain corrected, up to PASSES times
    (a file still off target then is reported). A clip too short or silent to measure is refused.
    """
    stream = _probe(source)
    bitrate = stream.get("bit_rate")
    measured = loudness(source)
    if not math.isfinite(measured):
        raise ValueError(f"{source}: too short or silent to measure its loudness")
    gain = target - measured
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / Path(target_path).name
        for _ in range(PASSES):
            args = ["ffmpeg", "-loglevel", "error", "-y", "-i", str(source),
                    "-af", gain_filter(gain, true_peak),
                    "-ar", stream["sample_rate"], "-ac", str(stream["channels"])]
            if bitrate:
                args += ["-b:a", bitrate]
            subprocess.run([*args, str(out)], check=True)
            miss = target - loudness(out)
            if abs(miss) <= 0.5:
                break
            gain += miss
        else:
            print(f"{source.name}: {target - miss:.1f} LUFS after {PASSES} passes", file=sys.stderr)
        out.replace(target_path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("files", nargs="+", type=Path)
    parser.add_argument("--lufs", type=float, required=True, help="target integrated loudness, e.g. -16")
    parser.add_argument("--check", action="store_true", help="report loudness only; change nothing")
    args = parser.parse_args()
    off = 0
    for path in args.files:
        if args.check:
            value = loudness(path)
            flag = "" if abs(value - args.lufs) <= 1.0 else "  OFF TARGET"
            off += bool(flag)
            print(f"{value:6.1f} LUFS  {path.name}{flag}")
        else:
            level(path, path, args.lufs)
            print(f"levelled {path.name}")
    sys.exit(1 if off else 0)


if __name__ == "__main__":
    main()
