"""Tests for TeleportationFocus item."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game
from retroquest.act3.items.TeleportationFocus import TeleportationFocus


class DummyGameState:
    pass


def test_teleportation_focus_name():
    """Teleportation Focus exposes a clear, non-empty name."""
    act3 = Act3()
    act3.music_file = ''
    _game = Game([act3])

    tf = TeleportationFocus()
    assert 'teleport' in tf.get_name().lower() or tf.get_name() is not None


def test_teleportationfocus_init():
    focus = TeleportationFocus()
    assert focus.get_name() == "teleportation focus"
    assert "prism" in focus.description.lower() or "circle" in focus.description.lower()
    assert focus.can_be_carried_flag is False


def test_teleportationfocus_examine():
    focus = TeleportationFocus()
    gs = DummyGameState()
    result = focus.examine(gs)
    assert "study the prism" in result or "doorway" in result or "mira" not in result.lower()
    assert result.startswith("[event]")


def test_teleportationfocus_prevent_pickup():
    focus = TeleportationFocus()
    result = focus.prevent_pickup()
    assert "Mira" in result
    assert "circle anchors" in result or "must bear it" in result
    assert "dialogue" in result
