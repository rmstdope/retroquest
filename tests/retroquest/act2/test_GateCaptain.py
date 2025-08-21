import pytest
from retroquest.act2.characters.GateCaptain import GateCaptain
from retroquest.act2.rooms.GreendaleGates import GreendaleGates


class MockGameState:
    """Mock GameState for testing purposes"""
    def __init__(self, room):
        self.current_room = room
        self.inventory = []


def test_gate_captain_initial_state():
    """Test that Gate Captain starts in the correct initial state"""
    captain = GateCaptain()
    
    assert captain.entry_pass_given == False
    assert captain.get_name() == "Gate Captain"


def test_gate_captain_entry_pass_interaction():
    """Test giving entry pass to Gate Captain"""
    room = GreendaleGates()
    captain = room.gate_captain
    game_state = MockGameState(room)
    
    # Create a mock entry pass item
    class MockEntryPass:
        def get_name(self):
            return "Entry Pass"
    
    entry_pass = MockEntryPass()
    game_state.inventory = [entry_pass]
    
    # Give entry pass to captain
    result = captain.give_item(game_state, entry_pass)
    
    assert captain.entry_pass_given == True
    assert "legitimate documentation" in result.lower()
    assert entry_pass not in game_state.inventory  # Should be removed from inventory


def test_gate_captain_walks_away_after_talking():
    """Test that Gate Captain walks away after being talked to (when entry pass given)"""
    room = GreendaleGates()
    captain = room.gate_captain
    game_state = MockGameState(room)
    
    # Set up state: entry pass already given
    captain.entry_pass_given = True
    
    # Verify captain is initially in the room
    assert captain in room.characters
    
    # Talk to captain
    result = captain.talk_to(game_state)
    
    # Verify captain has walked away (no longer in room)
    assert captain not in room.characters
    assert "walks back to his patrol duties" in result


def test_gate_captain_talk_without_entry_pass():
    """Test talking to Gate Captain before giving entry pass"""
    room = GreendaleGates()
    captain = room.gate_captain
    game_state = MockGameState(room)
    
    # Talk to captain without giving entry pass
    result = captain.talk_to(game_state)
    
    # Captain should still be present
    assert captain in room.characters
    assert "proper documentation" in result.lower()


def test_room_search_blocked_by_captain_presence():
    """Test that room search is blocked while captain is present"""
    room = GreendaleGates()
    game_state = MockGameState(room)
    
    # Captain should be present initially
    assert room.gate_captain in room.characters
    
    # Search should be blocked
    result = room.search(game_state)
    assert "improper to search around while he's observing" in result.lower()
    assert room.city_map_found == False


def test_room_search_allowed_after_captain_walks_away():
    """Test that room search is allowed after captain walks away"""
    room = GreendaleGates()
    game_state = MockGameState(room)
    
    # Simulate complete interaction: give entry pass and talk to captain
    captain = room.gate_captain
    captain.entry_pass_given = True
    captain.talk_to(game_state)  # This should make him walk away
    
    # Verify captain has walked away (no longer in room)
    assert captain not in room.characters
    
    # Search should now be allowed and find city map
    result = room.search(game_state)
    assert "having stepped away" in result.lower()
    assert "city map" in result.lower()
    assert room.city_map_found == True
    
    # City map should be added to room items
    city_map_found = any(item.get_name().lower() == "city map" for item in room.items)
    assert city_map_found == True


def test_room_search_already_searched():
    """Test that room search returns appropriate message when already searched"""
    room = GreendaleGates()
    game_state = MockGameState(room)
    
    # Make captain walk away and search once
    captain = room.gate_captain
    captain.entry_pass_given = True
    captain.talk_to(game_state)
    room.search(game_state)  # First search
    
    # Second search should indicate already searched
    result = room.search(game_state)
    assert "already thoroughly searched" in result.lower()
