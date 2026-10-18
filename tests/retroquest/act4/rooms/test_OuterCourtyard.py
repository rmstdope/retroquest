"""Test for OuterCourtyard room class."""

from retroquest.act4.rooms.OuterCourtyard import OuterCourtyard
from retroquest.act4.Act4 import Act4
from retroquest.engine.Game import Game
from retroquest.act4.Act4StoryFlags import FLAG_ACT4_SERVANTS_TRUST_EARNED
from ..markup_helpers import assert_markup_well_formed


class TestOuterCourtyard:
    """Test suite for OuterCourtyard room."""

    def test_room_name(self):
        """Test that OuterCourtyard has the correct name."""
        room = OuterCourtyard()
        assert room.name == "Outer Courtyard"


def _create_markup_game() -> Game:
    """Create an Act IV game for markup checks."""
    act = Act4()
    act.music_file = ''
    return Game([act])


def test_freed_servant_messages_use_known_tags():
    """Messages after the servants are freed use only known, balanced tags."""
    game = _create_markup_game()
    room = OuterCourtyard()
    game.state.current_room = room
    game.state.set_story_flag(FLAG_ACT4_SERVANTS_TRUST_EARNED, True)
    room.cast_bless(game.state)

    servants = room.examine(game.state, "servants")
    bless_again = room.cast_bless(game.state)

    assert "no longer trapped here" in servants
    assert "already been freed" in bless_again
    for answer in (servants, bless_again):
        assert_markup_well_formed(answer)
