"""Assertions on engine answer markup as parsed by the web UI.

The web UI (web/src/lantern/parseTurn.ts) gives each ``[dialogue]`` block the
speaker named by the last ``[character_name]`` in the narration before it, and
only renders the tags of the engine theme plus ``bold`` and ``dim``.
"""

import re

from retroquest.engine.theme import custom_theme

VALID_TAGS = set(custom_theme) | {"bold", "dim"}
TAG_PATTERN = re.compile(r"\[(/?)([a-z_]+)\]")
DIALOGUE_PATTERN = re.compile(r"\[dialogue\].*?\[/dialogue\]", re.S)
CHARACTER_NAME_PATTERN = re.compile(r"\[character_name\](.*?)\[/character_name\]", re.S)


def assert_markup_well_formed(text: str) -> None:
    """Assert that all tags are known, balanced and never nested in themselves."""
    open_tags: list[str] = []
    for match in TAG_PATTERN.finditer(text):
        closing, tag = match.groups()
        assert tag in VALID_TAGS, f"Unknown tag [{tag}] in: {text}"
        if not closing:
            assert tag not in open_tags, f"Nested [{tag}] in: {text}"
            open_tags.append(tag)
        else:
            assert open_tags and open_tags[-1] == tag, f"Unbalanced [/{tag}] in: {text}"
            open_tags.pop()
    assert not open_tags, f"Unclosed tags {open_tags} in: {text}"


def assert_dialogue_speaker(text: str, speaker: str) -> None:
    """Assert that every dialogue block in text is attributed to speaker."""
    blocks = list(DIALOGUE_PATTERN.finditer(text))
    assert blocks, f"No dialogue in: {text}"
    narration = ""
    position = 0
    for block in blocks:
        narration += text[position:block.start()]
        position = block.end()
        names = CHARACTER_NAME_PATTERN.findall(narration)
        assert names, f"No speaker before dialogue in: {text}"
        assert names[-1].lower() == speaker.lower(), (
            f"Dialogue attributed to {names[-1]!r}, expected {speaker!r} in: {text}"
        )
