"""Markup tests for the Mine Overseer character in Act 3."""

from retroquest.act3.Act3 import Act3
from retroquest.act3.characters.MineOverseer import MineOverseer
from retroquest.engine.Game import Game
from ..markup_helpers import assert_dialogue_speaker, assert_markup_well_formed


def test_overseer_dialogue_is_attributed_on_both_visits():
    """The plea for help and the later reminder are tagged, attributed dialogue."""
    act = Act3()
    act.music_file = ''
    game = Game([act])
    overseer = MineOverseer()

    first = overseer.talk_to(game.state)
    second = overseer.talk_to(game.state)

    assert game.state.has_item("Miner's Key")
    assert "Tool Cache" in second
    for answer in (first, second):
        assert_markup_well_formed(answer)
        assert_dialogue_speaker(answer, overseer.get_name())
    assert "Half a dozen men are trapped" in first.split("[dialogue]")[1]
    assert "Tool Cache is north" in second.split("[dialogue]")[1]
