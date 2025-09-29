"""Basic tests for the Tideward Sigils quest trigger and completion."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game
from retroquest.act3.Act3StoryFlags import FLAG_ACT3_TIDEWARD_SIGILS_STARTED, \
    FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED
from ...utils.utils import check_quests, check_story_flag


def test_tideward_sigils_start_and_complete():
    """Quest starts when the started flag is set and completes when the completed flag is set."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    # Initially no side quests
    check_quests(game.state, [])

    # Simulate reaching the shoreline by setting started flag and trigger
    # quest activation check.
    game.state.set_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_STARTED, True)
    game.state.next_activated_quest()
    # Quest should now be active
    check_quests(game.state, ['Tideward Sigils'])

    # Complete the sigils
    game.state.set_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, True)
    check_story_flag(game.state, FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, True)
