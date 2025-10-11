"""Mirror Labyrinth room: a maze of truth and lies requiring wisdom to navigate."""

from ...engine.Room import Room


class MirrorLabyrinth(Room):
    """An enchanted maze where reality bends and truth becomes elusive.

    Narrative Role:
        Tests player's ability to discern truth from deception.

    Key Mechanics:
        Requires echo stone knowledge and truth sight to navigate properly.

    Story Flags:
        Multi-visit location: initial exploration, then completion with proper tools.

    Contents:
        - Items: Mirror shard, Ancient iron key.
        - Characters: Reflections and illusions that mislead travelers.

    Design Notes:
        Central puzzle requiring information from multiple other locations.
    """

    def __init__(self) -> None:
        """Initialize the Mirror Labyrinth with its bewildering reflections."""
        super().__init__(
            name="Mirror Labyrinth",
            description=(
                "Endless corridors of gleaming mirrors stretch in impossible directions, "
                "each surface reflecting not just your image but fragments of possible "
                "futures and buried memories. The reflections move independently, some "
                "beckoning you forward while others shake their heads in warning. Crystal "
                "facets catch phantom light from unseen sources, creating a kaleidoscope "
                "of truth and deception that makes your head spin and your heart race."
            ),
            items=[],
            characters=[],
            exits={"south": "OuterCourtyard"}
        )
