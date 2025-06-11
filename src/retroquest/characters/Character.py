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
    
    def talk_to(self, game) -> str:
        """Default talk_to method. Subclasses should override this for specific dialog."""
        return f"{self.name} has nothing to say right now."

    def give_item(self, game_state, item_object) -> str:
        """
        Default behavior when an item is given to this character.
        Subclasses should override this to handle specific item interactions.
        """
        return f"{self.name} doesn't seem interested in the {item_object.get_name()}."


