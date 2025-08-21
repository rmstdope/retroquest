from ...engine.GameState import GameState
from ...engine.Item import Item

class EnhancedLantern(Item):
    def __init__(self) -> None:
        super().__init__(
            name="enhanced lantern",
            description="A magically enhanced lantern that burns with bright, steady light. The enchantment allows it to illuminate hidden paths and reveal magical auras that would otherwise remain invisible.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        if game_state.current_room.name == "Forest Entrance":
            if not game_state.get_story_flag("enhanced_lantern_used_forest_entrance"):
                game_state.set_story_flag("enhanced_lantern_used_forest_entrance", True)
                return ("[item_effect]The Enhanced Lantern's crystal core pulses with magical energy, casting "
                       "ethereal blue light that reveals hidden paths through the dense undergrowth. The light "
                       "seems to resonate with the forest's natural magic, illuminating safe routes and warning "
                       "you away from dangerous areas. With this enhanced vision, you can navigate the forest "
                       "with confidence.[/item_effect]")
            else:
                return ("[info]The Enhanced Lantern continues to provide magical illumination, keeping "
                       "the forest paths clearly visible.[/info]")
        else:
            return "You activate the enhanced lantern. Its magical light pierces through darkness and can reveal hidden passages, magical traces, and secret paths that ordinary light cannot illuminate."