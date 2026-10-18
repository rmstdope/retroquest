"""Markup tests for the Gate Captain character in Act II."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.characters.GateCaptain import GateCaptain
from retroquest.act2.items.EntryPass import EntryPass
from retroquest.engine.Game import Game
from ..markup_helpers import assert_markup_well_formed


def test_showing_entry_pass_again_uses_known_tags():
    """Showing the entry pass a second time uses only known, balanced tags."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    captain = GateCaptain()
    captain.give_item(game.state, EntryPass())

    answer = captain.give_item(game.state, EntryPass())

    assert "already shown the entry pass" in answer
    assert_markup_well_formed(answer)
