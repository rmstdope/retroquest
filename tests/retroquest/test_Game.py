import pytest
from unittest.mock import MagicMock, patch
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

# Dummy room and item setup for test
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

@pytest.fixture
def basic_rooms():
    # Minimal room network for testing
    return {
        "EliorsCottage": EliorsCottage(),
        "VegetableField": VegetableField(),
    }

@pytest.fixture
def game(basic_rooms):
    return Game(basic_rooms["EliorsCottage"], basic_rooms)

def test_game_initial_state(game, basic_rooms):
    assert game.state.current_room == basic_rooms["EliorsCottage"]
    assert game.is_running is True
    assert game.state.inventory == []
    assert game.state.history == []
    assert isinstance(game.command_parser, type(game.command_parser))

def test_move_valid(game, basic_rooms):
    # EliorsCottage south -> VegetableField
    result = game.move('south')
    assert game.state.current_room == basic_rooms["VegetableField"]
    assert "You move south to" in result
    assert basic_rooms["VegetableField"].name in result

def test_move_invalid(game):
    result = game.move('west')
    assert "can't go that way" in result

def test_quit_prompts_save(monkeypatch, game):
    # Simulate user saying 'no' to save
    monkeypatch.setattr(game.session, 'prompt', lambda msg: 'no')
    result = game.quit()
    assert "Goodbye!" in result
    assert game.is_running is False

    # Simulate user saying 'yes' to save, and patch save
    game.is_running = True
    monkeypatch.setattr(game.session, 'prompt', lambda msg: 'yes')
    game.save = MagicMock(return_value=None)
    result = game.quit()
    assert "Game saved. Goodbye!" in result
    assert game.save.called
    assert game.is_running is False

def test_quit_loops_on_invalid(monkeypatch, game):
    # Simulate user entering invalid, then 'no'
    responses = iter(['maybe', 'no'])
    monkeypatch.setattr(game.session, 'prompt', lambda msg: next(responses))
    result = game.quit()
    assert "Goodbye!" in result
    assert game.is_running is False

def test_visited_rooms_initial(game):
    # Only the starting room should be visited
    assert game.state.visited_rooms == [game.state.current_room.name]

def test_visited_rooms_after_move(game, basic_rooms):
    # Move to another room
    game.move('south')
    assert basic_rooms["VegetableField"].name in game.state.visited_rooms
    # Both rooms should be in visited_rooms
    assert set(game.state.visited_rooms) == {basic_rooms["EliorsCottage"].name, basic_rooms["VegetableField"].name}

def test_visited_rooms_no_duplicates(game, basic_rooms):
    # Move to another room and back
    game.move('south')
    game.move('north')  # Assuming VegetableField has north exit back
    # No duplicates in visited_rooms
    assert game.state.visited_rooms.count(basic_rooms["EliorsCottage"].name) == 1
    assert game.state.visited_rooms.count(basic_rooms["VegetableField"].name) == 1

def test_map_initial_state(game):
    result = game.map()
    # Only the starting room should be shown, with its exits listed
    assert "Visited Rooms and Exits:" in result
    assert "- Elior's Cottage:" in result
    # Should show exits for the starting room (EliorsCottage)
    assert "    south -> Vegetable Field" in result
    # Should not show VegetableField as a room yet
    assert "- Vegetable Field" not in result

def test_map_after_move(game):
    game.move('south')
    result = game.map()
    # Both rooms should be shown
    assert "- Elior's Cottage:" in result  # Accepts either full or partial name
    assert "- Vegetable Field:" in result  # Fixed: match the correct room name with space
    # Exits for EliorsCottage should be shown
    assert "    south -> Vegetable Field" in result
    # Exits for VegetableField should be shown (should have north back to EliorsCottage)
    assert "    north -> Elior's Cottage" in result

def test_map_multiple_moves(game):
    # Move south, then north (should visit both rooms, no duplicates)
    game.move('south')
    game.move('north')
    result = game.map()
    # Both rooms should be present
    assert "- Elior's Cottage:" in result
    assert "- Vegetable Field:" in result  # Fixed: match the correct room name with space
    # Exits for both rooms should be shown
    assert "    south -> Vegetable Field" in result
    assert "    north -> Elior's Cottage" in result
    # Only two rooms shown (count of '- ' at line start)
    room_lines = [line for line in result if line.strip().startswith('- ')]
    assert len(room_lines) == 2

def test_take_item_from_room(game, basic_rooms):
    # Place an item in the starting room
    from retroquest.items.Egg import Egg
    egg = Egg()
    game.state.current_room.items.append(egg)
    assert egg in game.state.current_room.items
    # Take the item
    result = game.take('egg')
    assert "You take the egg" in result
    assert egg in game.state.inventory
    assert egg not in game.state.current_room.items

