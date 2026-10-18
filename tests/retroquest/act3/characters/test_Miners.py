"""Markup tests for the Miners characters in Act 3."""

from retroquest.act3.Act3 import Act3
from retroquest.act3.characters.Miners import Miners
from retroquest.engine.Game import Game
from ..markup_helpers import assert_dialogue_speaker, assert_markup_well_formed


def test_miners_dialogue_is_attributed_on_rescue_and_after():
    """The rescue thanks and the later update name the miners before speaking."""
    act = Act3()
    act.music_file = ''
    game = Game([act])
    miners = Miners()

    answers = [miners.talk_to(game.state), miners.talk_to(game.state)]

    for answer in answers:
        assert_markup_well_formed(answer)
        assert_dialogue_speaker(answer, miners.get_name())
