from ...engine.Room import Room

class ForestTransition(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Forest Transition",
            description=(
                "The boundary between the civilized mountain paths and the wild Enchanted Forest. Ancient standing stones "
                "mark the threshold, covered in moss and carved with protective runes that seem to pulse with faint magic. "
                "The air grows thicker here, and you can sense the forest's ancient power awakening. Beyond lies a realm "
                "where normal rules may not apply."
            ),
            items=[],
            characters=[],
            exits={"west": "MountainPath", "east": "ForestEntrance"}
        )
