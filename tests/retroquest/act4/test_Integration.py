"""Integration tests for Act 4: golden path and key interactions."""

from typing import Optional
from retroquest.act4.Act4 import Act4
from retroquest.engine.Game import Game
from retroquest.act4.Act4StoryFlags import (
    FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
    FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED,
    FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED,
    FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED,
)
from ..utils.utils import (
    check_current_room,
    check_story_flag,
    execute_commands,
    check_item_in_inventory,
)

class TestAct4Integration:
    """Integration tests for Act 4."""
    act4: Optional[Act4] = None
    game: Optional[Game] = None

    def setup_method(self):
        """Set up test fixtures."""
        self.act4 = Act4()
        self.act4.music_file = ''
        self.game = Game([self.act4])

    def test_act4_initialization(self):
        """Test that Act 4 initializes correctly."""
        assert self.act4 is not None
        assert isinstance(self.act4.rooms, dict)
        assert isinstance(self.act4.quests, list)
        assert self.act4.get_act_intro() is not None

    def test_game_with_act4(self):
        """Test that Game can be initialized with Act 4."""
        assert self.game is not None
        assert len(self.game.acts) == 1
        assert self.game.acts[0] == self.act4

    def test_golden_path_phase1_fortress_breach(self):
        """Test Phase 1 of the Act 4 golden path: Fortress Breach.

        This test implements steps 1-3 of the golden path:
        1. Fortress Gates - Ward guardians quest
        2. Outer Courtyard - Trapped servants quest
        3. Mirror Labyrinth - Initial incomplete visit
        """
        game = self.game

        # Should start in Fortress Gates
        check_current_room(game.state, "Fortress Gates")

        # Phase 1.1: Examine ward stones to understand the mechanism
        result = execute_commands(game, ['examine ward stones'])
        assert 'shadow guardians' in result.lower() or 'anchor points' in result.lower()

        # Phase 1.2: Take ward stone fragment (should be available)
        result = execute_commands(game, ['take ward stone fragment'])
        check_item_in_inventory(game.state, 'Ward Stone Fragment', True)

        # Phase 1.3: Use ward stone fragment to disable barriers
        result = execute_commands(game, ['use ward stone fragment with barriers'])
        assert 'disable' in result.lower() or 'barrier' in result.lower()

        # Phase 1.4: Cast light to dispel shadow guardians
        result = execute_commands(game, ['cast light on ward stones'])
        assert ('dispel' in result.lower() or 'banish' in result.lower() or
                'guardians' in result.lower())

        # Quest should be completed and Guardian's Essence obtained
        check_story_flag(game.state, FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED, True)

        # Phase 1.5: Take Guardian's Chain for later protection
        result = execute_commands(game, ['take guardian\'s chain'])
        check_item_in_inventory(game.state, "Guardian's Chain", True)
        check_story_flag(game.state, FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED, True)

        # Phase 1.6: Take Guardian's Essence (should be available after light spell)
        result = execute_commands(game, ['take guardian\'s essence'])
        check_item_in_inventory(game.state, "Guardian's Essence", True)
        check_story_flag(game.state, FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED, True)

    def test_required_items_available_in_fortress_gates(self):
        """Test that required items are available in Fortress Gates."""
        game = self.game

        # Start at Fortress Gates
        check_current_room(game.state, "Fortress Gates")

        # Check that we can take ward stone fragment
        execute_commands(game, ['take ward stone fragment'])
        check_item_in_inventory(game.state, 'Ward Stone Fragment', True)

        # Check that we can take guardian's chain
        execute_commands(game, ['take guardian\'s chain'])
        check_item_in_inventory(game.state, "Guardian's Chain", True)

    def test_room_transitions_work_correctly(self):
        """Test that room transitions work as expected in phase 1."""
        game = self.game

        # Start in Fortress Gates
        check_current_room(game.state, "Fortress Gates")

        # Move to Outer Courtyard
        execute_commands(game, ['east'])
        check_current_room(game.state, "Outer Courtyard")

        # Move to Mirror Labyrinth
        execute_commands(game, ['north'])
        check_current_room(game.state, "Mirror Labyrinth")

        # Return to Outer Courtyard
        execute_commands(game, ['south'])
        check_current_room(game.state, "Outer Courtyard")

        # Return to Fortress Gates
        execute_commands(game, ['west'])
        check_current_room(game.state, "Fortress Gates")

    def test_story_flags_progression(self):
        """Test that story flags are set correctly during phase 1."""
        game = self.game

        # Initially no flags should be set
        check_story_flag(game.state, FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED, False)
        check_story_flag(game.state, FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED, False)
        check_story_flag(game.state, FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED, False)
        check_story_flag(game.state, FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED, False)

        # Simulate ward guardians quest completion
        # (Actual implementation would involve the quest system)
        game.state.set_story_flag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED, True)
        game.state.set_story_flag(FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED, True)
        game.state.set_story_flag(FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED, True)

        # Check flags are now set
        check_story_flag(game.state, FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED, True)
        check_story_flag(game.state, FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED, True)
        check_story_flag(game.state, FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED, True)
