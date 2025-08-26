from ...engine.Character import Character
from ...engine.GameState import GameState
from ...engine.Item import Item

class Herald(Character):
    def __init__(self) -> None:
        super().__init__(
            name="herald",
            description="An official court herald wearing ornate robes bearing the royal arms. He examines documents and credentials for those seeking audience with nobility.",
        )
        self.received_pass = False

    def talk_to(self, game_state: GameState) -> str:
        if self.received_pass:
            return ("[character_name]Herald[/character_name]: Your credentials have been verified and you have been "
                    "granted formal audience rights. You may proceed to meet with [character_name]Sir Cedric[/character_name] "
                    "and other members of the court.")
        else:
            return ("[character_name]Herald[/character_name]: Greetings, traveler. I must examine your credentials "
                    "before you can be granted audience with the nobility. Do you have a formal pass or letter "
                    "of recommendation?")

    def give_item(self, game_state, item_object: Item) -> str:
        """Handle giving items to the Herald"""
        if "pass" in item_object.get_name().lower():
            game_state.current_room.enable_castle_courtyard()
            self.received_pass = True
            return ("[event]You offer the [item_name]{item_object.get_name()}[/item_name] to the [character_name]{self.name}[/character_name].[/event]\n"
                    "[success]You present the [item_name]{item_object.get_name()}[/item_name] to the [character_name]Herald[/character_name]. "
                    "He examines the seal carefully and nods with approval. 'This is a formal recommendation "
                    "of excellent standing. You are granted formal audience rights with the nobility.' "
                    "The pass has been officially registered.[/success]")
        else:
            return super().give_item(game_state, item_object)