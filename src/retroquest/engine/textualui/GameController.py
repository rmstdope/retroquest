"""Bridge between core game logic and Textual UI panels/state queries."""

from typing import Any, Optional, List, Tuple
from ..Game import Game
from ..theme import apply_theme

class GameController:
    """Controller adapting engine operations for presentation in the Textual UI.

    Responsibilities:
        * Provide formatted / themed text for panels (room, result, quests, inventory).
        * Surface quest activation / update / completion events as popup payloads.
        * Delegate raw command strings to the command parser and retain last output.

    Design Notes:
        Kept intentionally thin; avoids UI dependencies so it can be reused by other
        front ends in future (e.g., web or curses). Popup generation returns optional
        strings instead of side‑effects, enabling the UI layer to decide sequencing.
    """

    def __init__(self, game: Game) -> None:
        self.game = game
        self.last_output = ""

    def start(self) -> str:
        """Return initial game / act intro text for first render."""
        return self.game.get_result_text()

    def handle_command(self, command: str) -> str:
        """Parse and execute a player command returning formatted result text."""
        output = self.game.command_parser.parse(command)
        self.last_output = output
        return output

    def get_output(self) -> str:
        """Return last command result (already themed when fetched via look/room)."""
        return self.last_output

    def get_active_quests(self) -> List[Tuple[str, str]]:
        """Return themed tuples: (quest_name_with_type, quest_description)."""
        quest_tuples: List[Tuple[str, str]] = []
        for quest in self.game.state.activated_quests:
            quest_type = "main" if quest.is_main() else "side"
            quest_name = f"[quest_name]{quest.name} ({quest_type})[/quest_name]"
            quest_tuples.append((quest_name, quest.description))
        return quest_tuples

    def get_completed_quests(self) -> List[Tuple[str, str]]:
        """Return themed tuples: (quest_name_with_type, completion_text)."""
        quest_tuples: List[Tuple[str, str]] = []
        for quest in self.game.state.completed_quests:
            quest_type = "main" if quest.is_main() else "side"
            quest_name = f"[quest_name]{quest.name} ({quest_type})[/quest_name]"
            completion_text = f"[dim]{quest.completion}[/dim]"
            quest_tuples.append((quest_name, completion_text))
        return quest_tuples

    def get_inventory(self) -> List[Tuple[str, str]]:
        """Return themed tuples: (possibly counted_item_name, item_description)."""
        item_tuples: List[Tuple[str, str]] = []
        inventory_summary = self.game.state.get_inventory_summary()

        # Create a set to track which items we've already processed
        processed_items = set()

        for item in self.game.state.inventory:
            item_name = item.get_name()
            if item_name in processed_items:
                continue  # Skip duplicates, we already processed this item type

            count = inventory_summary[item_name]
            if count > 1:
                styled_item_name = f"[item_name]{count} {item_name}[/item_name]"
            else:
                styled_item_name = f"[item_name]{item_name}[/item_name]"
            item_description = item.description
            item_tuples.append((styled_item_name, item_description))
            processed_items.add(item_name)

        return item_tuples

    def get_room(self) -> str:
        """Return themed current room description (includes exits/items/characters)."""
        return apply_theme(self.game.state.current_room.describe(self.game.state))

    def get_spells(self) -> List[Tuple[str, str]]:
        """Return themed tuples: (spell_name, description) for known spells."""
        spell_tuples: List[Tuple[str, str]] = []
        for spell in self.game.state.known_spells:
            spell_name = f"[spell_name]{spell.get_name()}[/spell_name]"
            spell_description = spell.description
            spell_tuples.append((spell_name, spell_description))
        return spell_tuples

    def save_game(self, name: str = 'retroquest') -> None:
        """Save the game state to the save slot identified by name."""
        self.game.save(name)

    def get_act_intro(self) -> str:
        """Get the act introduction text."""
        return self.game.get_act_intro()

    def look(self) -> str:
        """Execute the look command and return result."""
        return self.game.look()

    def complete_quest(self) -> Optional[str]:
        """Return completion popup payload if a quest just completed else None.

        Between acts this reports the finished act, whose last completion (usually
        its main quest) ends the act in the same turn.
        """
        state = self.game.finished_act_state or self.game.state
        if (quest := state.next_completed_quest()) is not None:
            quest_type = "main" if quest.is_main() else "side"
            return (
                f"[quest_name]{quest.name} ({quest_type} quest)"\
                f"[/quest_name]\n\n{quest.completion}"
            )
        return None

    def update_quest(self) -> Optional[str]:
        """Return update popup payload if a quest just updated else None."""
        if (quest := self.game.state.next_updated_quest()) is not None:
            quest_type = "main" if quest.is_main() else "side"
            return (
                f"[quest_name]{quest.name} ({quest_type} quest)"\
                f"[/quest_name]\n\n{quest.description}"
            )
        return None

    def activate_quest(self) -> Optional[str]:
        """Return activation popup payload if a quest just activated else None."""
        if not self.game.is_act_running():
            return None
        if (quest := self.game.state.next_activated_quest()) is not None:
            quest_type = "main" if quest.is_main() else "side"
            return (
                f"[quest_name]{quest.name} ({quest_type} quest)"\
                f"[/quest_name]\n\n{quest.description}"
            )
        return None

    def get_room_name(self) -> str:
        """Return the current room's display name."""
        return self.game.state.current_room.name

    def get_act_name(self) -> str:
        """Return the human-readable name of the current act, e.g. 'Act 1'."""
        return self.game.get_act_name()

    def get_quest_progress(self) -> dict[str, Any]:
        """Return quest progress for the current act as plain data.

        Keys: ``completed`` and ``total`` (quest counts, including quests not yet
        activated), ``act_number`` (1-based) and ``main_quest`` (the main quest's
        plain name, or None when the act has none). Between acts it still reports
        the act that just ended.
        """
        finished = self.game.finished_act_state
        state = finished or self.game.state
        act_index = self.game.current_act - 1 if finished else self.game.current_act
        all_quests = (
            state.non_activated_quests + state.activated_quests + state.completed_quests
        )
        main_quest = next((quest.name for quest in all_quests if quest.is_main()), None)
        return {
            "completed": len(state.completed_quests),
            "total": len(all_quests),
            "act_number": act_index + 1,
            "main_quest": main_quest,
        }

    def get_act_stats(self) -> dict[str, int]:
        """Return the act's statistics for its act-complete page as plain data.

        Keys: ``quests_completed`` and ``quests_total`` (as in get_quest_progress),
        ``spells`` (spells known) and ``places`` (rooms visited). Between acts it
        reports the act that just ended.
        """
        progress = self.get_quest_progress()
        state = self.game.finished_act_state or self.game.state
        return {
            "quests_completed": progress["completed"],
            "quests_total": progress["total"],
            "spells": len(state.known_spells),
            "places": len(state.visited_rooms),
        }

    def get_room_description(self) -> str:
        """Return the current room's narrative description text."""
        return self.game.state.current_room.description

    def get_room_characters(self) -> list[str]:
        """Return names of characters present in the current room."""
        return [
            c.get_name()
            for c in self.game.state.current_room.get_characters()
        ]

    def get_room_wares(self) -> list[tuple[str, int, str]]:
        """Return (ware name, price, seller name) for everything sold in the room.

        Merchants keep a ``wares`` mapping of name to ``{"item", "price"}``;
        other characters sell nothing.
        """
        wares: list[tuple[str, int, str]] = []
        for character in self.game.state.current_room.get_characters():
            for name, details in getattr(character, "wares", {}).items():
                wares.append((name, details["price"], character.get_name()))
        return wares

    def get_room_items(self) -> list[str]:
        """Return names of items visible in the current room."""
        return [
            item.get_name()
            for item in self.game.state.current_room.get_items()
        ]

    def get_short_names(self) -> dict[str, str]:
        """Return short item names (as the story uses them) mapped to full names.

        Covers the items in the inventory and in the current room whose short
        name differs from their name, e.g. ``{"journal": "Elior's Journal"}``.
        A short name shared by several items maps to the one the engine's own
        lookup (Game.find_item) picks: the inventory first, the first match.
        """
        items = self.game.state.inventory + self.game.state.current_room.get_items()
        short_names: dict[str, str] = {}
        for item in items:
            short = item.get_short_name().lower()
            if short != item.get_name().lower():
                short_names.setdefault(short, item.get_name())
        return short_names

    def get_room_exits(self) -> dict[str, str]:
        """Return direction to destination display name for the current room.

        Exits store internal room keys (e.g. 'VillageSquare'); the destination
        room's name ('Village Square') is shown instead, falling back to the key
        for rooms not in the current act.
        """
        rooms = self.game.state.all_rooms
        exits = self.game.state.current_room.get_exits(self.game.state)
        return {
            direction: rooms[key].name if key in rooms else key
            for direction, key in exits.items()
        }

    def load_game(self, name: str = 'retroquest') -> str:
        """Load the game state from the save slot identified by name."""
        return self.game.load(name)

    def is_game_running(self) -> bool:
        """Return True if the game is still running."""
        return self.game.is_running

    def is_act_running(self) -> bool:
        """Return True if the current act is in running state."""
        return self.game.is_act_running()

    def get_current_music(self) -> tuple[str, str]:
        """Return (music_file, music_info) for the current act when running.

        Returns ('', '') when the act is not yet in running state (e.g. during
        the logo or intro phases) so that the web frontend plays no music
        before the act has started.
        """
        if not self.game.is_act_running():
            return ('', '')
        act = self.game.acts[self.game.current_act]
        return (act.music_file, act.music_info)

    def play_soundeffect(self, filename: str) -> None:
        """Play a sound effect using the underlying Game's play_soundeffect method."""
        self.game.play_soundeffect(filename)
