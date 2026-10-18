"""Markup tests for the Phoenix character in Act 3."""

from retroquest.act3.Act3 import Act3
from retroquest.act3.characters.Phoenix import Phoenix
from retroquest.engine.Game import Game
from ..markup_helpers import assert_dialogue_speaker, assert_markup_well_formed


def _create_game() -> Game:
    """Create a game running Act III without music."""
    act = Act3()
    act.music_file = ''
    return Game([act])


def test_phoenix_dialogue_is_attributed_through_the_riddle():
    """Riddle, wrong answer, right answer and repeat all name the phoenix first."""
    game = _create_game()
    phoenix = Phoenix()
    answers = [phoenix.talk_to(game.state)]
    answers.append(phoenix.say_to("haste", game.state))
    answers.append(phoenix.say_to("patience", game.state))
    answers.append(phoenix.say_to("patience", game.state))

    assert game.state.has_item("Phoenix Feather")
    for answer in answers:
        assert_markup_well_formed(answer)
        assert_dialogue_speaker(answer, phoenix.get_name())
