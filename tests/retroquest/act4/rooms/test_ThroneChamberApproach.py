"""Test for ThroneChamberApproach room class."""

from retroquest.act4.rooms.ThroneChamberApproach import ThroneChamberApproach


class TestThroneChamberApproach:
    """Test suite for ThroneChamberApproach room."""

    def test_room_name(self):
        """Test that ThroneChamberApproach has the correct name."""
        room = ThroneChamberApproach()
        assert room.name == "Throne Chamber Approach"
