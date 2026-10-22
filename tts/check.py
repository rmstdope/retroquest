"""Check a generated clip against its text: transcribe it with Whisper and diff the words.

Prints the transcript, the share of text words heard in order, and every dropped,
added or changed stretch, so content errors show up without listening.

    python3 tts/check.py tts/out/p2.txt tts/out/p2.wav

Needs uv (Whisper runs through `uvx mlx-whisper`, on Apple Silicon).
"""

import difflib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

WHISPER_MODEL = "mlx-community/whisper-large-v3-turbo"


def words(text: str) -> list[str]:
    """Lower-case words without punctuation, for a forgiving comparison."""
    return re.findall(r"[a-z0-9']+", text.lower().replace("—", " "))


def transcribe(wav: Path) -> str:
    """Whisper's transcript of `wav`."""
    with tempfile.TemporaryDirectory() as out_dir:
        subprocess.run(
            ["uvx", "--from", "mlx-whisper", "mlx_whisper", "--model", WHISPER_MODEL,
             "--output-format", "json", "--output-dir", out_dir, "--output-name", "t",
             "--verbose", "False", str(wav)],
            check=True, capture_output=True,
        )
        return json.loads((Path(out_dir) / "t.json").read_text())["text"].strip()


def main() -> None:
    text_file, wav = Path(sys.argv[1]), Path(sys.argv[2])
    expected, heard_text = text_file.read_text(), transcribe(wav)
    want, heard = words(expected), words(heard_text)

    matcher = difflib.SequenceMatcher(a=want, b=heard, autojunk=False)
    matched = sum(block.size for block in matcher.get_matching_blocks())
    print(f"heard: {heard_text}\n")
    print(f"words matched: {matched}/{len(want)} ({100 * matched / len(want):.0f}%), heard {len(heard)} words")
    for op, a1, a2, b1, b2 in matcher.get_opcodes():
        if op != "equal":
            print(f"  {op:8} text: {' '.join(want[a1:a2]) or '-':40} heard: {' '.join(heard[b1:b2]) or '-'}")


if __name__ == "__main__":
    main()
