import pytest
from retroquest.Game import Game
from retroquest.rooms.EliorsCottage import EliorsCottage
from retroquest.rooms.VegetableField import VegetableField
from retroquest.rooms.ChickenCoop import ChickenCoop
from retroquest.rooms.VillageSquare import VillageSquare
from retroquest.rooms.MirasHut import MirasHut
from retroquest.rooms.BlacksmithsForge import BlacksmithsForge
from retroquest.rooms.GeneralStore import GeneralStore
from retroquest.rooms.VillageWell import VillageWell
from retroquest.rooms.AbandonedShed import AbandonedShed
from retroquest.rooms.OldMill import OldMill
from retroquest.rooms.Riverbank import Riverbank
from retroquest.rooms.ForestPath import ForestPath
from retroquest.rooms.HiddenGlade import HiddenGlade
from retroquest.rooms.VillageChapel import VillageChapel
from retroquest.rooms.RoadToGreendale import RoadToGreendale

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

def _check_spell_known(game_state, spell_name: str, should_be_present: bool = True):
    spell_names = [spell.get_name().lower() for spell in game_state.known_spells]
    if should_be_present:
        assert spell_name.lower() in spell_names, f"Spell '{spell_name}' not found in known spells, but was expected."
    else:
        assert spell_name.lower() not in spell_names, f"Spell '{spell_name}' found in known spells, but was not expected."

def _check_current_room(game_state, expected_room_name: str):
    assert game_state.current_room.name == expected_room_name, f"Not in '{expected_room_name}'"

def _execute_commands(game, commands_list):
    global results
    for cmd in commands_list:
        results.append(game.handle_command(cmd))

def _debug_print_history():
    for res_str in results:
        print(res_str)# Assuming buying rope costs 1 coin

# Room setup for integration test
ROOMS = {
    "EliorsCottage": EliorsCottage(),
    "VegetableField": VegetableField(),
    "ChickenCoop": ChickenCoop(),
    "VillageSquare": VillageSquare(),
    "MirasHut": MirasHut(),
    "BlacksmithsForge": BlacksmithsForge(),
    "GeneralStore": GeneralStore(),
    "VillageWell": VillageWell(),
    "AbandonedShed": AbandonedShed(),
    "OldMill": OldMill(),
    "Riverbank": Riverbank(),
    "ForestPath": ForestPath(),
    "HiddenGlade": HiddenGlade(),
    "VillageChapel": VillageChapel(),
    "RoadToGreendale": RoadToGreendale(),
}

@pytest.mark.integration
def test_golden_path_act1_completion(monkeypatch):
    # Setup Game
    game = Game(starting_room=ROOMS["EliorsCottage"], rooms=ROOMS)
    # # Patch session.prompt to avoid blocking
    # monkeypatch.setattr(game.session, "prompt", lambda *a, **kw: "no")
    # # Patch save to avoid NotImplementedError
    # monkeypatch.setattr(game, "save", lambda: None)

    # Elior’s Cottage
    _execute_commands(game, ["use lantern", "take bread", "talk to grandmother"])
    _check_item_in_inventory(game.state, "bread")
    _execute_commands(game, ["read journal", "talk to grandmother"])
    _check_spell_known(game.state, "revive")

    # Vegetable Field
    _execute_commands(game, ["go south", "take rusty hoe"])
    _check_current_room(game.state, "Vegetable Field")
    _check_item_in_inventory(game.state, "rusty hoe")
    _check_item_in_room(game.state.current_room, "rusty hoe", should_be_present=False)

    _execute_commands(game, ["use hoe", "take knife", "cast revive"])
    _check_item_in_inventory(game.state, "coin")
    _check_item_in_inventory(game.state, "dull knife")
    inventory_count_after_bread_use = len(game.state.inventory)
    _execute_commands(game, ["use hoe"])
    assert len(game.state.inventory) == inventory_count_after_bread_use, "Using hoe again should not add items to inventory"

    # Chicken Coop
    _execute_commands(game, ["go south", "use bread"])
    _check_current_room(game.state, "Chicken Coop")
    _check_item_in_inventory(game.state, "bread", should_be_present=False)
    _check_item_in_room(game.state.current_room, "key")

    _execute_commands(game, ["take key"])
    _check_item_in_inventory(game.state, "key")

    # Village Square
    _execute_commands(game, ["go north", "go north", "go east"])
    _check_current_room(game.state, "Village Square")
    _execute_commands(game, ["take bucket", "talk to villager"])
    _check_item_in_inventory(game.state, "bucket")

    # Village Well
    _execute_commands(game, ["go west", "go south", "go east"])
    _check_current_room(game.state, "Village Well")
    _execute_commands(game, ["use bucket"])
    _check_item_in_inventory(game.state, "bucket (full)")

    # Blacksmith's Forge
    _execute_commands(game, ["go east"])
    _check_current_room(game.state, "Blacksmith's Forge")
    _execute_commands(game, ["talk to blacksmith", "give coin to blacksmith"])
    _check_item_in_inventory(game.state, "coin", should_be_present=False)
    _check_item_in_inventory(game.state, "dull knife", should_be_present=False) 
    _check_item_in_inventory(game.state, "sharp knife")

    # Vegetable Field
    _execute_commands(game, ["go west", "go west", "use hoe"])
    _check_current_room(game.state, "Vegetable Field")
    _check_item_in_inventory(game.state, "coin")

    # General Store - Buy Rope
    _execute_commands(game, ["go north", "go east", "go east"]) # Veg Field -> Village Square -> General Store
    _check_current_room(game.state, "General Store")
    _execute_commands(game, ["talk to shopkeeper", "buy rope from shopkeeper"])
    _check_item_in_inventory(game.state, "rope")
    _check_item_in_inventory(game.state, "coin", should_be_present=False) 

    # Abandoned Shed - Use Key
    # Path: General Store (current) -> Village Square -> Village Well -> Abandoned Shed
    _execute_commands(game, ["go south", "go west", "go south"]) 
    _check_current_room(game.state, "Abandoned Shed")
    _execute_commands(game, ["use key with mysterious box"])
    _debug_print_history()
    _check_item_in_inventory(game.state, "key", should_be_present=False)
    assert game.state.current_room.get_item_by_name("mysterious box").locked == False, "Mysterious box should be unlocked after using key"
    _check_item_in_room(game.state.current_room, "mysterious box")


    # # Check for Act I completion: amulet and map fragment in inventory, and in Road to Greendale
    # # inventory_names = [item.get_name().lower() for item in game.state.inventory]
    # # assert "ancient amulet" in inventory_names, "Amulet not in inventory at end of Act I"
    # # assert "map fragment" in inventory_names, "Map fragment not in inventory at end of Act I"
    # # assert game.state.current_room.name == "Road to Greendale", "Not in Road to Greendale at end of Act I"
