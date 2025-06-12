class GameState:
    """
    Holds the mutable state of the currently played game: current room, inventory, history, and visited rooms.
    """
    def __init__(self, starting_room) -> None:
        self.current_room = starting_room
        self.inventory = []
        self.history = []
        self.visited_rooms = [starting_room.name]
        self.known_spells = []
        self.story_flags = [] # Replace journal_read_prologue_entry

    def mark_visited(self, room) -> None:
        if room.name not in self.visited_rooms:
            self.visited_rooms.append(room.name)

    def set_story_flag(self, flag_name: str, value: bool) -> None:
        """Sets or updates a story flag."""
        for i, (name, _) in enumerate(self.story_flags):
            if name == flag_name:
                self.story_flags[i] = (flag_name, value)
                return
        self.story_flags.append((flag_name, value))

    def get_story_flag(self, flag_name: str) -> bool:
        """Gets the value of a story flag. Returns False if not found."""
        for name, value in self.story_flags:
            if name == flag_name:
                return value
        return False

    def remove_item_from_inventory(self, item_name: str) -> None:
        """Removes an item from the player's inventory by its name."""
        item_name_lower = item_name.lower()
        for item in self.inventory:
            if item.get_name().lower() == item_name_lower:
                self.inventory.remove(item)
                return # Assuming only one instance of an item name can exist or we remove the first one

    def add_item_to_inventory(self, item_object) -> None:
        """Adds an item object to the player's inventory."""
        self.inventory.append(item_object)
