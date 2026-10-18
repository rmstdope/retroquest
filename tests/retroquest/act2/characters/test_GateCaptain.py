"""Markup and dialogue tests for the Gate Captain character in Act II."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.characters.GateCaptain import GateCaptain
from retroquest.act2.items.EntryPass import EntryPass
from retroquest.act2.items.WalkingStick import WalkingStick
from retroquest.engine.Game import Game
from ..markup_helpers import (
    assert_dialogue_speaker,
    assert_markup_well_formed,
    assert_no_speech_outside_dialogue,
)

SPEAKER = "Gate Captain"


def _create_game_at_gates() -> Game:
    """Create an Act II game with the player at the Greendale Gates."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    game.state.current_room = game.state.all_rooms["GreendaleGates"]
    return game


def _assert_captain_speaks(answer: str) -> None:
    """Assert that the answer is well formed and the captain speaks every dialogue."""
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, SPEAKER)
    assert_no_speech_outside_dialogue(answer)


def test_showing_entry_pass_again_uses_known_tags():
    """Showing the entry pass a second time uses only known, balanced tags."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    captain = GateCaptain()
    captain.give_item(game.state, EntryPass())

    answer = captain.give_item(game.state, EntryPass())

    assert "already shown the entry pass" in answer
    assert_markup_well_formed(answer)


def test_talk_before_entry_pass_is_attributed_dialogue():
    """The captain asking for documentation is tagged dialogue attributed to him."""
    game = _create_game_at_gates()

    answer = game.command_parser.parse("talk to gate captain")

    assert "State your business in Greendale" in answer
    _assert_captain_speaks(answer)


def test_showing_entry_pass_is_attributed_dialogue():
    """The captain accepting the entry pass is tagged dialogue attributed to him."""
    game = _create_game_at_gates()
    game.state.add_item_to_inventory(EntryPass())

    answer = game.command_parser.parse("give entry pass to gate captain")

    assert "This is legitimate documentation indeed" in answer
    _assert_captain_speaks(answer)


def test_talk_after_entry_pass_is_attributed_dialogue():
    """The captain's farewell after the pass is tagged dialogue attributed to him."""
    game = _create_game_at_gates()
    game.state.add_item_to_inventory(EntryPass())
    game.command_parser.parse("give entry pass to gate captain")

    answer = game.command_parser.parse("talk to gate captain")

    assert "Welcome to Greendale, honored visitor" in answer
    assert "salutes smartly" in answer
    _assert_captain_speaks(answer)


def test_declining_other_items_is_attributed_dialogue():
    """The captain declining other items is tagged dialogue attributed to him."""
    game = _create_game_at_gates()
    game.state.add_item_to_inventory(WalkingStick())

    answer = game.command_parser.parse("give walking stick to gate captain")

    assert "I only need to see proper entry documentation" in answer
    _assert_captain_speaks(answer)
