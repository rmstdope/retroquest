"""Markup tests for the Silence Keeper character in Act 3."""

from retroquest.act3.Act3 import Act3
from retroquest.act3.characters.SilenceKeeper import SilenceKeeper
from retroquest.engine.Game import Game
from ..markup_helpers import assert_dialogue_speaker, assert_markup_well_formed


def test_silence_keeper_guidance_is_attributed_dialogue():
    """The keeper's guidance names the keeper before the first dialogue."""
    act = Act3()
    act.music_file = ''
    game = Game([act])
    keeper = SilenceKeeper()

    answer = keeper.talk_to(game.state)

    assert "echo stones await sanctification" in answer
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, keeper.get_name())
