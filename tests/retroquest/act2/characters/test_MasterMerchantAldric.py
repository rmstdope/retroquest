"""Markup and dialogue tests for Master Merchant Aldric in Act II."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.items.MerchantsFlyer import MerchantsFlyer
from retroquest.act2.items.WalkingStick import WalkingStick
from retroquest.engine.Game import Game
from ..markup_helpers import (
    assert_dialogue_speaker,
    assert_markup_well_formed,
    assert_no_speech_outside_dialogue,
)

SPEAKER = "Master Merchant Aldric"


def _create_game_at_market() -> Game:
    """Create an Act II game with the player in the Market District."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    game.state.current_room = game.state.all_rooms["MarketDistrict"]
    return game


def _assert_aldric_speaks(answer: str) -> None:
    """Assert that the answer is well formed and Aldric speaks every dialogue."""
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, SPEAKER)
    assert_no_speech_outside_dialogue(answer)


def test_talk_before_flyer_is_attributed_dialogue():
    """Aldric asking for credentials is tagged dialogue attributed to him."""
    game = _create_game_at_market()

    answer = game.command_parser.parse("talk to master merchant aldric")

    assert "I deal only with established customers" in answer
    _assert_aldric_speaks(answer)


def test_giving_flyer_is_attributed_dialogue():
    """Aldric accepting the flyer is tagged dialogue attributed to him."""
    game = _create_game_at_market()
    game.state.add_item_to_inventory(MerchantsFlyer())

    answer = game.command_parser.parse("give merchant's flyer to master merchant aldric")

    assert "This flyer grants you access to our premium selection" in answer
    _assert_aldric_speaks(answer)


def test_talk_after_flyer_is_attributed_dialogue():
    """Aldric presenting his wares is tagged dialogue attributed to him."""
    game = _create_game_at_market()
    game.state.add_item_to_inventory(MerchantsFlyer())
    game.command_parser.parse("give merchant's flyer to master merchant aldric")

    answer = game.command_parser.parse("talk to master merchant aldric")

    assert "My premium selection includes" in answer
    _assert_aldric_speaks(answer)


def test_declining_other_items_is_attributed_dialogue():
    """Aldric declining other items is tagged dialogue attributed to him."""
    game = _create_game_at_market()
    game.state.add_item_to_inventory(WalkingStick())

    answer = game.command_parser.parse("give walking stick to master merchant aldric")

    assert "I deal in adventure gear, not donations" in answer
    _assert_aldric_speaks(answer)
