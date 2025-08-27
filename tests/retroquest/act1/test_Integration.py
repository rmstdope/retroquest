import pytest
from act1.Act1 import Act1
from engine.Game import Game
from retroquest.act1.rooms.EliorsCottage import EliorsCottage
from retroquest.act1.rooms.VegetableField import VegetableField
from retroquest.act1.rooms.ChickenCoop import ChickenCoop
from retroquest.act1.rooms.VillageSquare import VillageSquare
from retroquest.act1.rooms.MirasHut import MirasHut
from retroquest.act1.rooms.BlacksmithsForge import BlacksmithsForge
from retroquest.act1.rooms.GeneralStore import GeneralStore
from retroquest.act1.rooms.VillageWell import VillageWell
from retroquest.act1.rooms.AbandonedShed import AbandonedShed
from retroquest.act1.rooms.OldMill import OldMill
from retroquest.act1.rooms.Riverbank import Riverbank
from retroquest.act1.rooms.ForestPath import ForestPath
from retroquest.act1.rooms.HiddenGlade import HiddenGlade
from retroquest.act1.rooms.VillageChapel import VillageChapel
from retroquest.act1.rooms.RoadToGreendale import RoadToGreendale
from retroquest.act1.quests.HintOfMagic import HintOfMagicQuest
from retroquest.act1.quests.CuriosityKilledTheCat import CuriosityKilledTheCatQuest
from retroquest.act1.quests.FishingExpedition import FishingExpeditionQuest
from retroquest.act1.quests.KnowYourVillage import KnowYourVillageQuest
from retroquest.act1.quests.LetThereBeLight import LetThereBeLightQuest
from retroquest.act1.quests.MagicForReal import MagicForRealQuest
from retroquest.act1.quests.MagnetFishingExpedition import MagnetFishingExpeditionQuest
from retroquest.act1.quests.OhDeerOhDeer import OhDeerOhDeerQuest
from retroquest.act1.quests.PreparingForTheRoad import PreparingForTheRoadQuest
from retroquest.act1.quests.FadedPhotograph import FadedPhotographQuest
from retroquest.act1.quests.LostLetter import LostLetterQuest
from retroquest.act1.quests.ShadowsOverWillowbrook import ShadowsOverWillowbrookQuest

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
        results.append(game.command_parser.parse(cmd))
        while game.state.next_activated_quest():
            pass
        while game.state.next_updated_quest():
            pass
        while game.state.next_completed_quest():
            pass
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

# Quest setup for integration test
QUESTS = [
    HintOfMagicQuest(),
    CuriosityKilledTheCatQuest(),
    FishingExpeditionQuest(),
    KnowYourVillageQuest(),
    LetThereBeLightQuest(),
    MagicForRealQuest(),
    MagnetFishingExpeditionQuest(),
    OhDeerOhDeerQuest(),
    PreparingForTheRoadQuest(),
    FadedPhotographQuest(),
    ShadowsOverWillowbrookQuest(),
    LostLetterQuest()
]

