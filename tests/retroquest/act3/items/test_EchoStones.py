"""Unit tests for EchoStones item in Act 3."""
from retroquest.act3.items.EchoStones import EchoStones
from retroquest.act3.items.ResonantChantRubbings import ResonantChantRubbings
from retroquest.act3.Act3StoryFlags import FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED


class DummyGameState:
    """Dummy game state for testing."""

    def __init__(self):
        """Initialize with empty story flags."""
        self.story_flags = {}

    def get_story_flag(self, flag_name):
        """Get a story flag value."""
        return self.story_flags.get(flag_name, False)

    def set_story_flag(self, flag_name, value):
        """Set a story flag value."""
        self.story_flags[flag_name] = value


def test_echo_stones_init():
    """Test initialization of EchoStones."""
    stones = EchoStones()
    assert stones.get_name() == "echo stones"
    assert "carved" in stones.description and "channels" in stones.description
    assert stones.can_be_carried_flag is False
    assert not stones.are_blessed()


def test_echo_stones_bless_spell():
    """Test blessing the echo stones."""
    stones = EchoStones()
    gs = DummyGameState()
    
    # First blessing should succeed
    result = stones.receive_spell("bless", gs)
    assert "sacred light" in result.lower() and "ready to amplify" in result.lower()
    assert stones.are_blessed()
    
    # Second blessing should indicate already blessed
    result = stones.receive_spell("bless", gs)
    assert "already blessed" in result.lower()


def test_echo_stones_wrong_spell():
    """Test casting wrong spell on echo stones."""
    stones = EchoStones()
    gs = DummyGameState()
    
    result = stones.receive_spell("light", gs)
    assert "no effect" in result.lower()


def test_resonant_chant_rubbings_use_with_unblessed_stones():
    """Test using chant rubbings with unblessed stones."""
    stones = EchoStones()
    rubbings = ResonantChantRubbings()
    gs = DummyGameState()
    
    result = rubbings.use_with(gs, stones)
    assert "cold and unresponsive" in result.lower()
    assert "sanctified" in result.lower()
    assert not gs.get_story_flag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED)


def test_resonant_chant_rubbings_use_with_blessed_stones():
    """Test using chant rubbings with blessed stones."""
    stones = EchoStones()
    rubbings = ResonantChantRubbings()
    gs = DummyGameState()
    
    # First bless the stones
    stones.receive_spell("bless", gs)
    
    # Then use chant rubbings with stones
    result = rubbings.use_with(gs, stones)
    assert "recite the resonant chant" in result.lower()
    assert "harmonious silence" in result.lower()
    assert "dragon's hall now lies open" in result.lower()
    assert gs.get_story_flag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED)


def test_resonant_chant_rubbings_use_with_wrong_item():
    """Test using chant rubbings with wrong item."""
    rubbings = ResonantChantRubbings()
    gs = DummyGameState()
    
    # Create a dummy item
    class DummyItem:
        def get_name(self):
            return "random item"
    
    dummy = DummyItem()
    result = rubbings.use_with(gs, dummy)
    assert "no effect" in result.lower()