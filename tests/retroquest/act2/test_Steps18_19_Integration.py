"""Integration tests for specific Act 2 steps 18-19."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.characters.AncientTreeSpirit import AncientTreeSpirit
from retroquest.act2.items.EnchantedAcorn import EnchantedAcorn
from retroquest.act2.items.SilverLeaves import SilverLeaves
from retroquest.engine.Game import Game


def _setup_game_in_ancient_grove() -> Game:
    """Create an Act2 game with the player standing in the Ancient Grove."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    game.state.current_room = game.state.all_rooms["AncientGrove"]
    return game


def test_silver_leaves_appear_in_room_after_giving_enchanted_acorn():
    """Giving the enchanted acorn to the Ancient Tree Spirit must spawn silver leaves.

    The cheat sequence includes 'take silver leaves' immediately after giving
    the acorn, so the spirit must place them in the room as part of that exchange.
    """
    game = _setup_game_in_ancient_grove()
    spirit = AncientTreeSpirit()
    game.state.current_room.characters.append(spirit)
    acorn = EnchantedAcorn()
    game.state.add_item_to_inventory(acorn)

    spirit.give_item(game.state, acorn)

    room_item_names = [i.get_name().lower() for i in game.state.current_room.items]
    assert "silver leaves" in room_item_names, (
        "Silver leaves should appear in the Ancient Grove after giving the enchanted acorn."
    )
