from ...engine.Room import Room

class HeartOfTheForest(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Heart of the Forest",
            description=(
                "The deepest part of the Enchanted Forest, where reality seems more fluid and magic flows like water. "
                "Impossible colors paint the landscape, and the very air sparkles with enchantment. At the center stands "
                "a magnificent tree whose branches seem to hold up the sky itself. This is Nyx's domain, where the forest "
                "sprite dwells and where the greatest secrets are revealed. The sacred grove that leads here is the only "
                "passage to this mystical realm."
            ),
            items=[],
            characters=[],
            exits={"north": "AncientGrove"}
        )
