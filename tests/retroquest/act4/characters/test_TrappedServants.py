"""Tests for the Trapped Servants character in Act IV."""

from retroquest.act4.Act4 import Act4
from retroquest.act4.Act4StoryFlags import (
    FLAG_ACT4_SERVANTS_FREED,
    FLAG_ACT4_SERVANTS_TRUST_EARNED,
)
from retroquest.act4.characters.TrappedServants import TrappedServants
from retroquest.engine.Game import Game
from ..markup_helpers import assert_dialogue_speaker, assert_markup_well_formed

SPEAKER = "Trapped Servants"


def _create_game_in_courtyard() -> Game:
    """Create an Act IV game with the player in the Outer Courtyard."""
    act = Act4()
    act.music_file = ''
    game = Game([act])
    game.state.current_room = game.state.all_rooms["OuterCourtyard"]
    return game


def test_talk_before_trust_asks_for_proof_of_courage():
    """Before trust is earned, the servants ask the player to prove their courage."""
    game = _create_game_in_courtyard()

    answer = game.command_parser.parse("talk to trapped servants")

    assert "Prove your courage against the darkness" in answer
    assert_dialogue_speaker(answer, SPEAKER)
    assert_markup_well_formed(answer)


def test_talk_after_trust_asks_for_compassion():
    """Once trust is earned, the servants ask the player to break their chains."""
    game = _create_game_in_courtyard()
    game.state.set_story_flag(FLAG_ACT4_SERVANTS_TRUST_EARNED, True)

    answer = game.command_parser.parse("talk to trapped servants")

    assert "use your compassion" in answer
    assert_dialogue_speaker(answer, SPEAKER)
    assert_markup_well_formed(answer)


def test_talk_after_freed_thanks_the_player():
    """Once freed, the servants thank the player and warn about the labyrinth."""
    game = _create_game_in_courtyard()
    game.state.set_story_flag(FLAG_ACT4_SERVANTS_TRUST_EARNED, True)
    game.state.set_story_flag(FLAG_ACT4_SERVANTS_FREED, True)

    answer = TrappedServants().talk_to(game.state)

    assert "Thank you for our freedom!" in answer
    assert_dialogue_speaker(answer, SPEAKER)
    assert_markup_well_formed(answer)
