from ...engine.Character import Character
from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_COURT_HERALD_FORMAL_PRESENTATION
from ..items.EntryPass import EntryPass

class CourtHerald(Character):
    def __init__(self) -> None:
        super().__init__(
            name="court herald",
            description="An elaborately dressed official who manages formal presentations and ceremonies at court. He scrutinizes documents and credentials with practiced expertise.",
        )

    def give_item(self, game_state: GameState, item_object: Item) -> str:
        """Handle giving items to the Court Herald."""
        if isinstance(item_object, EntryPass):
            # Set the formal presentation flag
            game_state.set_story_flag(FLAG_COURT_HERALD_FORMAL_PRESENTATION, True)
            
            event_msg = f"[event]You present the [item_name]{item_object.get_name()}[/item_name] to the [character_name]{self.name}[/character_name].[/event]"
            return (event_msg + "\n" + 
                    f"[character_name]{self.name}[/character_name]: Excellent! This is a properly certified entry pass. "
                    "I hereby formally present you to the court and grant you access to our historical archives. "
                    "Your credentials are now on record, and you may research freely in our collections.")
        else:
            # Default behavior for other items
            return super().give_item(game_state, item_object)

    def talk_to(self, game_state: GameState) -> str:
        if game_state.get_story_flag(FLAG_COURT_HERALD_FORMAL_PRESENTATION):
            return ("[character_name]Court Herald[/character_name]: You have been formally presented to the court and "
                    "your credentials are on record. You may access the historical archives and speak with court "
                    "historians about your research.")
        else:
            return ("[character_name]Court Herald[/character_name]: I handle formal presentations and credentials for "
                    "court access. If you wish to research in the historical archives or speak with court officials, "
                    "you'll need proper documentation of your standing.")