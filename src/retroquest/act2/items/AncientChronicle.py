from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_ANCIENT_LIBRARY_COMPLETED

class AncientChronicle(Item):
    def __init__(self) -> None:
        super().__init__(
            name="ancient chronicle",
            short_name="chronicle",
            description="A massive tome containing historical records of the region, including detailed accounts of ancient bloodlines, family genealogies, and the significance of various settlements including Willowbrook.",
            can_be_carried=False,
        )

    def examine(self, game_state: GameState) -> str:
        if game_state.get_story_flag(FLAG_ANCIENT_LIBRARY_COMPLETED):
            return ("[info]You study the ancient texts, reviewing the knowledge of the [spell_name]dispel[/spell_name] "
                    "spell and the revelations about your heritage. The words of the Chosen One prophecy echo "
                    "in your mind as you contemplate your destiny.[/info]")
        else:
            return ("[info]The protective enchantments prevent you from accessing the most valuable texts. "
                    "You need to repair them first to prove your worthiness to the "
                    "[character_name]Spectral Librarian[/character_name].[/info]")

    def use(self, game_state: GameState) -> str:
        return "The ancient chronicle contains vast historical knowledge. You search through its pages for information about your heritage and Willowbrook's significance."