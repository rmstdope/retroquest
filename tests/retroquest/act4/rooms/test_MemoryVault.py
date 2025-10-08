"""Test for MemoryVault room class."""

from retroquest.act4.rooms.MemoryVault import MemoryVault


class TestMemoryVault:
    """Test suite for MemoryVault room."""

    def test_room_name(self):
        """Test that MemoryVault has the correct name."""
        room = MemoryVault()
        assert room.name == "Memory Vault"