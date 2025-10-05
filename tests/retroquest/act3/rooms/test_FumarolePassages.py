"""Unit tests for FumarolePassages room in Act 3."""
from retroquest.act3.rooms.FumarolePassages import FumarolePassages
from retroquest.act3.items.VentStone import VentStone
from retroquest.act3.items.HeatWardMix import HeatWardMix
from retroquest.act3.characters.PhoenixGuardian import PhoenixGuardian
from retroquest.act3.Act3StoryFlags import (
    FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED,
    FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED,
)

class DummyGameState:
    def __init__(self):
        self.inventory = []
        self._flags = set()
    def set_story_flag(self, flag, value):
        if value:
            self._flags.add(flag)
        else:
            self._flags.discard(flag)
    def get_story_flag(self, flag):
        return flag in self._flags


def test_fumarolepassages_init():
    room = FumarolePassages()
    assert room.name == "Fumarole Passages"
    assert "tunnels" in room.description or "vent" in room.description
    assert any(isinstance(i, VentStone) for i in room.items)
    assert any(isinstance(c, PhoenixGuardian) for c in room.characters)
    assert "south" in room.exits and "west" in room.exits

def test_calibrate_with_stone_progression():
    room = FumarolePassages()
    gs = DummyGameState()
    stone1, stone2, stone3 = room.items[:3]
    gs.inventory = [stone1, stone2, stone3]
    # First calibration
    out1 = room.calibrate_with_stone(gs, stone1)
    assert FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED in gs._flags
    assert "timing seems closer" in out1 or "steadier" in out1
    # Second calibration
    out2 = room.calibrate_with_stone(gs, stone2)
    assert "timing seems closer" in out2 or "steadier" in out2
    # Third calibration
    out3 = room.calibrate_with_stone(gs, stone3)
    assert "vents' rhythms align" in out3 or "now accept a heat ward" in out3
    # No more stones in inventory
    assert stone1 not in gs.inventory and stone2 not in gs.inventory and stone3 not in gs.inventory

def test_apply_heat_ward_requires_calibration():
    room = FumarolePassages()
    gs = DummyGameState()
    mix = HeatWardMix()
    gs.inventory = [mix]
    # Not calibrated yet
    result = room.apply_heat_ward(gs, mix)
    assert "not yet synchronized" in result or "calibrate more" in result
    # Calibrate three times
    for stone in room.items[:3]:
        gs.inventory.append(stone)
        room.calibrate_with_stone(gs, stone)
    # Now apply heat ward
    result2 = room.apply_heat_ward(gs, mix)
    assert FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED in gs._flags
    assert "ward seals into place" in result2 or "passage through the fumaroles is now safe" in result2
    assert mix not in gs.inventory

def test_get_exits_blocks_south_until_completed():
    room = FumarolePassages()
    gs = DummyGameState()
    # By default, south is hidden
    exits = room.get_exits(gs)
    assert "south" not in exits
    # Set completion flag
    gs.set_story_flag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED, True)
    exits2 = room.get_exits(gs)
    assert "south" in exits2

def test_on_enter_sets_started_flag():
    room = FumarolePassages()
    gs = DummyGameState()
    room.on_enter(gs)
    assert FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED in gs._flags
