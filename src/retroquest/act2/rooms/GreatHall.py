from ...engine.Room import Room
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

    def search(self, game_state) -> str:
        """Override search to handle family heritage research"""
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
