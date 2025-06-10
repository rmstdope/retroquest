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
