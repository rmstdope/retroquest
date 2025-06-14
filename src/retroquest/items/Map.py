from .Item import Item

class Map(Item):
    def __init__(self):
        super().__init__(
            name="Map",
            description="A detailed map of Willowbrook and the surrounding areas. It shows various landmarks and paths, some of which are not immediately obvious.",
            category="tool"
        )

    def use(self, game_state, player) -> str:
        # In a real scenario, this might change game state or reveal new exits.
        # For now, it just returns a descriptive message.
        if game_state.current_room_id == "road_to_greendale":
            # This is the specific check for completing Act I as per RoomsAct1.md
            game_state.set_flag("act_i_completed", True)
            return "The map aligns with the landscape, revealing a hidden path that shortens the journey to Greendale. You feel a sense of accomplishment as you set forth. (Act I Completed)"
        return "You study the map. It depicts the local area with surprising detail."
