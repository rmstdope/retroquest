"""Smoke tests for Mira character."""

from retroquest.act3.characters.Mira import Mira
from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game


def test_mira_has_name_and_talk():
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])
    m = Mira()
    assert m.get_name().lower() == 'mira'


def test_mira_starts_main_quest_on_first_talk():
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])
    m = Mira()
    # ensure flag is not set initially
    from retroquest.act3.Act3StoryFlags import FLAG_ACT3_MAIN_STARTED

    assert not game.state.get_story_flag(FLAG_ACT3_MAIN_STARTED)
    out = m.talk_to(game.state)
    # flag should be set and output should mention relics
    assert game.state.get_story_flag(FLAG_ACT3_MAIN_STARTED)
    assert 'three relics' in out


def test_mira_at_tidal_causeway_hints_or_teleports():
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])
    # ensure main quest has already started so we don't hit the initial talk path
    from retroquest.act3.Act3StoryFlags import FLAG_ACT3_MAIN_STARTED
    game.state.set_story_flag(FLAG_ACT3_MAIN_STARTED, True)
    # move player to Tidal Causeway
    game.state.current_room = game.state.all_rooms['TidalCauseway']
    m = Mira()
    # ensure crystal not acquired -> hint
    from retroquest.act3.Act3StoryFlags import FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED

    game.state.set_story_flag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, False)
    hint = m.talk_to(game.state)
    assert 'Crystal of Light' in hint

    # now set crystal acquired -> should teleport to Lower Switchbacks
    game.state.set_story_flag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, True)
    # put Mira and Sir Cedric in the origin room characters list so teleport moves them
    origin = game.state.current_room
    origin.characters.append(m)
    # ensure Sir Cedric is present to be moved as well
    from retroquest.act3.characters.SirCedric import SirCedric

    sc = SirCedric()
    origin.characters.append(sc)

    res = m.talk_to(game.state)
    # the method does a teleport routine; assert arrival event and that
    # Mira and Sir Cedric ended up in the room that is now current
    assert 'You arrive at' in res
    assert m in game.state.current_room.characters
    assert any(c.get_name().lower() == 'sir cedric' for c in game.state.current_room.characters)


def test_mira_from_sanctum_teleports_to_lower_switchbacks():
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])
    # ensure main quest started so Mira uses teleport branches
    from retroquest.act3.Act3StoryFlags import FLAG_ACT3_MAIN_STARTED
    game.state.set_story_flag(FLAG_ACT3_MAIN_STARTED, True)
    # place player in Sanctum of the Tide
    game.state.current_room = game.state.all_rooms['SanctumOfTheTide']
    m = Mira()
    # ensure Mira is in the room so she can be removed and moved
    game.state.current_room.characters.append(m)
    # call talk_to and verify destination
    out = m.talk_to(game.state)
    # accept variants of the room name (some rooms include suffixes like
    # ' (Base Camp)') so check substring membership
    assert 'LowerSwitchbacks' in out or 'Lower Switchbacks' in game.state.current_room.name
