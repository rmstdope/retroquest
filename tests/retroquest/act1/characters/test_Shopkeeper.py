"""Markup tests for the General Store shopkeeper's dialogue."""

import re

import pytest

from retroquest.act1.Act1 import Act1
from retroquest.act1.Act1StoryFlags import FLAG_CONNECT_WITH_NATURE, FLAG_PRIEST_TALKED_TO
from retroquest.act1.items.Coin import Coin
from retroquest.engine.Game import Game

DIALOGUE_PATTERN = re.compile(r"\[dialogue\](.*?)\[/dialogue\]", re.S)
CHARACTER_NAME_PATTERN = re.compile(r"\[character_name\](.*?)\[/character_name\]", re.S)
QUOTE_MARKS = "\"'"


def _create_game_in_store(shop_open: bool = True, priest_talked_to: bool = False) -> Game:
    """Create an Act I game with Elior standing in the General Store."""
    act = Act1()
    act.music_file = ''
    game = Game([act])
    game.state.current_room = game.state.all_rooms["GeneralStore"]
    game.state.set_story_flag(FLAG_CONNECT_WITH_NATURE, shop_open)
    game.state.set_story_flag(FLAG_PRIEST_TALKED_TO, priest_talked_to)
    return game


def _assert_quotes_inside_dialogue(text: str) -> None:
    """Assert no quote mark sits outside dialogue and each quoted block is closed."""
    narration = DIALOGUE_PATTERN.sub("", text)
    assert '"' not in narration, f"Double quote outside dialogue in: {text!r}"
    for block in DIALOGUE_PATTERN.findall(text):
        if block[0] in QUOTE_MARKS:
            assert block[-1] == block[0], f"Unclosed quotation in dialogue: {block!r}"


def _assert_speaker_before_dialogue(text: str) -> None:
    """Assert that the shopkeeper is named before every dialogue block."""
    blocks = list(DIALOGUE_PATTERN.finditer(text))
    assert blocks, f"No dialogue in: {text!r}"
    for block in blocks:
        names = CHARACTER_NAME_PATTERN.findall(text[:block.start()])
        assert names, f"No speaker before dialogue in: {text!r}"
        assert names[-1].lower() == "shopkeeper"


@pytest.mark.parametrize("talks", [1, 2, 3])
def test_talking_to_open_shop_keeps_quotes_inside_dialogue(talks: int) -> None:
    """Every rotating greeting with the wares list keeps its quotation inside dialogue."""
    game = _create_game_in_store()

    for _ in range(talks):
        answer = game.command_parser.parse("talk to shopkeeper")

    assert "for sale" in answer
    _assert_quotes_inside_dialogue(answer)
    _assert_speaker_before_dialogue(answer)


def test_talking_to_closed_shop_keeps_quotes_inside_dialogue() -> None:
    """The closed-shop reply keeps its quotation inside dialogue."""
    game = _create_game_in_store(shop_open=False)

    answer = game.command_parser.parse("talk to shopkeeper")

    assert "not open for business" in answer
    _assert_quotes_inside_dialogue(answer)
    _assert_speaker_before_dialogue(answer)


def test_talking_after_priest_keeps_quotes_inside_dialogue() -> None:
    """Receiving the matches for the priest keeps the quotation inside dialogue."""
    game = _create_game_in_store(priest_talked_to=True)

    answer = game.command_parser.parse("talk to shopkeeper")

    assert "on the house" in answer
    _assert_quotes_inside_dialogue(answer)
    _assert_speaker_before_dialogue(answer)


def test_buying_unknown_ware_keeps_quotes_inside_dialogue() -> None:
    """Asking for a ware the shop lacks keeps quotes inside dialogue."""
    game = _create_game_in_store()

    answer = game.command_parser.parse("buy lantern from shopkeeper")

    assert "for sale" in answer
    _assert_quotes_inside_dialogue(answer)
    _assert_speaker_before_dialogue(answer)


def test_buying_rope_reports_purchase_without_stray_quotes() -> None:
    """A successful purchase has no quote marks outside dialogue."""
    game = _create_game_in_store()
    game.state.add_item_to_inventory(Coin())

    answer = game.command_parser.parse("buy rope from shopkeeper")

    assert "You bought a" in answer
    _assert_quotes_inside_dialogue(answer)


def test_giving_item_keeps_quotes_inside_dialogue() -> None:
    """Offering the shopkeeper an item keeps the quotation inside dialogue."""
    game = _create_game_in_store()
    game.state.add_item_to_inventory(Coin())

    answer = game.command_parser.parse("give coin to shopkeeper")

    assert "donations" in answer
    _assert_quotes_inside_dialogue(answer)
    _assert_speaker_before_dialogue(answer)
