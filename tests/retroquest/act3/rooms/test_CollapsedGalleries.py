"""Unit tests for CollapsedGalleries room in Act 3."""
from retroquest.act3.rooms.CollapsedGalleries import CollapsedGalleries
from retroquest.act3.items.FallenRock import FallenRock
from retroquest.act3.items.ReinforcedBraces import ReinforcedBraces
from retroquest.act3.items.WedgeBlocks import WedgeBlocks
from retroquest.act3.characters.Miners import Miners
from retroquest.act3.Act3StoryFlags import FLAG_ACT3_MINERS_RESCUE_COMPLETED


class DummyGameState:
    """Dummy game state for testing inventory and story flags."""

    def __init__(self):
        """Initialize with empty inventory and flag set."""
        self.inventory = []
        self.flags = set()

    def set_story_flag(self, flag, value):
        """Set or unset a story flag."""
        if value:
            self.flags.add(flag)
        else:
            self.flags.discard(flag)

    def get_story_flag(self, flag):
        """Return True if the flag is set, else False."""
        return flag in self.flags


def test_collapsed_galleries_init():
    """Test initialization and properties of CollapsedGalleries room."""
    room = CollapsedGalleries()
    assert room.name == "Collapsed Galleries"
    assert "fallen rock" in room.description or "miners" in room.description
    assert any(isinstance(i, FallenRock) for i in room.items)
    assert any(isinstance(c, Miners) for c in room.characters)
    assert "south" in room.exits and "west" in room.exits and "east" in room.exits


def test_miners_rescue_progression():
    """Test the full miners rescue progression from steps 22."""
    room = CollapsedGalleries()
    gs = DummyGameState()
    fallen_rock = room.items[0]  # Should be FallenRock
    miners = room.characters[0]  # Should be Miners
    # Get tools
    braces = ReinforcedBraces()
    blocks = WedgeBlocks()
    # Step 1: Use reinforced braces with fallen rock
    result1 = fallen_rock.use_with(gs, braces)
    assert "stabilizing the collapse" in result1
    assert gs.get_story_flag("collapse_stabilized")
    # Step 2: Use wedge blocks with fallen rock
    result2 = fallen_rock.use_with(gs, blocks)
    assert "freeing the blocked passage" in result2
    assert gs.get_story_flag("passage_freed")
    # Step 3: Talk to miners
    result3 = miners.talk_to(gs)
    assert "lead the miners" in result3 or "newly opened passage" in result3
    assert gs.get_story_flag(FLAG_ACT3_MINERS_RESCUE_COMPLETED)


def test_get_exits_blocks_east_until_completed():
    """Test that east exit is blocked until miners rescue is completed."""
    room = CollapsedGalleries()
    gs = DummyGameState()
    # By default, east is hidden
    exits = room.get_exits(gs)
    assert "east" not in exits
    assert "south" in exits and "west" in exits
    # Set completion flag
    gs.set_story_flag(FLAG_ACT3_MINERS_RESCUE_COMPLETED, True)
    exits2 = room.get_exits(gs)
    assert "east" in exits2

def test_fallen_rock_requires_stabilization_first():
    """Test that wedge blocks can't be used before stabilization."""
    fallen_rock = FallenRock()
    gs = DummyGameState()
    blocks = WedgeBlocks()
    # Try blocks before stabilization
    result = fallen_rock.use_with(gs, blocks)
    assert "too unstable" in result or "stabilize it with braces" in result
    assert not gs.get_story_flag("passage_freed")
