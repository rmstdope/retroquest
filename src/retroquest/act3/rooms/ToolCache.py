"""Tool Cache room for Act 3."""


from ...engine.Room import Room
from ..items.SupplyCrate import SupplyCrate



class ToolCache(Room):
    """A reinforced alcove with a locked supply crate for the miners' rescue."""
    def __init__(self) -> None:
        """Initialize Tool Cache with supply crate and exits."""
        super().__init__(
            name="Tool Cache",
            description=(
                "A reinforced alcove with crates of timbers, iron braces, and hemp rope. "
                "A large supply crate sits against the wall, its padlock glinting in the dim light."
            ),
            items=[SupplyCrate()],
            characters=[],
            exits={"south": "CavernMouth", "east": "CollapsedGalleries"},
        )

    def search(self, _game_state, _target: str = None) -> str:
        """Describe the supply crate and hint at its importance."""
        return (
            "You search the alcove and find a heavy supply crate, locked with a large iron "
            "padlock. "
            "The label reads: 'Rescue Supplies — For Emergency Use Only.' If you had the "
            "right key, "
            "you could unlock it and retrieve the tools needed to help the trapped miners."
        )
