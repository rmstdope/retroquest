from ..items.Item import Item

class Lantern(Item):
    def __init__(self) -> None:
        super().__init__(
            name="lantern",
            description="A well-used brass lantern. Its glass is clean and the wick is fresh, ready to light up the darkest corners."
        )

    def use(self, game_state) -> str:
        """Lights the lantern if it's not already lit, changing its name, and reveals bread and the journal in the current room."""
        action_taken_message = ""

        if self.name == "lantern":  # If it's not lit yet
            self.name = "lantern (lit)"
            self.short_name = "lantern"  # Update short_name as well
            action_taken_message = "You light the lantern. The flickering light reveals more of the room."
        else:  # Already lit
            action_taken_message = "The lantern is already lit."

        # Item revealing logic
        for item_in_room in game_state.current_room.get_items():
            if item_in_room.get_name().lower() == "bread" and not item_in_room.get_is_visible():
                item_in_room.set_is_visible(True)
            elif item_in_room.get_name().lower() == "elior's journal" and not item_in_room.get_is_visible():
                item_in_room.set_is_visible(True)
        
        return action_taken_message
