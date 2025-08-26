from ...engine.Item import Item
from ...engine.GameState import GameState

class BoundaryStoneFragment(Item):
    def __init__(self) -> None:
        super().__init__(
            name="boundary stone fragment",
            short_name="fragment",
            description=(
                "A piece of ancient stone carved with druidic runes that pulse with faint magical energy. "
                "This fragment was broken from one of the standing stones that mark the boundary between "
                "the civilized world and the Enchanted Forest. It resonates with the old magic that once "
                "protected these sacred thresholds."
            ),
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        current_room = game_state.current_room.name
        if "forest" in current_room.lower():
            return ("[success]You hold the [item_name]boundary stone fragment[/item_name] in your hands. "
                   "The ancient runes glow brighter as they resonate with the forest's magical energy. "
                   "The fragment helps you sense the old druidic pathways that wind through these ancient "
                   "woods, making navigation safer and revealing hidden routes.[/success]")
        else:
            return ("The [item_name]boundary stone fragment[/item_name] feels warm to the touch, but its "
                   "magical properties seem dormant here. It would likely be more useful in areas of "
                   "natural magic, especially the forest.")
