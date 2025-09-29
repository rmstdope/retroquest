"""Tests for RustedLockerKey basic behavior."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game


def test_rusted_locker_key_name_and_pickup():
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    from retroquest.act3.items.RustedLockerKey import RustedLockerKey
    key = RustedLockerKey()
    assert key.get_name().lower().startswith('rusted')
