"""OldOathScrolls item for the Dragon's Hall in Act 3."""
from ...engine.Item import Item


class OldOathScrolls(Item):
    """Ancient scrolls containing binding oaths from ages past."""

    def __init__(self) -> None:
        """Initialize OldOathScrolls as a collectible item."""
        super().__init__(
            name="old oath scrolls",
            description=(
                "Weathered parchment scrolls bound with golden thread, inscribed "
                "with vows and pledges in languages both ancient and forgotten. "
                "The words pulse faintly with residual magic."
            ),
            can_be_carried=True
        )
