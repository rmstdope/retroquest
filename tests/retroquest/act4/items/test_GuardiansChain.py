"""Markup tests for the Guardian's Chain item in Act IV."""

from retroquest.act4.Act4 import Act4
from retroquest.act4.items.GuardiansChain import GuardiansChain
from retroquest.engine.Game import Game
from ..markup_helpers import assert_markup_well_formed


def test_chain_use_messages_use_known_tags():
    """Using the chain elsewhere and again in the hall uses only known tags."""
    act = Act4()
    act.music_file = ''
    game = Game([act])
    chain = GuardiansChain()
    elsewhere = chain.use(game.state)
    game.state.current_room = game.state.all_rooms["HallOfEchoes"]
    chain.use(game.state)

    again = chain.use(game.state)

    assert "glows softly" in elsewhere
    assert "already providing its protection" in again
    for answer in (elsewhere, again):
        assert_markup_well_formed(answer)
