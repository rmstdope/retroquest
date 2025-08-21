"""Integration tests for Act 2 Golden Path steps 18-19."""

import pytest
from unittest.mock import Mock

from src.retroquest.act2.Act2 import Act2
from src.retroquest.engine.GameState import GameState
from src.retroquest.act2.spells.NatureSenseSpell import NatureSenseSpell


class TestSteps18_19Integration:
    """Test the integration of steps 18-19 of the golden path."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.act2 = Act2()
        
        # Initialize game state with Act2's rooms and quests
        from src.retroquest.engine.Game import Game
        self.game = Game(self.act2)
        self.game_state = self.game.state
        
        # Set up preconditions for steps 18-19
        self._setup_prerequisites()
        
    def _setup_prerequisites(self):
        """Set up the prerequisites for steps 18-19."""
        # Player should have nature_sense spell
        nature_sense = NatureSenseSpell()
        self.game_state.known_spells.append(nature_sense)
        
        # Player should be in the Forest Entrance initially
        self.game_state.current_room = self.game_state.all_rooms["ForestEntrance"]
        
        # Set story flags that would have been set in earlier steps
        self.game_state.set_story_flag("forest_entrance_visited", True)
        self.game_state.set_story_flag("whispers_in_the_wind_started", True)
        
    def test_step_18_complete_workflow(self):
        """Test the complete workflow for step 18: Whispering Glade activities."""
        # Navigate to Whispering Glade
        response = self.game.handle_command("go east")
        assert "Whispering Glade" in response
        assert self.game_state.current_room.name == "Whispering Glade"
        
        # Cast nature_sense to detect water nymphs
        response = self.game.handle_command("cast nature_sense")
        assert "nature's sense" in response.lower()
        assert "water nymphs" in response.lower()
        assert "spell_effect" in response  # Should be spell_effect, not info
        assert self.game_state.get_story_flag("nature_sense_used_whispering_glade")
        
        # Talk to water nymphs to start riddles
        response = self.game.handle_command("talk to water nymphs")
        assert "riddle" in response.lower()
        assert "prove your wisdom" in response.lower()
        
        # Answer the first riddle (tree)
        response = self.game.handle_command("answer tree")
        assert "correct" in response.lower()
        assert self.game_state.get_story_flag("water_nymph_riddle_1_completed")
        
        # Answer the second riddle (water)
        response = self.game.handle_command("answer water")
        assert "correct" in response.lower()
        assert self.game_state.get_story_flag("water_nymph_riddle_2_completed")
        
        # Answer the third riddle (insects)
        response = self.game.handle_command("answer insects")
        assert "correct" in response.lower()
        assert self.game_state.get_story_flag("water_nymph_riddle_3_completed")
        assert self.game_state.get_story_flag("water_nymph_riddles_completed")
        
        # Check that the Crystal-Clear Water and Moonflowers are now available
        whispering_glade = self.game_state.current_room
        item_names = [item.name for item in whispering_glade.items]
        assert "crystal-clear water" in item_names
        assert "moonflowers" in item_names
        
        # Take the Crystal-Clear Water
        response = self.game.handle_command("take crystal-clear water")
        assert "crystal-clear water" in response.lower()
        assert "event" in response
        assert self.game_state.has_item("crystal-clear water")
        assert self.game_state.get_story_flag("crystal_clear_water_taken")
        
        # Take the Moonflowers
        response = self.game.handle_command("take moonflowers")
        assert "moonflowers" in response.lower()
        assert "event" in response
        assert self.game_state.has_item("moonflowers")
        assert self.game_state.get_story_flag("moonflowers_taken")
        
    def test_step_19_complete_workflow(self):
        """Test the complete workflow for step 19: Completing 'Whispers in the Wind' quest."""
        # Setup: Complete step 18 first
        self.test_step_18_complete_workflow()
        
        # Navigate back to Ancient Grove
        response = self.game.handle_command("go west")
        assert "Forest Entrance" in response
        assert self.game_state.current_room.name == "Forest Entrance"
        
        response = self.game.handle_command("go south")
        assert "Ancient Grove" in response
        assert self.game_state.current_room.name == "Ancient Grove"
        
        # Complete the "Whispers in the Wind" quest
        response = self.game.handle_command("complete whispers in the wind")
        assert "quest_complete" in response
        assert "Whispers in the Wind" in response
        assert "water nymphs have tested your wisdom" in response.lower()
        assert self.game_state.get_story_flag("whispers_in_the_wind_completed")
        
        # Verify quest completion is tracked
        completed_quests = self.game_state.get_story_flag("completed_quests") or []
        assert "Whispers in the Wind" in completed_quests
        
    def test_riddle_validation_and_error_handling(self):
        """Test riddle answer validation and error handling."""
        # Navigate to Whispering Glade and start riddles
        self.game.handle_command("go east")
        self.game.handle_command("cast nature_sense")
        self.game.handle_command("talk to water nymphs")
        
        # Test wrong answer
        response = self.game.handle_command("answer wrong")
        assert "not quite" in response.lower()
        assert not self.game_state.get_story_flag("water_nymph_riddle_1_completed")
        
        # Test empty answer
        response = self.game.handle_command("answer ")
        assert "error" in response and "must provide an answer" in response
        
        # Test correct answer after wrong one
        response = self.game.handle_command("answer tree")
        assert "correct" in response.lower()
        assert self.game_state.get_story_flag("water_nymph_riddle_1_completed")
        
    def test_item_access_restrictions(self):
        """Test that items are properly restricted before quest completion."""
        # Navigate to Whispering Glade without completing riddles
        self.game.handle_command("go east")
        
        # Try to take items without completing riddles
        response = self.game.handle_command("take crystal-clear water")
        assert "failure" in response
        assert "no 'crystal-clear water' here" in response.lower()
        
        response = self.game.handle_command("take moonflowers")
        assert "failure" in response
        assert "no" in response.lower() and "moonflowers" in response.lower()
        
    def test_quest_completion_requirements(self):
        """Test quest completion requirement validation."""
        # Navigate to Ancient Grove without completing prerequisites
        self.game.handle_command("go south")
        
        # Try to complete quest without prerequisites
        response = self.game.handle_command("complete whispers in the wind")
        assert "error" in response
        assert "Forest Guardian's Riddles" in response
        
        # Complete riddles but don't take items
        self.game.handle_command("go north")
        self.game.handle_command("go east")
        self.game.handle_command("cast nature_sense")
        self.game.handle_command("talk to water nymphs")
        self.game.handle_command("answer tree")
        self.game.handle_command("answer water")
        self.game.handle_command("answer insects")
        
        # Go back to Ancient Grove without items
        self.game.handle_command("go west")
        self.game.handle_command("go south")
        
        # Try to complete quest without required items
        response = self.game.handle_command("complete whispers in the wind")
        assert "error" in response
        assert "crystal-clear water" in response.lower()
        assert "moonflowers" in response.lower()
        
    def test_examine_items_functionality(self):
        """Test examining items before and after availability."""
        # Navigate to Whispering Glade and complete riddles
        self.game.handle_command("go east")
        self.game.handle_command("cast nature_sense")
        self.game.handle_command("talk to water nymphs")
        self.game.handle_command("answer tree")
        self.game.handle_command("answer water")
        self.game.handle_command("answer insects")
        
        # Examine crystal-clear water
        response = self.game.handle_command("examine crystal-clear water")
        assert "item_description" in response
        assert "sacred spring" in response.lower()
        assert "purification magic" in response.lower()
        
        # Examine moonflowers
        response = self.game.handle_command("examine moonflowers")
        assert "item_description" in response
        assert "ethereal white flowers" in response.lower()
        assert "magical properties" in response.lower()
        
    def test_nature_sense_spell_requirement(self):
        """Test that nature_sense spell is required for detecting nymphs."""
        # Remove nature_sense spell from player
        self.game_state.known_spells = []
        
        # Navigate to Whispering Glade
        self.game.handle_command("go east")
        
        # Try to cast nature_sense without knowing it
        response = self.game.handle_command("cast nature_sense")
        assert "failure" in response
        assert "don't know" in response.lower()
        
    def test_duplicate_actions_prevention(self):
        """Test that duplicate actions are properly prevented."""
        # Complete step 18 fully
        self.test_step_18_complete_workflow()
        
        # Try to take items again
        response = self.game.handle_command("take crystal-clear water")
        assert "failure" in response
        assert "no 'crystal-clear water' here" in response.lower()
        
        response = self.game.handle_command("take moonflowers")
        assert "failure" in response
        assert "no" in response.lower() and "moonflowers" in response.lower()
        
        # Complete step 19
        self.game.handle_command("go west")
        self.game.handle_command("go south")
        self.game.handle_command("complete whispers in the wind")
        
        # Try to complete quest again
        response = self.game.handle_command("complete whispers in the wind")
        assert "already completed" in response.lower()
        
    def test_room_descriptions_and_atmosphere(self):
        """Test that room descriptions properly reflect the magical atmosphere."""
        # Test Whispering Glade description
        self.game.handle_command("go east")
        response = self.game.handle_command("look")
        assert "peaceful meadow" in response.lower()
        assert "stream babbling" in response.lower()
        assert "water nymphs" in response.lower()
        
        # Test Ancient Grove description after returning
        self.game.handle_command("go west")
        self.game.handle_command("go south")
        response = self.game.handle_command("look")
        assert "circular clearing" in response.lower()
        assert "silver bark" in response.lower()
        assert "ancient tree spirit" in response.lower()
