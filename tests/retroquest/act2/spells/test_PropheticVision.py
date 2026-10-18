"""Markup tests for the Prophetic Vision spell."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.characters.SirCedric import SirCedric
from retroquest.act2.spells.PropheticVision import PropheticVision
from retroquest.engine.Game import Game
from ..markup_helpers import assert_markup_well_formed


def _create_game_with_cedric() -> Game:
    """Create an Act II game with Sir Cedric in the current room."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    game.state.current_room.add_character(SirCedric())
    return game


def test_first_vision_uses_only_known_tags():
    """The first vision with Sir Cedric present uses only known, balanced tags."""
    game = _create_game_with_cedric()

    answer = PropheticVision().cast_spell(game.state)

    assert "shadows gathering in the north" in answer
    assert_markup_well_formed(answer)


def test_repeated_vision_uses_only_known_tags():
    """Casting the vision again uses only known, balanced tags."""
    game = _create_game_with_cedric()
    spell = PropheticVision()
    spell.cast_spell(game.state)

    answer = spell.cast_spell(game.state)

    assert "brief glimpses of possible futures" in answer
    assert_markup_well_formed(answer)
