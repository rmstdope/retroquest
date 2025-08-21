from ...engine.Character import Character
from ...engine.GameState import GameState

class LocalCraftsmen(Character):
    def __init__(self) -> None:
        super().__init__(
            name="local craftsmen",
            description="Skilled artisans working at various crafts - blacksmithing, carpentry, tailoring, and magical repair work. They demonstrate traditional techniques passed down through generations.",
        )

    def talk_to(self, game_state: GameState) -> str:
        if game_state.get_story_flag("learned_mend_from_craftsmen"):
            return ("[character_name]Local Craftsmen[/character_name]: Good to see you again! How has your repair magic "
                    "been working? The mend spell is one of the most useful pieces of magic a person can learn.")
        else:
            return ("[character_name]Local Craftsmen[/character_name]: Welcome, young one! We're always happy to share "
                    "our knowledge with those willing to learn. Watch carefully as we work - there's magic in "
                    "the art of mending and repair that goes beyond mere craftsmanship.")