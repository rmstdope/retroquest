"""Unit tests for OldOathScrolls item in Act 3."""
from retroquest.act3.items.OldOathScrolls import OldOathScrolls
from retroquest.act3.Act3StoryFlags import FLAG_ACT3_OATH_SCROLLS_EXAMINED


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


def test_old_oath_scrolls_init():
    """Test initialization of OldOathScrolls."""
    scrolls = OldOathScrolls()
    assert scrolls.get_name() == "old oath scrolls"
    assert scrolls.can_be_carried_flag
    assert "binding oaths" in scrolls.description
    assert "selflessness" in scrolls.description
    assert "Ancient Dragon" in scrolls.description


def test_old_oath_scrolls_examine():
    """Test examining the oath scrolls sets the flag."""
    scrolls = OldOathScrolls()
    gs = DummyGameState()

    # Initially, the flag should not be set
    assert not gs.get_story_flag(FLAG_ACT3_OATH_SCROLLS_EXAMINED)

    # Examine the scrolls
    result = scrolls.examine(gs)
    
    # Flag should now be set
    assert gs.get_story_flag(FLAG_ACT3_OATH_SCROLLS_EXAMINED)
    
    # Should return description
    assert "binding oaths" in result
    assert "selflessness" in result


def test_old_oath_scrolls_examine_multiple_times():
    """Test examining the scrolls multiple times only sets flag once."""
    scrolls = OldOathScrolls()
    gs = DummyGameState()

    # Examine multiple times
    scrolls.examine(gs)
    scrolls.examine(gs)
    scrolls.examine(gs)
    
    # Flag should still be set
    assert gs.get_story_flag(FLAG_ACT3_OATH_SCROLLS_EXAMINED)