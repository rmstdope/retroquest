"""Test for OuterCourtyard room class."""

from retroquest.act4.rooms.OuterCourtyard import OuterCourtyard


class TestOuterCourtyard:
    """Test suite for OuterCourtyard room."""

    def test_room_name(self):
        """Test that OuterCourtyard has the correct name."""
        room = OuterCourtyard()
        assert room.name == "Outer Courtyard"
