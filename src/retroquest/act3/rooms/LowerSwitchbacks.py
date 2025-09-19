from ...engine.Room import Room


class LowerSwitchbacks(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Lower Switchbacks (Base Camp)",
            description=(
                "Wind‑carved paths zig‑zag across black rock; canvas shelters flap and "
                "braziers glow low."
            ),
            items=[],
            characters=[],
            exits={"north": "ObsidianOutcrops", "east": "EmberGallery"},
        )
