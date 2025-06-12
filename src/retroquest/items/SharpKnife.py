from .Item import Item

class SharpKnife(Item):
    def __init__(self) -> None:
        super().__init__(
            name="sharp knife",
            description="A well-sharpened knife. It looks like it could cut through almost anything.",
            short_name="knife",
            can_be_carried=True
        )
