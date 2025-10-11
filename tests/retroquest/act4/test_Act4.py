"""Test for Act4 class instantiation."""

from retroquest.act4.Act4 import Act4


class TestAct4:
    """Test suite for Act4 class."""

    def test_act4_instantiation(self):
        """Test that Act4 can be instantiated correctly."""
        act4 = Act4()
        assert act4.name == "Act IV"
        assert len(act4.rooms) == 10
        assert len(act4.quests) == 0  # No quests implemented yet

    def test_act4_rooms_exist(self):
        """Test that all expected rooms exist in Act4."""
        act4 = Act4()
        expected_rooms = [
            "FortressGates", "OuterCourtyard", "MirrorLabyrinth",
            "HallOfEchoes", "TowerOfShadows", "ChamberOfWhispers",
            "MemoryVault", "ThroneChamberApproach", "ThroneChamer",
            "RoyalGardens"
        ]
        for room_name in expected_rooms:
            assert room_name in act4.rooms

    def test_act4_intro_text(self):
        """Test that Act4 has proper intro text."""
        act4 = Act4()
        intro = act4.get_act_intro()
        assert "ACT IV: THE FINAL CONFRONTATION" in intro
        assert "Lifelight Elixir" in intro
