"""Reinforced Braces item for Miners' Rescue quest."""
from ...engine.Item import Item

class ReinforcedBraces(Item):
    """Heavy iron braces for stabilizing collapsed tunnels."""
    def __init__(self) -> None:
        super().__init__(
            name="Reinforced Braces",
            description="Heavy iron braces used to shore up unstable rock walls.",
            short_name="braces",
            can_be_carried=True,
        )
