"""Markup and dialogue tests for the Herald character in Act II."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.items.EntryPass import EntryPass
from retroquest.engine.Game import Game
from ..markup_helpers import (
    assert_dialogue_speaker,
    assert_markup_well_formed,
    assert_no_speech_outside_dialogue,
)

SPEAKER = "herald"


def _create_game_at_castle_approach() -> Game:
    """Create an Act II game with the player at the Castle Approach."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    game.state.current_room = game.state.all_rooms["CastleApproach"]
    return game


def _assert_herald_speaks(answer: str) -> None:
    """Assert that the answer is well formed and the herald speaks every dialogue."""
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, SPEAKER)
    assert_no_speech_outside_dialogue(answer)


def test_talk_before_pass_is_attributed_dialogue():
    """The herald asking for credentials is tagged dialogue attributed to him."""
    game = _create_game_at_castle_approach()

    answer = game.command_parser.parse("talk to herald")

    assert "I must examine your credentials" in answer
    _assert_herald_speaks(answer)


def test_giving_entry_pass_is_attributed_dialogue():
    """The herald accepting the entry pass is tagged dialogue attributed to him."""
    game = _create_game_at_castle_approach()
    game.state.add_item_to_inventory(EntryPass())

    answer = game.command_parser.parse("give entry pass to herald")

    assert "This is a formal recommendation of excellent standing" in answer
    assert "The pass has been officially registered" in answer
    _assert_herald_speaks(answer)


def test_talk_after_pass_is_attributed_dialogue():
    """The herald confirming audience rights is tagged dialogue attributed to him."""
    game = _create_game_at_castle_approach()
    game.state.add_item_to_inventory(EntryPass())
    game.command_parser.parse("give entry pass to herald")

    answer = game.command_parser.parse("talk to herald")

    assert "Your credentials have been verified" in answer
    _assert_herald_speaks(answer)
