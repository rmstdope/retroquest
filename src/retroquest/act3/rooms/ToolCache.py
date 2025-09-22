"""Tool Cache room for Act 3."""

from ...engine.Room import Room


class ToolCache(Room):
    """A reinforced alcove with crates of timbers, iron braces, and hemp rope."""
    def __init__(self) -> None:
        """Initialize Tool Cache with description and exits."""
        super().__init__(
            name="Tool Cache",
            description=(
                "A reinforced alcove with crates of timbers, iron braces, and hemp rope."
            ),
            items=[],
            characters=[],
            exits={"south": "CavernMouth", "east": "CollapsedGalleries"},
        )
