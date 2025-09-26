"""Unit tests for the Shoreline Markers room and rune shard discovery."""

from typing import Optional

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game

from ...utils.utils import (
    execute_commands,
    check_item_in_room,
    check_item_in_inventory,
)


class TestShorelineMarkers:
    """Tests for searching the steles and collecting Moon Rune Shards.

    Each test documents preconditions, actions, expected outcomes and
    failure modes. Tests operate by jumping the game state directly to the
    Shoreline Markers room to focus only on the room mechanics.
    """
    act3: Optional[Act3] = None
    game: Optional[Game] = None

    def setup_method(self):
        """ Sets up act and game for testing """
        self.act3 = Act3()
        self.act3.music_file = ''
        self.game = Game([self.act3])
        # Focus tests on the Shoreline Markers
        self.game.state.current_room = self.game.state.all_rooms['ShorelineMarkers']

    def test_search_reveals_moon_rune_shards_and_take(self):
        """Verify that searching reveals Moon Rune Shards and they can be taken.

        Preconditions: Player is in the Shoreline Markers and does not hold the
        shards and none are present in the room.
        Actions: Execute 'search', then 'take moon rune shards'.
        Expected: Search output references shards, the shards appear in the room,
        and taking them moves them into the player's inventory.
        """
        check_item_in_room(self.game.state.current_room, 'Moon Rune Shards', False)
        check_item_in_inventory(self.game.state, 'Moon Rune Shards', False)

        out = execute_commands(self.game, ['search'])
        assert 'moon' in out.lower() or 'shard' in out.lower()

        check_item_in_room(self.game.state.current_room, 'Moon Rune Shards', True)

        execute_commands(self.game, ['take moon rune shards'])
        check_item_in_inventory(self.game.state, 'Moon Rune Shards', True)

    def test_research_is_idempotent(self):
        """Ensure repeated searches do not create duplicate shards.

        Preconditions: Player is in Shoreline Markers.
        Actions: search twice (without taking) and assert the second result
        signals that the shards are already available.
        Expected: Only one instance of Moon Rune Shards in the room after both
        searches and the second output contains an 'already' style message.
        """
        first = execute_commands(self.game, ['search'])
        assert 'moon' in first.lower() or 'shard' in first.lower()

        second = execute_commands(self.game, ['search'])
        assert 'already' in second.lower() or 'again' in second.lower()

        # Only one instance should be present
        items = [i.get_name() for i in self.game.state.current_room.get_items()]
        assert items.count('Moon Rune Shards') == 1
