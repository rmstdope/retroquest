"""Smoke tests for Sir Cedric character."""

from retroquest.act3.characters.SirCedric import SirCedric
from retroquest.act3.Act3 import Act3
from retroquest.act3.Act3StoryFlags import (
    FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
    FLAG_ACT3_MAIN_STARTED,
    FLAG_ACT3_VOW_OF_COURAGE_MADE,
)
from retroquest.engine.Game import Game
from ..markup_helpers import assert_dialogue_speaker, assert_markup_well_formed


def test_sir_cedric_name_and_speak():
    """Sir Cedric reports the expected name in lowercase."""
    act3 = Act3()
    act3.music_file = ''
    _game = Game([act3])
    s = SirCedric()
    assert s.get_name().lower() == 'sir cedric'


def test_sir_cedric_directs_to_mira_before_quest():
    """Before the main quest, Sir Cedric points the player to Mira."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])
    s = SirCedric()
    out = s.talk_to(game.state)
    assert 'Mira' in out


def test_sir_cedric_tidal_causeway_responses():
    """Sir Cedric replies differently at Tidal Causeway based on flags."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])
    s = SirCedric()
    # start the main quest
    from retroquest.act3.Act3StoryFlags import FLAG_ACT3_MAIN_STARTED
    game.state.set_story_flag(FLAG_ACT3_MAIN_STARTED, True)
    # place player at Tidal Causeway
    game.state.current_room = game.state.all_rooms['TidalCauseway']
    from retroquest.act3.Act3StoryFlags import FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED
    from retroquest.act3.Act3StoryFlags import FLAG_ACT3_VOW_OF_COURAGE_MADE

    # no crystal: tide advice
    game.state.set_story_flag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, False)
    out = s.talk_to(game.state)
    assert 'tide' in out.lower()

    # crystal acquired but no vow: ask to make vow
    game.state.set_story_flag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, True)
    game.state.set_story_flag(FLAG_ACT3_VOW_OF_COURAGE_MADE, False)
    out = s.talk_to(game.state)
    assert 'vow' in out.lower()

    # vow made: acknowledge and encourage
    game.state.set_story_flag(FLAG_ACT3_VOW_OF_COURAGE_MADE, True)
    out = s.talk_to(game.state)
    assert 'vow' in out.lower() or 'let us press onward' in out.lower()


def test_sir_cedric_replies_are_attributed_dialogue():
    """Every Sir Cedric reply, in each quest state, is tagged, attributed dialogue."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])
    cedric = SirCedric()
    before_quest = cedric.talk_to(game.state)
    game.state.set_story_flag(FLAG_ACT3_MAIN_STARTED, True)
    default = cedric.talk_to(game.state)
    game.state.current_room = game.state.all_rooms['TidalCauseway']
    no_crystal = cedric.talk_to(game.state)
    game.state.set_story_flag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, True)
    no_vow = cedric.talk_to(game.state)
    game.state.set_story_flag(FLAG_ACT3_VOW_OF_COURAGE_MADE, True)

    vow_spoken = cedric.talk_to(game.state)

    assert "speak with" in before_quest
    assert "The path is set" in default
    assert "The tide tests the brave" in no_crystal
    assert "The Crystal is ours" in no_vow
    assert "Your vow has been spoken" in vow_spoken
    for answer in (before_quest, default, no_crystal, no_vow, vow_spoken):
        assert_markup_well_formed(answer)
        assert_dialogue_speaker(answer, "Sir Cedric")
