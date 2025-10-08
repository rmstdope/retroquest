"""Test for RoyalGardens room class."""

from retroquest.act4.rooms.RoyalGardens import RoyalGardens


class TestRoyalGardens:
    """Test suite for RoyalGardens room."""

    def test_room_name(self):
        """Test that RoyalGardens has the correct name."""
        room = RoyalGardens()
        assert room.name == "Royal Gardens"