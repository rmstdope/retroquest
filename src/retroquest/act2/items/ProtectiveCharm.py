"""Protective Charm (Act II Item)

Narrative Role:
    Spiritual warding component of the dual gating pair (with Enhanced Lantern) enabling safe traversal into
    deeper enchanted forest zones. Represents accord with forest spirits and hermit's sanctioned protection.

Key Mechanics / Interactions:
    - Context-sensitive use only at ForestEntrance sets FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE.
    - Emits a synergy success message if the enhanced lantern flag is already active (mirrors lantern behavior).
    - Generic use elsewhere gives atmospheric feedback (reinforces location specificity).
    - Provides delegation through use_with to OfferingAltar enabling multi-charm summoning ritual for Nyx.

Story Flags:
    - Sets: FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE
    - Reads: FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE (to conditionally append synergy messaging)

Progression Effects:
    One half of the ForestEntrance dual-item requirement that reveals additional forest exits when both flags are set.
    Also a ritual component for summoning Nyx (alongside DruidicCharm and NaturesCharm) via OfferingAltar.

Design Notes:
    - Maintains single responsibility: gating vs. ritual handled via contextual vs. use_with pathways.
    - Delegation pattern avoids circular ritual logic inside each charm, centralizing multi-item validation in OfferingAltar.
    - Could be extended with durability or charge systems if future design wants repeatable protective effects.
"""

from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE, FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE
from ...engine.GameState import GameState

class ProtectiveCharm(Item):
    def __init__(self) -> None:
        super().__init__(
            name="protective charm",
            short_name="charm",
            description=(
                "A small talisman woven from forest vines and blessed by ancient magic. It pulses with a gentle "
                "green light and carries the protective power of the deep woods. This charm will ward off hostile "
                "forest spirits and mark the bearer as one under the hermit's protection."
            ),
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        from ..rooms.ForestEntrance import ForestEntrance  # Import here to avoid circular imports
        
        if isinstance(game_state.current_room, ForestEntrance):
            if not game_state.get_story_flag(FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE):
                game_state.set_story_flag(FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE, True)
                result = ("[spell_effect]The Protective Charm radiates a warm, golden light as you invoke its power. "
            "A shimmering barrier of spiritual energy surrounds you, and you feel the watchful "
            "gaze of the forest spirits become less threatening. The ancient magic recognizes "
            "your respect and preparation, granting you safe passage through these sacred "
            "woods.[/spell_effect]")
                
                # Check if both protective charm and enhanced lantern have been used
                if game_state.get_story_flag(FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE):
                    result += (
                        "\n\n[success]With both the protective charm's spiritual barrier and the enhanced "
                        "lantern's magical illumination active, the forest's deeper paths are now revealed and "
                        "safe to travel. You can now venture deeper into the enchanted woods.[/success]"
                    )
                
                return result
            else:
                return (
                    "[info]The Protective Charm's energy still surrounds you, providing continued spiritual "
                    "protection in this mystical place.[/info]"
                )
        else:
            return (
                "The [item_name]protective charm[/item_name] glows softly, providing a sense of comfort and "
                "protection. It seems most powerful near places of natural magic."
            )

    def use_with(self, game_state: 'GameState', other_item) -> str:
        """Use the protective charm with another item."""
        from ..items.OfferingAltar import OfferingAltar
        
        if isinstance(other_item, OfferingAltar):
            # Delegate to the offering altar's use_with method
            return other_item.use_with(game_state, self)
        else:
            return super().use_with(game_state, other_item)
