"""Test for HallOfEchoes room class."""

from retroquest.act4.rooms.HallOfEchoes import HallOfEchoes


class TestHallOfEchoes:
    """Test suite for HallOfEchoes room."""

    def test_room_name(self):
        """Test that HallOfEchoes has the correct name."""
        room = HallOfEchoes()
        assert room.name == "Hall of Echoes"