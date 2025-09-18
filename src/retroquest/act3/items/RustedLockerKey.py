from ...engine.Item import Item

class RustedLockerKey(Item):
    def __init__(self) -> None:
        super().__init__(
            name="Rusted Locker Key",
            description=(
                "A corroded iron key recovered from the pier vaults. Its teeth are pitted with salt and age."
            ),
            short_name="rusted locker key",
            can_be_carried=True,
        )
