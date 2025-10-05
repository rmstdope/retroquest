"""EchoStones item for the Stillness Vestibule in Act 3."""
from ...engine.Item import Item
from ...engine.GameState import GameState


class EchoStones(Item):
    """Sacred stones that amplify the resonant chant when blessed."""

    def __init__(self) -> None:
        """Initialize EchoStones as an immovable feature."""
        super().__init__(
            name="echo stones",
            description=(
                "Three weathered stones arranged in a triangle, each one carved "
                "with spiraling channels that catch and hold whispered words."
            ),
            can_be_carried=False
        )
        self._blessed = False

    def receive_spell(self, spell_name: str, _game_state: GameState) -> str:
        """Handle bless spell cast on the echo stones."""
        if spell_name == "bless" and not self._blessed:
            self._blessed = True
            return (
                "[event]The echo stones shimmer with sacred light, their carved "
                "channels now glowing faintly. They are ready to amplify the "
                "resonant chant.[/event]"
            )
        elif spell_name == "bless" and self._blessed:
            return "[info]The echo stones are already blessed.[/info]"
        else:
            return f"[failure]The {spell_name} spell has no effect on the echo stones.[/failure]"

    def are_blessed(self) -> bool:
        """Check if the echo stones have been blessed."""
        return self._blessed