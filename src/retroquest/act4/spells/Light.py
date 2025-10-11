"""Light spell - illuminates dark areas and dispels shadow magic."""

from ...engine.Spell import Spell
from ...engine.GameState import GameState
from ...engine.Item import Item


class Light(Spell):
    """A spell that creates brilliant light to dispel darkness and shadow magic."""

    def __init__(self) -> None:
        """Initialize the Light spell."""
        super().__init__(
            name="light",
            description=(
                "Creates a brilliant burst of pure light that illuminates dark areas "
                "and can dispel shadow magic or reveal hidden objects."
            )
        )

    def cast_spell(self, game_state: GameState) -> str:
        """Cast light spell without a specific target."""
        # Check if the current room has a light method and call it
        if hasattr(game_state.current_room, 'light'):
            return game_state.current_room.light(game_state)
        else:
            return (
                "[event]You create a brilliant sphere of light that illuminates the "
                "area around you, but there is nothing here that responds to the light.[/event]"
            )

    def cast_on_item(self, game_state: GameState, target_item: Item) -> str:
        """Cast light spell on a specific item."""
        if target_item.get_name().lower() in ["ward stones", "ward stone"]:
            # Special handling for ward stones in Fortress Gates
            if hasattr(game_state.current_room, 'light'):
                return game_state.current_room.light(game_state)
            else:
                return (
                    "[event]You direct light at the ward stones, causing them to pulse "
                    "and flicker, but nothing more happens.[/event]"
                )
        else:
            return (
                f"[event]You shine light on the [item_name]{target_item.get_name()}[/item_name], "
                "illuminating it clearly, but the light has no special effect.[/event]"
            )
