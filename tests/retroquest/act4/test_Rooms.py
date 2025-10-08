"""Tests for Act 4 room definitions and connectivity."""

from retroquest.act4.rooms.FortressGates import FortressGates
from retroquest.act4.rooms.OuterCourtyard import OuterCourtyard
from retroquest.act4.rooms.MirrorLabyrinth import MirrorLabyrinth
from retroquest.act4.rooms.HallOfEchoes import HallOfEchoes
from retroquest.act4.rooms.TowerOfShadows import TowerOfShadows
from retroquest.act4.rooms.ChamberOfWhispers import ChamberOfWhispers
from retroquest.act4.rooms.MemoryVault import MemoryVault
from retroquest.act4.rooms.ThroneChamberApproach import ThroneChamberApproach
from retroquest.act4.rooms.ThroneChamer import ThroneChamer
from retroquest.act4.rooms.RoyalGardens import RoyalGardens


class TestRooms:
    """Test suite for Act 4 room connectivity."""

    # Map of direction to its opposite
    OPPOSITE = {
        "north": "south",
        "south": "north",
        "east": "west",
        "west": "east",
        "up": "down",
        "down": "up",
    }

    # All room classes in Act 4
    ROOM_CLASSES = {
        "FortressGates": FortressGates,
        "OuterCourtyard": OuterCourtyard,
        "MirrorLabyrinth": MirrorLabyrinth,
        "HallOfEchoes": HallOfEchoes,
        "TowerOfShadows": TowerOfShadows,
        "ChamberOfWhispers": ChamberOfWhispers,
        "MemoryVault": MemoryVault,
        "ThroneChamberApproach": ThroneChamberApproach,
        "ThroneChamer": ThroneChamer,
        "RoyalGardens": RoyalGardens,
    }

    def test_all_exits_are_bidirectional(self):
        """Test that all room exits are bidirectional."""
        # Create instances of all rooms
        rooms = {}
        for class_name, room_class in self.ROOM_CLASSES.items():
            rooms[class_name] = room_class()

        # Check each room's exits
        for room_name, room in rooms.items():
            for direction, destination_name in room.exits.items():
                # Check if destination room exists
                assert destination_name in rooms, (
                    f"Room {room_name} has exit {direction} to {destination_name}, "
                    f"but {destination_name} room class doesn't exist"
                )

                destination_room = rooms[destination_name]
                opposite_direction = self.OPPOSITE[direction]

                # Check if the destination has a return path
                assert opposite_direction in destination_room.exits, (
                    f"Room {room_name} has exit {direction} to {destination_name}, "
                    f"but {destination_name} has no {opposite_direction} exit back"
                )

                # Check if the return path leads back to the original room
                return_destination = destination_room.exits[opposite_direction]
                assert return_destination == room_name, (
                    f"Room {room_name} has exit {direction} to {destination_name}, "
                    f"but {destination_name} has {opposite_direction} exit to "
                    f"{return_destination} instead of {room_name}"
                )