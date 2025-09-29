"""Basic tests for the Lanterns of the Deeps quest lifecycle."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game
from retroquest.act3.Act3StoryFlags import FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT
from ...utils.utils import check_quests, check_story_flag


def test_lanterns_of_the_deeps_flag_set_on_light():
    """Manually setting lanterns flag should reflect in game state and not error."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    # Start act and ensure quest list may or may not include this quest depending
    # on external triggers; just ensure flag interactions work.
    check_quests(game.state, [])

    # Set the lanterns flag and assert
    game.state.set_story_flag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, True)
    check_story_flag(game.state, FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, True)
