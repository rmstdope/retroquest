"""Tests for the Lord Commander character in Act II."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.Act2StoryFlags import (
    FLAG_CEDRIKS_HONOR_COMPLETED,
    FLAG_EXAMINED_SECRET_DOCUMENTS,
)
from retroquest.engine.Game import Game
from ..markup_helpers import (
    assert_dialogue_speaker,
    assert_markup_well_formed,
    assert_no_speech_outside_dialogue,
)

SPEAKER = "lord commander"


def _create_game_in_great_hall() -> Game:
    """Create an Act II game with the player in the Great Hall."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    game.state.current_room = game.state.all_rooms["GreatHall"]
    return game


def _assert_attributed_dialogue(answer: str) -> None:
    """Assert that the answer is well-formed dialogue spoken by the Lord Commander."""
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, SPEAKER)
    assert_no_speech_outside_dialogue(answer)


def test_talk_before_evidence_gives_formal_welcome():
    """Before the documents are examined, the Lord Commander welcomes the player."""
    game = _create_game_in_great_hall()

    answer = game.command_parser.parse("talk to lord commander")

    assert "Welcome to Greendale's Great Hall" in answer
    _assert_attributed_dialogue(answer)


def test_talk_after_examining_documents_asks_for_evidence():
    """Once the documents are examined, the Lord Commander asks to see them."""
    game = _create_game_in_great_hall()
    game.state.set_story_flag(FLAG_EXAMINED_SECRET_DOCUMENTS, True)

    answer = game.command_parser.parse("talk to lord commander")

    assert "please present them to me" in answer
    _assert_attributed_dialogue(answer)


def test_talk_after_honor_restored_confirms_justice():
    """Once Sir Cedric's honor is restored, the Lord Commander confirms it."""
    game = _create_game_in_great_hall()
    game.state.set_story_flag(FLAG_EXAMINED_SECRET_DOCUMENTS, True)
    game.state.set_story_flag(FLAG_CEDRIKS_HONOR_COMPLETED, True)

    answer = game.command_parser.parse("talk to lord commander")

    assert "Sir Cedric's honor has been fully restored" in answer
    _assert_attributed_dialogue(answer)
