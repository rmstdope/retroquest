"""Tests for casting the Mend spell in Act II through the command parser."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.characters.SirCedric import SirCedric
from retroquest.act2.items.Caravan import Caravan
from retroquest.act2.spells.MendSpell import MendSpell
from retroquest.engine.Game import Game
from ..markup_helpers import assert_markup_well_formed


def _create_game_knowing_mend() -> Game:
    """Create an Act II game where the player knows the Mend spell."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    game.state.learn_spell(MendSpell())
    return game


def test_cast_mend_on_undamaged_item_has_no_effect():
    """Casting mend on an intact item reports that no repair is needed."""
    game = _create_game_knowing_mend()
    game.command_parser.parse("take walking stick")

    answer = game.command_parser.parse("cast mend on walking stick")

    assert "doesn't appear to need any repairs" in answer
    assert_markup_well_formed(answer)


def test_cast_mend_on_damaged_item_repairs_it():
    """Casting mend on an item described as damaged repairs it."""
    game = _create_game_knowing_mend()
    game.state.current_room.add_item(Caravan())

    answer = game.command_parser.parse("cast mend on caravan")

    assert "repairing damage" in answer
    assert_markup_well_formed(answer)


def test_cast_mend_on_character_fizzles():
    """Casting mend on a character fizzles without crashing."""
    game = _create_game_knowing_mend()
    game.state.current_room.add_character(SirCedric())

    answer = game.command_parser.parse("cast mend on sir cedric")

    assert "fizzles" in answer
    assert_markup_well_formed(answer)


def test_cast_mend_on_missing_target_fails():
    """Casting mend on something that is not present reports a failure."""
    game = _create_game_knowing_mend()

    answer = game.command_parser.parse("cast mend on teapot")

    assert "You don't see a 'teapot'" in answer
    assert_markup_well_formed(answer)


def test_cast_mend_without_target_finds_nothing():
    """Casting mend without a target finds nothing to repair."""
    game = _create_game_knowing_mend()

    answer = game.command_parser.parse("cast mend")

    assert "finds nothing that needs mending" in answer
    assert_markup_well_formed(answer)
