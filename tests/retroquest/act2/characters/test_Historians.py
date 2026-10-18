"""Markup tests for the Historians in Act II."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.Act2StoryFlags import FLAG_READ_TRAVELERS_JOURNAL
from retroquest.act2.characters.Historians import Historians
from retroquest.act2.items.TravelersJournal import TravelersJournal
from retroquest.engine.Game import Game
from ..markup_helpers import (
    assert_dialogue_speaker,
    assert_markup_well_formed,
    assert_no_speech_outside_dialogue,
)


def _create_game() -> Game:
    """Create an Act II game for the historians' dialogue."""
    act = Act2()
    act.music_file = ''
    return Game([act])


def test_welcome_is_attributed_dialogue():
    """The historians' welcome is tagged dialogue attributed to them."""
    game = _create_game()

    answer = Historians().talk_to(game.state)

    assert "Welcome to the historical archives" in answer
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, "historians")


def test_showing_journal_and_follow_up_are_attributed_dialogue():
    """Showing the journal and talking afterwards are tagged, attributed dialogue."""
    game = _create_game()
    historians = Historians()
    game.state.set_story_flag(FLAG_READ_TRAVELERS_JOURNAL, True)
    shown = historians.give_item(game.state, TravelersJournal())

    follow_up = historians.talk_to(game.state)

    assert "This is fascinating!" in shown
    assert "most illuminating" in follow_up
    for answer in (shown, follow_up):
        assert_markup_well_formed(answer)
        assert_dialogue_speaker(answer, "historians")
        assert_no_speech_outside_dialogue(answer)
