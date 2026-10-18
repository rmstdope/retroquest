"""Markup tests for the Guardian's Essence item in Act IV."""

from retroquest.act4.Act4 import Act4
from retroquest.act4.characters.TrappedServants import TrappedServants
from retroquest.act4.items.GuardiansEssence import GuardiansEssence
from retroquest.engine.Game import Game
from ..markup_helpers import assert_markup_well_formed


def test_essence_messages_use_known_tags():
    """Using the essence in each room and again on servants uses only known tags."""
    act = Act4()
    act.music_file = ''
    game = Game([act])
    essence = GuardiansEssence()
    elsewhere = essence.use(game.state)
    game.state.current_room = game.state.all_rooms["HallOfEchoes"]
    hall = essence.use(game.state)
    game.state.current_room = game.state.all_rooms["OuterCourtyard"]
    courtyard = essence.use(game.state)
    essence.use_on_character(game.state, TrappedServants())

    again = essence.use_on_character(game.state, TrappedServants())

    assert "pulses gently" in elsewhere
    assert "resonates with the ancient hall" in hall
    assert "Try using it on the servants" in courtyard
    assert "already recognize your worthiness" in again
    for answer in (elsewhere, hall, courtyard, again):
        assert_markup_well_formed(answer)
