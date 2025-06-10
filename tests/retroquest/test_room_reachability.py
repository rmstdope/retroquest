import pytest
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

ROOM_CLASSES = {
    "EliorsCottage": EliorsCottage,
    "VegetableField": VegetableField,
    "ChickenCoop": ChickenCoop,
    "VillageSquare": VillageSquare,
    "MirasHut": MirasHut,
    "BlacksmithsForge": BlacksmithsForge,
    "GeneralStore": GeneralStore,
    "VillageWell": VillageWell,
    "AbandonedShed": AbandonedShed,
    "OldMill": OldMill,
    "Riverbank": Riverbank,
    "ForestPath": ForestPath,
    "HiddenGlade": HiddenGlade,
    "VillageChapel": VillageChapel,
    "RoadToGreendale": RoadToGreendale,
}

@pytest.mark.parametrize("start_key", ROOM_CLASSES.keys())
def test_room_reachability(start_key):
    # Instantiate all rooms
    rooms = {k: v() for k, v in ROOM_CLASSES.items()}
    visited = set()
    queue = [start_key]
    while queue:
        current = queue.pop(0)
        if current in visited:
            continue
        visited.add(current)
        for dest in rooms[current].get_exits().values():
            if dest not in visited and dest in rooms:
                queue.append(dest)
    # All rooms should be reachable from the start room
    assert set(rooms.keys()) <= visited, f"From {start_key}, could not reach: {set(rooms.keys()) - visited}"
