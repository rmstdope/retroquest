"""Tests for Mural item."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game


def test_mural_examine_returns_text():
    """Mural in the Tidal Causeway should return descriptive text on examine."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    room = game.state.all_rooms['TidalCauseway']
    mural = next((i for i in room.items if i.__class__.__name__ == 'Mural'), None)
    assert mural is not None
    # Ensure current_room is the mural room so examine side-effects affect it
    game.state.current_room = room
    out = mural.examine(game.state)
    assert 'sea' in out.lower() or 'reliquary' in out.lower()


def test_mural_examine_reveals_sea_sealed_letter_and_sets_flag():
    """First examine reveals Sea-Sealed Letter and sets the story flag."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    room = game.state.all_rooms['TidalCauseway']
    mural = next((i for i in room.items if i.__class__.__name__ == 'Mural'), None)
    assert mural is not None

    # Ensure flag not set initially
    from retroquest.act3.Act3StoryFlags import FLAG_ACT3_SEA_SEALED_LETTER_FOUND
    assert game.state.get_story_flag(FLAG_ACT3_SEA_SEALED_LETTER_FOUND) is False

    # Ensure examine uses the test room as current_room for side-effects
    game.state.current_room = room
    out = mural.examine(game.state)
    assert '[item_name]Sea-Sealed Letter' in out or 'sea-sealed letter' in out.lower()
    # Flag should be set and letter added to the room
    assert game.state.get_story_flag(FLAG_ACT3_SEA_SEALED_LETTER_FOUND) is True
    letters = [i for i in room.items if i.__class__.__name__ == 'SeaSealedLetter']
    assert len(letters) == 1


def test_mural_examine_after_reveal_shows_alternate_text_and_no_duplicate():
    """Subsequent examines show alternate text and don't add another letter."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    room = game.state.all_rooms['TidalCauseway']
    mural = next((i for i in room.items if i.__class__.__name__ == 'Mural'), None)
    assert mural is not None

    from retroquest.act3.Act3StoryFlags import FLAG_ACT3_SEA_SEALED_LETTER_FOUND
    # Manually set the flag as if previously revealed
    game.state.set_story_flag(FLAG_ACT3_SEA_SEALED_LETTER_FOUND, True)

    # Capture current count of letters (should be 0 by default)
    initial_letters = [i for i in room.items if i.__class__.__name__ == 'SeaSealedLetter']
    game.state.current_room = room
    out = mural.examine(game.state)
    # Should not add a new letter and should return the alternate description
    letters_after = [i for i in room.items if i.__class__.__name__ == 'SeaSealedLetter']
    assert len(letters_after) == len(initial_letters)
    assert 'empty stone' in out.lower() or 'guardian' in out.lower()
