from ...engine.Room import Room


class ToolCache(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Tool Cache",
            description=(
                "A reinforced alcove with crates of timbers, iron braces, and hemp rope."
            ),
            items=[],
            characters=[],
            exits={"south": "CavernMouth", "east": "CollapsedGalleries"},
        )
