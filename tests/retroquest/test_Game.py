import pytest
from unittest.mock import MagicMock, patch
from retroquest.Game import Game
from retroquest.rooms.EliorsCottage import EliorsCottage
from retroquest.rooms.VegetableField import VegetableField

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