def test_golden_path_act1_completion(monkeypatch):
    # Setup Game
    act = Act1()
    game = Game([act])
    _execute_commands(game, ['look'])

    # Step 1: Elior’s Cottage
    _check_quests(game.state, ["Shadows Over Willowbrook", "Hint of Magic"])
    _check_item_in_room(game.state.current_room, "bread", should_be_present=False)
    _check_item_in_room(game.state.current_room, "Elior's Journal", should_be_present=False)
    _execute_commands(game, ["use lantern"])
    _check_item_in_room(game.state.current_room, "bread")
    _check_item_in_room(game.state.current_room, "Elior's Journal")
    _execute_commands(game, ["take bread", "talk to grandmother"])
    _check_spell_known(game.state, "revive", should_be_present=False)
    _check_item_in_inventory(game.state, "bread")
    _check_item_in_room(game.state.current_room, "bread", should_be_present=False)
    _check_quests(game.state, ["Shadows Over Willowbrook", "Hint of Magic"])
    _execute_commands(game, ["read journal", "talk to grandmother"])
    _check_spell_known(game.state, "revive")
    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real"])

    # Step 2: Vegetable Field
    _execute_commands(game, ["go south", "take rusty hoe"])
    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real", "Know your village"])
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

    # Step 3: Chicken Coop
    _execute_commands(game, ["go south", "use bread with chicken"])
    _check_current_room(game.state, "Chicken Coop")
    _check_item_in_inventory(game.state, "bread", should_be_present=False)
    _check_item_in_room(game.state.current_room, "key")

    _execute_commands(game, ["take key"])
    _check_item_in_inventory(game.state, "key")

    _execute_commands(game, ["take egg"])
    _check_item_in_inventory(game.state, "egg")
    _check_item_in_room(game.state.current_room, "egg", should_be_present=False)

    # Step 4: Village Square
    _execute_commands(game, ["go north", "go north", "go east"])
    _check_current_room(game.state, "Village Square")
    _execute_commands(game, ["take bucket", "talk to villager"])
    _check_item_in_inventory(game.state, "bucket")

    # Step 5: Village Well
    _execute_commands(game, ["go west", "go south", "go east"])
    _check_current_room(game.state, "Village Well")
    _execute_commands(game, ["examine well", "use bucket with well"])
    _check_item_in_inventory(game.state, "bucket (full)")

    # Step 6: Blacksmith's Forge
    _execute_commands(game, ["go east"])
    _check_current_room(game.state, "Blacksmith's Forge")
    _execute_commands(game, ["talk to blacksmith", "give coin to blacksmith"])
    _check_item_in_inventory(game.state, "coin", should_be_present=False)
    _check_item_in_inventory(game.state, "dull knife", should_be_present=False) 
    _check_item_in_inventory(game.state, "sharp knife")

    # Step 7: Vegetable Field
    _execute_commands(game, ["go west", "go west", "use hoe"])
    _check_current_room(game.state, "Vegetable Field")
    _check_item_in_inventory(game.state, "coin")

    # Step 7.5: Visit Mira's Hut for encouragement and hints
    _execute_commands(game, ["go north", "go east", "go north"])
    _check_current_room(game.state, "Mira's Hut")
    # Mira should be present in the room
    _check_character_in_room(game.state.current_room, "mira", should_be_present=True)
    # Talk to Mira for encouragement and hints
    _execute_commands(game, ["talk to mira"])
    # No new items or spells are expected at this point, but ensure the player remains on the correct quest path
    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real", "Know your village"])

    # Step 8: General Store - Buy Rope
    _execute_commands(game, ["go south", "go east"]) # Veg Field -> Village Square -> General Store
    _check_current_room(game.state, "General Store")
    _execute_commands(game, ["take apple", "take rope", "take matches"]) # Added "take apple"
    _check_item_in_inventory(game.state, "apple", should_be_present=False) #Cannot be in inventory yet, just in room
    _check_item_in_inventory(game.state, "rope", should_be_present=False) #Cannot be in inventory yet, just in room
    _check_item_in_inventory(game.state, "matches", should_be_present=False) #Cannot be in inventory yet, just in room
    _execute_commands(game, ["talk to shopkeeper", "buy rope from shopkeeper"]) # Added "take apple"
    _check_item_in_inventory(game.state, "apple") # Added check for apple
    _check_item_in_inventory(game.state, "rope")
    _check_item_in_inventory(game.state, "coin", should_be_present=False) 

    # Step 9: Abandoned Shed - Use Key
    # Path: General Store (current) -> Village Square -> Village Well -> Abandoned Shed
    _execute_commands(game, ["go south", "go west", "go south"]) 
    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real", "Know your village", "Curiosity killed the cat"])
    _check_current_room(game.state, "Abandoned Shed")
    _check_item_in_room(game.state.current_room, "mysterious box", should_be_present=False) # Box is not present yet
 
    _execute_commands(game, ["search"]) # Search does not reveals items since door is locked
    _check_item_in_room(game.state.current_room, "fishing rod", should_be_present=False)
    _check_item_in_room(game.state.current_room, "magnet", should_be_present=False)
 
    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real", "Know your village", "Curiosity killed the cat"])
    _execute_commands(game, ["use key with door"]) # Changed: Assumes 'use key' unlocks the shed door
    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real", "Know your village"])
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

    # Step 10: Old Mill - Use Rope, Take Millstone Fragment
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

    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real", "Know your village"])
    _execute_commands(game, ["give millstone fragment to blacksmith"])
    _check_item_in_inventory(game.state, "millstone fragment", should_be_present=False)
    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real", "Know your village", "Oh deer, oh deer"])

    # Step 12: Riverbank
    # Path: Blacksmith's Forge (current) -> Village Well -> Abandoned Shed -> Old Mill -> Riverbank
    _execute_commands(game, ["go west", "go south", "go south", "go east"])
    _check_current_room(game.state, "Riverbank")

    _execute_commands(game, ["use fishing rod with river"])
    _check_item_in_inventory(game.state, "fish", should_be_present=False) # Fish is not in inventory as player cannot fish

    _execute_commands(game, ["talk to fisherman"])
    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real", "Know your village", "Oh deer, oh deer", "Fishing expedition"])
    # Fisherman teaches fishing - no direct item/spell yet, but sets up next action
    _execute_commands(game, ["use fishing rod with river"])
    _check_item_in_inventory(game.state, "fish")

    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real", "Know your village", "Oh deer, oh deer", "Fishing expedition"])
    _execute_commands(game, ["give fish to fisherman"])
    _check_item_in_inventory(game.state, "fish", should_be_present=False)
    _check_spell_known(game.state, "purify")
    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real", "Know your village", "Oh deer, oh deer"])

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
    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real", "Know your village", "Oh deer, oh deer"])
    _execute_commands(game, ["rest"]) 
    _check_character_in_room(game.state.current_room, "deer", should_be_present=True)
    _check_item_in_room(game.state.current_room, "rare flower", should_be_present=True)
    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real", "Know your village"])

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

    _execute_commands(game, ["talk to priest"]) # Priest mentions needing matches
    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real", "Know your village", "Let there be light"])

    # Step 16: General Store (Visit for Matches)
    # Path: Village Chapel (current) -> Hidden Glade -> Forest Path -> Riverbank -> Old Mill -> Abandoned Shed -> Village Well -> Blacksmith's Forge -> General Store
    _execute_commands(game, ["go north", "go north", "go north", "go west", "go north", "go north", "go east", "go north"])
    _check_current_room(game.state, "General Store")
    
    _check_item_in_room(game.state.current_room, "matches") # Matches in room
    _execute_commands(game, ["talk to shopkeeper"]) # Ask for matches
    _check_item_in_inventory(game.state, "matches") # Matches obtained
    _check_item_in_room(game.state.current_room, "matches", should_be_present=False) # Matches not in room

    # Step 17: Village Chapel (First Visit - Part 2)
    # Path: General Store (current) -> Blacksmith's Forge -> Village Well -> Abandoned Shed -> Old Mill -> Riverbank -> Forest Path -> Hidden Glade -> Village Chapel
    _execute_commands(game, ["go south", "go west", "go south", "go south", "go east", "go south", "go south", "go south"])
    _check_current_room(game.state, "Village Chapel")

    # Pre-check: locket should not be visible yet
    _check_item_in_room(game.state.current_room, "locket", should_be_present=False)
    _check_item_in_inventory(game.state, "matches") # Ensure matches are in inventory

    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real", "Know your village", "Let there be light"])
    _execute_commands(game, ["use candle with matches"]) # Using candle with matches should reveal the locket
    _check_item_in_room(game.state.current_room, "locket") # Locket is now visible
    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real", "Know your village"])

    _execute_commands(game, ["take locket"])
    _check_item_in_inventory(game.state, "locket")
    _check_item_in_room(game.state.current_room, "locket", should_be_present=False)
    _check_spell_known(game.state, "bless")

    # Step 18: Return to Mira’s Hut
    # Path: Village Chapel (current) -> Hidden Glade -> Forest Path -> Riverbank -> Old Mill -> Abandoned Shed -> Village Well -> Village Square -> Mira's Hut
    _execute_commands(game, ["go north", "go north", "go north", "go west", "go north", "go north", "go east", "go north", "go west", "go north"])
    _check_current_room(game.state, "Mira's Hut")

    _check_quests(game.state, ["Shadows Over Willowbrook", "Magic for real", "Know your village"])
    _execute_commands(game, ["give rare flower to mira"])
    _check_item_in_inventory(game.state, "rare flower", should_be_present=False)
    _check_spell_known(game.state, "heal")
    _check_spell_known(game.state, "unlock")
    _check_spell_known(game.state, "light")
    _check_story_flag(game.state, "magic_fully_unlocked", True)
    _check_quests(game.state, ["Shadows Over Willowbrook", "Know your village", "Preparing for the road"])

    # Step 19: Return to Abandoned Shed (Second Visit)
    # Path: Mira's Hut (current) -> Village Square -> Elior's Cottage -> Vegetable Field -> Village Well -> Abandoned Shed
    _execute_commands(game, ["go south", "go west", "go south", "go east", "go south"])
    _check_current_room(game.state, "Abandoned Shed")
    # Box should be in the room from the first visit
    _check_item_in_room(game.state.current_room, "mysterious box") 
    
    # Make sure the box is locked initially
    mysterious_box = game.find_item("mysterious box", look_in_inventory=False, look_in_room=True)
    assert mysterious_box is not None, "Mysterious Box not found in Abandoned Shed"
    assert mysterious_box.locked, "Mysterious Box should be locked initially"
    
    _execute_commands(game, ["cast unlock on mysterious box"]) 
    assert not mysterious_box.locked, "Mysterious Box should be unlocked after casting Unlock spell"
    _check_item_in_room(game.state.current_room, "map", should_be_present=False) # Map is still in the box

    _execute_commands(game, ["open mysterious box"])
    _check_item_in_inventory(game.state, "map")
    _check_item_in_room(game.state.current_room, "map", should_be_present=False) # Map is now in inventory

    # Step 20: Return to Vegetable Field
    # Path: Abandoned Shed (current) -> Village Well -> Vegetable Field
    _execute_commands(game, ["go north", "go west"])
    _check_current_room(game.state, "Vegetable Field")
    # Withered carrot should be present in the room from the start if not taken
    # Or, if it was taken earlier and not revivable then, it might be in inventory.
    # Design doc: "Withered carrot (Available in Vegetable Field from start)"
    # Design doc: Step 2: "Attempt to cast revive (fails, but hints at magic)" - implies it might have been taken.
    # Let's assume it was left in the room, or if taken, it's still "Withered carrot".
    # For the test, we need to ensure it's targetable. If it was taken, the command would be `cast revive on Withered carrot` (targeting inventory).
    # If it's in the room, it might be `cast revive on Withered carrot` (targeting room item).
    # The design doc for step 18 says: "Cast revive on the Withered carrot." - not specifying location.
    # Let's assume the game logic handles finding the Withered Carrot either in room or inventory.
    # For a clean test, let's ensure it's in the room first if it wasn't picked up.
    # However, the initial setup of VegetableField likely places it. If player took it in step 2, it's in inventory.

    # To make this test robust, we should check if it's in inventory first, then room.
    # Or, rely on the game's `cast` command to find it.
    # The `RoomsAct1.md` states `Withered carrot (start)` for Vegetable Field items.
    # It's not explicitly taken in the Golden Path until it's revived.
    # Let's assume it's in the room for this test.
    _check_item_in_room(game.state.current_room, "Withered carrot")

    _execute_commands(game, ["cast revive on Withered carrot"])
    _check_item_in_room(game.state.current_room, "Withered carrot", should_be_present=False) # And removed from room
    _check_item_in_room(game.state.current_room, "Fresh Carrot", should_be_present=True) # Carrot should now be present after revival

    _execute_commands(game, ["take carrot"])
    _check_item_in_inventory(game.state, "fresh carrot")
    _check_item_in_room(game.state.current_room, "fresh carrot", should_be_present=False) # And removed from room

    # Step 21: Return to Village Well & Retrieve Shiny Ring
    # Path: Vegetable Field (current) -> Village Well
    _execute_commands(game, ["go east"])
    _check_current_room(game.state, "Village Well")

    # Ensure items for fishing the ring are present before combination
    _check_item_in_inventory(game.state, "fishing rod")
    _check_item_in_inventory(game.state, "magnet")
    _check_item_in_inventory(game.state, "stick")

    # Combine Fishing Rod with Magnet
    _execute_commands(game, ["use fishing rod with magnet"])
    _check_item_in_inventory(game.state, "fishing rod", should_be_present=False)
    _check_item_in_inventory(game.state, "magnet", should_be_present=False)
    _check_item_in_inventory(game.state, "magnetic fishing rod")
    _check_quests(game.state, ["Shadows Over Willowbrook", "Know your village", "Preparing for the road", "Magnet fishing expedition"])

    # Combine Magnetic Fishing Rod with Stick
    _execute_commands(game, ["use magnetic fishing rod with stick"])
    _check_item_in_inventory(game.state, "magnetic fishing rod", should_be_present=False)
    _check_item_in_inventory(game.state, "stick", should_be_present=False)
    _check_item_in_inventory(game.state, "extended magnetic fishing rod")

    # Test: Attempt to use extended magnetic fishing rod BEFORE purifying the well
    _execute_commands(game, ["use extended magnetic fishing rod with well"])
    _check_item_in_inventory(game.state, "shiny ring", should_be_present=False) # Ring should not be obtained
    _check_item_in_inventory(game.state, "extended magnetic fishing rod") # Rod should still be in inventory

    _check_quests(game.state, ["Shadows Over Willowbrook", "Know your village", "Magnet fishing expedition", "Preparing for the road"])
    _execute_commands(game, ["cast purify on well", "use extended magnetic fishing rod with well"])
    _check_item_in_inventory(game.state, "shiny ring") # Ring is now in inventory
    _check_item_in_inventory(game.state, "extended magnetic fishing rod", should_be_present=False) # Rod is consumed or disappears
    _check_quests(game.state, ["Shadows Over Willowbrook", "Know your village", "Preparing for the road"])

    # Step 22: Return to Hidden Glade (Second Visit)
    _execute_commands(game, ["go south", "go south", "go east", "go south", "go south"])
    _check_current_room(game.state, "Hidden Glade")

    _execute_commands(game, ["cast light"])
    _check_spell_known(game.state, "grow")

    # Step 23: Return to Forest Path
    # Path: Hidden Glade (current) -> Forest Path
    _execute_commands(game, ["go north"])
    _check_current_room(game.state, "Forest Path")
    # Casting grow on bush should make wild berries appear in the room.
    _check_item_in_room(game.state.current_room, "wild berries", should_be_present=False) # Not there before casting

    _execute_commands(game, ["cast grow on bush"]) # Or "cast grow spell"
    _check_item_in_room(game.state.current_room, "wild berries") # Should be present now

    _execute_commands(game, ["take wild berries"])
    _check_item_in_inventory(game.state, "wild berries")
    _check_item_in_room(game.state.current_room, "wild berries", should_be_present=False) # Taken from room

    # Step 24: Return to Elior's Cottage
    # Path: Forest Path (current) -> Riverbank -> Old Mill -> Abandoned Shed -> Village Well -> Vegetable Field -> Elior's Cottage
    _execute_commands(game, ["go north", "go west", "go north", "go north", "go west", "go north"])
    _check_current_room(game.state, "Elior's Cottage")
    _check_item_in_inventory(game.state, "locket") # Locket should still be there from Step 15

    _execute_commands(game, ["give locket to grandmother"])
    _check_item_in_inventory(game.state, "locket", should_be_present=False)
    _check_item_in_inventory(game.state, "travel cloak")

    # Step 25: Village Chapel (Prepare for Journey)
    _execute_commands(game, ["go south", "go east", "go south", "go south", "go east", "go south", "go south", "go south"])
    _check_current_room(game.state, "Village Chapel")
    _execute_commands(game, ["cast bless"])
    _check_story_flag(game.state, "journey_bless_completed", True)

    # Step 26: Road to Greendale (Interactions)
    # Path: Village Chapel (current) -> Road to Greendale
    _check_quests(game.state, ["Shadows Over Willowbrook", "Know your village", "Preparing for the road"])
    _execute_commands(game, ["go east"])
    _check_quests(game.state, ["Shadows Over Willowbrook", "Preparing for the road"])
    _check_current_room(game.state, "Road to Greendale")
    _check_item_in_inventory(game.state, "shiny ring") # Ensure shiny ring is present

    _execute_commands(game, ["give shiny ring to merchant"]) # Assumes merchant is present
    _check_item_in_inventory(game.state, "shiny ring", should_be_present=False)
    _check_item_in_inventory(game.state, "wandering boots")
    _check_quests(game.state, ["Shadows Over Willowbrook", ])

    # Step 27: Return to Mira’s Hut (Final Visit)
    # Path: Road to Greendale (current) -> Village Chapel -> Hidden Glade -> Forest Path -> Riverbank -> Old Mill -> Abandoned Shed -> Village Well -> Village Square -> Mira's Hut
    _execute_commands(game, ["go west", "go north", "go north", "go north", "go west", "go north", "go north", "go west", "go north", "go east", "go north"])
    _check_current_room(game.state, "Mira's Hut")
    # Verify all quest items are present before talking to Mira
    _check_item_in_inventory(game.state, "travel cloak")
    # Bless was cast, assume it fulfills "Magical protection"
    _check_item_in_inventory(game.state, "wild berries")
    _check_item_in_inventory(game.state, "apple")
    _check_item_in_inventory(game.state, "egg")
    _check_item_in_inventory(game.state, "fresh carrot")
    _check_item_in_inventory(game.state, "wandering boots")
    _check_item_in_inventory(game.state, "map")
    # Verify all spells are known
    _check_spell_known(game.state, "revive")
    _check_spell_known(game.state, "purify")
    _check_spell_known(game.state, "bless")
    _check_spell_known(game.state, "heal")
    _check_spell_known(game.state, "unlock")
    _check_spell_known(game.state, "light")
    _check_spell_known(game.state, "grow")
    # Verify that bless is cast
    _check_story_flag(game.state, "journey_bless_completed", True)

    _execute_commands(game, ["talk to mira"])
    _check_item_in_inventory(game.state, "ancient amulet")

    # Step 28: Road to Greendale (Departure)
    _execute_commands(game, ["go south", "go west", "go south", "go east", "go south", "go south", "go east", "go south", "go south", "go south", "go east"])
    _check_current_room(game.state, "Road to Greendale")
    _check_item_in_inventory(game.state, "map")
    _check_item_in_inventory(game.state, "ancient amulet") # Ensure amulet is still there
    
    # This command should ideally trigger an Act I completion state.
    # We'll check for the command execution. Further checks depend on how game handles act completion.
    _execute_commands(game, ["use map"])
    # Final check: Act I should be completed
    assert game.acts[game.current_act].is_completed(game.state), "Act I is not marked as completed."

