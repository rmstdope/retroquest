"""Tests for Locker item behavior."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game


def test_locker_examine_and_open_behaviour():
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    room = game.state.all_rooms['CollapsedPier']
    locker = next((i for i in room.items if i.__class__.__name__ == 'Locker'), None)
    assert locker is not None
    out = locker.examine(game.state)
    assert 'lock' in out.lower() or 'fused' in out.lower()
