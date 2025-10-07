"""Smoke tests for Mira character."""

from retroquest.act3.characters.Mira import Mira
from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game


def test_mira_has_name_and_talk():
    """Ensure Mira exposes a name and the basic talk interface."""
    act3 = Act3()
    act3.music_file = ''
    _game = Game([act3])
    m = Mira()
    assert m.get_name().lower() == 'mira'


def test_mira_starts_main_quest_on_first_talk():
    """Talking to Mira for the first time should set the main-quest flag
    and present the player with the three-relics exposition.
    """
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
    """At the Tidal Causeway Mira should hint about the Crystal when it
    is not acquired and teleport the party onward when it is acquired.
    """
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
    """From the Tidal Causeway, talking to Mira teleports the party toward
    the Lower Switchbacks; tests accept reasonable name variants.
    """
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])
    # ensure main quest started so Mira uses teleport branches
    from retroquest.act3.Act3StoryFlags import FLAG_ACT3_MAIN_STARTED
    game.state.set_story_flag(FLAG_ACT3_MAIN_STARTED, True)
    # place player at the Tidal Causeway and mark the crystal acquired
    game.state.current_room = game.state.all_rooms['TidalCauseway']
    from retroquest.act3.Act3StoryFlags import FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED
    game.state.set_story_flag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, True)
    m = Mira()
    # ensure Mira is in the room so she can be removed and moved
    game.state.current_room.characters.append(m)
    # call talk_to and verify destination
    out = m.talk_to(game.state)
    # accept variants of the room name (some rooms include suffixes like
    # ' (Base Camp)') so check substring membership
    assert 'LowerSwitchbacks' in out or 'Lower Switchbacks' in game.state.current_room.name


def test_mira_in_lower_switchbacks_only_lore():
    """When already at Lower Switchbacks, Mira should not teleport but
    should speak about the second virtue (Wisdom) and the phoenix legend.
    """
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])
    # ensure main quest started so we don't hit the initial talk path
    from retroquest.act3.Act3StoryFlags import FLAG_ACT3_MAIN_STARTED

    game.state.set_story_flag(FLAG_ACT3_MAIN_STARTED, True)
    # place player at the Lower Switchbacks (accept either key variant)
    if 'LowerSwitchbacks' in game.state.all_rooms:
        room_key = 'LowerSwitchbacks'
    else:
        room_key = 'Lower Switchbacks'
    game.state.current_room = game.state.all_rooms[room_key]
    m = Mira()
    # put Mira in the room characters list to ensure she remains
    game.state.current_room.characters.append(m)
    out = m.talk_to(game.state)
    # should mention Wisdom and phoenix, and should not perform a teleport
    assert 'wisdom' in out.lower()
    assert 'phoenix' in out.lower()
    assert 'You arrive at' not in out
    assert m in game.state.current_room.characters

def test_mira_in_lower_switchbacks_teleports_to_cavern_mouth():
    """When at Lower Switchbacks and Phoenix Feather is acquired, Mira teleports to 
    Cavern Mouth."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])
    from retroquest.act3.Act3StoryFlags import (
        FLAG_ACT3_MAIN_STARTED,
        FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED
    )
    game.state.set_story_flag(FLAG_ACT3_MAIN_STARTED, True)
    # Place player at Lower Switchbacks
    if 'LowerSwitchbacks' in game.state.all_rooms:
        room_key = 'LowerSwitchbacks'
    else:
        room_key = 'Lower Switchbacks'
    game.state.current_room = game.state.all_rooms[room_key]
    # Set Phoenix Feather acquired
    game.state.set_story_flag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, True)
    m = Mira()
    # Ensure Mira and Sir Cedric are in the room
    game.state.current_room.characters.append(m)
    from retroquest.act3.characters.SirCedric import SirCedric
    sc = SirCedric()
    game.state.current_room.characters.append(sc)
    # Call talk_to and verify teleport to Cavern Mouth
    out = m.talk_to(game.state)
    assert 'You arrive at' in out
    assert 'Cavern Mouth' in out or 'CavernMouth' in game.state.current_room.name
    assert m in game.state.current_room.characters
    assert any(c.get_name().lower() == 'sir cedric' for c in game.state.current_room.characters)


def test_mira_at_hut_requires_elixir_before_fortress_teleport():
    """At Mira's Hut after elixir creation, Mira should require the elixir to be 
    in inventory before teleporting to the fortress."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])
    
    from retroquest.act3.Act3StoryFlags import (
        FLAG_ACT3_MAIN_STARTED,
        FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED
    )
    
    # Set up initial state
    game.state.set_story_flag(FLAG_ACT3_MAIN_STARTED, True)
    game.state.set_story_flag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED, True)
    
    # Place player at Mira's Hut
    game.state.current_room = game.state.all_rooms['MirasHut']
    m = Mira()
    
    # Test without elixir in inventory - should urge to take it
    out = m.talk_to(game.state)
    assert 'take the Lifelight Elixir' in out
    assert 'before we depart' in out
    assert 'You arrive at' not in out  # Should not teleport
    
    # Test with elixir in inventory - should allow teleport
    from retroquest.act3.items.LifelightElixir import LifelightElixir
    elixir = LifelightElixir()
    game.state.inventory.append(elixir)
    
    # Add Mira and Sir Cedric to the room for teleport
    game.state.current_room.characters.append(m)
    from retroquest.act3.characters.SirCedric import SirCedric
    sc = SirCedric()
    game.state.current_room.characters.append(sc)
    
    out = m.talk_to(game.state)
    assert 'final journey' in out
    assert 'You arrive at' in out  # Should teleport


