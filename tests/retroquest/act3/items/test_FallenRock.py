"""Markup tests for the Fallen Rock rescue sequence in Act 3."""

from retroquest.act3.Act3 import Act3
from retroquest.act3.items.FallenRock import FallenRock
from retroquest.act3.items.ReinforcedBraces import ReinforcedBraces
from retroquest.act3.items.RustedLockerKey import RustedLockerKey
from retroquest.act3.items.SupportStraps import SupportStraps
from retroquest.act3.items.WedgeBlocks import WedgeBlocks
from retroquest.engine.Game import Game
from ..markup_helpers import assert_markup_well_formed


def _create_game_with_rock() -> tuple[Game, FallenRock]:
    """Create an Act III game with a fallen rock in the current room."""
    act = Act3()
    act.music_file = ''
    game = Game([act])
    rock = FallenRock()
    game.state.current_room.add_item(rock)
    return game, rock


def test_out_of_order_tools_use_known_tags():
    """Using rescue tools out of order uses only known, balanced tags."""
    game, rock = _create_game_with_rock()

    braces_unexamined = rock.use_with(game.state, ReinforcedBraces())
    rock.examine(game.state)
    straps_early = rock.use_with(game.state, SupportStraps())
    wedges_early = rock.use_with(game.state, WedgeBlocks())
    unhelpful = rock.use_with(game.state, RustedLockerKey())

    assert "examine the fallen rock first" in braces_unexamined
    assert "stabilize the collapse with braces" in straps_early
    assert "secured with support straps" in wedges_early
    assert "won't help" in unhelpful
    for answer in (braces_unexamined, straps_early, wedges_early, unhelpful):
        assert_markup_well_formed(answer)


def test_repeated_tools_use_known_tags():
    """Using each rescue tool a second time uses only known, balanced tags."""
    game, rock = _create_game_with_rock()
    rock.examine(game.state)
    rock.use_with(game.state, ReinforcedBraces())
    braces_again = rock.use_with(game.state, ReinforcedBraces())
    rock.use_with(game.state, SupportStraps())
    straps_again = rock.use_with(game.state, SupportStraps())
    rock.use_with(game.state, WedgeBlocks())

    wedges_again = rock.use_with(game.state, WedgeBlocks())

    assert "already in place" in braces_again
    assert "already securing the braces" in straps_again
    assert "already securing the passage" in wedges_again
    for answer in (braces_again, straps_again, wedges_again):
        assert_markup_well_formed(answer)
