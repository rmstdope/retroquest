"""River Item

Narrative Role:
Dynamic natural feature enabling fishing interactions and skill/knowledge gating (requires learned basics). Serves as a repeatable but state-limited resource source.

Key Mechanics / Interactions:
- `use_with` + `FishingRod` checks a story flag (`learned_fishing_basics`) before permitting catch.
- Single-catch logic via `fish_available` flag; subsequent attempts yield failure until reset (future extension).
- Updates description after fish caught (currently assigned with trailing comma—future cleanup candidate).

Story Flags (Sets / Reads):
- Reads: `learned_fishing_basics` (gates success)
- Sets: (none)

Progression Effects:
- Reinforces skill acquisition gating and natural resource harvesting loop.

Design Notes:
- Could introduce respawn timer or multiple fish types influenced by time-of-day or bait.
- Consider centralizing fishing logic if additional water bodies added.

"""

from ...engine.Item import Item
from .Fish import Fish # Assuming you have a Fish item

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ...engine.GameState import GameState

class River(Item):
    """
    Dynamic natural feature enabling fishing interactions and skill/knowledge gating.
    """

    def __init__(self) -> None:
        """Initialize the River item with name, description, and fish availability."""
        super().__init__(
            name="river",
            description="A gentle river, its waters flowing steadily. It looks like a good spot for fishing.",
            short_name="river",
        )
        self.fish_available = True

    def use_with(self, game_state: 'GameState', other_item: Item) -> str:
        """Use with FishingRod to catch fish if basics are learned, otherwise fail."""
        from .FishingRod import FishingRod
        if isinstance(other_item, FishingRod):
            if not game_state.get_story_flag("learned_fishing_basics"):
                return (
                    f"[failure]You have the [item_name]{other_item.get_name()}[/item_name], "
                    "but you're not quite sure how to fish effectively yet. Perhaps someone "
                    "could teach you.[/failure]"
                )
            if self.fish_available:
                game_state.add_item_to_inventory(Fish())
                self.fish_available = False
                self.description = (
                    "A gentle river, its waters flowing steadily. You've already fished here recently."
                )
                return (
                    f"[event]You cast your line into the [item_name]{self.get_name()}[/item_name] "
                    f"using the [item_name]{other_item.get_name()}[/item_name]. After a moment, "
                    "you feel a tug and reel in a plump [item_name]fish[/item_name]![/event]\n"
                    "You add the fish to your inventory."
                )
            else:
                return (
                    "[failure]You cast your line again, but the fish aren't biting right now.[/failure]"
                )
        else:
            return super().use_with(game_state, other_item)
