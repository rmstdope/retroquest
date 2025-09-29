"""Tests for WardingPillars item behavior."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game
from retroquest.act3.Act3StoryFlags import FLAG_ACT3_WARDING_PILLARS_PURIFIED
from ...utils.utils import check_story_flag


def test_purify_sets_flag():
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    room = game.state.all_rooms['OuterWards']
    # Find the pillars in the room object
    pillars = next((i for i in room.items if i.__class__.__name__ == 'WardingPillars'), None)
    assert pillars is not None

    # Purify and ensure the flag is set
    out = pillars.purify(game.state)
    assert 'clean' in out.lower() or 'rins' in out.lower() or 'breathe' in out.lower()
    check_story_flag(game.state, FLAG_ACT3_WARDING_PILLARS_PURIFIED, True)
