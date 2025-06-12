class Room:
    """
    Base class for all rooms in RetroQuest.
    Inherit from this class to define specific rooms.
    """
    def __init__(self, name: str, description: str, items: list = None, usable_items: list = None, characters: list = None, exits: dict = None) -> None:
        self.name = name
        self.description = description
        self.items = items if items is not None else []
        self.usable_items = usable_items if usable_items is not None else []
        self.characters = characters if characters is not None else []
        self.exits = exits if exits is not None else {}

    def enter(self) -> None:
        """Called when the player enters the room."""
        print(self.description)

    def get_items(self) -> list:
        return self.items

    def add_item(self, item) -> None:
        """Adds an item to the room's list of items."""
        if self.items is None:
            self.items = []
        self.items.append(item)

    def get_usable_items(self) -> list:
        return self.usable_items

    def get_characters(self) -> list:
        return self.characters

    def get_exits(self) -> dict:
        return self.exits

    def describe(self) -> str:
        """Return a full description of the room, including items, characters, and exits."""
        desc = "-" * 50 + "\n"
        desc += f"{self.name}\n"
        desc += "-" * 50 + "\n"
        desc += self.description + '\n'
        visible_items = [item for item in self.items]
        if visible_items:
            desc += f"\nItems you can see: {', '.join(item.get_name() for item in visible_items)}"
        if self.characters:
            # Use get_name for character instances
            desc += f"\nCharacters present: {', '.join(c.get_name() for c in self.characters)}"
        if self.exits:
            desc += f"\nExits: {', '.join(self.exits.keys())}"
        return desc
