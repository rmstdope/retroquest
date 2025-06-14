from .Item import Item

class Well(Item):
    def __init__(self):
        super().__init__(
            name="well",
            description="An old stone well, its surface worn smooth. The water below is dark and still. A frayed rope hangs nearby, disappearing into the depths.",
        )

    def use_with(self, game_state, other_item):
        from .Bucket import Bucket  # Local import to avoid circular dependency
        if isinstance(other_item, Bucket):
            # Delegate to the Bucket's use_with method
            return other_item.use_with(game_state, self)
        return f"The {self.get_name()} cannot be used with the {other_item.get_name()}."
