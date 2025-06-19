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
        return f"You can't use the [item.name]{self.get_name()}[/item.name] in any special way."

    def use_with(self, game_state, other_item) -> str:
        """Base 'use_with' method for items. Subclasses should override this if they can interact with other items."""
        return f"You can't use the [item.name]{self.get_name()}[/item.name] with the [item.name]{other_item.get_name()}[/item.name]."
    
    def examine(self) -> str:
        """Base 'examine' method for items. Subclasses should override this if they have specific examination details."""
        return f"You examine the [item.name]{self.get_name()}[/item.name]. {self.get_description()}"

    def read(self, game_state) -> str:
        """Base 'read' method for items. Subclasses should override this if they are readable."""
        return f"There is nothing to read on the [item.name]{self.get_name()}[/item.name]."

    def listen(self, game_state) -> str:
        """Base 'listen' method for items. Subclasses should override this if they make a sound."""
        return f"The [item.name]{self.get_name()}[/item.name] is silent."

    def picked_up(self, game_state) -> str | None:
        """Called when the item is picked up by the player. Subclasses can override this."""
        return None # Default behavior: no message or action

    def open(self, game_state) -> str:
        """Base 'open' method for items. Subclasses should override this if they can be opened."""
        return f"You can't open the [item.name]{self.get_name()}[/item.name]."

    def close(self, game_state) -> str:
        """Base 'close' method for items. Subclasses should override this if they can be closed."""
        return f"You can't close the [item.name]{self.get_name()}[/item.name]."

    def grow(self, game_state) -> str:
        """Base 'grow' method for items, typically called by the Grow spell. Subclasses should override this."""
        return f"The [item.name]{self.get_name()}[/item.name] does not respond to the [spell.name]grow[/spell.name] spell."

    def eat(self, game_state) -> str:
        """Base 'eat' method for items. Subclasses should override this if they are edible."""
        return f"You can't eat the [item.name]{self.get_name()}[/item.name]."

    def drink(self, game_state) -> str:
        """Base 'drink' method for items. Subclasses should override this if they are drinkable."""
        return f"You can't drink the [item.name]{self.get_name()}[/item.name]."

    def equip(self, game_state) -> str:
        """Base 'equip' method for items. Subclasses should override this if they are equippable."""
        return f"You can't equip the [item.name]{self.get_name()}[/item.name]."

    def unequip(self, game_state) -> str:
        """Base 'unequip' method for items. Subclasses should override this if they are equippable and can be unequipped."""
        return f"You can't unequip the [item.name]{self.get_name()}[/item.name]."
