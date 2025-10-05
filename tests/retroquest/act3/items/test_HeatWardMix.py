"""Unit tests for HeatWardMix item in Act 3."""
from retroquest.act3.items.HeatWardMix import HeatWardMix

class DummyGameState:
    def __init__(self):
        self.current_room = None

class DummyItem:
    def get_name(self):
        return "dummy item"

class DummyRoom:
    def __init__(self, name="Fumarole Passages"):
        self.name = name
        self.called_with = None
    def get_name(self):
        return self.name
    def apply_heat_ward(self, game_state, mix):
        self.called_with = (game_state, mix)
        return "[event]You apply the heat-ward mix to the vents.[/event]"

def test_heatwardmix_init():
    mix = HeatWardMix()
    assert mix.get_name() == "heat-ward mix"
    assert "ash-fern" in mix.description or "slag" in mix.description
    assert mix.can_be_carried_flag is True

def test_heatwardmix_use_with_non_room():
    mix = HeatWardMix()
    gs = DummyGameState()
    item = DummyItem()
    result = mix.use_with(gs, item)
    assert "can't use" in result or "cannot use" in result or "not compatible" in result.lower()
    assert "heat-ward mix" in result
    assert "dummy item" in result

def test_heatwardmix_use_with_room_delegates():
    mix = HeatWardMix()
    gs = DummyGameState()
    room = DummyRoom()
    result = mix.use_with(gs, room)
    assert room.called_with == (gs, mix)
    assert "apply the heat-ward mix" in result or "vents" in result

def test_heatwardmix_use_wrong_room():
    mix = HeatWardMix()
    gs = DummyGameState()
    gs.current_room = DummyRoom(name="Not Fumarole Passages")
    result = mix.use(gs)
    assert "can't use" in result or "usefully here" in result

def test_heatwardmix_use_in_fumarole_passages_delegates():
    mix = HeatWardMix()
    gs = DummyGameState()
    room = DummyRoom(name="Fumarole Passages")
    gs.current_room = room
    result = mix.use(gs)
    assert room.called_with == (gs, mix)
    assert "apply the heat-ward mix" in result or "vents" in result