def test_take_item_not_present(game):
    # Try to take an item that isn't in the room
    result = game.take('nonexistent')
    assert "There is no 'nonexistent' here to take." in result
    assert len(game.state.inventory) == 0

def test_drop_item_from_inventory(game, basic_rooms):
    # Add an item to inventory
    from retroquest.items.Lantern import Lantern
    lantern = Lantern()
    game.state.inventory.append(lantern)
    assert lantern in game.state.inventory
    # Drop the item
    result = game.drop('lantern')
    assert "You drop the lantern" in result
    assert lantern not in game.state.inventory
    assert lantern in game.state.current_room.items

def test_drop_item_not_in_inventory(game):
    # Try to drop an item not in inventory
    result = game.drop('nonexistent')
    assert "You don't have a 'nonexistent' to drop." in result

def test_learn_spell(game):
    from retroquest.spells.LightSpell import LightSpell
    light_spell = LightSpell()
    result = game.learn(light_spell)
    assert "You have learned the spell: Light!" in result
    assert light_spell in game.state.known_spells

def test_learn_spell_already_known(game):
    from retroquest.spells.LightSpell import LightSpell
    light_spell = LightSpell()
    game.learn(light_spell) # Learn it once
    result = game.learn(light_spell) # Try to learn again
    assert "You already know the spell: Light." in result
    assert game.state.known_spells.count(light_spell) == 1

def test_spells_command_no_spells(game):
    result = game.spells()
    assert "You don't know any spells yet." in result

def test_spells_command_with_spells(game):
    from retroquest.spells.LightSpell import LightSpell
    from retroquest.spells.HealSpell import HealSpell
    light_spell = LightSpell()
    heal_spell = HealSpell()
    game.learn(light_spell)
    game.learn(heal_spell)
    result = game.spells()
    assert "Known Spells:" in result
    assert f"  - {light_spell.get_name()}: {light_spell.get_description()}" in result
    assert f"  - {heal_spell.get_name()}: {heal_spell.get_description()}" in result

# --- Tests for \'give\' command ---

def test_give_item_to_character_successful(game, basic_rooms):
    from retroquest.items.Apple import Apple
    from retroquest.characters.Villager import Villager # Assuming a generic Villager character
    
    apple = Apple()
    villager = Villager() # Villager needs to be in the room
    
    game.state.inventory.append(apple)
    game.state.current_room.characters.append(villager)
    
    # Mock the villager\'s give_item method
    villager.give_item = MagicMock(return_value=f"{villager.get_name()} takes the {apple.get_name()}.")
    
    result = game.give(f"{apple.get_name()} to {villager.get_name()}")
    
    assert f"{villager.get_name()} takes the {apple.get_name()}." in result
    villager.give_item.assert_called_once_with(game.state, apple)
    # Assuming the character\'s give_item method is responsible for removing the item if accepted.
    # If Game.give should remove it, add that check here.
    # For now, we only check the call and response.

def test_give_item_not_in_inventory(game, basic_rooms):
    from retroquest.characters.Villager import Villager
    villager = Villager()
    game.state.current_room.characters.append(villager)
    
    result = game.give(f"nonexistent_item to {villager.get_name()}")
    assert "You don\'t have any \'nonexistent_item\'." in result

def test_give_item_to_character_not_in_room(game, basic_rooms):
    from retroquest.items.Apple import Apple
    apple = Apple()
    game.state.inventory.append(apple)
    
    # Character "Ghost" is not added to the room
    result = game.give(f"{apple.get_name()} to Ghost")
    assert "\'Ghost\' is not here." in result

def test_give_item_character_does_not_want(game, basic_rooms):
    from retroquest.items.Stick import Stick # An item the character might not want
    from retroquest.characters.Character import Character # Base character
    
    stick = Stick()
    generic_char = Character(name="Grumpy Person", description="Someone grumpy.")
    
    game.state.inventory.append(stick)
    game.state.current_room.characters.append(generic_char)
    
    # The default Character.give_item should be called
    result = game.give(f"{stick.get_name()} to {generic_char.get_name()}")
    assert f"{generic_char.get_name()} doesn\'t seem interested in the {stick.get_name()}." in result

def test_give_item_invalid_format(game):
    result = game.give("apple villager") # Missing "to"
    assert "Invalid command format. Please use \'give <item> to <character>\'." in result

    result = game.give("to villager") # Missing item
    assert "What do you want to give? Use \'give <item> to <character>\'." in result

    result = game.give("apple to") # Missing character
    assert "Who do you want to give it to? Use \'give <item> to <character>\'." in result
