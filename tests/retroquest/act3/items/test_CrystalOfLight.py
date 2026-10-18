"""Tests for CrystalOfLight pickup gating and name."""

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game
from retroquest.act3.Act3StoryFlags import FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, \
    FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, FLAG_ACT3_VOW_OF_COURAGE_MADE
from retroquest.act3.items.CrystalOfLight import CrystalOfLight
from ..markup_helpers import assert_markup_well_formed


def test_crystal_pickup_gated_by_flags():
    """Verify CrystalOfLight pickup is gated by the required story flags.

    When required flags are unset, the pickup should return a failure-like
    message; when flags are set, pickup should succeed with expected text.
    """
    act3 = Act3()
    act3.music_file = ''
    game = Game([act3])

    # Ensure flags unset and that Crystal cannot be picked up via direct method
    from retroquest.act3.items.CrystalOfLight import CrystalOfLight
    crystal = CrystalOfLight()
    # Attempting to pick up should return a failure message if flags not set
    result = crystal.picked_up(game.state)
    assert ('cannot' in result.lower() or 'may' in result.lower() or
        'complete the rites' in result.lower() or 'locking' in result.lower())

    # Set all flags and try again
    game.state.set_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, True)
    game.state.set_story_flag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, True)
    game.state.set_story_flag(FLAG_ACT3_VOW_OF_COURAGE_MADE, True)
    result_ok = crystal.picked_up(game.state)
    # Accept several success phrasings: steadies, radiance, grasp, take, picked
    assert any(k in result_ok.lower() for k in (
        'take', 'picked', 'steadies', 'radiance', 'grasp'
    ))


def _create_markup_game() -> Game:
    """Create an Act III game for markup checks."""
    act = Act3()
    act.music_file = ''
    return Game([act])


def test_crystal_pickup_after_vow_uses_known_tags():
    """Picking up the crystal after the vow uses only known, balanced tags."""
    game = _create_markup_game()
    game.state.set_story_flag(FLAG_ACT3_VOW_OF_COURAGE_MADE, True)

    answer = CrystalOfLight().picked_up(game.state)

    assert "crystal steadies in your grasp" in answer
    assert_markup_well_formed(answer)
