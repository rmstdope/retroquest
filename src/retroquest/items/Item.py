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

    def get_description(self) -> str:
        return self.description
    
    def get_short_name(self) -> str:
        return self.short_name
    
    def can_be_carried(self) -> bool:
        """Return True if the item can be carried by the player. Override in subclasses for special cases."""
        return self.can_be_carried_flag

    def use(self, game_state) -> str:
        """Base 'use' method for items. Subclasses should override this if they have specific use actions."""
        return f"You can't use the {self.get_name()} in any special way."

    def use_with(self, game_state, other_item) -> str:
        """Base 'use_with' method for items. Subclasses should override this if they can interact with other items."""
        return f"You can't use the {self.get_name()} with the {other_item.get_name()}."
    
    def examine(self) -> str:
        """Base 'examine' method for items. Subclasses should override this if they have specific examination details."""
        return f"You examine the {self.get_name()}. {self.get_description()}"

    def read(self, game_state) -> str:
        """Base 'read' method for items. Subclasses should override this if they are readable."""
        return f"There is nothing to read on the {self.get_name()}."

    def listen(self, game_state) -> str:
        """Base 'listen' method for items. Subclasses should override this if they make a sound."""
        return f"The {self.get_name()} is silent."

    def picked_up(self, game_state) -> str | None:
        """Called when the item is picked up by the player. Subclasses can override this."""
        return None # Default behavior: no message or action

    def open(self, game_state) -> str:
        """Base 'open' method for items. Subclasses should override this if they can be opened."""
        return f"You can't open the {self.get_name()}."

    def grow(self, game_state) -> str:
        """Base 'grow' method for items, typically called by the Grow spell. Subclasses should override this."""
        return f"The {self.get_name()} does not respond to the Grow spell."
