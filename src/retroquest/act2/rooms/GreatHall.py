from ...engine.Room import Room
from ..characters.CourtHerald import CourtHerald
from ..characters.Historians import Historians
from ..characters.LordCommander import LordCommander
from ..items.AncientChronicle import AncientChronicle
from ..Act2StoryFlags import FLAG_COURT_HERALD_FORMAL_PRESENTATION, FLAG_RESEARCHED_FAMILY_HERITAGE, FLAG_SHOWED_JOURNAL_TO_HISTORIANS
from ...engine.GameState import GameState

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
            items=[],
            characters=[CourtHerald(), Historians(), LordCommander()],
            exits={"east": "CastleCourtyard"}
        )

    def search(self, game_state: GameState) -> str:
        """Override search to handle family heritage research"""
        if game_state.get_story_flag(FLAG_COURT_HERALD_FORMAL_PRESENTATION):
            if not game_state.get_story_flag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS):
                return ("[failure]The archives are vast, filled with countless books and scrolls. You don't know where to start your research. You will need some help from someone knowledgeable about these historical records.[/failure]")
            
            game_state.set_story_flag(FLAG_RESEARCHED_FAMILY_HERITAGE, True)
            return ("[success]With the historians' expert guidance, you navigate through the vast archives to find records mentioning "
                    "Willowbrook and your family lineage. The ancient chronicles reveal that your ancestors, the Ravencrest family, "
                    "were among the first settlers of Willowbrook. For generations, they served as protectors of the realm, wielding "
                    "hereditary magical abilities passed down through bloodlines. Your family has long been connected to the ancient "
                    "tradition of safeguarding the balance between the natural and mystical worlds, with each generation producing "
                    "individuals capable of channeling protective magic to defend their community.[/success]")
        else:
            return "[failure]The Court Herald stops you from accessing the archives. You need formal approval from him first.[/failure]"
