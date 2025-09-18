from ...engine.Room import Room


class ObsidianOutcrops(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Obsidian Outcrops",
            description=(
                "Needle‑sharp obsidian towers; mirror fragments glint from crevices."
            ),
            items=[],
            characters=[],
            exits={"south": "LowerSwitchbacks", "east": "MirrorTerraces"},
        )
