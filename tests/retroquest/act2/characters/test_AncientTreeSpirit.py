"""Markup tests for the Ancient Tree Spirit's dialogue."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.characters.AncientTreeSpirit import AncientTreeSpirit
from retroquest.act2.items.CrystalClearWater import CrystalClearWater
from retroquest.act2.items.Moonflowers import Moonflowers
from retroquest.engine.Game import Game
from ..markup_helpers import assert_dialogue_speaker, assert_markup_well_formed


def _create_game() -> Game:
    """Create a game running Act II without music."""
    act = Act2()
    act.music_file = ''
    return Game([act])


def test_giving_glade_gifts_names_the_spirit_before_its_dialogue():
    """Giving both Whispering Glade gifts attributes every dialogue to the spirit."""
    game = _create_game()
    spirit = AncientTreeSpirit()
    moonflowers = Moonflowers()
    game.state.add_item_to_inventory(CrystalClearWater())
    game.state.add_item_to_inventory(moonflowers)

    answer = spirit.give_item(game.state, moonflowers)

    assert "Heart of the Forest" in answer
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, spirit.get_name())
