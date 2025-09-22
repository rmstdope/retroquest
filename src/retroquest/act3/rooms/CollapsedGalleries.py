"""Module defining the CollapsedGalleries room in Act 3."""
from ...engine.Room import Room


class CollapsedGalleries(Room):
    """Passages pinched by fallen rock; dust motes hang in still air."""
    def __init__(self) -> None:
        super().__init__(
            name="Collapsed Galleries",
            description=(
                "Passages pinched by fallen rock; dust motes hang in still air."
            ),
            items=[],
            characters=[],
            exits={
                "south": "StillnessVestibule", 
                "east": "EchoChambers", 
                "west": "ToolCache"
            },
        )
