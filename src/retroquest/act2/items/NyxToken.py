from ...engine.Item import Item

class NyxToken(Item):
    """A mystical token blessed by the forest sprite Nyx."""
    
    def __init__(self) -> None:
        super().__init__(
            name="nyx's token",
            description="A small, crystalline pendant that shifts through all the colors of nature - from the deep "
                        "green of summer leaves to the golden brown of autumn, the pure white of winter snow, and the "
                        "vibrant colors of spring flowers. It pulses with gentle magic and seems to contain a fragment "
                        "of the forest's eternal essence."
        )
