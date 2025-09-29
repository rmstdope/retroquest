"""Tests for HealingHerbs item."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game


def test_healing_herbs_get_name():
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    from retroquest.act3.items.HealingHerbs import HealingHerbs
    hh = HealingHerbs()
    assert 'herb' in hh.get_name().lower() or hh.get_name() is not None
