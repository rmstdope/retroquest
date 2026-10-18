"""Markup tests for the Water Nymphs character in Act II."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.characters.WaterNymphs import WaterNymphs
from retroquest.engine.Game import Game
from ..markup_helpers import assert_markup_well_formed


def test_answer_after_last_riddle_uses_known_tags():
    """Answering when no riddles remain uses only known, balanced tags."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    nymphs = WaterNymphs()
    nymphs.current_riddle = len(nymphs.riddles)

    answer = nymphs.say_to("water", game.state)

    assert "no more riddles to answer" in answer
    assert_markup_well_formed(answer)
