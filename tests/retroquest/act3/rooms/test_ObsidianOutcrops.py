"""Unit tests for ObsidianOutcrops room in Act 3."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game
from retroquest.act3.rooms.ObsidianOutcrops import ObsidianOutcrops
from ..markup_helpers import assert_markup_well_formed


def test_obsidian_outcrops_search_reveals_items_once():
    """Searching Obsidian Outcrops should reveal a mirror segment and resin once."""
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    room = act3.rooms['ObsidianOutcrops']
    gs = game.state
    gs.current_room = room

    # First search reveals items
    out1 = room.search(gs)
    assert 'brass' in out1.lower() or 'resin' in out1.lower()
    names_after = [i.get_name().lower() for i in room.get_items()]
    assert 'brass mirror segment' in names_after
    assert 'binding resin' in names_after

    # Second search should not add additional items
    out2 = room.search(gs)
    assert 'nothing new' in out2.lower() or 'same as before' in out2.lower()
    names_after2 = [i.get_name().lower() for i in room.get_items()]
    # Count remains the same (still contains the two revealed items)
    assert names_after2.count('brass mirror segment') == 1
    assert names_after2.count('binding resin') == 1


def _create_markup_game() -> Game:
    """Create an Act III game for markup checks."""
    act = Act3()
    act.music_file = ''
    return Game([act])


def test_second_search_uses_known_tags():
    """Searching the outcrops again uses only known, balanced tags."""
    game = _create_markup_game()
    room = ObsidianOutcrops()
    room.search(game.state)

    answer = room.search(game.state)

    assert "nothing new comes loose" in answer
    assert_markup_well_formed(answer)
