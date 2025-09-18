"""Sword Item

Narrative Role:
Found or purchased early as a foundational combat/heroism symbol. Provides flavor and potential future combat stat hooks without current mechanical modifiers.

Key Mechanics / Interactions:
- Standard equip/examine/use messaging; no durability or combat math yet.
- `equip` provides atmospheric confirmation; could later apply stat bonuses via `GameState` or player attributes.

Story Flags (Sets / Reads):
(none) – No direct progression gating presently.

Progression Effects:
- Signals preparedness for future threats; psychologically rewards acquisition even before combat is implemented.

Design Notes:
- Separation of `use` and `equip` retains flexibility for future differentiation (e.g., `use` could perform context-sensitive actions while equipped state persists).
- Could add `is_equipped` property if engine or character stats expand.

"""

from ...engine.Item import Item
from ...engine.GameState import GameState

class Sword(Item):
    def __init__(self) -> None:
        super().__init__(
            name="sword",
            description="A well-balanced iron sword with a sharp edge. The blade gleams with a faint sheen, and the leather-wrapped handle feels comfortable in your grip.",
            short_name="sword"
        )

    def prevent_pickup(self) -> str | None:
        """Shopkeeper prevents taking the sword unless it's been purchased."""
        if not self.can_be_carried_flag:
            return f"[character_name]Shopkeeper[/character_name] quickly steps over. [dialogue]'Hold on there, friend! That [item_name]{self.get_name()}[/item_name] is merchandise, not a free sample. If you want it, you'll need to buy it proper-like.'[/dialogue]"
        return None  # Allow pickup if can_be_carried is True

    def use(self, game_state: GameState) -> str:
        return "[event]You examine the [item_name]sword[/item_name]. It feels perfectly balanced and ready for combat.[/event]"

    def equip(self, game_state: GameState) -> str:
        return "[event]You grip the [item_name]sword[/item_name] firmly. You feel more confident and prepared for any threats.[/event]"

    def examine(self, game_state: GameState) -> str:
        return "[event]You examine the [item_name]sword[/item_name]. " + self.description + "[/event]"
