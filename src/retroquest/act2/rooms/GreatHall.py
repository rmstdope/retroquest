from ...engine.Room import Room
from ...engine.GameState import GameState
from ..characters.CourtHerald import CourtHerald
from ..characters.Historians import Historians
from ..items.AncientChronicle import AncientChronicle

class GreatHall(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Great Hall",
            description=(
                "A magnificent hall with soaring ceilings supported by massive stone columns. Tapestries depicting "
                "legendary battles cover the walls, and a throne sits on a raised dais at the far end. Sunlight streams "
                "through tall stained-glass windows, casting colorful patterns on the stone floor. This is where the "
                "lords of Greendale hold court and make important decisions."
            ),
            items=[AncientChronicle()],
            characters=[CourtHerald(), Historians()],
            exits={"east": "CastleCourtyard"}
        )

    def handle_command(self, command: str, game_state: GameState) -> str:
        # Handle "give pass to court herald" command
        if "give pass to court herald" in command.lower():
            pass_item = next((item for item in game_state.inventory if "pass" in item.get_name().lower() and "grandmother" in item.get_description().lower()), None)
            if pass_item:
                game_state.inventory.remove(pass_item)
                game_state.set_story_flag("court_herald_formal_presentation", True)
                return ("[success]You present your grandmother's pass to the [character_name]Court Herald[/character_name]. "
                        "He examines it carefully and formally announces your credentials to the court. 'By the authority "
                        "of this recommendation, you are formally presented to the noble court and granted access to "
                        "historical archives and research facilities.'[/success]")
            else:
                return "[failure]You don't have your grandmother's pass to present.[/failure]"
        
        # Handle "show traveler's journal to historians" command
        elif "show traveler's journal to historians" in command.lower() or "show journal to historians" in command.lower():
            journal = next((item for item in game_state.inventory if "journal" in item.get_name().lower()), None)
            if journal:
                game_state.set_story_flag("showed_journal_to_historians", True)
                return ("[success]You show the traveler's journal to the [character_name]Historians[/character_name]. "
                        "They examine it with great interest, cross-referencing the genealogical information with their "
                        "own records. 'This is fascinating! The journal confirms several theories about Willowbrook's "
                        "significance and provides crucial context for the ancient chronicles.'[/success]")
            else:
                return "[failure]You don't have a traveler's journal to show.[/failure]"
        
        # Handle "search for records" or "search for willowbrook records" command
        elif "search for records" in command.lower() or "search records" in command.lower():
            if game_state.get_story_flag("court_herald_formal_presentation"):
                # Activate the quest if not already activated
                if not game_state.is_quest_activated("Echoes of the Past"):
                    from ..quests.EchoesOfThePast import EchoesOfThePastQuest
                    game_state.activate_quest_by_object(EchoesOfThePastQuest())
                
                game_state.set_story_flag("researched_family_heritage", True)
                return ("[success]With formal access to the archives, you spend time researching records mentioning "
                        "Willowbrook and your family lineage. The ancient chronicles reveal that Willowbrook has long "
                        "been home to families with latent magical abilities, and your heritage connects you to this "
                        "ancient tradition of protecting the realm.[/success]")
            else:
                return "[failure]You need formal credentials from the Court Herald to access the historical archives.[/failure]"
        
        return super().handle_command(command, game_state)
