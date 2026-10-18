"""Tests that saving and loading restores the act the player was in."""

import pickle
from unittest.mock import MagicMock
from retroquest.engine.Act import Act
from retroquest.engine.Game import Game
from retroquest.engine.GameState import GameState
from retroquest.engine.Room import Room


class TwoActTestAct(Act):
    """Act with its own uniquely named room; completion is controlled by the test."""

    def __init__(self, label: str) -> None:
        """Create an act whose single room and music are named after label."""
        room = Room(name=f"{label} Room", description=f"The {label} room.")
        super().__init__(
            name=label,
            rooms={f"{label}Room": room},
            quests=[],
            music_file=f"{label}.mp3",
            music_info='',
        )
        self.completed = False

    def is_completed(self, _game_state: GameState) -> bool:
        """Return the completion flag set by the test."""
        return self.completed


def _new_game() -> Game:
    """Create a fresh two-act game with audio mocked out."""
    game = Game([TwoActTestAct("First"), TwoActTestAct("Second")], dev_mode=True)
    game.audio = MagicMock()
    return game


def _advance_to_second_act(game: Game) -> None:
    """Run the game loop from the logo until the second act is running."""
    game.new_turn()  # logo -> act intro
    game.new_turn()  # act intro -> running
    game.acts[0].completed = True
    game.new_turn()  # running -> transition to act 2
    game.new_turn()  # transition -> act intro
    game.new_turn()  # act intro -> running
    assert game.current_act == 1


def test_loading_restores_the_saved_act(tmp_path, monkeypatch) -> None:
    """A save made in act 2 resumes in act 2 in a fresh game."""
    monkeypatch.chdir(tmp_path)
    game = _new_game()
    _advance_to_second_act(game)
    game.save()

    fresh = _new_game()
    result = fresh.load()

    assert "successfully" in result.lower()
    assert fresh.current_act == 1
    assert fresh.get_act_name() == "Act 2"
    assert fresh.state.current_room.name == "Second Room"


def test_loading_an_earlier_act_moves_back_to_it(tmp_path, monkeypatch) -> None:
    """Loading an act 1 save while in act 2 returns to act 1."""
    monkeypatch.chdir(tmp_path)
    game = _new_game()
    game.save()
    _advance_to_second_act(game)

    game.load()

    assert game.current_act == 0


def test_loading_another_act_starts_its_music(tmp_path, monkeypatch) -> None:
    """Music switches to the loaded act's track when the act changes."""
    monkeypatch.chdir(tmp_path)
    game = _new_game()
    _advance_to_second_act(game)
    game.save()

    fresh = _new_game()
    fresh.audio.reset_mock()
    fresh.load()

    fresh.audio.start_music.assert_called_once_with("Second.mp3")


def test_legacy_save_without_act_resumes_in_the_matching_act(tmp_path, monkeypatch) -> None:
    """Old saves contain only the GameState; the act is found from its rooms."""
    monkeypatch.chdir(tmp_path)
    game = _new_game()
    _advance_to_second_act(game)
    with open("retroquest.save", "wb") as f:
        pickle.dump(game.state, f)

    fresh = _new_game()
    result = fresh.load()

    assert "successfully" in result.lower()
    assert fresh.current_act == 1
    assert fresh.state.current_room.name == "Second Room"


def test_save_after_finishing_the_last_act_loads_into_the_last_act(
    tmp_path, monkeypatch
) -> None:
    """A save made after the final act ends (e.g. save-on-quit) loads into that act."""
    monkeypatch.chdir(tmp_path)
    game = _new_game()
    _advance_to_second_act(game)
    game.acts[1].completed = True
    game.new_turn()  # running -> game over
    assert not game.is_running
    game.save()

    fresh = _new_game()
    result = fresh.load()

    assert "successfully" in result.lower()
    assert fresh.current_act == 1
    fresh.audio.start_music.assert_called_with("Second.mp3")
