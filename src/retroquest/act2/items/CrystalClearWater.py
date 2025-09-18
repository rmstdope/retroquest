"""Crystal-Clear Water (Act II Purification Item)

Narrative Role:
    Blessed spring water holding potent cleansing magic capable of breaking curses (notably Barmaid Elena's affliction).
    Embodies purity motif and a branching resolution vector for corruption narratives.

Key Mechanics / Interactions:
    - use_on_character() checks for BarmaidElena instance and delegates purification to character method.
    - Non-targeted application yields contextual feedback clarifying specificity.
    - examine() reinforces sanctity and latent power.

Story Flags:
    - Sets/Reads: (none directly; any curse resolution flags handled within character logic).

Progression Effects:
    Key consumable enabling advancement/closure of a healing or curse-lifting quest line.

Design Notes:
    - Consider single-use consumption mechanics (removal) once purification succeeds to reflect scarcity.
    - Potential future synergy: amplify other healing spells while possessed.
"""

from ...engine.Item import Item
from ...engine.GameState import GameState

class CrystalClearWater(Item):
    def __init__(self) -> None:
        super().__init__(
            name="crystal-clear water",
            short_name="water",
            description=(
                "Water from the sacred spring in the Whispering Glade, this liquid is "
                "so pure it seems to glow with its own inner light. The water has been "
                "blessed by the water nymphs and carries powerful purification magic "
                "that can break curses and cleanse dark enchantments. Each drop sparkles "
                "like liquid starlight, and the container feels cool to the touch."
            ),
            can_be_carried=True,
        )

    def use_on_character(self, game_state: GameState, target_character) -> str:
        """Use crystal-clear water on a character to purify them."""
        from ..characters.BarmaidElena import BarmaidElena  # Import here to avoid circular imports
        
        # Special handling for Elena's curse purification
        if isinstance(target_character, BarmaidElena):
            return target_character.receive_crystal_water_purification(game_state)
        else:
            return (f"The [item_name]crystal-clear water[/item_name] glows faintly when near "
                    f"[character_name]{target_character.get_name()}[/character_name], but it seems "
                    f"this blessed water is meant for someone specifically afflicted by dark magic.")

    def examine(self, game_state: GameState) -> str:
        return ("[event]You examine the [item_name]crystal-clear water[/item_name]. {0} "
                "The liquid moves with an otherworldly fluidity, and you can sense the "
                "powerful purification magic contained within. This water could break "
                "even the strongest curses.[/event]".format(self.description))
