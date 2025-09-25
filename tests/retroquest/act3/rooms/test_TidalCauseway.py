"""Unit tests for the Tidal Causeway room and its mural mechanics."""

from typing import Optional

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game
from retroquest.act3.Act3StoryFlags import FLAG_ACT3_SEA_SEALED_LETTER_FOUND

from ...utils.utils import (
    execute_commands,
    check_item_in_room,
    check_item_in_inventory,
    check_story_flag,
)

class TestTidalCauseway:
    """Tests for mural interactions on the Tidal Causeway."""
    act3: Optional[Act3] = None
    game: Optional[Game] = None

    def setup_method(self):
        self.act3 = Act3()
        self.act3.music_file = ''
        self.game = Game([self.act3])
        # Jump directly to Tidal Causeway for focused unit tests
        self.game.state.current_room = self.game.state.all_rooms['TidalCauseway']
    def test_mural_reveals_letter_and_sets_flag(self):
        """Verify that examining the mural reveals the Sea-Sealed Letter and sets
        the corresponding story flag.

        Preconditions: player is in Tidal Causeway and the reveal flag is unset.
        Actions: run `examine mural`.
        Expected: output mentions the letter/reliquary, the flag is set, and the
        `Sea-Sealed Letter` item is added to the room's items.
        """
        # Ensure initial state: flag not set and letter not present
        assert not self.game.state.get_story_flag(FLAG_ACT3_SEA_SEALED_LETTER_FOUND)
        check_item_in_room(self.game.state.current_room, 'Sea-Sealed Letter', False)

        # Examine the mural
        result = execute_commands(self.game, ['examine mural'])
        assert 'sea-sealed letter' in result.lower() or 'reliquary' in result.lower()

        # Flag should now be set and the letter placed in the room
        check_story_flag(self.game.state, FLAG_ACT3_SEA_SEALED_LETTER_FOUND, True)
        check_item_in_room(self.game.state.current_room, 'Sea-Sealed Letter', True)

    def test_reexamine_does_not_duplicate_letter(self):
        """Ensure that re-examining the mural does not duplicate the revealed
        Sea-Sealed Letter and that the mural returns an "already revealed" message.

        Preconditions: player is in Tidal Causeway.
        Actions: examine once, then examine again.
        Expected: only one Sea-Sealed Letter remains in the room and the second
        examine returns a message indicating the secret is already revealed.
        """
        # Prime the mural by first examine
        execute_commands(self.game, ['examine mural'])
        # Count sea-sealed letters in the room
        items = [i.get_name() for i in self.game.state.current_room.get_items()]
        initial_count = items.count('Sea-Sealed Letter')
        assert initial_count == 1

        # Re-examine: should produce a different message but not add another letter
        second = execute_commands(self.game, ['examine mural'])
        assert 'empty stone' in second.lower() or 'already' in second.lower()
        items_after = [i.get_name() for i in self.game.state.current_room.get_items()]
        assert items_after.count('Sea-Sealed Letter') == 1

    def test_take_sea_sealed_letter_moves_to_inventory(self):
        """Confirm that taking the revealed Sea-Sealed Letter moves it into the
        player's inventory and removes it from the room.

        Preconditions: the Sea-Sealed Letter has been revealed in the room.
        Actions: examine mural (to reveal) then `take sea-sealed letter`.
        Expected: inventory contains the letter and it is no longer present in
        the room's items.
        """
        execute_commands(self.game, ['examine mural'])
        # Now take the letter
        execute_commands(self.game, ['take sea-sealed letter'])
        check_item_in_inventory(self.game.state, 'Sea-Sealed Letter', True)
        # Ensure it's no longer in the room
        check_item_in_room(self.game.state.current_room, 'Sea-Sealed Letter', False)
