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

@pytest.mark.integration
def test_golden_path_act1_completion(monkeypatch):
    # Simulate all commands in the golden path
    commands = [
        # # Elior’s Cottage
        # "take lantern", "take bread", "talk grandmother",
        # # Vegetable Field
        # "go south", "take rusty hoe", "use hoe", "cast revive",
        # # Chicken Coop
        # "go south", "use bread", "take key",
        # # Village Square
        # "go north", "go east", "take bucket", "talk villager",
        # # Village Well
        # "go west", "go east", "use bucket",
        # # Blacksmith’s Forge
        # "go east", "use coin", "talk blacksmith",
        # # General Store
        # "go east", "use coin", "talk shopkeeper",
        # # Abandoned Shed
        # "go west", "go south", "use key", "take mysterious box",
        # # Old Mill
        # "go south", "use rope", "take millstone fragment",
        # # Riverbank
        # "go east", "take fishing rod", "talk fisherman",
        # # Forest Path
        # "go south", "use knife", "take wild berries", "take stick",
        # # Hidden Glade
        # "go east", "look", "take rare flower", "take shiny pebble",
        # # Village Chapel
        # "go south", "take candle", "talk priest", "use candle", "take locket",
        # # Mira’s Hut
        # "go north", "go west", "go north", "talk mira",
        # # Vegetable Field (again)
        # "go south", "go west", "cast revive",
        # # Village Well (again)
        # "go east", "cast purify", "take ring",
        # # Abandoned Shed (again)
        # "go west", "go south", "cast unlock", "take map fragment",
        # # Hidden Glade (again)
        # "go north", "go east", "cast light",
        # # Riverbank (again)
        # "go west", "go south", "go east", "cast freeze",
        # # Forest Path (again)
        # "go south", "cast grow",
        # # Village Chapel (again)
        # "go north", "go south", "cast bless",
        # # Road to Greendale
        # "go east", "talk merchant", "use map fragment"
    ]

    # Setup Game
    game = Game(starting_room=ROOMS["EliorsCottage"], rooms=ROOMS)
    # Patch session.prompt to avoid blocking
    monkeypatch.setattr(game.session, "prompt", lambda *a, **kw: "no")
    # Patch save to avoid NotImplementedError
    monkeypatch.setattr(game, "save", lambda: None)

    # Run all commands
    for cmd in commands:
        # try:
            game.handle_command(cmd)
        # except NotImplementedError:
        #     # Some commands may not be implemented, skip for now
        #     continue

    # Check for Act I completion: amulet and map fragment in inventory, and in Road to Greendale
    # inventory_names = [item.get_name().lower() for item in game.state.inventory]
    # assert "ancient amulet" in inventory_names, "Amulet not in inventory at end of Act I"
    # assert "map fragment" in inventory_names, "Map fragment not in inventory at end of Act I"
    # assert game.state.current_room.name == "Road to Greendale", "Not in Road to Greendale at end of Act I"
