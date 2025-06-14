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

    def read(self, game_state) -> str:
        """Base 'read' method for items. Subclasses should override this if they are readable."""
        return f"There is nothing to read on the {self.get_name()}."

    def listen(self, game_state) -> str:
        """Base 'listen' method for items. Subclasses should override this if they make a sound."""
        return f"The {self.get_name()} is silent."
