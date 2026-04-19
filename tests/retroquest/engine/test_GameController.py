"""Tests for the GameController structured-data methods."""

from retroquest.engine.Game import Game
from retroquest.engine.Room import Room
from retroquest.engine.Item import Item
from retroquest.engine.Character import Character
from retroquest.engine.GameState import GameState
from retroquest.engine.Act import Act
from retroquest.engine.textualui.GameController import GameController


class SimpleItem(Item):
    """Minimal item for controller tests."""

    def __init__(self, name: str) -> None:
        """Initialize with name and default description."""
        super().__init__(name, f"A {name}.")


class SimpleCharacter(Character):
    """Minimal character for controller tests."""

    def __init__(self, name: str) -> None:
        """Initialize with name and a default greeting."""
        super().__init__(name, "Hello there.")


class SimpleAct(Act):
    """Act with configurable rooms for controller tests."""

    def __init__(self, rooms: dict, quests=None) -> None:
        """Initialize the act with provided rooms."""
        super().__init__(
            name="Test Act",
            rooms=rooms,
            quests=quests or [],
            music_file='',
            music_info=''
        )

    def is_completed(self, _game_state: GameState) -> bool:
        """Never completes in tests."""
        return False


def _make_controller(
    room_name="Test Room",
    description="A test room.",
    items=None,
    characters=None,
    exits=None,
) -> GameController:
    """Create a GameController backed by a single-room act."""
    room = Room(
        name=room_name,
        description=description,
        items=items,
        characters=characters,
        exits=exits,
    )
    rooms = {"TestRoom": room}
    act = SimpleAct(rooms)
    game = Game([act], dev_mode=True)
    return GameController(game)


class TestGetRoomName:
    """Tests for GameController.get_room_name."""

    def test_returns_room_name(self) -> None:
        """Return the current room's display name."""
        ctrl = _make_controller(room_name="Moonlit Glade")
        assert ctrl.get_room_name() == "Moonlit Glade"


class TestGetRoomDescription:
    """Tests for GameController.get_room_description."""

    def test_returns_narrative_text(self) -> None:
        """Return the raw narrative description of the room."""
        ctrl = _make_controller(
            description="Vines creep along crumbling stone walls."
        )
        assert ctrl.get_room_description() == (
            "Vines creep along crumbling stone walls."
        )


class TestGetRoomCharacters:
    """Tests for GameController.get_room_characters."""

    def test_empty_when_no_characters(self) -> None:
        """Return empty list when the room has no characters."""
        ctrl = _make_controller()
        assert ctrl.get_room_characters() == []

    def test_returns_character_names(self) -> None:
        """Return a list of character display names."""
        chars = [SimpleCharacter("Mira"), SimpleCharacter("Elior")]
        ctrl = _make_controller(characters=chars)
        assert ctrl.get_room_characters() == ["Mira", "Elior"]


class TestGetRoomItems:
    """Tests for GameController.get_room_items."""

    def test_empty_when_no_items(self) -> None:
        """Return empty list when the room has no items."""
        ctrl = _make_controller()
        assert ctrl.get_room_items() == []

    def test_returns_item_names(self) -> None:
        """Return a list of item display names."""
        items = [SimpleItem("Old Scroll"), SimpleItem("Rusty Key")]
        ctrl = _make_controller(items=items)
        assert ctrl.get_room_items() == ["Old Scroll", "Rusty Key"]


class TestGetRoomExits:
    """Tests for GameController.get_room_exits."""

    def test_empty_when_no_exits(self) -> None:
        """Return empty dict when the room has no exits."""
        ctrl = _make_controller()
        assert ctrl.get_room_exits() == {}

    def test_returns_direction_destination_map(self) -> None:
        """Return exits as direction to destination name mapping."""
        exits = {"north": "MarketRoad", "east": "FarmPath"}
        ctrl = _make_controller(exits=exits)
        result = ctrl.get_room_exits()
        assert result == {"north": "MarketRoad", "east": "FarmPath"}


class TestLoadGame:
    """Tests for GameController.load_game."""

    def test_load_no_save_returns_failure(self, tmp_path, monkeypatch) -> None:
        """Return failure message when no save file exists."""
        monkeypatch.chdir(tmp_path)
        ctrl = _make_controller()
        result = ctrl.load_game()
        assert "No save file found" in result


class TestIsGameRunning:
    """Tests for GameController.is_game_running."""

    def test_game_is_running_initially(self) -> None:
        """Game should be running when freshly created."""
        ctrl = _make_controller()
        assert ctrl.is_game_running() is True


class TestIsActRunning:
    """Tests for GameController.is_act_running."""

    def test_act_not_running_at_start(self) -> None:
        """Act is not yet running immediately after game creation."""
        ctrl = _make_controller()
        # Game starts in SHOW_LOGO state, not ACT_RUNNING
        assert ctrl.is_act_running() is False


def _make_controller_with_music(
    music_file: str = "track.mp3",
    music_info: str = "Track Info",
    advance_to_running: bool = True,
) -> GameController:
    """Create a controller backed by an act with specific music metadata.

    Optionally advances the game to ACT_RUNNING state (two new_turn() calls).
    """
    room = Room(name="Test Room", description="A test room.")
    rooms = {"TestRoom": room}
    act = SimpleAct(rooms=rooms)
    # Override music fields before Game construction so Game.__init__
    # sees these test-specific values when it initializes audio state.
    act.music_file = music_file
    act.music_info = music_info
    game = Game([act], dev_mode=True)
    if advance_to_running:
        game.new_turn()  # SHOW_LOGO → ACT_INTRO
        game.new_turn()  # ACT_INTRO → ACT_RUNNING
    return GameController(game)


class TestGetCurrentMusic:
    """Tests for GameController.get_current_music."""

    def test_returns_empty_strings_when_act_not_running(self) -> None:
        """Return ('', '') when the act is not yet running (logo state)."""
        ctrl = _make_controller()
        assert ctrl.get_current_music() == ('', '')

    def test_returns_music_file_when_act_running(self) -> None:
        """Return the correct music_file for the current act when running."""
        ctrl = _make_controller_with_music(
            music_file="market.mp3",
            music_info="Market by Composer",
        )
        file_, _ = ctrl.get_current_music()
        assert file_ == "market.mp3"

    def test_returns_music_info_when_act_running(self) -> None:
        """Return the correct music_info for the current act when running."""
        ctrl = _make_controller_with_music(
            music_file="market.mp3",
            music_info="Market by Composer",
        )
        _, info = ctrl.get_current_music()
        assert info == "Market by Composer"
