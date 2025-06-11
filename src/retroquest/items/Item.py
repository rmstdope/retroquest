class Item:
    """
    Base class for all items in RetroQuest.
    Inherit from this class to define specific items.
    """
    def __init__(self, name: str, description: str, short_name: str = None, is_visible: bool = True, can_be_carried: bool = False) -> None:
        self.name = name
        self.description = description
        self.short_name = short_name if short_name is not None else name
        self.is_visible = is_visible
        self.can_be_carried_flag = can_be_carried

    def get_name(self) -> str:
        return self.name

    def get_description(self) -> str:
        return self.description
    
    def get_short_name(self) -> str:
        return self.short_name
    
    def get_is_visible(self) -> bool:
        """Return True if the item is visible, False otherwise."""
        return self.is_visible
    
    def set_is_visible(self, is_visible: bool) -> None:
        """Set the visibility of the item."""
        self.is_visible = is_visible
    
    def can_be_carried(self) -> bool:
        """Return True if the item can be carried by the player. Override in subclasses for special cases."""
        return self.can_be_carried_flag

    def use(self, game_state) -> str:
        """Base 'use' method for items. Subclasses should override this if they have specific use actions."""
        return f"You can't use the {self.get_name()} in any special way."
