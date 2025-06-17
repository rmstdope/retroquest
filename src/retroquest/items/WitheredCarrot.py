from ..items.Item import Item

class WitheredCarrot(Item):
    def __init__(self) -> None:
        super().__init__(
            name="withered carrot",
            description="A shriveled, orange carrot barely clinging to life. It looks edible, but only just.",
            short_name="carrot",
            can_be_carried=True # Withered carrots should be carriable
        )

    def revive(self) -> str:
        self.name = "Fresh carrot"
        self.short_name = "carrot" # Keep short_name consistent or update if needed
        self.description = "A vibrant, healthy carrot, freshly revived. It looks delicious and full of nutrients."
        return f"The {self.name.lower()} looks vibrant and healthy!"
