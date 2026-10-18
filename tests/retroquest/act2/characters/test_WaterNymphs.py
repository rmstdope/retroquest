"""Markup and dialogue tests for the Water Nymphs character in Act II."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.characters.WaterNymphs import WaterNymphs
from retroquest.engine.Game import Game
from ..markup_helpers import (
    assert_dialogue_speaker,
    assert_markup_well_formed,
    assert_no_speech_outside_dialogue,
)

SPEAKER = "water nymphs"


def test_answer_after_last_riddle_uses_known_tags():
    """Answering when no riddles remain uses only known, balanced tags."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    nymphs = WaterNymphs()
    nymphs.current_riddle = len(nymphs.riddles)

    answer = nymphs.say_to("water", game.state)

    assert "no more riddles to answer" in answer
    assert_markup_well_formed(answer)


def _create_game_with_nymphs() -> Game:
    """Create an Act II game with the Water Nymphs present in the Whispering Glade."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    game.state.current_room = game.state.all_rooms["WhisperingGlade"]
    game.state.current_room.characters.append(WaterNymphs())
    return game


def test_wrong_answer_is_attributed_dialogue():
    """The nymphs' reply to a wrong answer is tagged dialogue attributed to them."""
    game = _create_game_with_nymphs()
    game.command_parser.parse("talk to water nymphs")

    answer = game.command_parser.parse("say wrong to water nymphs")

    assert "shake their heads gently as you say 'wrong'" in answer
    assert "Not quite, young seeker" in answer
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, SPEAKER)
    assert_no_speech_outside_dialogue(answer)


def test_talk_when_no_riddles_remain_keeps_narration_outside_dialogue():
    """The fallback reply names the nymphs in narration and only quotes their words."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    nymphs = WaterNymphs()
    nymphs.current_riddle = len(nymphs.riddles)

    answer = nymphs.talk_to(game.state)

    assert "smile mysteriously" in answer
    assert "[dialogue]The" not in answer
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, SPEAKER)
