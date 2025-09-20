"""Quality Rope (Act II Utility / Rescue Item)

Narrative Role:
    Versatile traversal and rescue tool enabling resolution of vertical hazard scenarios (notably the ravine caravan rescue).

Key Mechanics / Interactions:
    - use() provides descriptive reminder; functional effect triggered via use_with(Ravine).
    - use_with sets FLAG_FOUND_LOST_CARAVAN, spawns Caravan item, and consumes the rope (removal from inventory) if rescue not previously performed.
    - Idempotent behavior: subsequent attempts report completion without re-spawning caravan.

Story Flags:
    - Sets: FLAG_FOUND_LOST_CARAVAN
    - Reads: FLAG_FOUND_LOST_CARAVAN (to prevent duplicate rescue logic)

Progression Effects:
    Advances lost caravan storyline, likely unlocking gratitude rewards, trade benefits, or reputation gains.

Design Notes:
    - Removes itself post-use to communicate commitment of resource; could later support multiple rope grades for expanded traversal system.
    - Unused FLAG_FOUND_RAVINE import removed (ravine discovery implicitly narrative, not flagged here).
"""

from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_FOUND_LOST_CARAVAN
from .Caravan import Caravan

class QualityRope(Item):
    def __init__(self) -> None:
        super().__init__(
            name="quality rope",
            short_name="rope",
            description="Fifty feet of strong, reliable rope suitable for climbing, securing loads, and emergency situations. The rope is treated to resist weather and magical corrosion.",
            can_be_carried=True,
        )

    def use(self, _game_state: GameState) -> str:
        # Default behavior - rope needs to be used with something specific
        return ("You examine the quality rope. It's well-made and versatile - useful for climbing, "
                "rappelling, securing equipment, or any situation where strong, reliable rope is needed. "
                "You need to use it with something specific, like a ravine or cliff.")

    def use_with(self, game_state: GameState, other_item) -> str:
        """Special method for using rope with other items like the ravine."""
        from .Ravine import Ravine  # Import here to avoid circular imports
        if isinstance(other_item, Ravine):
            # Check if caravan has already been secured
            if game_state.get_story_flag(FLAG_FOUND_LOST_CARAVAN):
                return ("[info]You've already used your rope to secure the caravan and help the merchants "
                        "escape from the ravine.[/info]")

            # Use the rope to rescue the caravan
            game_state.set_story_flag(FLAG_FOUND_LOST_CARAVAN, True)

            # Add the rescued caravan to the current room
            caravan = Caravan()
            game_state.current_room.items.append(caravan)

            # Remove the rope from inventory as it's used up in the rescue
            for item in list(game_state.inventory):  # Use list() to avoid modification during iteration
                if isinstance(item, QualityRope):
                    game_state.inventory.remove(item)
                    break

            return ("[success]You secure one end of your [item_name]Quality Rope[/item_name] to a "
                    "sturdy tree and lower it into the ravine. Rappelling down carefully, you find "
                    "the trapped merchant caravan at the bottom. The merchants are injured but alive, "
                    "and their wagon is damaged but some goods are salvageable. Working together, you "
                    "create a rope system that allows everyone to climb to safety. The grateful "
                    "merchants gather their most valuable goods and follow you back to civilization. "
                    "The caravan has been successfully rescued![/success]")
        return f"You can't use the rope with {other_item.get_name()}."
