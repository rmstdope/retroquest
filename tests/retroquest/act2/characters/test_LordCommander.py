"""Tests for the Lord Commander character in Act II."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.Act2StoryFlags import (
    FLAG_CEDRIKS_HONOR_COMPLETED,
    FLAG_EXAMINED_SECRET_DOCUMENTS,
)
from retroquest.act2.items.SecretDocuments import SecretDocuments
from retroquest.act2.items.WalkingStick import WalkingStick
from retroquest.engine.Game import Game
from ..markup_helpers import (
    assert_dialogue_speaker,
    assert_markup_well_formed,
    assert_no_speech_outside_dialogue,
)

SPEAKER = "lord commander"


def _create_game_in_great_hall() -> Game:
    """Create an Act II game with the player in the Great Hall."""
    act = Act2()
    act.music_file = ''
    game = Game([act])
    game.state.current_room = game.state.all_rooms["GreatHall"]
    return game


def _assert_attributed_dialogue(answer: str) -> None:
    """Assert that the answer is well-formed dialogue spoken by the Lord Commander."""
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, SPEAKER)
    assert_no_speech_outside_dialogue(answer)


def test_talk_before_evidence_gives_formal_welcome():
    """Before the documents are examined, the Lord Commander welcomes the player."""
    game = _create_game_in_great_hall()

    answer = game.command_parser.parse("talk to lord commander")

    assert "Welcome to Greendale's Great Hall" in answer
    _assert_attributed_dialogue(answer)


def test_talk_after_examining_documents_asks_for_evidence():
    """Once the documents are examined, the Lord Commander asks to see them."""
    game = _create_game_in_great_hall()
    game.state.set_story_flag(FLAG_EXAMINED_SECRET_DOCUMENTS, True)

    answer = game.command_parser.parse("talk to lord commander")

    assert "please present them to me" in answer
    _assert_attributed_dialogue(answer)


def test_talk_after_honor_restored_confirms_justice():
    """Once Sir Cedric's honor is restored, the Lord Commander confirms it."""
    game = _create_game_in_great_hall()
    game.state.set_story_flag(FLAG_EXAMINED_SECRET_DOCUMENTS, True)
    game.state.set_story_flag(FLAG_CEDRIKS_HONOR_COMPLETED, True)

    answer = game.command_parser.parse("talk to lord commander")

    assert "Sir Cedric's honor has been fully restored" in answer
    _assert_attributed_dialogue(answer)


def test_give_unexamined_documents_asks_to_examine_them():
    """Unexamined documents are handed back with a request to examine them first."""
    game = _create_game_in_great_hall()
    documents = SecretDocuments()
    game.state.inventory.append(documents)

    answer = game.command_parser.parse("give secret documents to lord commander")

    assert "Please examine them thoroughly" in answer
    _assert_attributed_dialogue(answer)
    assert documents in game.state.inventory
    assert not game.state.get_story_flag(FLAG_CEDRIKS_HONOR_COMPLETED)


def test_give_examined_documents_restores_cedrics_honor():
    """Examined documents prove Sir Cedric's innocence and complete the quest."""
    game = _create_game_in_great_hall()
    documents = SecretDocuments()
    game.state.inventory.append(documents)
    game.state.set_story_flag(FLAG_EXAMINED_SECRET_DOCUMENTS, True)

    answer = game.command_parser.parse("give secret documents to lord commander")

    assert "I hereby officially restore Sir Cedric's honor" in answer
    assert answer.startswith("[success]") and answer.endswith("[/success]")
    _assert_attributed_dialogue(answer)
    assert documents not in game.state.inventory
    assert game.state.get_story_flag(FLAG_CEDRIKS_HONOR_COMPLETED)


def test_give_other_item_is_declined():
    """Any other item is declined and kept by the player."""
    game = _create_game_in_great_hall()
    stick = WalkingStick()
    game.state.inventory.append(stick)

    answer = game.command_parser.parse(f"give {stick.get_name()} to lord commander")

    assert f"has no need for your [item_name]{stick.get_name()}[/item_name]" in answer
    assert_markup_well_formed(answer)
    assert f"[character_name]{SPEAKER}[/character_name]" in answer
    assert_no_speech_outside_dialogue(answer)
    assert stick in game.state.inventory
    assert not game.state.get_story_flag(FLAG_CEDRIKS_HONOR_COMPLETED)
