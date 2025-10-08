"""Test for ThroneChamer room class."""

from retroquest.act4.rooms.ThroneChamer import ThroneChamer


class TestThroneChamer:
    """Test suite for ThroneChamer room."""

    def test_room_name(self):
        """Test that ThroneChamer has the correct name."""
        room = ThroneChamer()
        assert room.name == "Throne Chamber"