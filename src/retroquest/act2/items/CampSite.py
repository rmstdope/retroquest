from ...engine.GameState import GameState
from ...engine.Item import Item

class CampSite(Item):
    def __init__(self) -> None:
        super().__init__(
            name="camp site",
            description="A small clearing off the main path where travelers often rest. There are signs of recent use - a fire pit with cold ashes and scattered belongings that suggest someone left in a hurry.",
            can_be_carried=False,
        )
        self.searched = False

    def search(self, game_state: GameState) -> str:
        if self.searched:
            return "You've already thoroughly searched the camp site. There's nothing more to find here."
        
        self.searched = True
        from .EntryPass import EntryPass
        entry_pass = EntryPass()
        game_state.add_item_to_inventory(entry_pass)
        
        return ("You carefully search through the abandoned camp site. Hidden under some leaves near the fire pit, "
                "you discover an [item_name]entry pass[/item_name] to Greendale! It must have been dropped by "
                "a previous traveler in their haste to leave.\n\n[event]You found an [item_name]entry pass[/item_name]![/event]")

    def use(self, game_state: GameState) -> str:
        if not self.searched:
            return self.search(game_state)
        return "The camp site has been thoroughly searched. You could rest here if needed, but there's nothing more to discover."
