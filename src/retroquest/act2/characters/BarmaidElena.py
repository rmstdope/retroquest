from ...engine.Character import Character
from ...engine.GameState import GameState
from ..quests.TheInnkeepersDaughter import TheInnkeepersDaughterQuest
from ..Act2StoryFlags import FLAG_KNOWS_ELENA_CURSE

class BarmaidElena(Character):
    def __init__(self) -> None:
        super().__init__(
            name="barmaid elena",
            description="A young woman who moves slowly and appears weakened by some affliction. Dark circles under her eyes and a pale complexion suggest she is suffering from a magical curse.",
        )

    def talk_to(self, game_state: GameState) -> str:
        if not game_state.get_story_flag(FLAG_KNOWS_ELENA_CURSE):
            game_state.set_story_flag(FLAG_KNOWS_ELENA_CURSE, True)
            return ("[character_name]Barmaid Elena[/character_name]: *coughs weakly* Hello, traveler. I apologize for my "
                    "appearance... I've been cursed by a dark wizard who passed through town weeks ago. The curse "
                    "grows stronger each day, draining my life force. My father searches desperately for a cure, "
                    "but I fear only someone with powerful magical abilities could break such dark magic.")
        else:
            return ("[character_name]Barmaid Elena[/character_name]: *weakly* Have you found a way to break the curse? "
                    "I can feel my strength fading more each day...")