"""Markup tests for the Local Craftsmen in Act II."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.Act2StoryFlags import FLAG_HELPED_ELDERLY_RESIDENTS
from retroquest.act2.characters.LocalCraftsmen import LocalCraftsmen
from retroquest.engine.Game import Game
from ..markup_helpers import assert_dialogue_speaker, assert_markup_well_formed


def test_greeting_after_learning_mend_is_attributed_dialogue():
    """The craftsmen's later greeting is tagged dialogue attributed to them."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    craftsmen = LocalCraftsmen()
    game.state.set_story_flag(FLAG_HELPED_ELDERLY_RESIDENTS, True)
    craftsmen.talk_to(game.state)

    answer = craftsmen.talk_to(game.state)

    assert "Good to see you again!" in answer
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, "local craftsmen")
