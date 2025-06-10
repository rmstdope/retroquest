from ..items.Item import Item

class PrayerBook(Item):
    def __init__(self) -> None:
        super().__init__(
            name="prayer book",
            description="A small, leather-bound book filled with prayers and hymns. The pages are worn from years of use.",
            short_name="prayerbook"
        )
