"""Test for FortressGates room class."""

from retroquest.act4.rooms.FortressGates import FortressGates
from retroquest.act4.Act4 import Act4
from retroquest.engine.Game import Game
from retroquest.act4.Act4StoryFlags import FLAG_ACT4_BARRIERS_DISABLED
from ..markup_helpers import assert_markup_well_formed


class TestFortressGates:
    """Test suite for FortressGates room."""

    def test_room_name(self):
        """Test that FortressGates has the correct name."""
        room = FortressGates()
        assert room.name == "Fortress Gates"


def _create_markup_game() -> Game:
    """Create an Act IV game for markup checks."""
    act = Act4()
    act.music_file = ''
    return Game([act])


def test_banished_guardian_messages_use_known_tags():
    """Messages after the guardians are banished use only known, balanced tags."""
    game = _create_markup_game()
    room = FortressGates()
    game.state.set_story_flag(FLAG_ACT4_BARRIERS_DISABLED, True)
    room.light(game.state)

    light_again = room.light(game.state)
    guardians = room.examine(game.state, "guardian")
    barriers = room.examine(game.state, "barrier")

    assert "already been banished" in light_again
    assert "banished by your light magic" in guardians
    assert "barriers have been disabled" in barriers
    for answer in (light_again, guardians, barriers):
        assert_markup_well_formed(answer)
