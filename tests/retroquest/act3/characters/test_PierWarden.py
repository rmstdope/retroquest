"""Tests for the PierWarden character dialogue branches."""

from retroquest.act3.characters.PierWarden import PierWarden
from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game


def test_pierwarden_dialog_before_sigils():
    """Before Tideward Sigils are completed, the warden hints at shore markers."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    w = PierWarden()
    out = w.talk_to(game.state)
    assert 'high stones' in out.lower() or 'moon' in out.lower()


def test_pierwarden_dialog_after_sigils_before_lanterns():
    """After sigils but before lanterns, the warden mentions the fused locker."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    from retroquest.act3.Act3StoryFlags import FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED

    game.state.set_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, True)
    w = PierWarden()
    out = w.talk_to(game.state)
    assert 'fused' in out.lower() or 'locker' in out.lower()
    assert 'stuck' in out.lower() or 'magic' in out.lower()


def test_pierwarden_dialog_after_all_tasks():
    """When both sigils and lanterns are done, the warden praises the lit way."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    from retroquest.act3.Act3StoryFlags import (
        FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
        FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
    )

    game.state.set_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, True)
    game.state.set_story_flag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, True)
    w = PierWarden()
    out = w.talk_to(game.state)
    assert 'steadier' in out.lower() or 'lanterns' in out.lower()


def test_pierwarden_dialogue_is_attributed_in_every_state():
    """Each of the warden's lines names the warden before the dialogue."""
    from retroquest.act3.Act3StoryFlags import (
        FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
        FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
    )
    from ..markup_helpers import assert_dialogue_speaker, assert_markup_well_formed

    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])
    warden = PierWarden()
    answers = [warden.talk_to(game.state)]
    game.state.set_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, True)
    answers.append(warden.talk_to(game.state))
    game.state.set_story_flag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, True)
    answers.append(warden.talk_to(game.state))

    for answer in answers:
        assert_markup_well_formed(answer)
        assert_dialogue_speaker(answer, warden.get_name())
