from ...engine.Room import Room

class HiddenLibrary(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Hidden Library",
            description=(
                "Discovered beneath Greendale through a secret passage, this ancient library contains countless volumes "
                "of magical lore. Glowing crystals provide soft illumination, and the air hums with residual magic. "
                "Protective enchantments shimmer around the most valuable texts. This repository of knowledge holds "
                "secrets that could unlock the mysteries of your destiny."
            ),
            items=[],
            characters=[],
            exits={"secret_passage": "ResidentialQuarter"}
        )
