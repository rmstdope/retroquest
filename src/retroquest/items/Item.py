class Item:
    """
    Base class for all items in RetroQuest.
    Inherit from this class to define specific items.
    """
    def __init__(self, name: str, description: str, short_name: str = None) -> None:
        self.name = name
        self.description = description
        self.short_name = short_name if short_name is not None else name

    def get_name(self) -> str:
        return self.name

    def get_description(self) -> str:
        return self.description
    
    def get_short_name(self) -> str:
        return self.short_name
    
    def can_be_carried(self) -> bool:
        """Return True if the item can be carried by the player. Override in subclasses for special cases."""
        return False
