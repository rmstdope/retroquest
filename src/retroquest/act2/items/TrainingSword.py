from ...engine.GameState import GameState
from ...engine.Item import Item

class TrainingSword(Item):
    def __init__(self) -> None:
        super().__init__(
            name="training sword",
            description="A well-balanced practice sword with a dulled blade. Though not sharp enough for real combat, it's perfect for demonstrating martial skills and training exercises.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        # Check if we're in the Castle Courtyard with Sir Cedric present
        if (game_state.current_room.name == "Castle Courtyard" and 
            any(char.get_name().lower() == "sir cedric" for char in game_state.current_room.get_characters()) and
            not game_state.get_story_flag("demonstrated_combat_skills")):
            
            game_state.set_story_flag("demonstrated_combat_skills", True)
            return ("[success]You draw the training sword and perform a series of combat forms for "
                    "[character_name]Sir Cedric[/character_name]. Your movements are fluid and precise, "
                    "demonstrating skill with both offensive and defensive techniques. Sir Cedric nods "
                    "approvingly. 'Excellent! Your martial training is evident. I can trust someone with "
                    "such disciplined combat skills.'[/success]")
        else:
            return "You practice a few sword forms with the training sword. The balance feels good in your hands, and it would be perfect for demonstrating combat skills to someone who needs proof of your abilities."
