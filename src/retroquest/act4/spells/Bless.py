"""Bless spell - purifies and frees those bound by dark magic."""

from ...engine.Spell import Spell
from ...engine.GameState import GameState
from ...engine.Character import Character


class Bless(Spell):
    """A spell that channels divine energy to purify and free the corrupted."""

    def __init__(self) -> None:
        """Initialize the Bless spell."""
        super().__init__(
            name="bless",
            description=(
                "Channels divine energy to purify corruption, break dark enchantments, "
                "and free those bound by shadow magic."
            )
        )

    def cast_spell(self, game_state: GameState) -> str:
        """Cast bless spell without a specific target."""
        # Check if the current room has a cast_bless method and call it
        if hasattr(game_state.current_room, 'cast_bless'):
            return game_state.current_room.cast_bless(game_state)
        else:
            return (
                "[event]You channel divine energy, filling the area with warm, golden "
                "light, but there is nothing here that responds to the blessing.[/event]"
            )

    def cast_on_character(self, game_state: GameState, target_character: Character) -> str:
        """Cast bless spell on a specific character."""
        if "servant" in target_character.get_name().lower():
            # Special handling for servants
            if hasattr(game_state.current_room, 'cast_bless'):
                return game_state.current_room.cast_bless(game_state)
            else:
                return (
                    "[event]You channel blessing energy toward the servants, but "
                    "the magic seems unable to reach them fully here.[/event]"
                )
        else:
            return (
                f"[event]You bless [character_name]{target_character.get_name()}[/character_name] "
                "with divine energy, causing them to glow briefly with golden light.[/event]"
            )