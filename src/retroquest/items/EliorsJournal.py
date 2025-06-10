from ..items.Item import Item

class EliorsJournal(Item):
    def __init__(self) -> None:
        super().__init__(
            name="Elior's journal",
            description="A leather-bound journal filled with Elior's careful handwriting. The pages are full of notes, sketches, and secrets.",
            short_name="journal"
        )
