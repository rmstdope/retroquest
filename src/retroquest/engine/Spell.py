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

    def cast(self, game_state, target_item=None) -> str:
        """Casts the spell. This method should be overridden by subclasses."""
        if target_item:
            return f"[failure]You can't cast [spell.name]{self.name}[/spell.name] on [item.name]{target_item.get_name()}[/item.name].[/failure]"
        return f"[failure]You cast [spell.name]{self.name}[/spell.name], but nothing happens.[/failure]"
