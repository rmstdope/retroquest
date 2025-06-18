from ..GameState import GameState
from ..items.Item import Item

class Character:
    """
    Base class for all characters in RetroQuest.
    Inherit from this class to define specific characters.
    """
    def __init__(self, name: str, description: str) -> None:
        self.name = name
        self.description = description

    def get_name(self) -> str:
        return self.name

    def get_description(self) -> str:
        return self.description
    
    def talk_to(self, game_state: GameState) -> str:
        """Default talk_to method. Subclasses should override this for specific dialog."""
        return f"[character.name]{self.name}[/character.name] has nothing to say right now."

    def give_item(self, game_state: GameState, item_object: Item) -> str:
        """
        Default behavior when an item is given to this character.
        Subclasses should override this to handle specific item interactions.
        """
        return f"[character.name]{self.name}[/character.name] doesn't seem interested in the [item.name]{item_object.get_name()}[/item.name]."

    def buy_item(self, item_name_to_buy: str, game_state: GameState) -> str:
        """Default buy_item method. Subclasses should override this for specific dialog."""
        return f"[character.name]{self.name}[/character.name] does not have any [item.name]{item_name_to_buy}[/item.name] to sell right now."
