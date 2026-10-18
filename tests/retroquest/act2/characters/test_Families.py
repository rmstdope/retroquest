"""Markup and dialogue tests for the Families character in Act II."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.items.WalkingStick import WalkingStick
from retroquest.engine.Game import Game
from ..markup_helpers import (
    assert_dialogue_speaker,
    assert_markup_well_formed,
    assert_no_speech_outside_dialogue,
)

SPEAKER = "families"


def _create_game_after_helping_elders() -> Game:
    """Create an Act II game where the player has helped the elderly residents."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    game.state.current_room = game.state.all_rooms["ResidentialQuarter"]
    game.state.add_item_to_inventory(WalkingStick())
    game.command_parser.parse("give walking stick to families")
    return game


def _assert_families_speak(answer: str) -> None:
    """Assert that the answer is well formed and the families speak every dialogue."""
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, SPEAKER)
    assert_no_speech_outside_dialogue(answer)


def test_first_talk_after_helping_gives_herbs_as_attributed_dialogue():
    """The elderly woman's words when handing over the herbs are tagged dialogue."""
    game = _create_game_after_helping_elders()

    answer = game.command_parser.parse("talk to families")

    assert "Here, dear," in answer
    assert "rare healing herbs" in answer
    assert "You receive" in answer
    assert game.state.has_item("healing herbs")
    _assert_families_speak(answer)


def test_later_talk_is_attributed_dialogue():
    """The families' welcome on later visits is tagged dialogue attributed to them."""
    game = _create_game_after_helping_elders()
    game.command_parser.parse("talk to families")

    answer = game.command_parser.parse("talk to families")

    assert "Welcome to our neighborhood!" in answer
    assert "Here, dear," not in answer
    _assert_families_speak(answer)
