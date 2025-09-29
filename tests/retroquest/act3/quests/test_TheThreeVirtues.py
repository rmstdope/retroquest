"""Basic tests for The Three Virtues quest activation."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game
from retroquest.act3.quests.TheThreeVirtues import TheThreeVirtuesQuest
from retroquest.act3.Act3StoryFlags import FLAG_ACT3_MAIN_STARTED, FLAG_ACT3_MAIN_COMPLETED


def test_the_three_virtues_trigger_and_completion_flags():
    """Quest triggers when main started flag set and completes when main completed."""
    act3 = Act3()
    act3.music_file = ''
    _game = Game([act3])

    quest = TheThreeVirtuesQuest()

    # Not started by default
    _game.state.set_story_flag(FLAG_ACT3_MAIN_STARTED, False)
    assert quest.check_trigger(_game.state) is False

    # When main started flag set -> triggers
    _game.state.set_story_flag(FLAG_ACT3_MAIN_STARTED, True)
    assert quest.check_trigger(_game.state) is True

    # Completion follows main completed flag
    _game.state.set_story_flag(FLAG_ACT3_MAIN_COMPLETED, False)
    assert quest.check_completion(_game.state) is False

    _game.state.set_story_flag(FLAG_ACT3_MAIN_COMPLETED, True)
    assert quest.check_completion(_game.state) is True
