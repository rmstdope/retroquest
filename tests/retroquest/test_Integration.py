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

def _check_current_room(game_state, expected_room_name: str):
    assert game_state.current_room.name == expected_room_name, f"Not in '{expected_room_name}'"

def _execute_commands(game, commands_list):
    global results
    for cmd in commands_list:
        results.append(game.handle_command(cmd))
    _debug_print_history()

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

def test_golden_path_act1_completion(monkeypatch):
    # Setup Game
    game = Game(starting_room=ROOMS["EliorsCottage"], rooms=ROOMS)

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
    inventory_count_after_first_hoe_use = len(game.state.inventory)
    _execute_commands(game, ["use hoe"])
    assert len(game.state.inventory) == inventory_count_after_first_hoe_use, \
        "Using hoe again should not add items to inventory"

    # Chicken Coop
    _execute_commands(game, ["go south", "use bread with chicken"])
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
    _execute_commands(game, ["use bucket with well"])
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
    _execute_commands(game, ["take apple"]) # Added "take apple"
    _check_item_in_inventory(game.state, "apple", should_be_present=False) #Cannot be in inventory yet, just in room
    _execute_commands(game, ["talk to shopkeeper", "buy rope from shopkeeper"]) # Added "take apple"
    _check_item_in_inventory(game.state, "apple") # Added check for apple
    _check_item_in_inventory(game.state, "rope")
    _check_item_in_inventory(game.state, "coin", should_be_present=False) 

    # Abandoned Shed - Use Key
    # Path: General Store (current) -> Village Square -> Village Well -> Abandoned Shed
    _execute_commands(game, ["go south", "go west", "go south"]) 
    _check_current_room(game.state, "Abandoned Shed")
    _check_item_in_room(game.state.current_room, "mysterious box", should_be_present=False) # Box is not present yet
 
    _execute_commands(game, ["search"]) # Search does not reveals items since door is locked
    _check_item_in_room(game.state.current_room, "fishing rod", should_be_present=False)
    _check_item_in_room(game.state.current_room, "magnet", should_be_present=False)
 
    _execute_commands(game, ["use key with door"]) # Changed: Assumes 'use key' unlocks the shed door
    _check_item_in_inventory(game.state, "key", should_be_present=False) # Key is used up or its state changes
    _check_item_in_room(game.state.current_room, "mysterious box") # Box is present

    _execute_commands(game, ["search"]) # Search reveals items
    _check_item_in_room(game.state.current_room, "fishing rod") # Fishing rod is now visible/obtainable
    _check_item_in_room(game.state.current_room, "magnet") # Magnet is now visible/obtainable

    _execute_commands(game, ["take fishing rod", "take magnet"]) # Take both items

    _check_item_in_inventory(game.state, "fishing rod")
    _check_item_in_room(game.state.current_room, "fishing rod", should_be_present=False)
    
    _check_item_in_inventory(game.state, "magnet")
    _check_item_in_room(game.state.current_room, "magnet", should_be_present=False)

    # Old Mill - Use Rope, Take Millstone Fragment
    # Path: Abandoned Shed (current) -> Old Mill
    _execute_commands(game, ["go south"])
    _check_current_room(game.state, "Old Mill")

    _execute_commands(game, ["use rope with mechanism"]) # Assuming "use rope" is enough, and it interacts with the mechanism
    _check_item_in_inventory(game.state, "rope", should_be_present=False)
    _check_item_in_room(game.state.current_room, "millstone fragment")

    _execute_commands(game, ["take millstone fragment"])
    _check_item_in_inventory(game.state, "millstone fragment")
    _check_item_in_room(game.state.current_room, "millstone fragment", should_be_present=False)

    # Step 11: Return to Blacksmith's Forge
    # Path: Old Mill (current) -> Abandoned Shed -> Village Well -> Blacksmith's Forge
    _execute_commands(game, ["go north", "go north", "go east"])
    _check_current_room(game.state, "Blacksmith's Forge")

    _execute_commands(game, ["give millstone fragment to blacksmith"])
    _check_item_in_inventory(game.state, "millstone fragment", should_be_present=False)

    # Step 12: Riverbank
    # Path: Blacksmith's Forge (current) -> Village Well -> Abandoned Shed -> Old Mill -> Riverbank
    _execute_commands(game, ["go west", "go south", "go south", "go east"])
    _check_current_room(game.state, "Riverbank")

    _execute_commands(game, ["use fishing rod with river"])
    _check_item_in_inventory(game.state, "fish", should_be_present=False) # Fish is not in inventory as player cannot fish

    _execute_commands(game, ["talk to fisherman"])
    # Fisherman teaches fishing - no direct item/spell yet, but sets up next action
    _execute_commands(game, ["use fishing rod with river"])
    _check_item_in_inventory(game.state, "fish")

    _execute_commands(game, ["give fish to fisherman"])
    _check_item_in_inventory(game.state, "fish", should_be_present=False)
    _check_spell_known(game.state, "purify")

    # Step 13: Forest Path
    # Path: Riverbank (current) -> Forest Path
    _execute_commands(game, ["go south"])
    _check_current_room(game.state, "Forest Path")
    # Vines should be in the room initially
    _check_item_in_room(game.state.current_room, "vines", should_be_present=True)
    _check_item_in_room(game.state.current_room, "stick", should_be_present=False) # Stick is not present yet
    _check_item_in_inventory(game.state, "sharp knife") # Elior has the sharp knife

    _execute_commands(game, ["use sharp knife with vines"])
    # Vines should be removed from the room
    _check_item_in_room(game.state.current_room, "vines", should_be_present=False)
    # Sharp Knife should be removed from inventory (it breaks)
    _check_item_in_inventory(game.state, "sharp knife", should_be_present=False)
    # Stick should be added to the room
    _check_item_in_room(game.state.current_room, "stick", should_be_present=True) 

    _execute_commands(game, ["take stick"])
    _check_item_in_inventory(game.state, "stick")
    _check_item_in_room(game.state.current_room, "stick", should_be_present=False)

    # Step 14: Hidden Glade
    # Path: Forest Path (current) -> Hidden Glade
    _execute_commands(game, ["go south"])
    _check_current_room(game.state, "Hidden Glade")
    # Deer and Rare Flower should not be present initially
    _check_character_in_room(game.state.current_room, "deer", should_be_present=False) 
    _check_item_in_room(game.state.current_room, "rare flower", should_be_present=False)

    # Elior rests, and if deer_can_be_observed is true (set by Blacksmith), Deer and Rare Flower appear
    # The flag deer_can_be_observed was set in step 11.
    _execute_commands(game, ["rest"]) 
    _check_character_in_room(game.state.current_room, "deer", should_be_present=True)
    _check_item_in_room(game.state.current_room, "rare flower", should_be_present=True)
    
    _execute_commands(game, ["take rare flower"])
    _check_item_in_inventory(game.state, "rare flower")
    _check_item_in_room(game.state.current_room, "rare flower", should_be_present=False)
    # Deer remains in the room
    _check_character_in_room(game.state.current_room, "deer", should_be_present=True)

    # Step 15: Village Chapel (First Visit - Part 1)
    # Path: Hidden Glade (current) -> Village Chapel
    _execute_commands(game, ["go south"])
    _check_current_room(game.state, "Village Chapel")
    _check_item_in_room(game.state.current_room, "candle") # Candle should be in the chapel

    _execute_commands(game, ["take candle"]) # Taking the candle first
    _check_item_in_inventory(game.state, "candle")
    _check_item_in_room(game.state.current_room, "candle", should_be_present=False)

    _execute_commands(game, ["talk to priest"]) # Priest mentions needing matches

    # Step 16: General Store (Visit for Matches)
    # Path: Village Chapel (current) -> Hidden Glade -> Forest Path -> Riverbank -> Old Mill -> Abandoned Shed -> Village Well -> Blacksmith's Forge -> General Store
    _execute_commands(game, ["go north", "go north", "go north", "go west", "go north", "go north", "go east", "go north"])
    _check_current_room(game.state, "General Store")
    
    _check_item_in_room(game.state.current_room, "matches") # Matches in room
    _execute_commands(game, ["talk to shopkeeper"]) # Ask for matches
    _check_item_in_inventory(game.state, "matches") # Matches obtained
    _check_item_in_room(game.state.current_room, "matches", should_be_present=False) # Matches not in room

    # # Step 17: Village Chapel (First Visit - Part 2)
    # # Path: General Store (current) -> Blacksmith's Forge -> Village Well -> Abandoned Shed -> Old Mill -> Riverbank -> Forest Path -> Hidden Glade -> Village Chapel
    # _execute_commands(game, ["go south", "go west", "go south", "go south", "go east", "go south", "go south", "go south"])
    # _check_current_room(game.state, "Village Chapel")

    # # Pre-check: Hidden locket should not be visible yet
    # _check_item_in_room(game.state.current_room, "hidden locket", should_be_present=False)
    # _check_item_in_inventory(game.state, "candle") # Ensure candle is still in inventory
    # _check_item_in_inventory(game.state, "matches") # Ensure matches are in inventory

    # _execute_commands(game, ["use candle with matches"]) # Using candle with matches should reveal the locket
    # _check_item_in_room(game.state.current_room, "hidden locket") # Locket is now visible

    # _execute_commands(game, ["take hidden locket"])
    # _check_item_in_inventory(game.state, "hidden locket")
    # _check_item_in_room(game.state.current_room, "hidden locket", should_be_present=False)

    # # Assuming giving the locket to the priest consumes it, as per previous logic.
    # # The design doc says "Show the locket to the Priest", then "Item used: hidden locket (to show, not consumed yet)"
    # # However, the previous test version assumed it was consumed upon learning bless.
    # # Let's stick to the design doc: locket is NOT consumed when shown to learn bless.
    # # It's consumed later when given to Grandmother.
    # _execute_commands(game, ["give locket to priest"]) # Or "show locket to priest"
    # _check_spell_known(game.state, "bless")
    # _check_item_in_inventory(game.state, "hidden locket") # Locket should still be in inventory

    # # Step 18: Return to Mira’s Hut
    # # Path: Village Chapel (current) -> Hidden Glade -> Forest Path -> Riverbank -> Old Mill -> Abandoned Shed -> Village Well -> Village Square -> Mira's Hut
    # # Note: The path to General Store and back to Chapel for matches was long.
    # # The path from Chapel to Mira's hut is:
    # # Village Chapel -> Hidden Glade (N) -> Forest Path (N) -> Riverbank (N) -> Old Mill (W) -> Abandoned Shed (N) -> Village Well (N) -> Village Square (N) -> Mira's Hut (N)
    # # This is 8 'go north' or 'go west' moves.
    # _execute_commands(game, ["go north", "go north", "go north", "go west", "go north", "go north", "go north", "go north"])
    # _check_current_room(game.state, "Mira's Hut")
    # _execute_commands(game, ["give rare flower to mira"])
    # _check_item_in_inventory(game.state, "rare flower", should_be_present=False)
    # _execute_commands(game, ["talk to mira"])
    # _check_spell_known(game.state, "heal")
    # _check_spell_known(game.state, "unlock")
    # _check_spell_known(game.state, "light")

    # # Step 19: Return to Abandoned Shed (Second Visit)
    # # Path: Mira's Hut (current) -> Village Square -> Village Well -> Abandoned Shed
    # _execute_commands(game, ["go south", "go west", "go south"])
    # _check_current_room(game.state, "Abandoned Shed")
    # # Box should be in the room from the first visit
    # _check_item_in_room(game.state.current_room, "mysterious box") 
    # _execute_commands(game, ["cast unlock on mysterious box"]) # Or "use unlock spell with mysterious box"
    # # Assuming casting unlock automatically opens it or makes it openable
    # # The design doc says: "Open mysterious box. Inside... lies a fragment of an old map."
    # # This implies a separate "open box" command might be needed if "cast unlock" doesn't auto-open.
    # # For now, let's assume "cast unlock" is sufficient or the game handles "open box" implicitly after unlock.
    # # If an explicit "open box" is needed, add: _execute_commands(game, ["open mysterious box"])
    # _check_item_in_inventory(game.state, "map")
    # _check_item_in_room(game.state.current_room, "mysterious box", should_be_present=False) # Box is taken or gone after opening

    # # Step 20: Return to Vegetable Field
    # # Path: Abandoned Shed (current) -> Village Well -> Vegetable Field
    # _execute_commands(game, ["go north", "go west"])
    # _check_current_room(game.state, "Vegetable Field")
    # # Withered carrot should be present in the room from the start if not taken
    # # Or, if it was taken earlier and not revivable then, it might be in inventory.
    # # Design doc: "Withered carrot (Available in Vegetable Field from start)"
    # # Design doc: Step 2: "Attempt to cast revive (fails, but hints at magic)" - implies it might have been taken.
    # # Let's assume it was left in the field, or if taken, it's still "Withered carrot".
    # # For the test, we need to ensure it's targetable. If it was taken, the command would be `cast revive on Withered carrot` (targeting inventory).
    # # If it's in the room, it might be `cast revive on Withered carrot` (targeting room item).
    # # The design doc for step 18 says: "Cast revive on the Withered carrot." - not specifying location.
    # # Let's assume the game logic handles finding the Withered Carrot either in room or inventory.
    # # For a clean test, let's ensure it's in the room first if it wasn't picked up.
    # # However, the initial setup of VegetableField likely places it. If player took it in step 2, it's in inventory.

    # # To make this test robust, we should check if it's in inventory first, then room.
    # # Or, rely on the game's `cast` command to find it.
    # # The `RoomsAct1.md` states `Withered carrot (start)` for Vegetable Field items.
    # # It's not explicitly taken in the Golden Path until it's revived.
    # # _check_item_in_room(game.state.current_room, "Withered carrot")
    # # _execute_commands(game, ["cast revive on Withered carrot"])
    # # _check_item_in_inventory(game.state, "carrot")
    # # _check_item_in_inventory(game.state, "Withered carrot", should_be_present=False) # Withered carrot is transformed
    # # _check_item_in_room(game.state.current_room, "Withered carrot", should_be_present=False) # And removed from room

    # # For robustness, explicitly check and revive if needed
    # _check_item_in_inventory(game.state, "Withered carrot", should_be_present=False) # Ensure it's not in inventory
    # _check_item_in_room(game.state.current_room, "Withered carrot") # Check it's in the room
    # _execute_commands(game, ["cast revive on Withered carrot"])
    # _check_item_in_inventory(game.state, "carrot")
    # _check_item_in_inventory(game.state, "Withered carrot", should_be_present=False) # Withered carrot is transformed
    # _check_item_in_room(game.state.current_room, "Withered carrot", should_be_present=False) # And removed from room

    # # Step 21: Return to Village Well
    # # Path: Vegetable Field (current) -> Village Well
    # _execute_commands(game, ["go east"])
    # _check_current_room(game.state, "Village Well")
    # _execute_commands(game, ["cast purify on well"])
    # # Casting purify should make the shiny ring visible or retrievable.
    # # The design doc implies it's seen at the bottom. We'll assume the next command handles retrieval.
    
    # # Ensure items for fishing the ring are present
    # _check_item_in_inventory(game.state, "fishing rod")
    # _check_item_in_inventory(game.state, "magnet")
    # _check_item_in_inventory(game.state, "stick")

    # _execute_commands(game, ["use fishing rod with magnet and stick on well"])
    # _check_item_in_inventory(game.state, "shiny ring")
    # # Assuming the tools are not consumed
    # _check_item_in_inventory(game.state, "fishing rod")
    # _check_item_in_inventory(game.state, "magnet")
    # _check_item_in_inventory(game.state, "stick")

    # # Step 22: Return to Hidden Glade
    # # Path: Village Well (current) -> Abandoned Shed -> Old Mill -> Riverbank -> Forest Path -> Hidden Glade
    # _execute_commands(game, ["go south", "go south", "go east", "go south", "go south"])
    # _check_current_room(game.state, "Hidden Glade")
    # _execute_commands(game, ["cast light near moss-covered stone"]) # Or "cast light on stone", "use light spell"
    # _check_spell_known(game.state, "grow")

    # # Step 23: Return to Forest Path
    # # Path: Hidden Glade (current) -> Forest Path
    # _execute_commands(game, ["go north"])
    # _check_current_room(game.state, "Forest Path")
    # # Assuming berry bush is a feature of the room, not an item itself initially.
    # # Casting grow should make wild berries appear in the room.
    # _check_item_in_room(game.state.current_room, "wild berries", should_be_present=False) # Not there before casting
    # _execute_commands(game, ["cast grow on berry bush"]) # Or "cast grow spell"
    # _check_item_in_room(game.state.current_room, "wild berries") # Should be present now
    # _execute_commands(game, ["take wild berries"])
    # _check_item_in_inventory(game.state, "wild berries")
    # _check_item_in_room(game.state.current_room, "wild berries", should_be_present=False) # Taken from room

    # # Step 24: Return to Elior's Cottage
    # # Path: Forest Path (current) -> Riverbank -> Old Mill -> Abandoned Shed -> Village Well -> Vegetable Field -> Elior's Cottage
    # _execute_commands(game, ["go north", "go west", "go north", "go north", "go west", "go north"])
    # _check_current_room(game.state, "Elior's Cottage")
    # _check_item_in_inventory(game.state, "hidden locket") # Locket should still be there from Step 15
    # _execute_commands(game, ["give hidden locket to grandmother"])
    # _check_item_in_inventory(game.state, "hidden locket", should_be_present=False)
    # _check_item_in_inventory(game.state, "travel cloak")

    # # Step 25: Village Chapel (Prepare for Journey)
    # # Path: Elior's Cottage (current) -> Village Square -> Mira's Hut -> Village Square -> Village Well -> Abandoned Shed -> Old Mill -> Riverbank -> Forest Path -> Hidden Glade -> Village Chapel
    # _execute_commands(game, ["go east", "go north", "go south", "go west", "go south", "go south", "go east", "go south", "go south", "go south"])
    # _check_current_room(game.state, "Village Chapel")
    # _check_spell_known(game.state, "bless") # Ensure bless was learned
    # _execute_commands(game, ["cast bless"])
    # # Add assertion for bless effect if applicable (e.g., status effect on player)
    # # For now, just checking command execution.

    # # Step 26: Road to Greendale (Interactions)
    # # Path: Village Chapel (current) -> Road to Greendale
    # _execute_commands(game, ["go east"])
    # _check_current_room(game.state, "Road to Greendale")
    # _check_item_in_inventory(game.state, "shiny ring") # Ensure shiny ring is present
    # _execute_commands(game, ["give shiny ring to merchant"]) # Assumes merchant is present
    # _check_item_in_inventory(game.state, "shiny ring", should_be_present=False)
    # _check_item_in_inventory(game.state, "wandering boots")

    # # Step 27: Return to Mira’s Hut (Final Visit)
    # # Path: Road to Greendale (current) -> Village Chapel -> Hidden Glade -> Forest Path -> Riverbank -> Old Mill -> Abandoned Shed -> Village Well -> Village Square -> Mira's Hut
    # _execute_commands(game, ["go west", "go north", "go north", "go north", "go west", "go north", "go north", "go north", "go north"])
    # _check_current_room(game.state, "Mira's Hut")
    # # Verify all quest items are present before talking to Mira
    # _check_item_in_inventory(game.state, "travel cloak")
    # # Bless was cast, assume it fulfills "Magical protection"
    # _check_item_in_inventory(game.state, "wild berries")
    # _check_item_in_inventory(game.state, "apple")
    # _check_item_in_inventory(game.state, "egg")
    # _check_item_in_inventory(game.state, "carrot")
    # _check_item_in_inventory(game.state, "wandering boots")
    # _check_item_in_inventory(game.state, "map")
    # # Verify all spells are known
    # _check_spell_known(game.state, "revive")
    # _check_spell_known(game.state, "purify")
    # _check_spell_known(game.state, "bless")
    # _check_spell_known(game.state, "heal")
    # _check_spell_known(game.state, "unlock")
    # _check_spell_known(game.state, "light")
    # _check_spell_known(game.state, "grow")

    # _execute_commands(game, ["talk to mira"])
    # _check_item_in_inventory(game.state, "ancient amulet")

    # # Step 28: Road to Greendale (Departure)
    # # Path: Mira's Hut (current) -> Village Square -> Village Well -> Abandoned Shed -> Old Mill -> Riverbank -> Forest Path -> Hidden Glade -> Village Chapel -> Road to Greendale
    # _execute_commands(game, ["go south", "go west", "go south", "go south", "go east", "go south", "go south", "go south", "go east"])
    # _check_current_room(game.state, "Road to Greendale")
    # _check_item_in_inventory(game.state, "map")
    # _check_item_in_inventory(game.state, "ancient amulet") # Ensure amulet is still there
    
    # # This command should ideally trigger an Act I completion state.
    # # We'll check for the command execution. Further checks depend on how game handles act completion.
    # _execute_commands(game, ["use map"])
    # # Example: assert game.state.act_completed == True or similar
    # # For now, we assume the command executes. If it returns a specific message for act completion, that can be asserted.
    # # _debug_print_history() # Uncomment to see the final output messages

