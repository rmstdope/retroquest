"""Tests for SeaSealedLetter item."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game
from retroquest.act3.items.SeaSealedLetter import SeaSealedLetter
from ..markup_helpers import assert_markup_well_formed


def test_sea_sealed_letter_name_and_pickup():
    """SeaSealedLetter exists and exposes an appropriate name."""
    act3 = Act3()
    act3.music_file = ''
    _game = Game([act3])

    from retroquest.act3.items.SeaSealedLetter import SeaSealedLetter
    letter = SeaSealedLetter()
    assert letter.get_name().lower().startswith('sea')


def test_sea_sealed_letter_examine_markup_is_well_formed():
    """Examining the letter yields balanced, non-nested markup."""
    from retroquest.act3.items.SeaSealedLetter import SeaSealedLetter
    from ..markup_helpers import assert_markup_well_formed

    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    answer = SeaSealedLetter().examine(game.state)

    assert "Lyra and Theron" in answer
    assert_markup_well_formed(answer)


def _create_markup_game() -> Game:
    """Create an Act III game for markup checks."""
    act = Act3()
    act.music_file = ''
    return Game([act])


def test_letter_pickup_uses_known_tags():
    """Picking up the sea-sealed letter uses only known, balanced tags."""
    game = _create_markup_game()

    answer = SeaSealedLetter().picked_up(game.state)

    assert "testament kept by the sea" in answer
    assert_markup_well_formed(answer)
