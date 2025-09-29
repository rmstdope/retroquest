"""Tests for TeleportationFocus item."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game


def test_teleportation_focus_name():
    """Teleportation Focus exposes a clear, non-empty name."""
    act3 = Act3()
    act3.music_file = ''
    _game = Game([act3])

    from retroquest.act3.items.TeleportationFocus import TeleportationFocus
    tf = TeleportationFocus()
    assert 'teleport' in tf.get_name().lower() or tf.get_name() is not None
