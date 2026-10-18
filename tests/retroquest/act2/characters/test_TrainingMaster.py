"""Markup tests for the Training Master in Act II."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.characters.TrainingMaster import TrainingMaster
from retroquest.engine.Game import Game
from ..markup_helpers import (
    assert_dialogue_speaker,
    assert_markup_well_formed,
    assert_no_speaker_label_in_dialogue,
)


def test_both_conversations_are_attributed_dialogue():
    """The quest hook and the follow-up are attributed dialogue without inner labels."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    master = TrainingMaster()

    first = master.talk_to(game.state)
    second = master.talk_to(game.state)

    assert "evidence that would clear his name" in first
    assert "Perhaps the squires might know more" in second
    for answer in (first, second):
        assert_markup_well_formed(answer)
        assert_dialogue_speaker(answer, "Training Master")
        assert_no_speaker_label_in_dialogue(answer)
