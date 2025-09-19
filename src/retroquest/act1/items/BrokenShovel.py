from ...engine.GameState import GameState
from ...engine.Item import Item

class BrokenShovel(Item):
    """Derelict digging tool hinting at future repair or crafting systems.

    Purpose:
        Flavor item that suggests environmental interaction (digging) without granting the
        capability yet. Sets expectation for tool restoration or upgrade later.

    Design Notes:
        Could be repairable at the forge or combined with a handle component to produce a
        functional digging tool enabling access to buried objects / flags.
    """

    def __init__(self) -> None:
        super().__init__(
            name="broken shovel",
            description=(
                "A rusty, splintered shovel with a cracked wooden handle. It looks like it "
                "hasn't been used in years, but might still be useful for digging in soft "
                "earth."
            ),
            short_name="shovel",
            can_be_carried=True,
        )
