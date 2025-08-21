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


def test_act2_creation():
    """Test that Act2 can be created without errors"""
    act = Act2()
    assert act is not None
    assert act.name == "Act II: Greendale & The Forest Edge"
    assert len(act.rooms) == 18  # All 18 rooms should be present


def test_act2_has_all_expected_rooms():
    """Test that Act2 contains all expected rooms"""
    act = Act2()
    expected_rooms = [
        "MountainPath",
        "GreendaleGates", 
        "MainSquare",
        "MarketDistrict",
        "SilverStagInn",
        "InnRooms",
        "MerchantsWarehouse",
        "CastleApproach",
        "CastleCourtyard",
        "GreatHall",
        "ResidentialQuarter",
        "HealersHouse",
        "HiddenLibrary",
        "ForestTransition",
        "ForestEntrance",
        "AncientGrove",
        "WhisperingGlade",
        "HeartOfTheForest",
    ]
    
    for room_name in expected_rooms:
        assert room_name in act.rooms, f"Room {room_name} missing from Act2"


def test_act2_game_creation():
    """Test that a Game can be created with Act2"""
    act = Act2()
    game = Game(act)
    assert game is not None
    assert game.state is not None
    assert game.state.current_room.name == "Mountain Path"  # Starting room


def test_act2_intro():
    """Test that Act2 has a proper introduction"""
    act = Act2()
    intro = act.get_act_intro()
    assert intro is not None
    assert len(intro) > 0
    assert "Greendale" in intro
    assert "Enchanted Forest" in intro


def test_act2_completion_placeholder():
    """Test that Act2 completion checking is implemented (placeholder)"""
    act = Act2()
    # For now, should return False as a placeholder
    assert act.is_complete() == False


def test_act2_room_navigation():
    """Test basic room navigation in Act2"""
    act = Act2()
    game = Game(act)
    
    # Should start in Mountain Path
    assert game.state.current_room.name == "Mountain Path"
    
    # Test moving to Greendale Gates
    result = game.handle_command("go north")
    assert "Greendale Gates" in result or game.state.current_room == "GreendaleGates"


def test_mountain_path_forest_exit_initially_locked():
    """Test that the forest exit from Mountain Path is initially locked"""
    act = Act2()
    mountain_path = act.rooms["MountainPath"]
    
    # Forest exit should be locked initially
    exits = mountain_path.get_exits()
    assert "east" not in exits  # Forest transition should not be available initially


# TODO: Add comprehensive integration tests when quests are implemented
# def test_golden_path_act2_completion():
#     """Test the golden path through Act2 completion"""
#     # This will be implemented when all quests and items are created
#     pass


def _execute_commands(game, commands):
    """Helper function to execute a list of commands"""
    results = []
    for command in commands:
        result = game.handle_command(command)
        results.append(result)
    return results


def _check_current_room(game_state, expected_room):
    """Helper function to check current room"""
    assert game_state.current_room.name == expected_room, f"Expected to be in {expected_room}, but in {game_state.current_room.name}"


def _check_item_in_inventory(game_state, item_name, should_be_present=True):
    """Helper function to check if item is in inventory"""
    has_item = any(item.get_name().lower() == item_name.lower() for item in game_state.inventory)
    if should_be_present:
        assert has_item, f"Item '{item_name}' should be in inventory"
    else:
        assert not has_item, f"Item '{item_name}' should not be in inventory"


def _check_story_flag(game_state, flag_name, expected_value=True):
    """Helper function to check story flags"""
    flag_value = game_state.get_flag(flag_name)
    assert flag_value == expected_value, f"Story flag '{flag_name}' should be {expected_value}, got {flag_value}"


# Placeholder test for future quest integration
def test_act2_quest_structure():
    """Test that Act2 quest structure is properly set up"""
    act = Act2()
    
    # Currently no quests implemented, but structure should be there
    assert hasattr(act, 'quests')
    assert isinstance(act.quests, list)
    # When quests are implemented, we'll test their presence here


def test_act2_starting_conditions():
    """Test Act2 starting conditions and setup"""
    act = Act2()
    game = Game(act)
    
    # Should start in Mountain Path
    assert game.state.current_room.name == "Mountain Path"
    
    # Player should have basic starting conditions
    # (This will be expanded when we know what items/flags should carry over from Act1)
    assert game.state is not None
    assert hasattr(game.state, 'inventory')
    assert hasattr(game.state, 'story_flags')


def test_act2_room_transitions():
    """Test that room transitions work correctly"""
    act = Act2()
    game = Game(act)
    
    # Test a few basic transitions
    test_moves = [
        ("go north", "Greendale Gates"),
        ("go north", "Main Square"),
        ("go east", "Market District"),
        ("go south", "Merchant's Warehouse"),
        ("go north", "Market District"),
        ("go west", "Main Square"),
    ]
    
    for command, expected_room in test_moves:
        game.handle_command(command)
        _check_current_room(game.state, expected_room)
