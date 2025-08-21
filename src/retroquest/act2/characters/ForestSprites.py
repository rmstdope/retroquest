from ...engine.Character import Character
from ...engine.GameState import GameState

class ForestSprites(Character):
    def __init__(self) -> None:
        super().__init__(
            name="forest sprites",
            description=(
                "Tiny, luminescent beings that dance through the air like living sparks of light. "
                "These mischievous but benevolent forest spirits appear as glowing wisps with "
                "delicate, translucent wings. They speak in chiming voices that sound like wind "
                "chimes in a gentle breeze, and their presence fills the air with a sense of "
                "ancient magic and playful wisdom."
            )
        )
        self.riddles_quest_given = False

    def talk_to(self, game_state: GameState, player=None) -> str:
        event_msg = f"[event]You approach the [character_name]{self.get_name()}[/character_name].[/event]"
        
        if not self.riddles_quest_given:
            # Give the Forest Guardian's Riddles quest
            self.riddles_quest_given = True
            game_state.set_story_flag("forest_guardians_riddles_offered", True)
            
            return (event_msg + "\n" +
                   f"[dialogue]The [character_name]{self.get_name()}[/character_name] flutter around you "
                   f"in a sparkling dance, their chiming voices creating a melodic chorus. 'Welcome, "
                   f"traveler, to the threshold of the deep forest! We are the guardians of the "
                   f"ancient paths, keepers of riddles and secrets old.'[/dialogue]\n\n"
                   
                   f"[dialogue]'If you would venture deeper into our sacred realm, you must prove "
                   f"your wisdom and understanding of forest ways. Seek the Ancient Grove where "
                   f"the silver-barked tree holds court, and beyond that, the Whispering Glade "
                   f"where the water spirits dwell. Answer their riddles, and you shall earn the "
                   f"right to walk freely among the deepest mysteries of our forest.'[/dialogue]\n\n"
                   
                   f"[dialogue]'But beware - the forest tests not just knowledge, but heart and "
                   f"spirit as well. Show respect to all living things, and the ancient powers "
                   f"will guide your steps. Show arrogance or harm, and the very trees will "
                   f"lead you astray until you learn better ways.'[/dialogue]")
        else:
            # Subsequent conversations provide guidance
            return (event_msg + "\n" +
                   f"[dialogue]The [character_name]{self.get_name()}[/character_name] continue their "
                   f"eternal dance, chiming softly. 'The ancient ones await your wisdom, traveler. "
                   f"Remember - the forest rewards those who listen with their hearts as well as "
                   f"their minds. The silver tree and the water spirits hold the keys to deeper "
                   f"understanding.'[/dialogue]")

    def examine(self, game_state: GameState) -> str:
        return (f"[event]You study the [character_name]{self.get_name()}[/character_name] more closely. "
               f"{self.description} They seem to be composed of pure forest magic, ancient guardians "
               f"who have watched over these woods since the earliest days. Their dance follows "
               f"patterns that mirror the movement of leaves in the wind and the flow of streams "
               f"through the forest.[/event]")
