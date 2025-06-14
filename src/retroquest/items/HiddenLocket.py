from .Item import Item

class HiddenLocket(Item):
    def __init__(self):
        super().__init__(
            name="hidden locket",
            description="A small, intricately carved silver locket, clearly very old. It feels cool to the touch.",
            examine_description="The locket is tarnished with age, but its delicate carvings of intertwined vines and stars are still visible. It seems designed to hold a tiny portrait or keepsake."
        )
