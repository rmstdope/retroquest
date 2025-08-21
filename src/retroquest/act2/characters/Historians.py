from ...engine.Character import Character
from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_SHOWED_JOURNAL_TO_HISTORIANS

class Historians(Character):
    def __init__(self) -> None:
        super().__init__(
            name="historians",
            description="A group of learned scholars who maintain the court's historical records and genealogical archives. They are eager to examine any historical documents or artifacts.",
        )

    def talk_to(self, game_state: GameState) -> str:
        if game_state.get_story_flag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS):
            return ("[character_name]Historians[/character_name]: The journal you showed us was most illuminating! "
                    "The references to Willowbrook's bloodlines confirm what we suspected from the ancient chronicles. "
                    "Your heritage appears to be quite significant indeed.")
        else:
            return ("[character_name]Historians[/character_name]: Welcome to the historical archives. We maintain "
                    "records of regional history, family genealogies, and ancient chronicles. Do you have any "
                    "historical documents or artifacts you'd like us to examine?")

    def give_item(self, game_state: GameState, item_object: Item) -> str:
        """Handle giving items to the Historians"""
        if "journal" in item_object.get_name().lower():
            game_state.set_story_flag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS, True)
            return ("[event]You offer the [item_name]{item_object.get_name()}[/item_name] to the [character_name]{self.name}[/character_name].[/event]\n"
                    "[success]You show the traveler's journal to the [character_name]Historians[/character_name]. "
                    "They examine it with great interest, cross-referencing the genealogical information with their "
                    "own records. 'This is fascinating! The journal confirms several theories about Willowbrook's "
                    "significance and provides crucial context for the ancient chronicles.'[/success]")
        else:
            return super().give_item(game_state, item_object)