"""Test for ChamberOfWhispers room class."""

from retroquest.act4.rooms.ChamberOfWhispers import ChamberOfWhispers


class TestChamberOfWhispers:
    """Test suite for ChamberOfWhispers room."""

    def test_room_name(self):
        """Test that ChamberOfWhispers has the correct name."""
        room = ChamberOfWhispers()
        assert room.name == "Chamber of Whispers"
