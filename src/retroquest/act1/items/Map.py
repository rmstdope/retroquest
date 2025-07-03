from ...engine.Item import Item
from ...engine.GameState import GameState

class Map(Item):
    def __init__(self):
        super().__init__(
            name="map",
            description="A detailed map of Willowbrook and the surrounding areas. It shows various landmarks and paths, some of which are not immediately obvious.",
            can_be_carried=True
        )

    def use(self, game_state: GameState) -> str:
        # In a real scenario, this might change game state or reveal new exits.
        # For now, it just returns a descriptive message.
        if game_state.current_room.name.lower() == "road to greendale":
            # This is the specific check for completing Act I as per RoomsAct1.md
            game_state.set_story_flag("act_1_completed", True)
            return f"[event]You use the map.[/event]\nThe [item_name]{self.get_name()}[/item_name] aligns with the landscape, revealing a hidden path that shortens the journey to Greendale. You feel a sense of accomplishment as you set forth. (Act I Completed)"
        return f"[event]You study the [item_name]{self.get_name()}[/item_name]. It depicts the local area with surprising detail.[/event]"
