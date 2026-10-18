"""Markup tests for the ReinforcedBraces item in Act 3."""

from retroquest.act3.Act3 import Act3
from retroquest.act3.items.ReinforcedBraces import ReinforcedBraces
from retroquest.act3.items.RustedLockerKey import RustedLockerKey
from retroquest.engine.Game import Game
from ..markup_helpers import assert_markup_well_formed


def test_use_with_unrelated_item_uses_known_tags():
    """Using the reinforced braces with an unrelated item uses only known, balanced tags."""
    act = Act3()
    act.music_file = ''
    game = Game([act])

    answer = ReinforcedBraces().use_with(game.state, RustedLockerKey())

    assert "You can't use the reinforced braces with" in answer
    assert_markup_well_formed(answer)
