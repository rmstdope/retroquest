from ...engine.Character import Character

class Deer(Character):
    def __init__(self) -> None:
        super().__init__(
            name="deer",
            description="A graceful deer with wise, gentle eyes. It seems to sense the magic of the glade and watches you with curiosity."
        )
