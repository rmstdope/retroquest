from .Item import Item

class Fish(Item):
    def __init__(self):
        super().__init__(
            name="fish",
            description="A plump river fish. It looks fresh and would make a good meal or perhaps a gift.",
            examine_description="A silvery fish, its scales shimmering. It's a good size, caught from the local river."
        )
