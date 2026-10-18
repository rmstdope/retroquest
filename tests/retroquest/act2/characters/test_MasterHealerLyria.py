"""Markup tests for Master Healer Lyria in Act II."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.Act2StoryFlags import (
    FLAG_HEALERS_APPRENTICE_ACCEPTED,
    FLAG_HEALERS_APPRENTICE_COMPLETED,
)
from retroquest.act2.characters.MasterHealerLyria import MasterHealerLyria
from retroquest.act2.items.CrystalFocus import CrystalFocus
from retroquest.act2.items.HealingHerbs import HealingHerbs
from retroquest.engine.Game import Game
from ..markup_helpers import (
    assert_dialogue_speaker,
    assert_markup_well_formed,
    assert_no_speech_outside_dialogue,
)

SPEAKER = "Master Healer Lyria"


def _create_game() -> Game:
    """Create an Act II game for Lyria's dialogue."""
    act = Act2()
    act.music_file = ''
    return Game([act])


def _assert_lyria_speaks(answer: str) -> None:
    """Assert that the answer is well formed and Lyria speaks every dialogue."""
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, SPEAKER)
    assert_no_speech_outside_dialogue(answer)


def test_talk_without_offerings_is_attributed_dialogue():
    """Lyria's plea for help is tagged dialogue attributed to her."""
    game = _create_game()

    answer = MasterHealerLyria().talk_to(game.state)

    assert "Welcome to my house of healing" in answer
    _assert_lyria_speaks(answer)


def test_talk_with_crystal_focus_is_attributed_dialogue():
    """Lyria noticing the Crystal Focus is tagged dialogue attributed to her."""
    game = _create_game()
    game.state.add_item_to_inventory(CrystalFocus())

    answer = MasterHealerLyria().talk_to(game.state)

    assert "That crystal focus!" in answer
    _assert_lyria_speaks(answer)


def test_talk_with_healing_herbs_is_attributed_dialogue():
    """Lyria noticing the Healing Herbs is tagged dialogue without stray quotes."""
    game = _create_game()
    game.state.add_item_to_inventory(HealingHerbs())

    answer = MasterHealerLyria().talk_to(game.state)

    assert "natural gift for healing magic" in answer
    assert "supplies. '" not in answer
    _assert_lyria_speaks(answer)


def test_talk_during_and_after_apprenticeship_is_attributed_dialogue():
    """Lyria's in-progress and completed replies are tagged, attributed dialogue."""
    game = _create_game()
    lyria = MasterHealerLyria()
    game.state.set_story_flag(FLAG_HEALERS_APPRENTICE_ACCEPTED, True)
    in_progress = lyria.talk_to(game.state)
    game.state.set_story_flag(FLAG_HEALERS_APPRENTICE_COMPLETED, True)

    completed = lyria.talk_to(game.state)

    assert "looking forward to teaching you" in in_progress
    assert "truly a master of the healing arts" in completed
    for answer in (in_progress, completed):
        _assert_lyria_speaks(answer)


def test_giving_crystal_focus_is_attributed_dialogue():
    """Lyria accepting the Crystal Focus is tagged dialogue attributed to her."""
    game = _create_game()
    focus = CrystalFocus()
    game.state.add_item_to_inventory(focus)

    answer = MasterHealerLyria().give_item(game.state, focus)

    assert "This is exactly what I needed!" in answer
    _assert_lyria_speaks(answer)


def test_giving_healing_herbs_is_attributed_dialogue():
    """Lyria accepting the Healing Herbs is tagged dialogue attributed to her."""
    game = _create_game()
    herbs = HealingHerbs()
    game.state.add_item_to_inventory(herbs)

    answer = MasterHealerLyria().give_item(game.state, herbs)

    assert "Your commitment shows you're ready to learn" in answer
    _assert_lyria_speaks(answer)
