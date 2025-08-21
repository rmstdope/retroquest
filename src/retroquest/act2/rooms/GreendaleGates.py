from ...engine.Room import Room

class GreendaleGates(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Greendale Gates",
            description=(
                "A magnificent stone archway marks the entrance to Greendale, the largest settlement you've encountered. "
                "Guards in polished mail stand watch, their banners fluttering in the mountain breeze. Beyond the gates, "
                "cobblestone streets wind between well-built stone houses and bustling shops. The air carries the sounds "
                "of commerce and conversation - a stark contrast to Willowbrook's quiet charm."
            ),
            items=[],
            characters=[],
            exits={"south": "MountainPath", "north": "MainSquare"}
        )
