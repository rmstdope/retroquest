"""Fumarole Passages room for Act 3."""

from ...engine.Room import Room


class FumarolePassages(Room):
    """Narrow tunnels exhaling rhythmic heat like a great sleeping bellows."""
    def __init__(self) -> None:
        """Initialize Fumarole Passages with description and exits."""
        super().__init__(
            name="Fumarole Passages",
            description=(
                "Narrow tunnels exhale a rhythmic, breath-like heat; stone vents chuff "
                "and sigh as if the mountain itself sleeps and dreams. Curtains of "
                "steam veil the low passages, and the air tastes faintly of sulfur "
                "and warm metal. Here and there a vent hisses sparks that glass the "
                "rock into smoky, translucent streaks, while the floor bears the "
                "pale scars of old fittings—tiny holes and rubbed brass where mounts "
                "were once bolted. Each step sends a warm gust that carries a distant "
                "clink of metal and the steady, low sigh of fumaroles farther below."
            ),
            items=[],
            characters=[],
            exits={"south": "PhoenixCrater", "west": "MirrorTerraces"},
        )
