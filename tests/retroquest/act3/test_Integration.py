"""Integration tests for Act 3: golden path and key interactions."""

from typing import Optional
from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game
from retroquest.act3.Act3StoryFlags import (
    FLAG_ACT3_MAIN_STARTED,
    FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED,
    FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED,
    FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED
)
from ..utils.utils import (
    check_character_in_room,
    check_current_room,
    check_item_in_room,
    check_quests,
    check_story_flag,
    execute_commands,
    check_item_in_inventory,
    check_item_count_in_inventory
)

class TestAct3Integration:
    """Integration tests for Act 3."""
    act3: Optional[Act3] = None
    game: Optional[Game] = None

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
        """Run the Act 3 golden path and assert expected progressions."""
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
        # Cast light to find key
        result = execute_commands(game, ['talk to mira'])
        check_current_room(game.state, 'Tidal Causeway')
        check_character_in_room(game.state.current_room, 'mira', True)
        check_character_in_room(game.state.current_room, 'sir cedric', True)
        check_item_in_inventory(game.state, 'Rusted Locker Key', False)
        result = execute_commands(game, ['cast light'])
        assert 'shadow' in result.lower() and 'hollow' in result.lower() and'key' in result.lower()
        # Ensure rusted key present
        check_item_in_room(game.state.current_room, 'Rusted Locker Key', True)
        result = execute_commands(game, ['take rusted locker key'])
        check_item_in_inventory(game.state, 'Rusted Locker Key', True)
        check_item_in_room(game.state.current_room, 'Rusted Locker Key', False)

        # Step 3: move north to Shoreline Markers => should activate Tideward Sigils
        execute_commands(game, ['north'])
        check_current_room(game.state, 'Shoreline Markers')
        # Reveal the runes so the Tideward Sigils started flag is set
        execute_commands(game, ['search'])
        # Newly activated side quest should now be active alongside the main quest
        check_quests(game.state, ['The Three Virtues', 'Tideward Sigils'])
        # Search/examine/take runes
        combined = execute_commands(game, ['search', 'examine steles', 'take moon rune shards'])
        assert 'moon' in combined.lower() or 'shard' in combined.lower()
        check_item_in_inventory(game.state, 'Moon Rune Shards', True)
        again = execute_commands(game, ['search'])
        assert 'already' in again.lower()

        # Step 5: Outer Wards — purify and set sigil; completes Tideward Sigils
        execute_commands(game, ['east'])
        check_current_room(game.state, 'Outer Wards')
        purify_result = execute_commands(game, ['cast purify on pillars'])
        assert any(k in purify_result.lower() for k in ['cleanse', 'rinse', 'cleansed'])
        use_result = execute_commands(game, ['use moon rune shards with pillars'])
        assert 'sigil' in use_result.lower()
        check_story_flag(game.state, FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, True)
        # Quest should be marked completed
        check_quests(game.state, ['The Three Virtues'])

        # Step 6: Removed

        # Step 7: Collapsed Pier (Vault) — key fails, cast unlock, open locker,
        # take three prism lanterns
        # Give the hint by examining the locker
        execute_commands(game, ['east'])
        check_current_room(game.state, 'Collapsed Pier')
        exam = execute_commands(game, ['examine locker'])
        assert 'fused' in exam.lower() or 'lock' in exam.lower()
        # Try the key and fail
        fail_key = execute_commands(game, ['use rusted locker key with locker'])
        assert 'too corroded' in fail_key.lower() or 'jams in the mechanism' in fail_key.lower()
        # Cast unlock on locker
        unlocked = execute_commands(game, ['cast unlock on locker'])
        assert ('locker' in unlocked.lower() and
                ('click' in unlocked.lower() or 'release' in unlocked.lower()))
        # Open locker and take all lanterns
        opened = execute_commands(game, ['open locker'])
        assert 'prism lantern' in opened.lower()
        # Collect three lanterns
        execute_commands(game, ['take prism lantern', 'take prism lantern', 'take prism lantern'])
        check_item_count_in_inventory(game.state, 'Prism Lantern', 3)

        # Step 8: Submerged Antechamber — navigate, mount lanterns and cast light
        # Move from Collapsed Pier back toward the Outer Wards and the submerged
        # antechamber where lanterns are mounted.
        execute_commands(game, ['west'])
        check_current_room(game.state, 'Outer Wards')
        execute_commands(game, ['south'])
        check_current_room(game.state, 'Submerged Antechamber')
        # Reveal the lantern brackets in the antechamber, then mount lanterns
        search_result = execute_commands(game, ['search'])
        assert 'bracket' in search_result.lower() or 'brackets' in search_result.lower()
        # Mount three lanterns to brackets
        execute_commands(game, ['use prism lantern with lantern bracket'])
        execute_commands(game, ['use prism lantern with lantern bracket'])
        execute_commands(game, ['use prism lantern with lantern bracket'])
        # After mounts, there should be no more prism lanterns in inventory
        check_item_count_in_inventory(game.state, 'Prism Lantern', 0)
        # Cast light to reveal the path
        light_result = execute_commands(game, ['cast light'])
        assert 'path' in light_result.lower() or 'lanterns' in light_result.lower()
        # After lighting, head west to the Tidal Causeway
        execute_commands(game, ['west'])
        check_current_room(game.state, 'Tidal Causeway')

        # Step 9: Tidal Causeway — examine mural, take Sea-Sealed Letter
        execute_commands(game, ['west'])
        check_current_room(game.state, 'Tidal Causeway')
        mural_reveal = execute_commands(game, ['examine mural'])
        assert 'reliquary' in mural_reveal.lower() or 'sea-sealed letter' in mural_reveal.lower()
        execute_commands(game, ['take sea-sealed letter'])
        check_item_in_inventory(game.state, 'Sea-Sealed Letter', True)

        # Step 10: Sanctum — speak vow, then take crystal
        execute_commands(game, ['east', 'east'])
        check_current_room(game.state, 'Sanctum of the Tide')
        vow = execute_commands(game, ['say myself to tide-born guardian'])
        assert ('vow' in vow.lower() or 'waters draw back' in vow.lower() or
                'you may now take' in vow.lower())
        execute_commands(game, ['take crystal of light'])
        check_item_in_inventory(game.state, 'crystal of light', True)

        # Step 11: Talk to Mira to teleport to Mount Ember
        execute_commands(game, ['w', 'w', 'talk to mira'])
        check_current_room(game.state, 'Lower Switchbacks')

        # Step 12: Lower Switchbacks — talk to Ash Scholar to receive a brass mirror
        # Inspect the Emberwater Canteen for lore and a possible mirror hint
        examine_canteen = execute_commands(game, ['examine emberwater canteen'])
        assert ('expedition' in examine_canteen.lower() or
                'brass' in examine_canteen.lower() or 'canteen' in examine_canteen.lower())
        examine_canteen = execute_commands(game, ['take brass mirror segment'])
        check_item_count_in_inventory(game.state, 'Brass Mirror Segment', 1)

        talk_scholar = execute_commands(game, ['talk to ash scholar'])
        assert 'scholar' in talk_scholar.lower() or 'brass' in talk_scholar.lower()
        check_item_count_in_inventory(game.state, 'Brass Mirror Segment', 2)

        # Step 13: Obsidian Outcrops — search to reveal mirror segments and binding resin
        execute_commands(game, ['north'])
        check_current_room(game.state, 'Obsidian Outcrops')
        search_out = execute_commands(game, ['search'])
        assert 'brass' in search_out.lower() or 'resin' in search_out.lower()
        # Take discovered items
        execute_commands(game, ['take brass mirror segment', 'take binding resin'])
        check_item_count_in_inventory(game.state, 'Brass Mirror Segment', 3)
        check_item_in_inventory(game.state, 'Binding Resin')

        # Step 14: Mirror Terraces — install mirrors to form channel
        execute_commands(game, ['east'])
        check_current_room(game.state, 'Mirror Terraces')
        # There should be mounts and at least one brass segment in the room
        # Take the terrace-provided segment if present
        execute_commands(game, ['examine mirror mount', 'take brass mirror segment'])
        check_item_count_in_inventory(game.state, 'Brass Mirror Segment', 4)
        # Install three segments into mounts (use command format recognized by game)
        execute_commands(game, ['use brass mirror segment with mirror mount'])
        execute_commands(game, ['use binding resin with mirror mount'])
        # Before mending, the mirrors quest should not be completed and the flag not set
        check_story_flag(game.state, FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED, False)
        # After installing, cast the mend spell on a mount to finalize repairs
        execute_commands(game, ['cast mend on mirror mount'])
        # After mending, the mirrors quest should be completed and the flag set
        check_story_flag(game.state, FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED, True)

        # --- Step 15: Ember Gallery — find ash-fern and cooled slag, craft heat ward
        # Move back south to the Ember Gallery to gather ward components
        execute_commands(game, ['south'])
        check_current_room(game.state, 'Ember Gallery')
        # Search reveals ash-fern and cooled slag
        search_result = execute_commands(game, ['search'])
        assert 'ash-fern' in search_result.lower() or 'cooled slag' in search_result.lower()
        execute_commands(game, ['take ash-fern', 'take cooled slag'])
        check_item_in_inventory(game.state, 'ash-fern', True)
        check_item_in_inventory(game.state, 'cooled slag', True)
        # Combine to craft the heat-ward mix
        craft_result = execute_commands(game, ['use ash-fern with cooled slag'])
        assert 'heat' in craft_result.lower() or 'ward' in craft_result.lower()
        check_item_in_inventory(game.state, 'heat-ward mix', True)

        # --- Step 16: Fumarole Passages — calibrate vents and apply heat ward
        # Move east to the Fumarole Passages (now open because mirrors completed)
        execute_commands(game, ['north', 'east'])
        check_current_room(game.state, 'Fumarole Passages')
        # It should not be possible to move south
        execute_commands(game, ['south'])
        check_current_room(game.state, 'Fumarole Passages')
        # Take and use three vent stones to calibrate
        execute_commands(game, ['take vent stone', 'take vent stone', 'take vent stone'])
        check_item_count_in_inventory(game.state, 'Vent Stone', 3)
        # Use each vent stone to calibrate the vents
        execute_commands(game, ['use vent stone', 'use vent stone'])
        # Before the third calibration, applying the ward should fail
        fail_apply = execute_commands(game, ['use heat-ward mix'])
        assert 'not yet synchronized' in fail_apply.lower() or 'unstable' in fail_apply.lower()
        # Final calibration
        execute_commands(game, ['use vent stone'])
        # Now apply the heat-ward mix
        apply_result = execute_commands(game, ['use heat-ward mix'])
        assert 'ward' in apply_result.lower() or 'seals' in apply_result.lower()
        check_story_flag(game.state, FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED, True)
