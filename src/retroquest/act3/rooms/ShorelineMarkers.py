from ...engine.GameState import GameState
from ...engine.Room import Room
from ..items import CoquinaRunes, Steles


class ShorelineMarkers(Room):
    """Shore location with weathered steles containing searchable coquina runes."""

    def __init__(self) -> None:
        super().__init__(
            name="Shoreline Markers",
            description=(
                "Weathered stone steles stand at the surf's edge, carved with coquina runes "
                "encrusted in coral."
            ),
            items=[Steles()],
            characters=[],
            exits={"south": "TidalCauseway", "east": "OuterWards"},
        )

    def search(self, game_state: GameState, _target: str = None) -> str:
        """Search the steles to find coquina runes for ward construction."""
        # If runes already present either in room or inventory, return idempotent message
        already_here = any(isinstance(i, CoquinaRunes) for i in self.items)
        already_owned = any(isinstance(i, CoquinaRunes) for i in game_state.inventory)
        if already_here or already_owned:
            return (
                "[event]You comb the surf-slick stones again. Coquina fragments gleam in the "
                "cracks, but you've already gathered what you need.[/event]"
            )
        # Reveal runes
        self.items.append(CoquinaRunes())
        return (
            "[event]You brush aside kelp and barnacle crusts. A cluster of coquina rune "
            "tiles comes free—salt-white and ready to set into ward pillars.[/event]"
        )
