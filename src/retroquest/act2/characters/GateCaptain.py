from ...engine.Character import Character
from ...engine.GameState import GameState

class GateCaptain(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Gate Captain",
            description="A seasoned officer of Greendale's guard, wearing polished mail and bearing the insignia of the city watch. His weathered face shows years of experience maintaining order at the gates.",
        )
        self.entry_pass_given = False

    def talk_to(self, game_state: GameState) -> str:
        if not self.entry_pass_given:
            return ("The Gate Captain looks at you with a professional but guarded expression. "
                    "'State your business in Greendale, traveler. Do you have proper documentation for entry?'")
        else:
            if self in game_state.current_room.characters:
                # Remove self from the current room
                game_state.current_room.characters.remove(self)
                
                return ("The Gate Captain nods respectfully. 'Welcome to Greendale, honored visitor. "
                        "You'll need a map to navigate the city - the streets can be quite maze-like for newcomers. "
                        "Feel free to look around here for anything that might help you find your way.' "
                        "With that, he salutes smartly and walks back to his patrol duties, leaving you free to explore the gate area.")
            else:
                return ("The Gate Captain has already returned to his duties and is no longer present.")

    def give_item(self, game_state: GameState, item) -> str:
        if item.get_name().lower() == "entry pass":
            if self.entry_pass_given:
                return f"You have already shown the entry pass to the [character]{self.name}[/character]. He waves you through with respect."
            
            self.entry_pass_given = True
            
            return ("The Gate Captain examines the entry pass carefully when you show it to him, noting the official seal. "
                    "His expression changes to one of respect as he recognizes the authority behind it. "
                    "'This is legitimate documentation indeed. You are welcome in Greendale, honored visitor. "
                    "Please, proceed with our blessing.' He steps aside and gestures toward the city.")
        else:
            return f"The Gate Captain politely declines the {item.get_name()}. 'I only need to see proper entry documentation.'"
