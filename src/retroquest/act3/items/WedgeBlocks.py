"""Wedge Blocks item for Miners' Rescue quest."""
from ...engine.Item import Item

class WedgeBlocks(Item):
    """Tapered wooden blocks for prying and stabilizing rockfalls."""
    def __init__(self) -> None:
        super().__init__(
            name="Wedge Blocks",
            description="Tapered wooden blocks used to pry and stabilize fallen rock.",
            short_name="wedges",
            can_be_carried=True,
        )
