"""Camp Site (Act II Environmental Discovery Item)

Narrative Role:
    Abandoned resting point that rewards attentive exploration with an Entry Pass find, reinforcing early-game
    preparation and world lived-in texture.

Key Mechanics / Interactions:
    - Non-carriable; single-use examination spawns an EntryPass into the room (idempotent via self.examined flag).
    - use() delegates to examine() if not yet searched to streamline player interaction.

Story Flags:
    - Sets/Reads: (none) — discovery handled locally without global progression dependency.

Progression Effects:
    Provides alternate acquisition path for city access credential (Entry Pass) if player missed another source.

Design Notes:
    - Could later track discovery via a FLAG_FOUND_CAMP_SITE for completion metrics; currently intentionally lean.
    - Pattern reusable for other micro-discovery nodes (e.g., caches, shrines) with minimal boilerplate.
"""

from ...engine.GameState import GameState
from ...engine.Item import Item

class CampSite(Item):  # pylint: disable=too-few-public-methods
    """Abandoned rest node offering single hidden item discovery (entry pass)."""

    def __init__(self) -> None:
        super().__init__(
            name="camp site",
            short_name="camp",
            description=(
                "A small clearing off the main path where travelers often rest. Signs "
                "of recent use remain—a fire pit with cold ashes and scattered "
                "belongings suggesting a hurried departure."
            ),
            can_be_carried=False,
        )
        self.examined = False

    def examine(self, game_state: GameState) -> str:  # type: ignore[override]
        if self.examined:
            return (
                "You've already thoroughly examined the camp site. There's nothing more "
                "to find here."
            )
        self.examined = True
        from .EntryPass import EntryPass
        entry_pass = EntryPass()
        game_state.current_room.add_item(entry_pass)
        return (
            "You carefully examine the abandoned camp site. Hidden under leaves near the "
            "fire pit you discover an [item_name]entry pass[/item_name] to Greendale—likely "
            "dropped by a prior traveler in haste.\n\n[event]You found an "
            "[item_name]entry pass[/item_name]![/event]"
        )

    def use(self, game_state: GameState) -> str:  # type: ignore[override]
        if not self.examined:
            return self.examine(game_state)
        return (
            "The camp site has been thoroughly examined. You could rest here if needed, "
            "but there's nothing more to discover."
        )
