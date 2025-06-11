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
        from .Bread import Bread
        from .EliorsJournal import EliorsJournal
        game_state.current_room.add_item(Bread())  # Add bread to the room
        game_state.current_room.add_item(EliorsJournal())
        
        return action_taken_message
