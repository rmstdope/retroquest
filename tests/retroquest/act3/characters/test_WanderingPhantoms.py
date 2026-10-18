"""Markup tests for the Wandering Phantoms characters in Act 3."""

import random

from retroquest.act3.Act3 import Act3
from retroquest.act3.characters.WanderingPhantoms import WanderingPhantoms
from retroquest.engine.Game import Game
from ..markup_helpers import assert_markup_well_formed, assert_no_speakerless_dialogue


def test_phantom_whispers_have_no_speakerless_dialogue():
    """Every whisper variant is narration without unattributed dialogue."""
    act = Act3()
    act.music_file = ''
    game = Game([act])
    phantoms = WanderingPhantoms()

    answers = set()
    for seed in range(40):
        random.seed(seed)
        answers.add(phantoms.talk_to(game.state))

    assert len(answers) == 4
    for answer in answers:
        assert_markup_well_formed(answer)
        assert_no_speakerless_dialogue(answer)
