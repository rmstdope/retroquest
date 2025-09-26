"""Unit tests for the Collapsed Pier vault and rusted locker key."""

from typing import Optional

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game

from ...utils.utils import (
    execute_commands,
    check_item_in_room,
    check_item_in_inventory,
)


class TestCollapsedPier:
    """Tests for discovering the rusted locker key and its idempotence.

    These tests jump to the Collapsed Pier and exercise the search mechanic
    that reveals the Rusted Locker Key, ensuring the reveal happens once and
    that taking the key moves it to the player's inventory.
    """
    act3: Optional[Act3] = None
    game: Optional[Game] = None

    def setup_method(self):
        """ Sets up act and game for testing """
        self.act3 = Act3()
        self.act3.music_file = ''
        self.game = Game([self.act3])
        self.game.state.current_room = self.game.state.all_rooms['CollapsedPier']

    def test_search_reveals_rusted_locker_key_and_take(self):
        """Search reveals the Rusted Locker Key and taking it adds it to
        inventory.

        Preconditions: Player in Collapsed Pier with no Rusted Locker Key.
        Actions: execute 'search', then 'take rusted locker key'.
        Expected: Search mentions locker/vault and Rusted Locker Key is moved to
        inventory after taking.
        """
        check_item_in_room(self.game.state.current_room, 'Rusted Locker Key', False)
        check_item_in_inventory(self.game.state, 'Rusted Locker Key', False)

        out = execute_commands(self.game, ['search'])
        assert 'vault' in out.lower() and 'locker' in out.lower()

        check_item_in_room(self.game.state.current_room, 'Rusted Locker Key', True)
        execute_commands(self.game, ['take rusted locker key'])
        check_item_in_inventory(self.game.state, 'Rusted Locker Key', True)

    def test_research_is_idempotent(self):
        """Ensure subsequent searches do not add another Rusted Locker Key.

        Preconditions: Player in Collapsed Pier. Action: search twice without
        taking. Expected: second search indicates nothing new and only one key
        exists in the room.
        """
        execute_commands(self.game, ['search'])
        second = execute_commands(self.game, ['search'])
        assert 'already' in second.lower() or 'again' in second.lower()
        items = [i.get_name() for i in self.game.state.current_room.get_items()]
        assert items.count('Rusted Locker Key') == 1
