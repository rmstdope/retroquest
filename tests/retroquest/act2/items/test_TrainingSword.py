"""Markup tests for demonstrating the Training Sword to Sir Cedric in Act II."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.items.TrainingSword import TrainingSword
from retroquest.engine.Game import Game
from ..markup_helpers import (
    assert_dialogue_speaker,
    assert_markup_well_formed,
    assert_no_speech_outside_dialogue,
)


def test_demonstrations_are_attributed_to_sir_cedric():
    """Sir Cedric's replies to both demonstrations are tagged, attributed dialogue."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    game.state.current_room = game.state.all_rooms["CastleCourtyard"]
    sword = TrainingSword()

    first = sword.use(game.state)
    second = sword.use(game.state)

    assert "Excellent! Your martial training is evident" in first
    assert "Your skills remain sharp" in second
    for answer in (first, second):
        assert_markup_well_formed(answer)
        assert_dialogue_speaker(answer, "Sir Cedric")
        assert_no_speech_outside_dialogue(answer)
