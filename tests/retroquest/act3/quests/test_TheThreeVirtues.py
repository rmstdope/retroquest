"""Basic tests for The Three Virtues quest activation."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game
from ...utils.utils import check_quests, execute_commands


def test_the_three_virtues_activates_on_talk_to_mira():
    """Starting the act by talking to Mira activates The Three Virtues quest."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    # Before talking, no quests should be active
    check_quests(game.state, [])

    # Talk to Mira to start the main quest
    execute_commands(game, ['talk to mira'])
    check_quests(game.state, ['The Three Virtues'])
