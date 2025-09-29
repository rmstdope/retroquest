"""Tests for PrismLantern item basic behaviors."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game


def test_prism_lantern_inventory_and_name():
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    from retroquest.act3.items.PrismLantern import PrismLantern
    pl = PrismLantern()
    game.state.add_item_to_inventory(pl, count=2)
    assert game.state.get_item('Prism Lantern') is not None
    assert game.state.get_item('Prism Lantern').get_name() == 'Prism Lantern'
