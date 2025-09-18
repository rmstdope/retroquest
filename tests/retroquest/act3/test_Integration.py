import pytest
from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game
from retroquest.act3.Act3StoryFlags import FLAG_ACT3_MAIN_STARTED, FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED
from ..utils.utils import *

# TODO: Import room classes when they are created
# from retroquest.act3.rooms.ExampleRoom import ExampleRoom

# TODO: Import quest classes when they are created
# from retroquest.act3.quests.ExampleQuest import ExampleQuest

class TestAct3Integration:
    """Integration tests for Act 3."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.act3 = Act3()
        self.act3.music_file = ''
        self.game = Game([self.act3])
        
    def test_act3_initialization(self):
        """Test that Act 3 initializes correctly."""
        assert self.act3 is not None
        assert isinstance(self.act3.rooms, dict)
        assert isinstance(self.act3.quests, list)
        assert self.act3.get_act_intro() is not None
        
    def test_game_with_act3(self):
        """Test that Game can be initialized with Act 3."""
        assert self.game is not None
        assert len(self.game.acts) == 1
        assert self.game.acts[0] == self.act3
        
    def test_golden_path_act3_completion(self):
        game = self.game

        # Start in Mira's Hut with Mira present
        check_current_room(game.state, "Mira's Hut")
        check_character_in_room(game.state.current_room, 'mira', True)

        # First talk: start main quest (The Three Virtues)
        result = execute_commands(game, ['talk to mira'])
        check_story_flag(game.state, FLAG_ACT3_MAIN_STARTED, True)
        assert 'three relics' in result.lower()
        # Ensure quest is activated (helpers auto-flush activations)
        check_quests(game.state, ['The Three Virtues'])

        # Second talk: teleport to Tidal Causeway (Sunken Ruins entry) with companions
        result = execute_commands(game, ['talk to mira'])
        check_current_room(game.state, 'Tidal Causeway')
        check_character_in_room(game.state.current_room, 'mira', True)
        check_character_in_room(game.state.current_room, 'sir cedric', True)

        # Step 3: move north to Shoreline Markers => should activate Tideward Sigils
        execute_commands(game, ['north'])
        check_current_room(game.state, 'Shoreline Markers')
        # Newly activated side quest should now be active alongside the main quest
        check_quests(game.state, ['The Three Virtues', 'Tideward Sigils'])
        # Search/examine/take runes
        combined = execute_commands(game, ['search', 'examine steles', 'take coquina runes'])
        assert 'coquina' in combined.lower()
        check_item_in_inventory(game.state, 'Coquina Runes', True)
        again = execute_commands(game, ['search'])
        assert 'already' in again.lower()

        # Step 5: Outer Wards — purify and set sigil; completes Tideward Sigils
        execute_commands(game, ['east'])
        check_current_room(game.state, 'Outer Wards')
        purify_result = execute_commands(game, ['cast purify on warding pillars'])
        assert any(k in purify_result.lower() for k in ['cleanse', 'rinse', 'cleansed'])
        use_result = execute_commands(game, ['use coquina runes with warding pillars'])
        assert 'sigil' in use_result.lower()
        check_story_flag(game.state, FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED, True)
        # Quest should be marked completed
        check_quest_completed(game.state, 'Tideward Sigils')

        # Step 6: Collapsed Pier — reveal vault and recover the Rusted Locker Key
        execute_commands(game, ['east'])
        check_current_room(game.state, 'Collapsed Pier')
        pier_search = execute_commands(game, ['search'])
        assert 'vault' in pier_search.lower() and 'locker' in pier_search.lower()
        take_key = execute_commands(game, ['take rusted locker key'])
        check_item_in_inventory(game.state, 'Rusted Locker Key', True)
