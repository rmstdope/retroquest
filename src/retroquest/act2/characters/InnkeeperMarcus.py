from ...engine.Character import Character
from ...engine.GameState import GameState

class InnkeeperMarcus(Character):
    def __init__(self) -> None:
        super().__init__(
            name="innkeeper marcus",
            description="A kind-hearted man who runs The Silver Stag Inn. He has worry lines on his face and glances frequently toward his daughter with obvious concern.",
        )

    def talk(self, game_state: GameState) -> str:
        if game_state.get_story_flag("knows_elena_curse"):
            return ("[character_name]Innkeeper Marcus[/character_name]: You've spoken with [character_name]Elena[/character_name]? "
                    "Then you understand my desperation. The curse grows stronger each day, and I fear we don't have "
                    "much time left. If you truly can help her, I'll give you anything - rooms, information, whatever you need.")
        else:
            return ("[character_name]Innkeeper Marcus[/character_name]: Welcome to The Silver Stag Inn, friend. We offer "
                    "fine rooms and hearty meals. Though I must say, these have been dark times for my family. "
                    "My daughter... well, perhaps you should speak with her yourself if you're looking to help those in need.")