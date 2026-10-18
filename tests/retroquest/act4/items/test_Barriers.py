"""Markup tests for the Barriers item in Act IV."""

from retroquest.act4.Act4 import Act4
from retroquest.act4.Act4StoryFlags import FLAG_ACT4_BARRIERS_DISABLED
from retroquest.act4.items.Barriers import Barriers
from retroquest.engine.Game import Game
from ..markup_helpers import assert_markup_well_formed


def test_disabled_barriers_use_known_tags():
    """Examining disabled barriers uses only known, balanced tags."""
    act = Act4()
    act.music_file = ''
    game = Game([act])
    game.state.set_story_flag(FLAG_ACT4_BARRIERS_DISABLED, True)

    answer = Barriers().examine(game.state)

    assert "barriers have been disabled" in answer
    assert_markup_well_formed(answer)
