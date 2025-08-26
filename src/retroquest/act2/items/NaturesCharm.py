from ...engine.Item import Item

class NaturesCharm(Item):
    """One of three sacred charms needed to summon Nyx, blessed by ancient knights."""
    
    def __init__(self) -> None:
        super().__init__(
            name="nature's charm",
            description="An ancient charm blessed by the knights of old, carved from living wood and inlaid with silver runes. "
                       "It pulses with a gentle green light and seems to resonate with the natural world. This is clearly one of "
                       "the sacred charms mentioned in the old texts - those needed to summon the forest sprite Nyx."
        )
