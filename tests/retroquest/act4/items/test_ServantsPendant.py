"""Markup tests for the Servant's Pendant item in Act IV."""

from retroquest.act4.Act4 import Act4
from retroquest.act4.items.ServantsPendant import ServantsPendant
from retroquest.engine.Game import Game
from ..markup_helpers import assert_markup_well_formed


def test_pendant_use_messages_use_known_tags():
    """Using the pendant elsewhere and again in the labyrinth uses only known tags."""
    act = Act4()
    act.music_file = ''
    game = Game([act])
    pendant = ServantsPendant()
    elsewhere = pendant.use(game.state)
    game.state.current_room = game.state.all_rooms["MirrorLabyrinth"]
    pendant.use(game.state)

    again = pendant.use(game.state)

    assert "glows softly" in elsewhere
    assert "already shared their guidance" in again
    for answer in (elsewhere, again):
        assert_markup_well_formed(answer)
