"""Tests for level.py: the second-pass filter built from a measurement, and a real round trip.

    uv run --no-project --with pytest pytest tts/test_level.py      (needs ffmpeg)
"""

import subprocess

import pytest

from level import gain_filter, level, loudness


def test_gain_filter_raises_the_level_and_limits_the_peaks():
    assert gain_filter(10.0, true_peak=-1.5) == "volume=10.00dB,alimiter=limit=0.8414:attack=5:release=50:level=false"


@pytest.fixture
def quiet_tone(tmp_path):
    path = tmp_path / "tone.mp3"
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=6",
         "-af", "volume=-30dB", "-ac", "1", "-b:a", "64k", str(path)],
        check=True,
    )
    return path


def test_level_brings_a_quiet_clip_to_the_target_and_keeps_its_format(quiet_tone, tmp_path):
    out = tmp_path / "levelled.mp3"
    level(quiet_tone, out, target=-16.0)
    assert loudness(out) == pytest.approx(-16.0, abs=1.0)
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=channels,sample_rate:format=duration", "-of", "csv=p=0", str(out)],
        capture_output=True, text=True, check=True,
    ).stdout.split()
    original = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=channels,sample_rate:format=duration", "-of", "csv=p=0", str(quiet_tone)],
        capture_output=True, text=True, check=True,
    ).stdout.split()
    assert probe[0] == original[0]  # sample rate and channels unchanged
    assert float(probe[1]) == pytest.approx(float(original[1]), abs=0.1)  # timing unchanged


@pytest.fixture
def quiet_with_a_sharp_peak(tmp_path):
    """Like speech: quiet on average, with a short loud peak that a plain gain would push past 0 dBFS."""
    path = tmp_path / "peaky.mp3"
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y",
         "-f", "lavfi", "-i", "sine=frequency=220:duration=6",
         "-f", "lavfi", "-i", "sine=frequency=1000:duration=0.05",
         "-filter_complex", "[0]volume=-30dB[a];[1]volume=-2dB,adelay=2000[b];[a][b]amix=inputs=2:normalize=0",
         "-ac", "1", "-b:a", "64k", str(path)],
        check=True,
    )
    return path


def test_level_reaches_the_target_even_when_peaks_limit_a_plain_gain(quiet_with_a_sharp_peak, tmp_path):
    out = tmp_path / "levelled.mp3"
    level(quiet_with_a_sharp_peak, out, target=-16.0)
    assert loudness(out) == pytest.approx(-16.0, abs=1.0)
