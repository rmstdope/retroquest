"""Unit tests for VentStone item in Act 3."""
from retroquest.act3.items.VentStone import VentStone

class DummyGameState:
    def __init__(self):
        self.current_room = None

class DummyRoom:
    def __init__(self, name="Fumarole Passages"):
        self.name = name
        self.called_with = None
    def calibrate_with_stone(self, game_state, stone):
        self.called_with = (game_state, stone)
        return "[event]You calibrate the vent with the stone.[/event]"

def test_ventstone_init():
    stone = VentStone()
    assert stone.get_name() == "vent stone"
    assert "stone" in stone.description.lower() or "vent" in stone.description.lower()
    assert stone.can_be_carried_flag is True

def test_ventstone_use_wrong_room():
    stone = VentStone()
    gs = DummyGameState()
    gs.current_room = DummyRoom(name="Not Fumarole Passages")
    result = stone.use(gs)
    assert "can't use" in result or "usefully here" in result

def test_ventstone_use_in_fumarole_passages_delegates():
    stone = VentStone()
    gs = DummyGameState()
    room = DummyRoom(name="Fumarole Passages")
    gs.current_room = room
    result = stone.use(gs)
    assert room.called_with == (gs, stone)
    assert "calibrate the vent" in result or "vent" in result
