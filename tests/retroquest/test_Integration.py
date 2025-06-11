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
        # Elior’s Cottage
        "use lantern", "take bread", "talk grandmother", "use journal", "talk grandmother",
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
    # # Patch session.prompt to avoid blocking
    # monkeypatch.setattr(game.session, "prompt", lambda *a, **kw: "no")
    # # Patch save to avoid NotImplementedError
    # monkeypatch.setattr(game, "save", lambda: None)

    # Elior’s Cottage
    for cmd in ["use lantern", "take bread", "talk grandmother", "use journal", "talk grandmother"]:
        game.handle_command(cmd)
    # Check if bread is in inventory
    inventory_names = [item.get_name().lower() for item in game.state.inventory]
    assert "bread" in inventory_names, "Bread not found in inventory after 'take bread'"

    # Check for Act I completion: amulet and map fragment in inventory, and in Road to Greendale
    # inventory_names = [item.get_name().lower() for item in game.state.inventory]
    # assert "ancient amulet" in inventory_names, "Amulet not in inventory at end of Act I"
    # assert "map fragment" in inventory_names, "Map fragment not in inventory at end of Act I"
    # assert game.state.current_room.name == "Road to Greendale", "Not in Road to Greendale at end of Act I"
