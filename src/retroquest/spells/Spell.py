class Spell:
    """
    Base class for all spells in RetroQuest.
    Inherit from this class to define specific spells.
    """
    def __init__(self, name: str, description: str) -> None:
        self.name = name
        self.description = description

    def get_name(self) -> str:
        return self.name

    def get_description(self) -> str:
        return self.description

    def cast(self, game_state) -> str:
        """Casts the spell. This method should be overridden by subclasses."""
        raise NotImplementedError("This spell has not been implemented yet.")
