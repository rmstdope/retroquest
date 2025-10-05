"""Unit tests for AshFern item in Act 3."""
from retroquest.act3.items.AshFern import AshFern

class DummyGameState:
    def __init__(self):
        self.inventory = []

class DummyItem:
    def __init__(self, name):
        self._name = name
    def get_name(self):
        return self._name

def test_ashfern_init():
    ash = AshFern()
    assert ash.get_name() == "ash-fern"
    assert "brittle frond" in ash.description
    assert ash.can_be_carried_flag is True

def test_ashfern_use_with_non_slag():
    ash = AshFern()
    gs = DummyGameState()
    other = DummyItem("not slag")
    result = ash.use_with(gs, other)
    assert "can't use" in result
    assert "ash-fern" in result
    assert "not slag" in result

def test_ashfern_use_with_slag_adds_mix():
    ash = AshFern()
    gs = DummyGameState()
    slag = DummyItem("cooled slag")
    gs.inventory = [ash, slag]
    result = ash.use_with(gs, slag)
    # Should remove both from inventory and add HeatWardMix
    assert ash not in gs.inventory
    assert slag not in gs.inventory
    # Check for HeatWardMix by name
    found = any(getattr(i, 'get_name', lambda: None)() == 'heat-ward mix' for i in gs.inventory)
    assert found
    assert "heat-ward mix" in result or "heat-ward" in result
    assert "combine the ash-fern with cooled slag" in result
