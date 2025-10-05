"""Support Straps item for Miners' Rescue quest."""
from ...engine.Item import Item

class SupportStraps(Item):
    """Strong hemp straps for securing braces and debris."""
    def __init__(self) -> None:
        super().__init__(
            name="Support Straps",
            description="Strong hemp straps for binding braces and hauling debris.",
            short_name="straps",
            can_be_carried=True,
        )
