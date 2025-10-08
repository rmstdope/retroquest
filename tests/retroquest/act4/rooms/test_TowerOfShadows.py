"""Test for TowerOfShadows room class."""

from retroquest.act4.rooms.TowerOfShadows import TowerOfShadows


class TestTowerOfShadows:
    """Test suite for TowerOfShadows room."""

    def test_room_name(self):
        """Test that TowerOfShadows has the correct name."""
        room = TowerOfShadows()
        assert room.name == "Tower of Shadows"