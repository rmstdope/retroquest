from ...engine.GameState import GameState
from ...engine.Room import Room
from ..items import Locker, RustedLockerKey


class CollapsedPier(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Collapsed Pier",
            description=(
                "A shattered jetty with sunken vaults beneath; barnacled beams jut like ribs."
            ),
            items=[Locker()],
            characters=[],
            exits={"south": "SanctumOfTheTide", "west": "OuterWards"},
        )

    def search(self, game_state: GameState, _target: str = None) -> str:
        # If key already present or in inventory, return idempotent vault description
        if any(isinstance(i, RustedLockerKey) for i in self.items) or any(
            isinstance(i, RustedLockerKey) for i in game_state.inventory
        ):
            return (
                "[event]You peer again beneath the shattered planks. The flooded vault "
                "yawns below, its corroded locker still visible—but you've already "
                "recovered the key you'll need.[/event]"
            )
        # Reveal vault and place rusted locker key to be taken
        self.items.append(RustedLockerKey())
        return (
            "[event]Between barnacled beams you find a flooded vault. A corroded locker "
            "is wedged within, its lock fused with salt. A [item_name]Rusted Locker "
            "Key[/item_name] lies caught in a tangle of netting nearby.[/event]"
        )
