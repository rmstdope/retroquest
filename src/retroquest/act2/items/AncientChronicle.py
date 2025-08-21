from ...engine.GameState import GameState
from ...engine.Item import Item

class AncientChronicle(Item):
    def __init__(self) -> None:
        super().__init__(
            name="ancient chronicle",
            description="A massive tome containing historical records of the region, including detailed accounts of ancient bloodlines, family genealogies, and the significance of various settlements including Willowbrook.",
            can_be_carried=False,
        )

    def examine(self, game_state: GameState) -> str:
        return ("You carefully study the ancient chronicle. The historical records mention Willowbrook repeatedly, "
                "describing it as a settlement of special significance tied to ancient magical bloodlines. Several "
                "passages reference families with latent magical abilities and their role in protecting the realm "
                "from dark forces.")

    def use(self, game_state: GameState) -> str:
        return "The ancient chronicle contains vast historical knowledge. You search through its pages for information about your heritage and Willowbrook's significance."