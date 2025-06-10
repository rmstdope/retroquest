from .Character import Character

class Merchant(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Merchant",
            description="A traveling merchant with a cart full of wares and stories from distant lands. Always ready to trade or offer travel advice."
        )
