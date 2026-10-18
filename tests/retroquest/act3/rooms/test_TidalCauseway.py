"""Unit tests for the Tidal Causeway room and its mural mechanics."""

from typing import Optional

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game
from retroquest.act3.rooms.TidalCauseway import TidalCauseway
from ..markup_helpers import assert_markup_well_formed

class TestTidalCauseway:
    """Tests for mural interactions on the Tidal Causeway."""
    act3: Optional[Act3] = None
    game: Optional[Game] = None

    def setup_method(self):
        """ Sets up act and game for testing """
        self.act3 = Act3()
        self.act3.music_file = ''
        self.game = Game([self.act3])
        # Jump directly to Tidal Causeway for focused unit tests
        self.game.state.current_room = self.game.state.all_rooms['TidalCauseway']


def test_cast_light_reveals_rusted_key_and_updates_room():
    """Casting light in the Tidal Causeway should reveal a rusted key in shadow."""
    # Use the setup fixture values
    tc = TestTidalCauseway()
    tc.setup_method()
    room = tc.game.state.current_room

    # Ensure no rusted key present initially
    assert not any(i.__class__.__name__ == 'RustedLockerKey' for i in room.items)

    # Call the room-specific light hook
    out = room.cast_light_here(tc.game.state)
    assert 'shadow' in out.lower() or 'hollow' in out.lower() or 'key' in out.lower()

    # Now a RustedLockerKey should be present in the room
    assert any(i.__class__.__name__ == 'RustedLockerKey' for i in room.items)


def _create_markup_game() -> Game:
    """Create an Act III game for markup checks."""
    act = Act3()
    act.music_file = ''
    return Game([act])


def test_second_light_cast_uses_known_tags():
    """Casting light on the causeway again uses only known, balanced tags."""
    game = _create_markup_game()
    room = TidalCauseway()
    room.cast_light_here(game.state)

    answer = room.cast_light_here(game.state)

    assert "nothing new comes free" in answer
    assert_markup_well_formed(answer)
