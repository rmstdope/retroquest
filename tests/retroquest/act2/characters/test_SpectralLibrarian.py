"""Markup tests for the Spectral Librarian's dialogue."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.Act2StoryFlags import FLAG_MENDED_LIBRARY_ENCHANTMENTS
from retroquest.act2.characters.SpectralLibrarian import SpectralLibrarian
from retroquest.engine.Game import Game
from ..markup_helpers import assert_dialogue_speaker, assert_markup_well_formed


def _create_game() -> Game:
    """Create a game running Act II without music."""
    act = Act2()
    act.music_file = ''
    return Game([act])


def test_greeting_before_mending_is_tagged_dialogue():
    """Before the wards are mended the librarian speaks in tagged dialogue."""
    game = _create_game()
    librarian = SpectralLibrarian()

    answer = librarian.talk_to(game.state)

    assert "Prove your worthiness" in answer
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, librarian.get_name())


def test_revelation_after_mending_is_tagged_dialogue():
    """After mending, the heritage revelation is spoken in tagged dialogue."""
    game = _create_game()
    game.state.set_story_flag(FLAG_MENDED_LIBRARY_ENCHANTMENTS, True)
    librarian = SpectralLibrarian()

    answer = librarian.talk_to(game.state)

    assert "Your bloodline traces back" in answer
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, librarian.get_name())


def test_follow_up_after_revelation_is_tagged_dialogue():
    """Talking again after the revelation is spoken in tagged dialogue."""
    game = _create_game()
    game.state.set_story_flag(FLAG_MENDED_LIBRARY_ENCHANTMENTS, True)
    librarian = SpectralLibrarian()
    librarian.talk_to(game.state)

    answer = librarian.talk_to(game.state)

    assert "You have proven yourself worthy" in answer
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, librarian.get_name())
