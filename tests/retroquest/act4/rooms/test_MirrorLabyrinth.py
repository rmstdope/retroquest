"""Test for MirrorLabyrinth room class."""

from retroquest.act4.rooms.MirrorLabyrinth import MirrorLabyrinth


class TestMirrorLabyrinth:
    """Test suite for MirrorLabyrinth room."""

    def test_room_name(self):
        """Test that MirrorLabyrinth has the correct name."""
        room = MirrorLabyrinth()
        assert room.name == "Mirror Labyrinth"
