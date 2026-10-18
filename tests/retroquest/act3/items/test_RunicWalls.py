"""Markup tests for the Runic Walls item in Act 3."""

from retroquest.act3.Act3 import Act3
from retroquest.act3.items.RunicWalls import RunicWalls
from retroquest.engine.Game import Game
from ..markup_helpers import assert_markup_well_formed


def test_examining_walls_uses_known_tags():
    """Examining the runic walls uses only known, balanced tags."""
    act = Act3()
    act.music_file = ''
    game = Game([act])

    answer = RunicWalls().examine(game.state)

    assert "chant to quiet the phantoms" in answer
    assert_markup_well_formed(answer)
