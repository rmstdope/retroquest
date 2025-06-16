from .Item import Item

class Carrot(Item):
    """
    Represents a carrot, obtained by reviving a Withered carrot.
    It's needed for Mira's quest.
    """
    def __init__(self):
        super().__init__(
            name="Carrot",
            description="A bright orange carrot, surprisingly fresh. It looks delicious and might be useful for a certain hungry individual.",
            short_name="carrot",
            can_be_carried=True
        )

    def use(self, game_state) -> str:
        # Specific use logic for the carrot can be added here if needed in the future.
        # For now, its primary purpose is to be given to Mira.
        return f"The {self.get_name()} looks tasty, but you should probably save it for Mira."

