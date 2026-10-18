"""Markup tests for the Loyalty Token item in Act IV."""

from retroquest.act4.Act4 import Act4
from retroquest.act4.items.LoyaltyToken import LoyaltyToken
from retroquest.engine.Game import Game
from ..markup_helpers import assert_markup_well_formed


def test_token_use_messages_use_known_tags():
    """Using the token elsewhere and again in the tower uses only known tags."""
    act = Act4()
    act.music_file = ''
    game = Game([act])
    token = LoyaltyToken()
    elsewhere = token.use(game.state)
    game.state.current_room = game.state.all_rooms["TowerOfShadows"]
    token.use(game.state)

    again = token.use(game.state)

    assert "glows softly" in elsewhere
    assert "already protecting you" in again
    for answer in (elsewhere, again):
        assert_markup_well_formed(answer)
