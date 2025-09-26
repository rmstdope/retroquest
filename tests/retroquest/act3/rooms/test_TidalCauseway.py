"""Unit tests for the Tidal Causeway room and its mural mechanics."""

from typing import Optional

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game

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
