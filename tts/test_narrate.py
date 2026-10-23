"""Tests for narrate.py's pure parts: aligning Whisper's words onto the shown words,
splitting long lines, and building the text sent to Fish.

    uv run --with pytest --with fish-audio-sdk==1.3.0 pytest tts/test_narrate.py
"""

import pytest

from narrate import GAP_S, _join, align, chunk_text, heard_words, orphan_cues, said_words, spoken_text


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


def test_align_compares_against_the_words_as_said():
    shown = ["Act", "I:", "The", "Call"]
    said = said_words("Act I: The Call", {"pronounce": {"Act I:": "Act One:"}})
    timed, ratio = align(shown, words(("Act", 0.0, 0.3), ("1", 0.3, 0.9), ("The", 1.0, 1.2), ("Call", 1.2, 1.6)), 2.0, said)
    assert ratio == 1.0
    assert timed[1] == {"word": "I:", "start": 0.3, "end": 0.9}


def test_a_pronunciation_changes_only_its_own_phrase():
    cast = {"pronounce": {"Act I:": "Act One:"}}
    text = "I knew your parents. Once you are ready, I will tell you."
    assert said_words(text, cast) == text.split(" ")
    _, ratio = align(text.split(" "), words(*[(w, i, i + 0.5) for i, w in enumerate(text.split(" "))]), 30.0, said_words(text, cast))
    assert ratio == 1.0


def test_said_words_fall_back_to_the_shown_words_when_the_count_changes():
    assert said_words("Malakar waits", {"pronounce": {"Malakar": "Mala kar"}}) == ["Malakar", "waits"]


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
    timed, ratio = align(["Act", "I:"], words(("Act", 0.0, 0.3), ("1", 0.3, 0.9)), 1.0, ["Act", "One:"])
    assert ratio == 1.0
    _, ratio = align(["three", "words"], words(("3", 0.0, 0.3), ("words", 0.3, 0.9)), 1.0)
    assert ratio == 1.0


def test_heard_words_keep_a_real_last_segment_that_overshoots_the_clip():
    segments = [
        {"start": 0.0, "end": 2.0, "words": words(("I", 0.0, 0.5), ("knew", 0.5, 1.0))},
        {"start": 2.0, "end": 3.6, "words": words(("tell", 2.1, 2.8), ("you.", 2.8, 3.5))},
        {"start": 3.4, "end": 3.4, "words": words(("Thanks", 3.4, 3.4))},
        {"start": 3.45, "end": 4.5, "words": words(("for", 3.45, 4.0), ("watching", 4.0, 4.5))},
    ]
    assert [w["word"] for w in heard_words(segments, duration=3.5)] == ["I", "knew", "tell", "you."]


def test_cues_whose_line_left_the_script_are_reported():
    script = [{"key": "a1", "speaker": "narrator", "text": "x"}]
    assert orphan_cues({"a1": "[soft]", "b2": "[loud]"}, script) == ["b2"]


def test_spoken_text_reads_checklist_bullets_as_a_list_not_as_asterisks():
    text = "You will need: * Warm clothing * A map"
    assert spoken_text(text, "", {}) == "You will need: Warm clothing, A map"
