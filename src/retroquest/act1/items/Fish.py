
"""Plump river fish, can be carried as food or a gift."""
from ...engine.Item import Item

class Fish(Item):
    """
    Plump river fish, can be carried as food or a gift.
    """

    def __init__(self) -> None:
        """Initialize the Fish item with name, description, and carry status."""
        super().__init__(
            name="fish",
            description="A plump river fish. It looks fresh and would make a good meal or perhaps a gift.",
            can_be_carried=True
        )
