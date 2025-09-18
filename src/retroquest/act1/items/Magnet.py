"""Magnet Item

Narrative Role:
Simple component item suggesting utility in retrieval puzzles and crafting/combination with tools (fishing rod) to extend reach capability.

Key Mechanics / Interactions:
- When used with `FishingRod`, delegates to the rod to handle upgrade logic (keeps combination rules centralized in primary tool).

Story Flags (Sets / Reads):
(none)

Progression Effects:
- Part of upgrade chain enabling metallic object retrieval from depth (well ring via extended variants later).

Design Notes:
- Minimal own logic; intentionally lean to reduce maintenance duplication across reciprocal `use_with` paths.

"""

from ...engine.Item import Item

class Magnet(Item):
    def __init__(self) -> None:
        super().__init__(
            name="magnet",
            description="A small, surprisingly strong magnet. It might be useful for retrieving metallic objects from hard-to-reach places.",
            can_be_carried=True
        )

    def use_with(self, game_state, other_item: Item) -> str:
        from .FishingRod import FishingRod
        if isinstance(other_item, FishingRod):
            # Delegate to FishingRod's use_with
            return other_item.use_with(game_state, self)
        return super().use_with(game_state, other_item)
