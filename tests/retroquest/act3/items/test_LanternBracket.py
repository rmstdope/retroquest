"""Tests for LanternBracket presence and state transitions."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game


def test_lantern_bracket_default_state():
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    from retroquest.act3.items.LanternBracket import LanternBracket
    lb = LanternBracket()
    assert hasattr(lb, 'has_lantern')
    assert lb.has_lantern is False
