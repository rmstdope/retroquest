from .GameState import GameState
from .Item import Item

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

    def examine(self, game_state: GameState) -> str:
        """Base 'examine' method for items. Subclasses should override this if they have specific examination details."""
        return f"[event]You examine [character.name]{self.get_name()}[/character.name]. {self.description}[/event]"

    def talk_to(self, game_state: GameState) -> str:
        """Default talk_to method. Subclasses should override this for specific dialog."""
        event_msg = f"[event]You speak with the [character.name]{self.name}[/character.name].[/event]"
        return event_msg + "\n" + f"[character.name]{self.name}[/character.name] has nothing to say right now."

    def give_item(self, game_state: GameState, item_object: Item) -> str:
        """
        Default behavior when an item is given to this character.
        Subclasses should override this to handle specific item interactions.
        """
        event_msg = f"[event]You offer the [item.name]{item_object.get_name()}[/item.name] to the [character.name]{self.name}[/character.name].[/event]"
        return event_msg + "\n" + f"[character.name]{self.name}[/character.name] doesn't seem interested in the [item.name]{item_object.get_name()}[/item.name]."

    def buy_item(self, item_name_to_buy: str, game_state: GameState) -> str:
        """Default buy_item method. Subclasses should override this for specific dialog."""
        event_msg = f"[event]You try to buy the [item.name]{item_name_to_buy}[/item.name] from the [character.name]{self.name}[/character.name].[/event]"
        return event_msg + "\n" + f"[character.name]{self.name}[/character.name] does not have any [item.name]{item_name_to_buy}[/item.name] to sell right now."
