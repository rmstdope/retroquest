from .GameState import GameState
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .Character import Character

class Item:
    """
    Base class for all items in RetroQuest.
    Inherit from this class to define specific items.
    """
    
    def __init__(self, name: str, description: str, short_name: str = None, can_be_carried: bool = False) -> None:
        self.name = name
        self.description = description
        self.short_name = short_name if short_name is not None else name
        self.can_be_carried_flag = can_be_carried

    def get_name(self) -> str:
        return self.name

    def get_short_name(self) -> str:
        return self.short_name
    
    def prevent_pickup(self) -> str | None:
        """Return a message if the item cannot be picked up. Override in subclasses for special cases."""
        return None if self.can_be_carried_flag else f"[failure]You can't take the [item_name]{self.get_name()}[/item_name].[/failure]"

    def use(self, game_state: GameState) -> str:
        """Base 'use' method for items. Subclasses should override this if they have specific use actions."""
        return f"[failure]You can't use the [item_name]{self.get_name()}[/item_name] in any special way.[/failure]"

    def use_with(self, game_state: GameState, other_item: 'Item') -> str:
        """Base 'use_with' method for items. Subclasses should override this if they can interact with other items."""
        return f"[failure]You can't use the [item_name]{self.get_name()}[/item_name] with the [item_name]{other_item.get_name()}[/item_name].[/failure]"
    
    def use_on_character(self, game_state: GameState, target_character: 'Character') -> str:
        """Base 'use_on_character' method for items. Subclasses should override this if they can be used on characters."""
        return f"[failure]You can't use the [item_name]{self.get_name()}[/item_name] on [character_name]{target_character.get_name()}[/character_name].[/failure]"
    
    def examine(self, game_state: GameState) -> str:
        """Base 'examine' method for items. Subclasses should override this if they have specific examination details."""
        return f"[event]You examine the [item_name]{self.get_name()}[/item_name]. {self.description}[/event]"

    def read(self, game_state: GameState) -> str:
        """Base 'read' method for items. Subclasses should override this if they are readable."""
        return f"[failure]There is nothing to read on the [item_name]{self.get_name()}[/item_name].[/failure]"

    def listen(self, game_state: GameState) -> str:
        """Base 'listen' method for items. Subclasses should override this if they make a sound."""
        return f"[failure]The [item_name]{self.get_name()}[/item_name] is silent.[/failure]"

    def picked_up(self, game_state: GameState) -> str | None:
        """Called when the item is picked up by the player. Subclasses can override this."""
        return None # Default behavior: no message or action

    def open(self, game_state: GameState) -> str:
        """Base 'open' method for items. Subclasses should override this if they can be opened."""
        return f"[failure]You can't open the [item_name]{self.get_name()}[/item_name].[/failure]"

    def close(self, game_state: GameState) -> str:
        """Base 'close' method for items. Subclasses should override this if they can be closed."""
        return f"[failure]You can't close the [item_name]{self.get_name()}[/item_name].[/failure]"

    def grow(self, game_state: GameState) -> str:
        """Base 'grow' method for items, typically called by the Grow spell. Subclasses should override this."""
        return f"[failure]The [item_name]{self.get_name()}[/item_name] does not respond to the [spell_name]grow[/spell_name] spell.[/failure]"

    def eat(self, game_state: GameState) -> str:
        """Base 'eat' method for items. Subclasses should override this if they are edible."""
        return f"[failure]You can't eat the [item_name]{self.get_name()}[/item_name].[/failure]"

    def drink(self, game_state: GameState) -> str:
        """Base 'drink' method for items. Subclasses should override this if they are drinkable."""
        return f"[failure]You can't drink the [item_name]{self.get_name()}[/item_name].[/failure]"

    def equip(self, game_state: GameState) -> str:
        """Base 'equip' method for items. Subclasses should override this if they are equippable."""
        return f"[failure]You can't equip the [item_name]{self.get_name()}[/item_name].[/failure]"

    def unequip(self, game_state: GameState) -> str:
        """Base 'unequip' method for items. Subclasses should override this if they are equippable and can be unequipped."""
        return f"[failure]You can't unequip the [item_name]{self.get_name()}[/item_name].[/failure]"
