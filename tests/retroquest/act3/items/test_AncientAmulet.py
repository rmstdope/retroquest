"""Tests for AncientAmulet item."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game


def test_ancient_amulet_exists():
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    from retroquest.act3.items.AncientAmulet import AncientAmulet
    am = AncientAmulet()
    assert am.get_name() is not None
