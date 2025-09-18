"""Forest Survival Kit (Act II Item)

Narrative Role:
    Core preparation item for the forest phase. Represents the player's readiness after heeding the hermit's
    warning and formalizes the transition from urban preparation (Greendale) to wilderness exploration.

Key Mechanics / Interactions:
    - Usable only in the ForestTransition room for its special effect; elsewhere provides a descriptive reminder.
    - On successful use (in ForestTransition) sets FLAG_HERMITS_WARNING_COMPLETED and is immediately removed
      from the inventory (single‑use consumable representing unpacking & equipping its contents).
    - Confers no persistent object after use; its effect is encoded entirely via the story flag.

Story Flags:
    - Sets: FLAG_HERMITS_WARNING_COMPLETED
    - Reads: (none directly)

Progression Effects:
    Completes the hermit's preparation arc, allowing narrative justification for entering deeper forest biomes.
    Other forest gating (e.g., dual-item gate at ForestEntrance) is orthogonal and handled by separate items.

Design Notes:
    - Flag driven; no partial state tracking needed—either preparation is complete or not.
    - Removal ensures inventory clarity (prevents player re-using or questioning lingering utility).
    - Future extensibility: could evolve into a container yielding sub-items instead of a pure flag trigger if
      later design wants granular survival systems.
"""

from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_HERMITS_WARNING_COMPLETED

class ForestSurvivalKit(Item):
    def __init__(self) -> None:
        super().__init__(
            name="forest survival kit",
            short_name="kit",
            description="A comprehensive kit containing everything needed for safe forest exploration: dried food, water purification tablets, protective gear, a compass, and magical wards against forest spirits.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        from ..rooms.ForestTransition import ForestTransition  # Import here to avoid circular imports
        
        # Check if we're in Forest Transition for special handling
        current_room = game_state.current_room
        if isinstance(current_room, ForestTransition):
            game_state.set_story_flag(FLAG_HERMITS_WARNING_COMPLETED, True)
            
            # Remove the forest survival kit from inventory after successful use
            game_state.remove_item_from_inventory("forest survival kit")
            
            return (f"[success]You open the [item_name]{self.get_name()}[/item_name] and spread its contents. "
                    "The compass points true north, the protective gear fits snugly, "
                    "and the dried rations remind you to prepare for a long journey. Most importantly, you "
                    "study the forest map, learning the locations of safe camping spots and which areas to avoid. "
                    "You feel much more prepared for wilderness survival and equipped yourself with the essential "
                    "gear from the kit. You can now safely enter the forest.[/success]")
        
        # Default behavior for other rooms
        return "You examine the forest survival kit. It contains high-quality gear that would provide essential protection and tools for navigating dangerous forest areas safely. Now is not the time to use it."
    