"""Tests for Mural item."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game


def test_mural_examine_returns_text():
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    room = game.state.all_rooms['TidalCauseway']
    mural = next((i for i in room.items if i.__class__.__name__ == 'Mural'), None)
    assert mural is not None
    out = mural.examine(game.state)
    assert 'sea' in out.lower() or 'reliquary' in out.lower()