def test_mira_at_fortress_entrance_discusses_fatigue():
    """At Fortress Entrance, Mira should talk about being fatigued and needing rest."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])
    
    from retroquest.act3.Act3StoryFlags import FLAG_ACT3_MAIN_STARTED
    game.state.set_story_flag(FLAG_ACT3_MAIN_STARTED, True)
    
    # Place player at Fortress Entrance
    game.state.current_room = game.state.all_rooms['FortressEntrance']
    m = Mira()
    
    out = m.talk_to(game.state)
    assert 'journey has taken its toll' in out
    assert 'drained much of my strength' in out
    assert 'must rest and recover' in out
    assert 'Sir Cedric press forward' in out
    assert 'three virtues you have proven' in out
    assert 'You arrive at' not in out  # Should not teleport


def test_mira_creates_elixir_and_removes_relics():
    """At Mira's Hut with all three relics, Mira should create the elixir and remove the relics."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])
    
    from retroquest.act3.Act3StoryFlags import (
        FLAG_ACT3_MAIN_STARTED,
        FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
        FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
        FLAG_ACT3_DRAGONS_SCALE_ACQUIRED
    )
    
    # Set up initial state with all relics acquired
    game.state.set_story_flag(FLAG_ACT3_MAIN_STARTED, True)
    game.state.set_story_flag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, True)
    game.state.set_story_flag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, True)
    game.state.set_story_flag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, True)
    
    # Place player at Mira's Hut
    game.state.current_room = game.state.all_rooms['MirasHut']
    
    # Add the three relics to inventory and room
    from retroquest.act3.items.CrystalOfLight import CrystalOfLight
    from retroquest.act3.items.PhoenixFeather import PhoenixFeather
    from retroquest.act3.items.DragonsScale import DragonsScale
    
    crystal = CrystalOfLight()
    feather = PhoenixFeather()
    scale = DragonsScale()
    
    # Add items to different locations to test removal from both inventory and room
    game.state.inventory.append(crystal)  # Crystal in inventory
    game.state.inventory.append(feather)  # Feather in inventory
    game.state.current_room.items.append(scale)  # Scale in room
    
    # Verify items are present before ritual
    assert game.state.has_item("Crystal of Light")
    assert game.state.has_item("Phoenix Feather") 
    # For scale in room, check manually since has_item only checks inventory
    scale_in_room = any(
        item.get_name() == "Dragon's Scale" 
        for item in game.state.current_room.items
    )
    assert scale_in_room
    
    m = Mira()
    out = m.talk_to(game.state)
    
    # Should perform the ritual
    assert 'three relics resonate' in out
    assert 'Warding Rite' in out or 'elixir' in out
    assert 'Lifelight Elixir' in out
    
    # Verify relics have been removed from both inventory and room
    assert not game.state.has_item("Crystal of Light")
    assert not game.state.has_item("Phoenix Feather")
    
    # Check that scale was removed from room
    scale_still_in_room = any(
        item.get_name() == "Dragon's Scale" 
        for item in game.state.current_room.items
    )
    assert not scale_still_in_room
    
    # Verify elixir was created in the room
    lifelight_elixir_in_room = any(
        item.get_name() == "Lifelight Elixir" 
        for item in game.state.current_room.items
    )
    assert lifelight_elixir_in_room
