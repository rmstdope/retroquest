"""Test for FortressGates room class."""

from retroquest.act4.rooms.FortressGates import FortressGates


class TestFortressGates:
    """Test suite for FortressGates room."""

    def test_room_name(self):
        """Test that FortressGates has the correct name."""
        room = FortressGates()
        assert room.name == "Fortress Gates"