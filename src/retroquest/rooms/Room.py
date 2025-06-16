from ..items.Item import Item  # Added import
from ..GameState import GameState  # Added for GameState type hint

class Room:
    """
    Base class for all rooms in RetroQuest.
    Inherit from this class to define specific rooms.
    """
    def __init__(self, name: str, description: str, items: list = None, characters: list = None, exits: dict = None) -> None:
        self.name = name
        self.description = description
        self.items = items if items is not None else []
        self.characters = characters if characters is not None else []
        self.exits = exits if exits is not None else {}

    def enter(self) -> None:
        """Called when the player enters the room."""
        print(self.description)

    def get_items(self) -> list:
        return self.items

    def add_item(self, item: Item) -> None:
        """Adds an item to the room's list of items."""
        if self.items is None:
            self.items = []
        self.items.append(item)

    def get_characters(self) -> list:
        return self.characters

    def get_exits(self) -> dict:
        return self.exits

    def get_ambient_sound(self) -> str:
        """Returns a description of the ambient sound of the room."""
        return "It is quiet here."

    def get_item_by_name(self, item_name: str) -> Item | None:
        """
        Retrieves an item from the room by its name (case-insensitive).
        Returns the item object if found, otherwise None.
        """
        item_name_lower = item_name.lower()
        for item in self.items:
            if item.get_name().lower() == item_name_lower:
                return item
        return None

    def remove_item(self, item_name: str) -> Item | None:
        """
        Removes an item from the room by its name (case-insensitive).
        Returns the item object if removed, otherwise None.
        """
        item_to_remove = self.get_item_by_name(item_name)
        if item_to_remove:
            self.items.remove(item_to_remove)
            return item_to_remove
        return None

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

    def search(self, game_state: GameState, target: str = None) -> str:
        """Allows the player to search the room."""
        return f"You search around the {self.name}, but find nothing of interest beyond what you can already see."
