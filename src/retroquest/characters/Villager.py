from .Character import Character

class Villager(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Villager",
            description="A friendly Willowbrook local, always eager to share the latest gossip or rumors about the village."
        )
