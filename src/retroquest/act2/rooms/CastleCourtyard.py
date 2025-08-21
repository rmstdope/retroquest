from ...engine.Room import Room
from ...engine.GameState import GameState
from ..characters.SirCedric import SirCedric

class CastleCourtyard(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Castle Courtyard",
            description=(
                "An expansive courtyard within the castle walls, featuring training grounds where knights practice their "
                "swordwork. Ancient oak trees provide shade for stone benches, and a stable houses magnificent warhorses. "
                "The castle's main hall rises before you, its great doors carved with the symbols of Greendale's noble houses."
            ),
            items=[],
            characters=[SirCedric()],
            exits={"east": "CastleApproach", "north": "ResidentialQuarter", "west": "GreatHall"}
        )

    def handle_command(self, command: str, game_state: GameState) -> str:
        # Handle "use training sword" command to demonstrate combat skills
        if "use training sword" in command.lower():
            training_sword = next((item for item in game_state.inventory if item.get_name().lower() == "training sword"), None)
            if training_sword and not game_state.get_story_flag("demonstrated_combat_skills"):
                game_state.set_story_flag("demonstrated_combat_skills", True)
                return ("[success]You draw the training sword and perform a series of combat forms for "
                        "[character_name]Sir Cedric[/character_name]. Your movements are fluid and precise, "
                        "demonstrating skill with both offensive and defensive techniques. Sir Cedric nods "
                        "approvingly. 'Excellent! Your martial training is evident. I can trust someone with "
                        "such disciplined combat skills.'[/success]")
            elif not training_sword:
                return "[failure]You don't have a training sword to demonstrate your combat skills.[/failure]"
            else:
                return "[info]You've already demonstrated your combat skills to Sir Cedric.[/info]"
        
        return super().handle_command(command, game_state)
