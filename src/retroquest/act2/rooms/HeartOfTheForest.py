from ...engine.Room import Room
from ..items.OfferingAltar import OfferingAltar

class HeartOfTheForest(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Heart of the Forest",
            description=(
                "The deepest part of the Enchanted Forest, where reality seems more fluid and magic flows like water. "
                "Impossible colors paint the landscape, and the very air sparkles with enchantment. At the center stands "
                "a magnificent tree whose branches seem to hold up the sky itself. Before the great tree sits an ancient "
                "offering altar, carved from a single piece of starstone and adorned with mystical runes that pulse with "
                "otherworldly light. This is Nyx's domain, where the forest sprite dwells and where the greatest secrets "
                "are revealed. The sacred grove that leads here is the only passage to this mystical realm."
            ),
            items=[OfferingAltar()],
            characters=[],
            exits={"north": "AncientGrove"}
        )
