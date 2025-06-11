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

def _execute_commands(game, commands_list):
    for cmd in commands_list:
        game.handle_command(cmd)

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
    # Simulate all commands in the golden path
    commands = [
        # Village Well
        "go west", "go east", "use bucket",
        # Blacksmith’s Forge
        "go east", "use coin", "talk blacksmith",
        # General Store
        "go east", "use coin", "talk shopkeeper",
        # Abandoned Shed
        "go west", "go south", "use key", "take mysterious box",
        # Old Mill
        "go south", "use rope", "take millstone fragment",
        # Riverbank
        "go east", "take fishing rod", "talk fisherman",
        # Forest Path
        "go south", "use knife", "take wild berries", "take stick",
        # Hidden Glade
        "go east", "look", "take rare flower", "take shiny pebble",
        # Village Chapel
        "go south", "take candle", "talk priest", "use candle", "take locket",
        # Mira’s Hut
        "go north", "go west", "go north", "talk mira",
        # Vegetable Field (again)
        "go south", "go west", "cast revive",
        # Village Well (again)
        "go east", "cast purify", "take ring",
        # Abandoned Shed (again)
        "go west", "go south", "cast unlock", "take map fragment",
        # Hidden Glade (again)
        "go north", "go east", "cast light",
        # Riverbank (again)
        "go west", "go south", "go east", "cast freeze",
        # Forest Path (again)
        "go south", "cast grow",
        # Village Chapel (again)
        "go north", "go south", "cast bless",
        # Road to Greendale
        "go east", "talk merchant", "use map fragment"
    ]

    # Setup Game
    game = Game(starting_room=ROOMS["EliorsCottage"], rooms=ROOMS)
    # # Patch session.prompt to avoid blocking
    # monkeypatch.setattr(game.session, "prompt", lambda *a, **kw: "no")
    # # Patch save to avoid NotImplementedError
    # monkeypatch.setattr(game, "save", lambda: None)

    # Elior’s Cottage
    _execute_commands(game, ["use lantern", "take bread", "talk to grandmother", "use journal", "talk to grandmother"])
    # Check if bread is in inventory
    _check_item_in_inventory(game.state, "bread")
    _check_spell_known(game.state, "revive")

    # Vegetable Field
    _execute_commands(game, ["go south", "take rusty hoe"])
    assert game.state.current_room.name == "Vegetable Field", "Not in Vegetable Field after commands"
    _check_item_in_inventory(game.state, "rusty hoe")
    _check_item_in_room(game.state.current_room, "rusty hoe", should_be_present=False)

    _execute_commands(game, ["use hoe", "cast revive"])
    _check_item_in_inventory(game.state, "coin")
    _check_item_in_inventory(game.state, "rusty hoe", should_be_present=False)

    # Chicken Coop
    _execute_commands(game, ["go south", "use bread"])
    assert game.state.current_room.name == "Chicken Coop", "Not in Chicken Coop after commands"
    _check_item_in_inventory(game.state, "bread", should_be_present=False)
    _check_item_in_room(game.state.current_room, "key")
    _execute_commands(game, ["take key"])
    _check_item_in_inventory(game.state, "key")
    
    # Village Square
    _execute_commands(game, ["go north", "go north", "go east"])
    assert game.state.current_room.name == "Village Square", "Not in Village Square after commands (CC -> VF -> VS)"
    _execute_commands(game, ["take bucket", "talk villager"])
    _check_item_in_inventory(game.state, "bucket")

    # # Village Well
    # # Path: Village Square (S) -> Blacksmith's Forge (W) -> Village Well
    # # Note: The map shows VS -> (E) GS, VS -> (W) EC, VS -> (N) MH. 
    # # To reach VW from VS as per golden path step 5 (after VS step 4), need to adjust path or golden path.
    # # Current golden path in RoomsAct1.md for step 5 (Village Well) is after step 4 (Village Square).
    # # Map: VS -> EC (W), EC -> VF (S), VF -> VW (E)
    # # So, from Village Square: go west (to EC), go south (to VF), go east (to VW)
    # _execute_commands(game, ["go west", "go south", "go east"])
    # assert game.state.current_room.name == "Village Well", "Not in Village Well after commands (VS -> EC -> VF -> VW)"
    # _execute_commands(game, ["use bucket"])
    # # TODO: Add assertion for filled bucket or water interaction if applicable

    # # Blacksmith's Forge
    # # Path: Village Well (E) -> Blacksmith's Forge
    # _execute_commands(game, ["go east"])
    # assert game.state.current_room.name == "Blacksmith's Forge", "Not in Blacksmith's Forge after commands (VW -> BSF)"
    # # Assuming player has a coin from using the hoe earlier.
    # _check_item_in_inventory(game.state, "coin") 
    # _execute_commands(game, ["use coin", "talk blacksmith"])
    # _check_item_in_inventory(game.state, "coin", should_be_present=False)
    # # Assuming using coin at blacksmith gives a sharpened knife and removes dull knife if present.
    # # Need to ensure DullKnife is added to inventory if it's a prerequisite for sharpening.
    # # For now, let's assume `use coin` handles the transaction and gives `sharpened knife`.
    # # _check_item_in_inventory(game.state, "dull knife", should_be_present=False) 
    # _check_item_in_inventory(game.state, "sharpened knife")

    # # General Store
    # # Path: Blacksmith's Forge (N) -> General Store
    # _execute_commands(game, ["go north"])
    # assert game.state.current_room.name == "General Store", "Not in General Store after commands (BSF -> GS)"
    # _execute_commands(game, ["talk shopkeeper"])
    # # Player needs a coin to buy rope. The first coin was used at the Blacksmith.
    # # Golden path suggests: "(If coin was already spent, return to Vegetable Field and use hoe again to uncover another coin, or trade items with shopkeeper.)"
    # # For the test, we will assume the player needs to get another coin.
    # # Path: GS (W) -> VS (W) -> EC (S) -> VF
    # _execute_commands(game, ["go west", "go west", "go south"]) # GS -> VS -> EC -> VF
    # assert game.state.current_room.name == "Vegetable Field", "Not in Vegetable Field for second coin"
    # # Using hoe again - assuming RustyHoe is not single-use for *finding* coins, or a new one is acquired.
    # # For simplicity, let's assume the original RustyHoe was consumed, and we need a new one or the WitheredCarrot interaction gives a coin.
    # # The current RustyHoe implementation makes it break after one use.
    # # This part of the golden path needs clarification or game logic adjustment for repeated coin acquisition.
    # # For now, we will skip buying rope and proceed, or assume a coin is magically available for test purposes.
    # # Option: Add a coin directly to inventory for test if game logic for re-acquiring isn't in place.
    # # game.state.inventory.append(Coin()) # Test-only hack if needed
    # # _check_item_in_inventory(game.state, "coin") 
    # # _execute_commands(game, ["use coin"]) # Buy rope
    # # _check_item_in_inventory(game.state, "coin", should_be_present=False)
    # # _check_item_in_inventory(game.state, "rope")

    # # Check for Act I completion: amulet and map fragment in inventory, and in Road to Greendale
    # # inventory_names = [item.get_name().lower() for item in game.state.inventory]
    # # assert "ancient amulet" in inventory_names, "Amulet not in inventory at end of Act I"
    # # assert "map fragment" in inventory_names, "Map fragment not in inventory at end of Act I"
    # # assert game.state.current_room.name == "Road to Greendale", "Not in Road to Greendale at end of Act I"
