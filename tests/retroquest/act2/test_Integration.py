import pytest
from retroquest.engine.Game import Game
from retroquest.act2.Act2 import Act2
from retroquest.engine.GameState import GameState

# TODO: Import quest classes when they are created
# from retroquest.act2.quests.TheGatheringStorm import TheGatheringStormQuest
# from retroquest.act2.quests.TheKnightsTest import TheKnightsTestQuest
# from retroquest.act2.quests.SuppliesForTheJourney import SuppliesForTheJourneyQuest
# from retroquest.act2.quests.TheMerchantsLostCaravan import TheMerchantsLostCaravanQuest
# from retroquest.act2.quests.EchoesOfThePast import EchoesOfThePastQuest
# from retroquest.act2.quests.TheHealersApprentice import TheHealersApprenticeQuest
# from retroquest.act2.quests.CedricsLostHonor import CedricsLostHonorQuest
# from retroquest.act2.quests.TheInnkeepersDaughter import TheInnkeepersDaughterQuest
# from retroquest.act2.quests.TheAncientLibrary import TheAncientLibraryQuest
# from retroquest.act2.quests.TheHermitsWarning import TheHermitsWarningQuest
# from retroquest.act2.quests.TheForestGuardiansRiddles import TheForestGuardiansRiddlesQuest
# from retroquest.act2.quests.WhispersInTheWind import WhispersInTheWindQuest

results = []

# Helper functions for assertions
def _check_item_in_inventory(game_state, item_name: str, should_be_present: bool = True):
    inventory_names = [item.get_name().lower() for item in game_state.inventory]
    if should_be_present:
        assert item_name.lower() in inventory_names, f"{item_name} not found in inventory, but was expected."
    else:
        assert item_name.lower() not in inventory_names, f"{item_name} found in inventory, but was not expected."

def _check_item_in_room(current_room, item_name: str, should_be_present: bool = True):
    room_item_names = [item.get_name().lower() for item in current_room.get_items()]
    if should_be_present:
        assert item_name.lower() in room_item_names, f"{item_name} not found in room {current_room.name}, but was expected."
    else:
        assert item_name.lower() not in room_item_names, f"{item_name} found in room {current_room.name}, but was not expected."

def _check_character_in_room(current_room, character_name: str, should_be_present: bool = True):
    room_character_names = [char.get_name().lower() for char in current_room.get_characters()]
    if should_be_present:
        assert character_name.lower() in room_character_names, f"Character '{character_name}' not found in room {current_room.name}, but was expected."
    else:
        assert character_name.lower() not in room_character_names, f"Character '{character_name}' found in room {current_room.name}, but was not expected."

def _check_spell_known(game_state, spell_name: str, should_be_present: bool = True):
    spell_names = [spell.get_name().lower() for spell in game_state.known_spells]
    if should_be_present:
        assert spell_name.lower() in spell_names, f"Spell '{spell_name}' not found in known spells, but was expected."
    else:
        assert spell_name.lower() not in spell_names, f"Spell '{spell_name}' found in known spells, but was not expected."

def _check_story_flag(game_state, flag_name: str, expected_value: bool = True):
    assert game_state.get_story_flag(flag_name) == expected_value, f"Story flag '{flag_name}' was not {expected_value}."

def _check_current_room(game_state, expected_room_name: str):
    assert game_state.current_room.name == expected_room_name, f"Not in '{expected_room_name}'"

def _check_quests(game_state, expected_active_quests):
    """
    Asserts that the specified quests (by name) are currently active, no more, no less.
    """
    active_quest_names = sorted([q.name for q in game_state.activated_quests])
    expected_names = sorted(expected_active_quests)
    assert active_quest_names == expected_names, (
        f"Active quests do not match.\nExpected: {expected_names}\nActual: {active_quest_names}"
    )

def _execute_commands(game, commands_list):
    global results
    for cmd in commands_list:
        results.append(game.handle_command(cmd))
    _debug_print_history()

def _debug_print_history():
    for res_str in results:
        print(res_str)

def test_golden_path_act2_completion():
    """Test the golden path through Act2 completion - Currently testing steps 1-2"""
    act = Act2()
    game = Game(act)
    
    # Step 1: Mountain Path
    # Should start in Mountain Path
    _check_current_room(game.state, "Mountain Path")
    # Forest exit should be locked initially
    exits = game.state.current_room.get_exits()
    assert "east" not in exits  # Forest transition should not be available initially
    # Take Walking Stick
    _execute_commands(game, ["take walking stick"])
    _check_item_in_inventory(game.state, "Walking Stick")
    # Speak to Mountain Hermit
    _execute_commands(game, ["talk to mountain hermit"])
    _check_item_in_inventory(game.state, "Training Sword")
    # Examine the camp site to find Entry Pass
    _check_item_in_room(game.state.current_room, "Entry Pass", should_be_present=False)
    _execute_commands(game, ["examine camp site"])
    _check_item_in_room(game.state.current_room, "Entry Pass", should_be_present=True)
    _check_item_in_inventory(game.state, "Entry Pass", should_be_present=False)
    # Take Entry Pass
    _execute_commands(game, ["take entry pass"])
    _check_item_in_inventory(game.state, "Entry Pass")
    _check_item_in_room(game.state.current_room, "Entry Pass", should_be_present=False)    
    
    # Step 2: Greendale Gates
    # Move to Greendale Gates
    _execute_commands(game, ["go north"])
    _check_current_room(game.state, "Greendale Gates")
    # Verify that north exit to Main Square is not available before giving Entry Pass
    exits = game.state.current_room.get_exits()
    assert "north" not in exits, "North exit to Main Square should not be available before giving Entry Pass"
    assert "south" in exits, "South exit to Mountain Path should always be available"
    # Give Entry Pass to Gate Captain
    _check_character_in_room(game.state.current_room, "Gate Captain")
    _execute_commands(game, ["give entry pass to gate captain"])
    _check_item_in_inventory(game.state, "Entry Pass", should_be_present=False)
    # Verify that north exit to Main Square is now available after giving Entry Pass
    exits = game.state.current_room.get_exits()
    assert "north" in exits, "North exit to Main Square should be available after giving Entry Pass"
    assert exits["north"] == "MainSquare", "North exit should lead to Main Square"
    # Verify that the room cannot be searched yet (captain still present)
    _check_character_in_room(game.state.current_room, "Gate Captain")
    _execute_commands(game, ["search"])
    # The search should fail because captain is still watching
    assert "improper to search around while he's observing" in results[-1].lower(), "Search should be blocked while captain is present"
    _check_item_in_room(game.state.current_room, "City Map", should_be_present=False)
    # Talk to Gate Captain for city information - this causes him to walk away
    _execute_commands(game, ["talk to gate captain"])
    # Verify that the Gate Captain has now walked away and is no longer in the room
    _check_character_in_room(game.state.current_room, "Gate Captain", should_be_present=False)
    # Search the room to find City Map (should now be possible after captain walked away)
    _check_item_in_room(game.state.current_room, "City Map", should_be_present=False)
    _execute_commands(game, ["search"])
    _check_item_in_room(game.state.current_room, "City Map", should_be_present=True)
    # Take City Map
    _execute_commands(game, ["take city map"])
    _check_item_in_inventory(game.state, "City Map")
    _check_item_in_room(game.state.current_room, "City Map", should_be_present=False)
    
    # TODO: Implement remaining steps 3-27 when all rooms, items, and quests are available
