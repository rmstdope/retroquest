from ...engine.Item import Item

class ProtectiveCharm(Item):
    def __init__(self) -> None:
        super().__init__(
            name="protective charm",
            description=(
                "A small talisman woven from forest vines and blessed by ancient magic. It pulses with a gentle "
                "green light and carries the protective power of the deep woods. This charm will ward off hostile "
                "forest spirits and mark the bearer as one under the hermit's protection."
            ),
            can_be_carried=True,
        )

    def use(self, game_state) -> str:
        if game_state.current_room.name == "Forest Entrance":
            return ("[success]You hold the [item_name]protective charm[/item_name] aloft. Its gentle green glow "
                   "creates a barrier of safety around you, warding off the hostile forest spirits that lurk "
                   "in the shadows. The charm provides safe passage through the dangerous threshold between "
                   "the civilized world and the wild forest realm.[/success]")
        else:
            return ("The [item_name]protective charm[/item_name] glows softly, providing a sense of comfort and "
                   "protection. It seems most powerful near places of natural magic.")
