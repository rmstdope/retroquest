from ..items.Item import Item

class MysteriousBox(Item):
    def __init__(self) -> None:
        super().__init__(
            name="mysterious box",
            description="A small, ornate wooden box covered in strange runes. The lid is tightly shut, and it feels oddly heavy for its size. You sense something important is hidden inside.",
            short_name="box"
        )
        self.locked = True
        self.contains = "a small, intricately carved wooden bird" # Item revealed when unlocked

    def unlock(self):
        self.locked = False

    def use_with(self, game_state, other_item):
        from .Key import Key  # Local import to avoid circular dependency
        if isinstance(other_item, Key):
            # Delegate to the Key's use_with method
            return other_item.use_with(game_state, self)
        return f"The {self.get_name()} cannot be used with the {other_item.get_name()}."

    def use(self, game_state):
        if self.locked:
            return "The mysterious box is locked. You need to find a way to open it."
        else:
            # Item is revealed, and potentially added to inventory or the room
            # For now, let's assume it's just revealed.
            # And let's make it so it can only be "used" once to reveal the item.
            if self.contains:
                revealed_item = self.contains
                self.description = f"An open, ornate wooden box. It once held {revealed_item}." # Update description
                self.contains = None # Box is now empty
                # TODO: Decide if the item should be automatically added to inventory or placed in the room
                # game_state.add_item_to_inventory(RevealedItemObject(revealed_item)) # If it's an actual item object
                return f"You open the mysterious box. Inside, you find {revealed_item}!"
            else:
                return "The mysterious box is now empty."
