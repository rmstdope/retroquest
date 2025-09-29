"""Tests for MoonRuneShards item basic behaviors."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game


def test_moon_rune_shards_can_be_added_to_inventory():
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    from retroquest.act3.items.MoonRuneShards import MoonRuneShards
    shards = MoonRuneShards()
    game.state.add_item_to_inventory(shards)
    assert game.state.has_item('Moon Rune Shards')
