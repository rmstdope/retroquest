"""Protective Enchantments (Act II Environmental Item)

Narrative Role:
    Environmental magical barrier inside the ancient library signifying restricted knowledge protection.
    Serves as visual / interactive indicator that restoration work is required before accessing deeper lore.

Key Mechanics / Interactions:
    - Non-carriable static item; player cannot pick up or directly use (examine driven interaction).
    - examine() output branches based on FLAG_MENDED_LIBRARY_ENCHANTMENTS to reflect repair progress.
    - use_item() overridden to supply clarifying feedback about non-usability.

Story Flags:
    - Reads: FLAG_MENDED_LIBRARY_ENCHANTMENTS
    - Sets: (none) — state mutation performed elsewhere by restoration quest logic/spells.

Progression Effects:
    Feedback surface for completion of library restoration tasks prerequisite to accessing certain texts (e.g., AncientChronicle study gating).

Design Notes:
    - Pure presentation layer; keeps narrative clarity without embedding quest logic here.
    - Pattern for other environmental magical constructs (wards, seals, barriers) emphasizing examine() state reflection.
"""

from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_MENDED_LIBRARY_ENCHANTMENTS
from ...engine.GameState import GameState

class ProtectiveEnchantments(Item):
    def __init__(self) -> None:
        super().__init__(
            name="protective enchantments",
            short_name="enchantments",
            description=(
                "Shimmering magical barriers that surround the most valuable texts in the ancient library. "
                "These enchantments appear to be damaged by time, with flickering energy and weak points "
                "that suggest they need repair. The ancient magic that protects this knowledge requires "
                "restoration before the texts can be safely accessed."
            ),
            can_be_carried=False,
        )

    def examine(self, game_state: GameState) -> str:
        if game_state.get_story_flag(FLAG_MENDED_LIBRARY_ENCHANTMENTS):
            return ("The [item_name]protective enchantments[/item_name] now glow steadily with restored power. "
                    "The magical barriers around the most valuable texts have been successfully repaired, "
                    "allowing access to the ancient knowledge within.")
        else:
            return ("The [item_name]protective enchantments[/item_name] flicker weakly, showing clear signs "
                    "of damage from the passage of time. These ancient magical barriers need to be repaired "
                    "with restoration magic before they can properly protect the library's most precious texts.")

    def use_item(self, _game_state: GameState) -> str:
        return "[info]The protective enchantments are magical barriers, not something you can use directly.[/info]"