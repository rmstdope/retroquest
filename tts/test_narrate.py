"""Tests for narrate.py's pure parts: aligning Whisper's words onto the shown words,
splitting long lines, and building the text sent to Fish.

    uv run --with pytest --with fish-audio-sdk==1.3.0 pytest tts/test_narrate.py
"""

import pytest

from narrate import GAP_S, _join, align, chunk_text, spoken_aliases, spoken_text


def words(*triples):
    return [{"word": w, "start": s, "end": e} for w, s, e in triples]


def test_align_exact_match_takes_whisper_times():
    tokens = ["She", "stops", "here."]
    heard = words((" She", 0.1, 0.3), (" stops", 0.3, 0.6), (" here.", 0.7, 1.0))
    timed, ratio = align(tokens, heard, duration=1.2)
    assert ratio == 1.0
    assert timed == [
        {"word": "She", "start": 0.1, "end": 0.3},
        {"word": "stops", "start": 0.3, "end": 0.6},
        {"word": "here.", "start": 0.7, "end": 1.0},
    ]


def test_align_ignores_case_and_punctuation():
    timed, ratio = align(["Come", "in,", "child."], words(("come", 0.0, 0.2), ("in", 0.2, 0.4), ("child", 0.5, 0.9)), 1.0)
    assert ratio == 1.0
    assert [w["start"] for w in timed] == [0.0, 0.2, 0.5]


def test_align_spreads_unheard_words_between_their_neighbours():
    tokens = ["I", "am", "Borin,", "the", "smith."]
    heard = words(("I", 0.0, 0.2), ("am", 0.2, 0.4), ("Boring", 0.5, 0.9), ("the", 1.0, 1.1), ("smith", 1.1, 1.6))
    timed, ratio = align(tokens, heard, duration=2.0)
    assert ratio == pytest.approx(4 / 5)
    borin = timed[2]
    assert borin["word"] == "Borin,"
    assert 0.4 <= borin["start"] < borin["end"] <= 1.0


def test_align_times_never_go_backwards_and_stay_inside_the_clip():
    tokens = ["one", "two", "three", "four"]
    heard = words(("three", 0.9, 1.2))
    timed, _ = align(tokens, heard, duration=1.5)
    starts = [w["start"] for w in timed]
    assert starts == sorted(starts)
    assert timed[0]["start"] >= 0.0 and timed[-1]["end"] <= 1.5


def test_align_with_nothing_heard_spreads_words_over_the_clip():
    timed, ratio = align(["a", "b"], [], duration=2.0)
    assert ratio == 0.0
    assert timed[0]["start"] == 0.0 and timed[-1]["end"] == 2.0


def test_chunk_text_keeps_short_lines_whole():
    assert chunk_text("A storm. Then quiet.", limit=400) == ["A storm. Then quiet."]


def test_chunk_text_splits_long_lines_at_sentence_ends():
    text = "First sentence here. Second one is a bit longer. Third."
    chunks = chunk_text(text, limit=30)
    assert chunks == ["First sentence here.", "Second one is a bit longer.", "Third."]
    assert " ".join(chunks) == text


def test_chunk_text_keeps_an_overlong_sentence_whole():
    text = "One very long sentence without any stop at all in it"
    assert chunk_text(text, limit=10) == [text]


def test_spoken_text_adds_the_cue_and_says_names_as_cast():
    cast = {"pronounce": {"Act I": "Act One"}}
    assert spoken_text("Act I: The Call to Adventure", "[grand]", cast) == "[grand] Act One: The Call to Adventure"


def test_align_counts_a_word_said_as_the_cast_asks_as_heard():
    timed, ratio = align(["Act", "I:", "The", "Call"], words(("Act", 0.0, 0.3), ("one", 0.3, 0.9), ("The", 1.0, 1.2), ("Call", 1.2, 1.6)), 2.0, {"i": "one"})
    assert ratio == 1.0
    assert timed[1] == {"word": "I:", "start": 0.3, "end": 0.9}


def test_spoken_aliases_pair_words_said_differently():
    assert spoken_aliases({"pronounce": {"Act I:": "Act One:", "Malakar": "Mala-kar the Grey"}}) == {"i": "one"}


def test_join_measures_the_audio_read_not_the_header():
    import io
    import wave

    def clip(frames):
        out = io.BytesIO()
        with wave.open(out, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(1000)
            w.writeframes(b"\x01\x00" * frames)
        data = bytearray(out.getvalue())
        data[40:44] = (0xFFFFFFF0).to_bytes(4, "little")  # a streaming placeholder for the data length
        return bytes(data)

    joined, seconds = _join([clip(500), clip(250)])
    assert seconds == pytest.approx(0.5 + GAP_S + 0.25)


def test_align_treats_a_number_word_and_its_digits_alike():
    timed, ratio = align(["Act", "I:"], words(("Act", 0.0, 0.3), ("1", 0.3, 0.9)), 1.0, {"i": "one"})
    assert ratio == 1.0
    _, ratio = align(["three", "words"], words(("3", 0.0, 0.3), ("words", 0.3, 0.9)), 1.0)
    assert ratio == 1.0
