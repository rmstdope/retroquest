"""Mountain Flower (Act II Flavor / Minor Resource Item)

Narrative Role:
    Ambient collectible reinforcing biome identity along mountain routes. Currently ornamental with latent potential
    for future alchemical or offering systems.

Key Mechanics / Interactions:
    - use() yields descriptive feedback only; no flags or transformation.

Story Flags:
    - Sets/Reads: (none)

Progression Effects:
    None at present—may become a secondary ingredient or trade good later.

Design Notes:
    - Serves as low-stakes inventory occupant illustrating world richness.
    - Could gain rarity variants (e.g., dusk-bloom) introducing collection incentives.
"""

from ...engine.GameState import GameState
from ...engine.Item import Item

class MountainFlower(Item):
    def __init__(self) -> None:
        super().__init__(
            name="mountain flower",
            short_name="flower",
            description="A small but hardy wildflower that grows along the mountain paths. Its purple petals seem to shimmer slightly in the sunlight, though it appears to have no special properties.",
            can_be_carried=True,
        )

    def use(self, _game_state: GameState) -> str:
        return "You examine the mountain flower closely. It's quite pretty, but seems to be just an ordinary wildflower that's adapted to the harsh mountain climate."
