import pytest
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

# Map of direction to its opposite
OPPOSITE = {
    "north": "south",
    "south": "north",
    "east": "west",
    "west": "east"
}

@pytest.mark.parametrize("start_key", ROOM_CLASSES.keys())
def test_room_reachability(start_key):
    # Instantiate all rooms
    rooms = {k: v() for k, v in ROOM_CLASSES.items()}
    rooms['EliorsCottage'].can_leave()
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

@pytest.mark.parametrize("room_class, room_key", [
    (EliorsCottage, "EliorsCottage"),
    (VegetableField, "VegetableField"),
    (ChickenCoop, "ChickenCoop"),
    (VillageSquare, "VillageSquare"),
    (MirasHut, "MirasHut"),
    (BlacksmithsForge, "BlacksmithsForge"),
    (GeneralStore, "GeneralStore"),
    (VillageWell, "VillageWell"),
    (AbandonedShed, "AbandonedShed"),
    (OldMill, "OldMill"),
    (Riverbank, "Riverbank"),
    (ForestPath, "ForestPath"),
    (HiddenGlade, "HiddenGlade"),
    (VillageChapel, "VillageChapel"),
    (RoadToGreendale, "RoadToGreendale"),
])
def test_room_transitions_bidirectional(room_class, room_key):
    # Instantiate all rooms
    rooms = {
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
    rooms['EliorsCottage'].can_leave()  # Ensure Elior's Cottage can be left
    room = rooms[room_key]
    for direction, dest_key in room.get_exits().items():
        # Only test cardinal directions
        if direction not in OPPOSITE:
            continue
        dest_room = rooms[dest_key]
        opposite = OPPOSITE[direction]
        # The destination room must have an exit back to the original room
        assert (
            dest_room.get_exits().get(opposite) == room_key
        ), f"{room_key} -> {direction} -> {dest_key} but {dest_key} does not have {opposite} back to {room_key}"
